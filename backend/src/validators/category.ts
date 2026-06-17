import { z } from 'zod';

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(50),
    icon: z.string().max(30).optional().default('circle'),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid color hex code').optional().default('#6366f1'),
    type: z.enum(['INCOME', 'EXPENSE']),
  }),
});

export const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(50).optional(),
    icon: z.string().max(30).optional(),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    type: z.enum(['INCOME', 'EXPENSE']).optional(),
  }),
});
