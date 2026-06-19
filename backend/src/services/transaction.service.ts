import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { NotFoundError } from '../utils/errors';
import { parsePagination } from '../utils/helpers';
import { TransactionQuery } from '../interfaces';

interface CreateTransactionData {
  amount: number;
  description: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  categoryId?: string;
  date: string;
  paymentMethod?: string;
  notes?: string;
  receiptUrl?: string | null;
  tags?: string[];
}

interface UpdateTransactionData {
  amount?: number;
  description?: string;
  type?: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  categoryId?: string | null;
  date?: string;
  paymentMethod?: string | null;
  notes?: string | null;
  receiptUrl?: string | null;
  tags?: string[];
}

export async function resolveCategoryId(userId: string, type: string, fallbackCategoryId?: string): Promise<string> {
  if (fallbackCategoryId) return fallbackCategoryId;
  const fallback = await prisma.category.findFirst({ where: { userId, type: type as 'INCOME' | 'EXPENSE' } });
  if (fallback) return fallback.id;
  const anyCategory = await prisma.category.findFirst({ where: { userId } });
  if (anyCategory) return anyCategory.id;
  const created = await prisma.category.create({
    data: { name: 'Miscellaneous', type: 'EXPENSE', userId, icon: 'circle', color: '#6366f1' },
  });
  return created.id;
}

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

  async create(userId: string, data: CreateTransactionData) {
    const categoryId = await resolveCategoryId(userId, data.type || 'EXPENSE', data.categoryId);

    return prisma.transaction.create({
      data: {
        userId,
        categoryId,
        amount: data.amount,
        description: data.description,
        type: data.type,
        date: data.date ? new Date(data.date) : new Date(),
        paymentMethod: data.paymentMethod || '',
        notes: data.notes || '',
        receiptUrl: data.receiptUrl || null,
        isRecurring: false,
        tags: data.tags || [],
      },
      include: { category: { select: { id: true, name: true, icon: true, color: true } } },
    });
  }

  async update(userId: string, id: string, data: UpdateTransactionData) {
    await this.findById(userId, id);

    const updateData: Prisma.TransactionUpdateInput = {};
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.categoryId !== undefined) updateData.category = { connect: { id: data.categoryId! } };
    if (data.date !== undefined) updateData.date = new Date(data.date);
    if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.receiptUrl !== undefined) updateData.receiptUrl = data.receiptUrl;
    if (data.tags !== undefined) updateData.tags = { set: data.tags };

    return prisma.transaction.update({
      where: { id },
      data: updateData,
      include: { category: { select: { id: true, name: true, icon: true, color: true } } },
    });
  }

  async delete(userId: string, id: string) {
    await this.findById(userId, id);
    await prisma.transaction.delete({ where: { id } });
  }

  async bulkDelete(userId: string, ids: string[]) {
    const result = await prisma.transaction.deleteMany({ where: { id: { in: ids }, userId } });
    if (result.count === 0) throw new NotFoundError('Transactions');
    return { deleted: result.count };
  }

  async getSummary(userId: string, startDate?: string, endDate?: string) {
    const dateFilter: Record<string, unknown> = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const [incomeAgg, expenseAgg] = await Promise.all([
      prisma.transaction.aggregate({
        where: { userId, type: 'INCOME', ...(Object.keys(dateFilter).length && { date: dateFilter as Prisma.TransactionWhereInput['date'] }) },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.aggregate({
        where: { userId, type: 'EXPENSE', ...(Object.keys(dateFilter).length && { date: dateFilter as Prisma.TransactionWhereInput['date'] }) },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const totalIncome = Number(incomeAgg._sum.amount) || 0;
    const totalExpenses = Number(expenseAgg._sum.amount) || 0;

    return { totalIncome, totalExpenses, netSavings: totalIncome - totalExpenses, transactionCount: incomeAgg._count + expenseAgg._count };
  }
}