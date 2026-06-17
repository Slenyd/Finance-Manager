import { z } from 'zod';

export const createBudgetSchema = z.object({
  body: z.object({
    categoryId: z.string().uuid('Invalid category ID'),
    limit: z.number().positive('Limit must be positive'),
    period: z.enum(['WEEKLY', 'MONTHLY', 'YEARLY']),
    startDate: z.string().datetime('Invalid start date'),
    endDate: z.string().datetime('Invalid end date'),
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
