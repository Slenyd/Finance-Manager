import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';
import { NotFoundError } from '../utils/errors';
import { resolveCategoryId } from '../utils/category.helpers';
import { parsePagination } from '../utils/helpers';
import { BudgetWithSpent, CreateBudgetData, UpdateBudgetData, BudgetQuery, PaginationMeta } from '../interfaces';

type BudgetWithCategory = Prisma.BudgetGetPayload<{
  include: { category: { select: { id: true; name: true; icon: true; color: true } } };
}>;

export class BudgetService {
  async findAll(userId: string, query: BudgetQuery): Promise<{ data: BudgetWithSpent[]; meta: PaginationMeta }> {
    const { page, limit, skip } = parsePagination(query);
    const where: Prisma.BudgetWhereInput = { userId };

    const [budgets, total] = await Promise.all([
      prisma.budget.findMany({
        where,
        include: { category: { select: { id: true, name: true, icon: true, color: true } } },
        skip,
        take: limit,
      }),
      prisma.budget.count({ where }),
    ]);

    const meta: PaginationMeta = { page, limit, total, totalPages: Math.ceil(total / limit) || (total > 0 ? 1 : 0) };

    if (budgets.length === 0) return { data: [], meta };

    const spentResults = await prisma.$transaction(
      budgets.map(b =>
        prisma.transaction.aggregate({
          where: {
            userId,
            categoryId: b.categoryId!,
            type: 'EXPENSE',
            date: { gte: b.startDate, lte: b.endDate },
          },
          _sum: { amount: true },
        })
      ),
    );

    const data = budgets.map((budget, i) => {
      const spent = Number(spentResults[i]._sum.amount) || 0;
      return { ...budget, spent, percentage: Number(budget.limit) > 0 ? (spent / Number(budget.limit)) * 100 : 0 };
    });

    return { data, meta };
  }

  async findById(userId: string, id: string): Promise<BudgetWithSpent> {
    const budget = await prisma.budget.findFirst({
      where: { id, userId },
      include: { category: true },
    });
    if (!budget) throw new NotFoundError('Budget');

    const spent = await prisma.transaction.aggregate({
      where: {
        userId,
        categoryId: budget.categoryId!,
        type: 'EXPENSE',
        date: { gte: budget.startDate, lte: budget.endDate },
      },
      _sum: { amount: true },
    });
    const spentAmount = Number(spent._sum.amount) || 0;
    return { ...budget, spent: spentAmount, percentage: Number(budget.limit) > 0 ? (spentAmount / Number(budget.limit)) * 100 : 0 };
  }

  async create(userId: string, data: CreateBudgetData): Promise<BudgetWithCategory> {
    const categoryId = await resolveCategoryId(userId, 'EXPENSE', data.categoryId);
    return prisma.budget.create({
      data: {
        userId,
        categoryId,
        limit: data.limit,
        period: data.period,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      },
      include: { category: { select: { id: true, name: true, icon: true, color: true } } },
    });
  }

  async update(userId: string, id: string, data: UpdateBudgetData): Promise<BudgetWithCategory> {
    await this.findById(userId, id);
    return prisma.budget.update({
      where: { id },
      data: {
        ...(data.limit !== undefined && { limit: data.limit }),
        ...(data.period !== undefined && { period: data.period }),
        ...(data.startDate !== undefined && { startDate: new Date(data.startDate) }),
        ...(data.endDate !== undefined && { endDate: new Date(data.endDate) }),
      },
      include: { category: { select: { id: true, name: true, icon: true, color: true } } },
    });
  }

  async delete(userId: string, id: string): Promise<void> {
    await this.findById(userId, id);
    await prisma.budget.delete({ where: { id } });
  }
}