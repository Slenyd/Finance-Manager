import { z } from 'zod';

export const getNotificationsSchema = z.object({
  query: z.object({
    limit: z.string().optional().transform((v) => {
      const n = parseInt(v ?? '50', 10);
      return Math.min(Math.max(isNaN(n) ? 50 : n, 1), 100);
    }),
  }),
});