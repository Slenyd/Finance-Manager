import { z } from 'zod';

export const goalQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

export const createGoalSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100),
    targetAmount: z.number().positive('Target amount must be positive'),
    currentAmount: z.number().min(0).optional().default(0),
    deadline: z.string().datetime().nullable().optional(),
  }),
});

export const updateGoalSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    targetAmount: z.number().positive().optional(),
    currentAmount: z.number().min(0).optional(),
    deadline: z.string().datetime().nullable().optional(),
  }),
});

export const contributeGoalSchema = z.object({
  body: z.object({
    amount: z.number().positive('Contribution must be positive'),
  }),
});
