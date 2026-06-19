import { prisma } from '../config/database';

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