import { TransactionType } from '@prisma/client';
import { prisma } from '../config/database';
import { NotFoundError, AuthorizationError } from '../utils/errors';

export class CategoryService {
  async findAll(userId: string) {
    return prisma.category.findMany({
      where: { OR: [{ userId }, { userId: null }] },
      orderBy: { name: 'asc' },
    });
  }

  async findById(userId: string, id: string) {
    const category = await prisma.category.findFirst({
      where: { id, OR: [{ userId }, { userId: null }] },
    });
    if (!category) throw new NotFoundError('Category');
    return category;
  }

  async create(userId: string, data: { name: string; icon?: string; color?: string; type: 'INCOME' | 'EXPENSE' }) {
    return prisma.category.create({ data: { ...data, userId } });
  }

  async update(userId: string, id: string, data: Partial<{
    name: string;
    icon: string;
    color: string;
    type: 'INCOME' | 'EXPENSE';
  }>) {
    const existing = await this.findById(userId, id);
    if (existing.userId !== userId) {
      throw new AuthorizationError('You cannot modify a default category');
    }
    return prisma.category.update({ where: { id }, data });
  }

  async delete(userId: string, id: string) {
    const existing = await this.findById(userId, id);
    if (existing.userId !== userId) {
      throw new AuthorizationError('You cannot delete a default category');
    }

    await prisma.$transaction(async (tx) => {
      const otherCategory = await tx.category.findFirst({
        where: { userId, type: existing.type, id: { not: id } },
      });

      let fallbackId = otherCategory?.id;
      if (!fallbackId) {
        const fallback = await tx.category.create({
          data: { userId, name: 'Uncategorized', icon: 'circle', color: '#6b7280', type: existing.type },
        });
        fallbackId = fallback.id;
      }

      await tx.transaction.updateMany({
        where: { categoryId: id, userId },
        data: { categoryId: fallbackId },
      });
      await tx.budget.updateMany({
        where: { categoryId: id, userId },
        data: { categoryId: fallbackId },
      });
      await tx.category.delete({ where: { id } });
    });
  }
}
