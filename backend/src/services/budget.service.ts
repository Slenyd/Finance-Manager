import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';
import { NotFoundError } from '../utils/errors';
import { resolveCategoryId } from '../utils/category.helpers';
import { BudgetWithSpent, CreateBudgetData, UpdateBudgetData } from '../interfaces';

type BudgetWithCategory = Prisma.BudgetGetPayload<{
  include: { category: { select: { id: true; name: true; icon: true; color: true } } };
}>;

export class BudgetService {
  async findAll(userId: string): Promise<BudgetWithSpent[]> {
    const budgets = await prisma.budget.findMany({
      where: { userId },
      include: { category: { select: { id: true, name: true, icon: true, color: true } } },
    });

    if (budgets.length === 0) return [];

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

    return budgets.map((budget, i) => {
      const spent = Number(spentResults[i]._sum.amount) || 0;
      return { ...budget, spent, percentage: Number(budget.limit) > 0 ? (spent / Number(budget.limit)) * 100 : 0 };
    });
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