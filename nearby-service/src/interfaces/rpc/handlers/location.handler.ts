import * as grpc from '@grpc/grpc-js';
import { authenticateGrpcRequest } from '../interceptors/auth.interceptor';
import { handleGrpcError } from '../interceptors/error.interceptor';
import { logger } from '../../../utils/logger.util';

export const locationHandlers = {
  UpdateLocation: (call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) => {
    authenticateGrpcRequest(call.metadata, async (err, userId) => {
      if (err) return callback(err, null);
      
      try {
        const { latitude, longitude, speed, direction } = call.request;
        logger.info(`Received Location Update from ${userId}: [${latitude}, ${longitude}]`);
        
        // TODO: Pass to Application Service to process and save to Redis

        callback(null, { success: true, message: 'Location updated successfully' });
      } catch (error) {
        handleGrpcError(error, callback);
      }
    });
  },

  StreamLocation: (call: grpc.ServerReadableStream<any, any>, callback: grpc.sendUnaryData<any>) => {
    authenticateGrpcRequest(call.metadata, (err, userId) => {
      if (err) return callback(err, null);

      logger.info(`Started Location Stream for user ${userId}`);

      call.on('data', (request) => {
        // TODO: Process continuous stream of location updates
        logger.debug(`Stream chunk from ${userId}:`, request);
      });

      call.on('end', () => {
        logger.info(`Ended Location Stream for user ${userId}`);
        callback(null, { success: true, message: 'Stream completed' });
      });

      call.on('error', (error) => {
        logger.error(`Stream error for user ${userId}`, error);
      });
    });
  }
};
