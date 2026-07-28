import * as grpc from '@grpc/grpc-js';
import { handleGrpcError } from '../interceptors/error.interceptor';
import { logger } from '../../../utils/logger.util';
import { NotificationService } from '../../../application/services/notification.service';
import { eventDispatcher } from '../../../infrastructure/redis/redis.event.dispatcher';

// Instantiate the NotificationService
const notificationService = new NotificationService(eventDispatcher);

export const notificationHandlers = {
  SubscribeToMatches: (call: grpc.ServerWritableStream<any, any>) => {
    try {
      const { server_id } = call.request;
      logger.info(`Server ${server_id} subscribed to the global MatchEvent firehose`);

      // Register listener on the NotificationService
      const cleanup = notificationService.registerStreamListener((event) => {
        // Write the protobuf MatchEvent to the gRPC stream
        call.write(event);
      });

      // Handle client disconnect (e.g., API Gateway restarts)
      call.on('cancelled', () => {
        logger.warn(`Server ${server_id} cancelled the MatchEvent stream`);
        cleanup();
        call.end();
      });

      call.on('error', (error) => {
        logger.error(`Stream error for server ${server_id}`, error);
        cleanup();
        call.end();
      });

    } catch (error) {
      logger.error('Failed to initialize MatchEvent stream', error);
      call.end();
    }
  }
};
