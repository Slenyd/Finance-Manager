import app from './app';
import { config } from './config';
import { logger } from './utils/logger';

if (!process.env.VERCEL) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { startJobs } = require('./jobs');
  startJobs();
}

app.listen(config.port, () => {
  logger.info(`Server running on port ${config.port} in ${config.env} mode`);
});
