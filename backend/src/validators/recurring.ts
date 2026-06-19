import { z } from 'zod';

export const createRecurringSchema = z.object({
  body: z.object({
    categoryId: z.string().uuid(),
    amount: z.number().positive('Amount must be positive'),
    description: z.string().min(1, 'Description is required').max(255),
    type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
    interval: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
    dayOfMonth: z.number().int().min(1).max(31).optional().nullable(),
    dayOfWeek: z.number().int().min(0).max(6).optional().nullable(),
    startDate: z.string().datetime('Invalid start date').optional().default(() => new Date().toISOString()),
    endDate: z.string().datetime('Invalid end date').optional().nullable(),
  }),
});

export const updateRecurringSchema = z.object({
  body: z.object({
    categoryId: z.string().uuid().optional(),
    amount: z.number().positive().optional(),
    description: z.string().min(1).max(255).optional(),
    type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']).optional(),
    interval: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).optional(),
    dayOfMonth: z.number().int().min(1).max(31).optional().nullable(),
    dayOfWeek: z.number().int().min(0).max(6).optional().nullable(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional().nullable(),
    isActive: z.boolean().optional(),
  }),
});