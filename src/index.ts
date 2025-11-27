import { ContendoServer } from './server';
import logger from './utils/logger';

async function main(): Promise<void> {
  try {
    logger.info('Starting Contendo Business Management Platform');

    const server = new ContendoServer();
    await server.start();

    logger.info(`Contendo Platform is now running - API available at http://localhost:${process.env.PORT || 3000}/api`);

  } catch (error) {
    logger.error('Failed to start Contendo Platform', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught exception - shutting down', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled promise rejection - shutting down', reason);
  process.exit(1);
});

// Start the application
if (require.main === module) {
  main().catch((error) => {
    logger.error('Application startup failed', error);
    process.exit(1);
  });
}

export { main };
