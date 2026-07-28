import * as grpc from '@grpc/grpc-js';
import { authenticateGrpcRequest } from '../interceptors/auth.interceptor';
import { handleGrpcError } from '../interceptors/error.interceptor';
import { ConnectionService } from '../../../application/services/connection.service';
import { PostgresConnectionRepository } from '../../../infrastructure/repositories/postgres.connection.repository';
import { RedisOfflineQueueRepository } from '../../../infrastructure/repositories/redis.offline.queue.repository';
import { OfflineQueueService } from '../../../application/services/offline.queue.service';
import { eventDispatcher } from '../../../infrastructure/redis/redis.event.dispatcher';

const connectionRepo = new PostgresConnectionRepository();
const offlineQueueRepo = new RedisOfflineQueueRepository();
const offlineQueueService = new OfflineQueueService(offlineQueueRepo);
const connectionService = new ConnectionService(connectionRepo, eventDispatcher, offlineQueueService);

export const connectionHandlers = {
  SendRequest: (call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) => {
    authenticateGrpcRequest(call.metadata, async (err, userId) => {
      if (err) return callback(err, null);
      if (!userId) return callback({ code: grpc.status.INTERNAL }, null);
      
      try {
        const { target_user_id } = call.request;
        await connectionService.sendRequest(userId, target_user_id);
        
        callback(null, { success: true, message: 'Request sent successfully' });
      } catch (error) {
        handleGrpcError(error, callback);
      }
    });
  },

  RespondToRequest: (call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) => {
    authenticateGrpcRequest(call.metadata, async (err, userId) => {
      if (err) return callback(err, null);
      if (!userId) return callback({ code: grpc.status.INTERNAL }, null);
      
      try {
        const { target_user_id, status } = call.request;
        // userId is the responder (the person who received the request)
        // target_user_id is the sender of the original request
        await connectionService.respondToRequest(userId, target_user_id, status);
        
        callback(null, { success: true, message: `Request ${status}` });
      } catch (error) {
        handleGrpcError(error, callback);
      }
    });
  }
};
