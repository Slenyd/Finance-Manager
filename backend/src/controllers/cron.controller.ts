import { Response } from 'express';
import { RecurringService } from '../services/recurring.service';
import { AuthenticatedRequest } from '../interfaces';
import { asyncHandler } from '../utils/asyncHandler';
import { config } from '../config';

const recurringService = new RecurringService();

export class CronController {
  processRecurring = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const cronSecret = _req.headers['x-cron-secret'] as string | undefined;
    if (config.cronSecret && cronSecret !== config.cronSecret) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const result = await recurringService.processRecurringTransactions();
    res.json({ success: true, data: result, message: 'Recurring transactions processed' });
  });
}