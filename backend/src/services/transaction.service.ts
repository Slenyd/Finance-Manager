import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { NotFoundError } from '../utils/errors';
import { parsePagination } from '../utils/helpers';
import { TransactionQuery } from '../interfaces';

export class TransactionService {
  async findAll(userId: string, query: TransactionQuery) {
    const { page, limit, skip } = parsePagination(query);
    const where: Prisma.TransactionWhereInput = { userId };

    if (query.type) where.type = query.type as 'INCOME' | 'EXPENSE' | 'TRANSFER';
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.search) where.description = { contains: query.search, mode: 'insensitive' };
    if (query.paymentMethod) where.paymentMethod = query.paymentMethod;
    if (query.tags) where.tags = { hasSome: query.tags.split(',') };
    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) where.date.gte = new Date(query.startDate);
      if (query.endDate) where.date.lte = new Date(query.endDate);
    }
    if (query.minAmount || query.maxAmount) {
      where.amount = {};
      if (query.minAmount) where.amount.gte = parseFloat(query.minAmount);
      if (query.maxAmount) where.amount.lte = parseFloat(query.maxAmount);
    }

    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';
    const orderBy: Prisma.TransactionOrderByWithRelationInput = {};
    if (query.sortBy === 'amount') orderBy.amount = sortOrder;
    else if (query.sortBy === 'description') orderBy.description = sortOrder;
    else orderBy.date = sortOrder;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: { category: { select: { id: true, name: true, icon: true, color: true } } },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return {
      data: transactions,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(userId: string, id: string) {
    const transaction = await prisma.transaction.findFirst({
      where: { id, userId },
      include: { category: true },
    });
    if (!transaction) throw new NotFoundError('Transaction');
    return transaction;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async create(userId: string, data: any) {
    let categoryId = data.categoryId;
    if (!categoryId) {
      const fallback = await prisma.category.findFirst({
        where: { userId, type: data.type || 'EXPENSE' },
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
    return prisma.transaction.create({
      data: { ...data, userId, categoryId, date: new Date(data.date) },
      include: { category: { select: { id: true, name: true, icon: true, color: true } } },
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async update(userId: string, id: string, data: any) {
    await this.findById(userId, id);
    return prisma.transaction.update({
      where: { id },
      data: {
        ...data,
        ...(data.date && { date: new Date(data.date) }),
        ...(data.paymentMethod === null && { paymentMethod: null }),
        ...(data.notes === null && { notes: null }),
      },
      include: { category: { select: { id: true, name: true, icon: true, color: true } } },
    });
  }

  async delete(userId: string, id: string) {
    await this.findById(userId, id);
    await prisma.transaction.delete({ where: { id } });
  }

  async bulkDelete(userId: string, ids: string[]) {
    await prisma.transaction.deleteMany({ where: { id: { in: ids }, userId } });
  }

  async getSummary(userId: string, startDate?: string, endDate?: string) {
    const dateFilter: Prisma.TransactionWhereInput['date'] = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const transactions = await prisma.transaction.findMany({
      where: { userId, ...(Object.keys(dateFilter).length && { date: dateFilter }) },
      select: { amount: true, type: true, categoryId: true, date: true },
    });

    const totalIncome = transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpenses = transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return { totalIncome, totalExpenses, netSavings: totalIncome - totalExpenses, transactionCount: transactions.length };
  }
}
