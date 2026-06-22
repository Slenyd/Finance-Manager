import app from './app';
import { config } from './config';
import { logger } from './utils/logger';

if (!process.env.VERCEL) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { startJobs } = require('./jobs');
  startJobs();
}

const server = app.listen(config.port, () => {
  logger.info(`Server running on port ${config.port} in ${config.env} mode`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, closing server...');
  server.close(() => {
    logger.info('Server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, closing server...');
  server.close(() => {
    logger.info('Server closed.');
    process.exit(0);
  });
});
