import { Prisma, TransactionType } from '@prisma/client';
import { prisma } from '../config/database';
import { NotFoundError, ValidationError } from '../utils/errors';
import { parsePagination } from '../utils/helpers';
import { resolveCategoryId } from '../utils/category.helpers';
import {
  TransactionQuery,
  CreateTransactionData,
  UpdateTransactionData,
  TransactionSummary,
} from '../interfaces';

export class TransactionService {
  async findAll(userId: string, query: TransactionQuery): Promise<{
    data: Prisma.TransactionGetPayload<{ include: { category: { select: { id: true; name: true; icon: true; color: true } } } }>[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const { page, limit, skip } = parsePagination(query);
    const where: Prisma.TransactionWhereInput = { userId };

    if (query.type) where.type = query.type as TransactionType;
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

  async findById(userId: string, id: string): Promise<Prisma.TransactionGetPayload<{ include: { category: true } }>> {
    const transaction = await prisma.transaction.findFirst({
      where: { id, userId },
      include: { category: true },
    });
    if (!transaction) throw new NotFoundError('Transaction');
    return transaction;
  }

  async create(userId: string, data: CreateTransactionData): Promise<Prisma.TransactionGetPayload<{ include: { category: { select: { id: true; name: true; icon: true; color: true } } } }>> {
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

  async update(userId: string, id: string, data: UpdateTransactionData): Promise<Prisma.TransactionGetPayload<{ include: { category: { select: { id: true; name: true; icon: true; color: true } } } }>> {
    await this.findById(userId, id);

    if (data.categoryId !== undefined && data.categoryId !== null) {
      const cat = await prisma.category.findFirst({
        where: { id: data.categoryId, OR: [{ userId }, { userId: null }] },
      });
      if (!cat) throw new ValidationError({ categoryId: ['Category not found'] });
    }

    const updateData: Prisma.TransactionUpdateInput = {};
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.categoryId !== undefined) {
      if (data.categoryId === null) {
        updateData.category = { disconnect: true };
      } else {
        updateData.category = { connect: { id: data.categoryId } };
      }
    }
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

  async delete(userId: string, id: string): Promise<void> {
    await this.findById(userId, id);
    await prisma.transaction.delete({ where: { id } });
  }

  async bulkDelete(userId: string, ids: string[]): Promise<{ deleted: number }> {
    const result = await prisma.transaction.deleteMany({ where: { id: { in: ids }, userId } });
    if (result.count === 0) throw new NotFoundError('Transactions');
    return { deleted: result.count };
  }

  async getSummary(userId: string, startDate?: string, endDate?: string): Promise<TransactionSummary> {
    const dateFilter: Prisma.DateTimeFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const hasDateFilter = Object.keys(dateFilter).length > 0;

    const [incomeAgg, expenseAgg] = await Promise.all([
      prisma.transaction.aggregate({
        where: { userId, type: 'INCOME', ...(hasDateFilter && { date: dateFilter }) },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.aggregate({
        where: { userId, type: 'EXPENSE', ...(hasDateFilter && { date: dateFilter }) },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const totalIncome = Number(incomeAgg._sum.amount) || 0;
    const totalExpenses = Number(expenseAgg._sum.amount) || 0;

    return { totalIncome, totalExpenses, netSavings: totalIncome - totalExpenses, transactionCount: incomeAgg._count + expenseAgg._count };
  }
}