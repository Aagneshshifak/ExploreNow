import * as grpc from '@grpc/grpc-js';
import { authenticateGrpcRequest } from '../interceptors/auth.interceptor';
import { logger } from '../../../utils/logger.util';

export const notificationHandlers = {
  SubscribeToMatches: (call: grpc.ServerWritableStream<any, any>) => {
    // For server-streaming, authentication happens right as the connection is established
    authenticateGrpcRequest(call.metadata, (err, serverId) => {
      if (err) {
        call.emit('error', err);
        return;
      }
      
      logger.info(`Tourist Backend instance [${serverId}] subscribed to Match Events`);
      
      // TODO: Hook this stream up to the RedisEventDispatcher
      // When Redis receives an event on 'channel:location_updated', write it to this stream
      // example: call.write({ user_id_a: "A", user_id_b: "B", match_type: "ENTERED", timestamp: Date.now() });

      call.on('cancelled', () => {
        logger.info(`Tourist Backend instance [${serverId}] cancelled subscription`);
        // TODO: Clean up Redis Pub/Sub listener for this stream
      });
    });
  }
};
