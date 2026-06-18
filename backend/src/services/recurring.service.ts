import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export class RecurringService {
  async processRecurringTransactions() {
    const now = new Date();
    const dueTransactions = await prisma.recurringTransaction.findMany({
      where: {
        isActive: true,
        nextDate: { lte: now },
      },
    });

    logger.info(`Processing ${dueTransactions.length} recurring transactions`);

    if (dueTransactions.length === 0) return;

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
    } catch (error) {
      logger.error('Failed to process recurring transactions batch:', error);
    }
  }

  private calculateNextDate(recurring: { interval: string; nextDate: Date; dayOfMonth?: number | null; dayOfWeek?: number | null }): Date {
    const next = new Date(recurring.nextDate);
    switch (recurring.interval) {
      case 'DAILY':
        next.setDate(next.getDate() + 1);
        break;
      case 'WEEKLY':
        next.setDate(next.getDate() + 7);
        break;
      case 'MONTHLY':
        next.setMonth(next.getMonth() + 1);
        if (recurring.dayOfMonth) next.setDate(recurring.dayOfMonth);
        break;
      case 'YEARLY':
        next.setFullYear(next.getFullYear() + 1);
        break;
    }
    return next;
  }
}
