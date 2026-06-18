import { prisma } from '../config/database';
import { NotFoundError } from '../utils/errors';

export class BudgetService {
  async findAll(userId: string) {
    const budgets = await prisma.budget.findMany({
      where: { userId },
      include: { category: { select: { id: true, name: true, icon: true, color: true } } },
    });

    return Promise.all(
      budgets.map(async (budget) => {
        const spent = await this.calculateSpent(userId, budget.categoryId, budget.startDate, budget.endDate);
        return { ...budget, spent, percentage: Number(budget.limit) > 0 ? (spent / Number(budget.limit)) * 100 : 0 };
      }),
    );
  }

  async findById(userId: string, id: string) {
    const budget = await prisma.budget.findFirst({
      where: { id, userId },
      include: { category: true },
    });
    if (!budget) throw new NotFoundError('Budget');

    const spent = await this.calculateSpent(userId, budget.categoryId, budget.startDate, budget.endDate);
    return { ...budget, spent, percentage: Number(budget.limit) > 0 ? (spent / Number(budget.limit)) * 100 : 0 };
  }

  async create(userId: string, data: {
    categoryId?: string; limit: number; period: 'WEEKLY' | 'MONTHLY' | 'YEARLY'; startDate: string; endDate: string;
  }) {
    let categoryId = data.categoryId;
    if (!categoryId) {
      const fallback = await prisma.category.findFirst({
        where: { userId, type: 'EXPENSE' },
      });
      if (fallback) {
        categoryId = fallback.id;
      } else {
        const anyCategory = await prisma.category.findFirst({ where: { userId } });
        if (anyCategory) {
          categoryId = anyCategory.id;
        } else {
          const created = await prisma.category.create({
            data: { name: 'Miscellaneous', type: 'EXPENSE', userId, icon: 'circle', color: '#6366f1' },
          });
          categoryId = created.id;
        }
      }
    }
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

  async update(userId: string, id: string, data: Partial<{
    limit: number;
    period: 'WEEKLY' | 'MONTHLY' | 'YEARLY';
    startDate: string;
    endDate: string;
  }>) {
    await this.findById(userId, id);
    return prisma.budget.update({
      where: { id },
      data: {
        ...(data.limit !== undefined && { limit: data.limit }),
        ...(data.period !== undefined && { period: data.period }),
        ...(data.startDate && { startDate: new Date(data.startDate) }),
        ...(data.endDate && { endDate: new Date(data.endDate) }),
      },
      include: { category: { select: { id: true, name: true, icon: true, color: true } } },
    });
  }

  async delete(userId: string, id: string) {
    await this.findById(userId, id);
    await prisma.budget.delete({ where: { id } });
  }

  private async calculateSpent(userId: string, categoryId: string | null, startDate: Date, endDate: Date): Promise<number> {
    if (!categoryId) return 0;
    const result = await prisma.transaction.aggregate({
      where: {
        userId,
        categoryId,
        type: 'EXPENSE',
        date: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
    });
    return Number(result._sum.amount) || 0;
  }
}
