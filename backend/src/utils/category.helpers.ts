import { prisma } from '../config/database';
import { TransactionType } from '@prisma/client';
import { ValidationError } from './errors';

export async function resolveCategoryId(userId: string, type: TransactionType, fallbackCategoryId?: string): Promise<string> {
  if (fallbackCategoryId) {
    const cat = await prisma.category.findFirst({
      where: { id: fallbackCategoryId, OR: [{ userId }, { userId: null }] },
    });
    if (!cat) throw new ValidationError({ categoryId: ['Category not found'] });
    return fallbackCategoryId;
  }
  const fallback = await prisma.category.findFirst({ where: { userId, type } });
  if (fallback) return fallback.id;
  const anyCategory = await prisma.category.findFirst({ where: { userId } });
  if (anyCategory) return anyCategory.id;
  const created = await prisma.category.create({
    data: { name: 'Miscellaneous', type: 'EXPENSE', userId, icon: 'circle', color: '#6366f1' },
  });
  return created.id;
}