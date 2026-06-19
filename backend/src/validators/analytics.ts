import { z } from 'zod';

export const monthlySpendingSchema = z.object({
  query: z.object({
    months: z.string().optional().transform((v) => {
      const n = parseInt(v ?? '6', 10);
      return Math.min(Math.max(isNaN(n) ? 6 : n, 1), 36);
    }),
  }),
});

export const categoryBreakdownSchema = z.object({
  query: z.object({
    startDate: z.string().datetime('Invalid start date').optional(),
    endDate: z.string().datetime('Invalid end date').optional(),
  }),
});

export const cashFlowSchema = z.object({
  query: z.object({
    months: z.string().optional().transform((v) => {
      const n = parseInt(v ?? '12', 10);
      return Math.min(Math.max(isNaN(n) ? 12 : n, 1), 36);
    }),
  }),
});