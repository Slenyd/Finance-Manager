import { TransactionType } from '@prisma/client';
import { prisma } from '../config/database';
import { NotFoundError } from '../utils/errors';

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
      throw new NotFoundError('Category');
    }
    return prisma.category.update({ where: { id }, data });
  }

  async delete(userId: string, id: string) {
    const existing = await this.findById(userId, id);
    if (existing.userId !== userId) {
      throw new NotFoundError('Category');
    }

    const otherCategory = await prisma.category.findFirst({
      where: { userId, type: existing.type, id: { not: id } },
    });

    const fallbackId = otherCategory?.id || (await this.ensureUncategorized(userId, existing.type));

    await prisma.transaction.updateMany({
      where: { categoryId: id, userId },
      data: { categoryId: fallbackId },
    });
    await prisma.budget.updateMany({
      where: { categoryId: id, userId },
      data: { categoryId: fallbackId },
    });

    await prisma.category.delete({ where: { id } });
  }

  private async ensureUncategorized(userId: string, type: TransactionType): Promise<string> {
    const existing = await prisma.category.findFirst({
      where: { userId, name: 'Uncategorized', type },
    });
    if (existing) return existing.id;

    const created = await prisma.category.create({
      data: { userId, name: 'Uncategorized', icon: 'circle', color: '#6b7280', type },
    });
    return created.id;
  }
}
