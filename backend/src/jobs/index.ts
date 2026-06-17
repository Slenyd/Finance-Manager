import cron from 'node-cron';
import { RecurringService } from '../services/recurring.service';
import { logger } from '../utils/logger';

const recurringService = new RecurringService();

export const startJobs = () => {
  cron.schedule('0 0 * * *', async () => {
    logger.info('Running recurring transactions job');
    try {
      await recurringService.processRecurringTransactions();
    } catch (error) {
      logger.error('Recurring transactions job failed:', error);
    }
  });

  logger.info('Background jobs started');
};
