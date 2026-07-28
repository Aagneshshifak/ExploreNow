import { createApp } from './interfaces/http/app';
import { config } from './config/env.config';
import { logger } from './utils/logger.util';
import { prisma } from './infrastructure/database/prisma.client';
import { redisDB } from './infrastructure/redis/redis.client';

const startServer = async () => {
  try {
    // 1. Initialize Databases & Caches
    await prisma.connect();
    await redisDB.connect();

    // 2. Setup Express App
    const app = createApp();

    // 3. Start HTTP Server
    const server = app.listen(config.PORT, () => {
      logger.info(`🚀 Nearby HTTP Service running on port ${config.PORT}`);
    });

    // 4. Graceful Shutdown handlers
    const shutdown = async () => {
      logger.info('SIGINT/SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        logger.info('HTTP server closed.');
      });
      await prisma.disconnect();
      await redisDB.disconnect();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
