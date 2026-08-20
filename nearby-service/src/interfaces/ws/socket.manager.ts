import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { createAdapter } from '@socket.io/redis-adapter';
import { logger } from '../../utils/logger.util';
import { config } from '../../config/env.config';
import { NotificationService } from '../../application/services/notification.service';
import { OfflineQueueService } from '../../application/services/offline.queue.service';
import { redisDB } from '../../infrastructure/redis/redis.client';

interface AuthenticatedSocket extends Socket {
  userId: string;
}

export class SocketManager {
  private io: SocketIOServer;
  // Map of userId -> array of socket IDs (a user might have multiple devices)
  private userSockets: Map<string, Set<string>> = new Map();

  constructor(
    server: HttpServer,
    private readonly notificationService: NotificationService,
    private readonly offlineQueueService: OfflineQueueService
  ) {
    this.io = new SocketIOServer(server, {
      cors: { origin: '*' }
    });

    const pubClient = redisDB.client.duplicate();
    const subClient = pubClient.duplicate();

    Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
      this.io.adapter(createAdapter(pubClient, subClient));
      logger.info('✅ Redis Adapter initialized for Socket.io');
    });

    this.setupMiddleware();
    this.setupListeners();
    this.bindNotificationBridge();
  }

  private setupMiddleware() {
    this.io.use((socket, next) => {
      const token = socket.handshake.auth?.token || socket.handshake.headers['authorization'];
      
      if (!token) {
        return next(new Error('Authentication error: Missing token'));
      }

      try {
        const decoded = jwt.verify(token.replace('Bearer ', ''), config.JWT_SECRET) as any;
        (socket as AuthenticatedSocket).userId = decoded.userId;
        next();
      } catch (err) {
        return next(new Error('Authentication error: Invalid token'));
      }
    });
  }

  private setupListeners() {
    this.io.on('connection', async (socket) => {
      const authSocket = socket as AuthenticatedSocket;
      const userId = authSocket.userId;

      logger.info(`WebSocket connected for user ${userId} [${socket.id}]`);

      // 1. Add to active socket map
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(socket.id);
      
      // Also join a room for easy emitting
      socket.join(`user:${userId}`);

      // 2. Flush Offline Queue
      try {
        const missedMessages = await this.offlineQueueService.flushNotifications(userId);
        for (const msg of missedMessages) {
          socket.emit(msg.type, msg.payload);
        }
      } catch (err) {
        logger.error(`Failed to flush offline queue for ${userId}`, err);
      }

      // 3. Chat Message handler
      socket.on('CHAT_MESSAGE', (data: { to: string, text: string }) => {
        logger.info(`Chat message from ${userId} to ${data.to}`);
        this.io.to(`user:${data.to}`).emit('CHAT_MESSAGE', {
          from: userId,
          to: data.to,
          text: data.text,
          timestamp: Date.now()
        });
      });

      // 3. Disconnect handler
      socket.on('disconnect', () => {
        logger.info(`WebSocket disconnected for user ${userId} [${socket.id}]`);
        const sockets = this.userSockets.get(userId);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            this.userSockets.delete(userId);
          }
        }
      });
    });
  }

  private bindNotificationBridge() {
    // Pipe Pub/Sub events to specific user rooms if they are connected to this node
    this.notificationService.on('connection_requested', (data: { senderId: string, receiverId: string }) => {
      this.io.to(`user:${data.receiverId}`).emit('CONNECTION_REQUESTED', { senderId: data.senderId });
    });

    this.notificationService.on('connection_accepted', (data: { userA: string, userB: string }) => {
      // Both users should get notified that their map is now unlocked
      this.io.to(`user:${data.userA}`).emit('CONNECTION_ACCEPTED', { withUser: data.userB });
      this.io.to(`user:${data.userB}`).emit('CONNECTION_ACCEPTED', { withUser: data.userA });
    });
    
    this.notificationService.on('connection_rejected', (data: { userA: string, userB: string }) => {
      this.io.to(`user:${data.userB}`).emit('CONNECTION_REJECTED', { byUser: data.userA });
    });
  }
}
