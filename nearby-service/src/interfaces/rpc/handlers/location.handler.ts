import * as grpc from '@grpc/grpc-js';
import { authenticateGrpcRequest } from '../interceptors/auth.interceptor';
import { handleGrpcError } from '../interceptors/error.interceptor';
import { logger } from '../../../utils/logger.util';
import { UpdateLocationSchema } from '../../../application/dtos/location.dto';
import { LocationService } from '../../../application/services/location.service';
import { RedisLocationRepository } from '../../../infrastructure/repositories/redis.location.repository';
import { PostgresPrivacyRepository } from '../../../infrastructure/repositories/postgres.privacy.repository';
import { eventDispatcher } from '../../../infrastructure/redis/redis.event.dispatcher';

// Instantiate dependencies (In a real app, use a DI container like TSyringe or Awilix)
const locationRepo = new RedisLocationRepository();
const privacyRepo = new PostgresPrivacyRepository();
const locationService = new LocationService(locationRepo, privacyRepo, eventDispatcher);

export const locationHandlers = {
  UpdateLocation: (call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) => {
    authenticateGrpcRequest(call.metadata, async (err, userId) => {
      if (err) return callback(err, null);
      if (!userId) return callback({ code: grpc.status.INTERNAL }, null);
      
      try {
        // 1. Zod Validation
        const data = UpdateLocationSchema.parse(call.request);
        
        // 2. Pass to Application Service
        await locationService.updateLocation(userId, data);

        callback(null, { success: true, message: 'Location updated successfully' });
      } catch (error) {
        handleGrpcError(error, callback);
      }
    });
  },

  StreamLocation: (call: grpc.ServerReadableStream<any, any>, callback: grpc.sendUnaryData<any>) => {
    let connectedUserId: string | null = null;

    authenticateGrpcRequest(call.metadata, (err, userId) => {
      if (err) return callback(err, null);
      if (!userId) return callback({ code: grpc.status.INTERNAL }, null);
      
      connectedUserId = userId;
      logger.info(`Started Location Stream for user ${userId}`);

      call.on('data', async (request) => {
        try {
          const data = UpdateLocationSchema.parse(request);
          await locationService.updateLocation(userId, data);
        } catch (error) {
          logger.warn(`Failed to process stream chunk for ${userId}`, error);
          // Don't kill the stream for one bad chunk, but log it
        }
      });

      call.on('end', async () => {
        logger.info(`Ended Location Stream for user ${userId}`);
        if (connectedUserId) {
          await locationService.markUserOffline(connectedUserId);
        }
        callback(null, { success: true, message: 'Stream completed' });
      });

      call.on('error', async (error) => {
        logger.error(`Stream error for user ${userId}`, error);
        if (connectedUserId) {
          await locationService.markUserOffline(connectedUserId);
        }
      });
    });
  }
};
