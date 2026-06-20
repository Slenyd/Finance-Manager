import { Request, Response } from 'express';
import { RecurringService } from '../services/recurring.service';
import { asyncHandler } from '../utils/asyncHandler';
import { config } from '../config';
import { ApiError, AuthenticationError } from '../utils/errors';
import { ApiResponse } from '../interfaces';

const recurringService = new RecurringService();

export class CronController {
  processRecurring = asyncHandler(async (req: Request, res: Response) => {
    if (!config.cronSecret) {
      throw new ApiError(503, 'Cron endpoint not configured', 'CRON_NOT_CONFIGURED');
    }

    const cronSecret = req.headers['x-cron-secret'] as string | undefined;
    if (cronSecret !== config.cronSecret) {
      throw new AuthenticationError('Invalid cron secret');
    }

    const result = await recurringService.processRecurringTransactions();
    res.json({ success: true, data: result, message: 'Recurring transactions processed' } satisfies ApiResponse<{ processed: number }>);
  });
}