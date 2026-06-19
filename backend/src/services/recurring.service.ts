import { prisma } from '../config/database';
import { NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

export class RecurringService {
  async findAll(userId: string) {
    return prisma.recurringTransaction.findMany({
      where: { userId },
      include: { category: { select: { id: true, name: true, icon: true, color: true } } },
      orderBy: { nextDate: 'asc' },
    });
  }

  async findById(userId: string, id: string) {
    const recurring = await prisma.recurringTransaction.findFirst({
      where: { id, userId },
      include: { category: { select: { id: true, name: true, icon: true, color: true } } },
    });
    if (!recurring) throw new NotFoundError('Recurring transaction');
    return recurring;
  }

  async create(userId: string, data: {
    categoryId: string;
    amount: number;
    description: string;
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
    interval: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
    dayOfMonth?: number | null;
    dayOfWeek?: number | null;
    startDate?: string;
    endDate?: string | null;
  }) {
    const startDate = data.startDate ? new Date(data.startDate) : new Date();
    const nextDate = this.calculateNextDateFromStart(data.interval, startDate, data.dayOfMonth);

    return prisma.recurringTransaction.create({
      data: {
        userId,
        categoryId: data.categoryId,
        amount: data.amount,
        description: data.description,
        type: data.type,
        interval: data.interval,
        dayOfMonth: data.dayOfMonth ?? null,
        dayOfWeek: data.dayOfWeek ?? null,
        startDate,
        endDate: data.endDate ? new Date(data.endDate) : null,
        nextDate,
      },
      include: { category: { select: { id: true, name: true, icon: true, color: true } } },
    });
  }

  async update(userId: string, id: string, data: Partial<{
    categoryId: string;
    amount: number;
    description: string;
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
    interval: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
    dayOfMonth: number | null;
    dayOfWeek: number | null;
    startDate: string;
    endDate: string | null;
    isActive: boolean;
  }>) {
    await this.findById(userId, id);

    const updateData: Record<string, unknown> = {};
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.interval !== undefined) {
      updateData.interval = data.interval;
      const current = await prisma.recurringTransaction.findUnique({ where: { id } });
      if (current) {
        updateData.nextDate = this.calculateNextDateFromStart(
          data.interval,
          current.nextDate,
          data.dayOfMonth ?? current.dayOfMonth,
        );
      }
    }
    if (data.dayOfMonth !== undefined) updateData.dayOfMonth = data.dayOfMonth;
    if (data.dayOfWeek !== undefined) updateData.dayOfWeek = data.dayOfWeek;
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return prisma.recurringTransaction.update({
      where: { id },
      data: updateData,
      include: { category: { select: { id: true, name: true, icon: true, color: true } } },
    });
  }

  async delete(userId: string, id: string) {
    await this.findById(userId, id);
    await prisma.recurringTransaction.delete({ where: { id } });
  }

  async processRecurringTransactions(): Promise<{ processed: number }> {
    const now = new Date();
    const dueTransactions = await prisma.recurringTransaction.findMany({
      where: {
        isActive: true,
        nextDate: { lte: now },
      },
    });

    logger.info(`Processing ${dueTransactions.length} recurring transactions`);

    if (dueTransactions.length === 0) return { processed: 0 };

    const transactionCreates = dueTransactions.map((recurring) =>
      prisma.transaction.create({
        data: {
          userId: recurring.userId,
          categoryId: recurring.categoryId,
          amount: recurring.amount,
          description: recurring.description,
          type: recurring.type,
          date: now,
          isRecurring: true,
        },
      }),
    );

    const updates = dueTransactions.map((recurring) => {
      const nextDate = this.calculateNextDate(recurring);
      return prisma.recurringTransaction.updateMany({
        where: { id: recurring.id },
        data: {
          nextDate,
          ...(recurring.endDate && nextDate > recurring.endDate ? { isActive: false } : {}),
        },
      });
    });

    try {
      await prisma.$transaction([...transactionCreates, ...updates]);
      logger.info(`Successfully processed ${dueTransactions.length} recurring transactions`);
      return { processed: dueTransactions.length };
    } catch (error) {
      logger.error('Failed to process recurring transactions batch:', error);
      throw error;
    }
  }

  private calculateNextDate(recurring: { interval: string; nextDate: Date; dayOfMonth?: number | null; dayOfWeek?: number | null }): Date {
    return this.calculateNextDateFromStart(recurring.interval, recurring.nextDate, recurring.dayOfMonth);
  }

  private calculateNextDateFromStart(interval: string, startDate: Date, dayOfMonth?: number | null): Date {
    const next = new Date(startDate);
    switch (interval) {
      case 'DAILY':
        next.setDate(next.getDate() + 1);
        break;
      case 'WEEKLY':
        next.setDate(next.getDate() + 7);
        break;
      case 'MONTHLY': {
        const day = dayOfMonth ?? next.getDate();
        const targetMonth = next.getMonth() + 1;
        next.setMonth(targetMonth);
        const maxDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
        next.setDate(Math.min(day, maxDay));
        break;
      }
      case 'YEARLY':
        next.setFullYear(next.getFullYear() + 1);
        break;
    }
    return next;
  }
}