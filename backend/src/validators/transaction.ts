import { z } from 'zod';

export const createTransactionSchema = z.object({
  body: z.object({
    amount: z.number().positive('Amount must be positive'),
    description: z.string().min(1, 'Description is required').max(255),
    type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
    categoryId: z.string().uuid('Invalid category ID'),
    date: z.string().datetime('Invalid date format'),
    paymentMethod: z.string().max(50).optional(),
    notes: z.string().max(1000).optional(),
    isRecurring: z.boolean().optional().default(false),
    tags: z.array(z.string().max(30)).max(10).optional().default([]),
  }),
});

export const updateTransactionSchema = z.object({
  body: z.object({
    amount: z.number().positive().optional(),
    description: z.string().min(1).max(255).optional(),
    type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']).optional(),
    categoryId: z.string().uuid().optional(),
    date: z.string().datetime().optional(),
    paymentMethod: z.string().max(50).nullable().optional(),
    notes: z.string().max(1000).nullable().optional(),
    isRecurring: z.boolean().optional(),
    tags: z.array(z.string().max(30)).max(10).optional(),
  }),
});

export const bulkDeleteSchema = z.object({
  body: z.object({
    ids: z.array(z.string().uuid()).min(1, 'At least one ID is required').max(100),
  }),
});

export const transactionQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.enum(['date', 'amount', 'createdAt', 'description']).optional().default('date'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
    type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']).optional(),
    categoryId: z.string().uuid().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    minAmount: z.string().optional(),
    maxAmount: z.string().optional(),
    search: z.string().optional(),
    tags: z.string().optional(),
    paymentMethod: z.string().optional(),
  }),
});
