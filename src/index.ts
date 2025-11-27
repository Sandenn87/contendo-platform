import { ContendoServer } from './server';
import logger from './utils/logger';

async function main(): Promise<void> {
  try {
    console.log('Starting Contendo Business Management Platform...');
    logger.info('Starting Contendo Business Management Platform');

    const server = new ContendoServer();
    await server.start();

    const port = process.env.PORT || 3000;
    console.log(`✅ Contendo Platform is now running - API available at http://localhost:${port}/api`);
    logger.info(`Contendo Platform is now running - API available at http://localhost:${port}/api`);

  } catch (error) {
    console.error('❌ Failed to start Contendo Platform:', error);
    console.error('Error details:', error instanceof Error ? error.stack : error);
    logger.error('Failed to start Contendo Platform', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error: Error) => {
  console.error('❌ Uncaught exception - shutting down:', error);
  console.error('Stack:', error.stack);
  logger.error('Uncaught exception - shutting down', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: any) => {
  console.error('❌ Unhandled promise rejection - shutting down:', reason);
  logger.error('Unhandled promise rejection - shutting down', reason);
  process.exit(1);
});

// Start the application
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Application startup failed:', error);
    console.error('Error details:', error instanceof Error ? error.stack : error);
    logger.error('Application startup failed', error);
    process.exit(1);
  });
}

export { main };
