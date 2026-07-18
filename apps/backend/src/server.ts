import { createApp } from './app';
import { env } from '@config/env';
import { logger } from '@config/logger';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`🚀 Lift SaaS backend running in ${env.NODE_ENV} mode on port ${env.PORT}`);
  logger.info(`   Health check: http://localhost:${env.PORT}/health`);
});

function shutdown(signal: string) {
  logger.info(`${signal} received. Shutting down gracefully...`);
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});
