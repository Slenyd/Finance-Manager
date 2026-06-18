import app from './app';
import { config } from './config';
import { startJobs } from './jobs';
import { logger } from './utils/logger';

if (!process.env.VERCEL) {
  startJobs();
  app.listen(config.port, () => {
    logger.info(`Server running on port ${config.port} in ${config.env} mode`);
  });
}

export default app;
