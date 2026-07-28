import { createApp } from './interfaces/http/app';
import { config } from './config/env.config';
import { logger } from './utils/logger.util';
import { prisma } from './infrastructure/database/prisma.client';
import { redisDB } from './infrastructure/redis/redis.client';
import { startGrpcServer } from './interfaces/rpc/grpc.server';
import { SocketManager } from './interfaces/ws/socket.manager';
import { NotificationService } from './application/services/notification.service';
import { eventDispatcher } from './infrastructure/redis/redis.event.dispatcher';
import { OfflineQueueService } from './application/services/offline.queue.service';
import { RedisOfflineQueueRepository } from './infrastructure/repositories/redis.offline.queue.repository';

const startServer = async () => {
  try {
    // 1. Initialize Databases & Caches
    await prisma.connect();
    await redisDB.connect();

    // 2. Start gRPC Server (Internal Microservice Traffic)
    startGrpcServer();

    // 3. Setup Express App
    const app = createApp();

    // 4. Start HTTP Server (External REST Traffic / Debugging)
    const server = app.listen(config.PORT, () => {
      logger.info(`🚀 Nearby HTTP Service running on port ${config.PORT}`);
    });

    // 5. Initialize WebSocket Gateway
    const offlineQueueRepo = new RedisOfflineQueueRepository();
    const offlineQueueService = new OfflineQueueService(offlineQueueRepo);
    const notificationService = new NotificationService(eventDispatcher);
    const socketManager = new SocketManager(server, notificationService, offlineQueueService);

    // 5. Graceful Shutdown handlers
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
