import { Request, Response } from 'express';
import { RecurringService } from '../services/recurring.service';
import { asyncHandler } from '../utils/asyncHandler';
import { config } from '../config';

const recurringService = new RecurringService();

export class CronController {
  processRecurring = asyncHandler(async (req: Request, res: Response) => {
    if (!config.cronSecret) {
      res.status(503).json({ success: false, message: 'Cron endpoint not configured', code: 'CRON_NOT_CONFIGURED' });
      return;
    }

    const cronSecret = req.headers['x-cron-secret'] as string | undefined;
    if (cronSecret !== config.cronSecret) {
      res.status(401).json({ success: false, message: 'Unauthorized', code: 'AUTHENTICATION_ERROR' });
      return;
    }

    const result = await recurringService.processRecurringTransactions();
    res.json({ success: true, data: result, message: 'Recurring transactions processed' });
  });
}