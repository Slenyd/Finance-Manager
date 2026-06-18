import { z } from 'zod';

export const createBudgetSchema = z.object({
  body: z.object({
    categoryId: z.string().uuid().optional(),
    limit: z.number().positive('Limit must be positive'),
    period: z.enum(['WEEKLY', 'MONTHLY', 'YEARLY']).optional().default('MONTHLY'),
    startDate: z.string().datetime('Invalid start date').optional().default(() => new Date().toISOString()),
    endDate: z.string().datetime('Invalid end date').optional().default(() => new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString()),
  }),
});

export const updateBudgetSchema = z.object({
  body: z.object({
    limit: z.number().positive().optional(),
    period: z.enum(['WEEKLY', 'MONTHLY', 'YEARLY']).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});
