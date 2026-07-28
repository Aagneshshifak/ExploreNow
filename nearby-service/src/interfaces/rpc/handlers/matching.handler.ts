import * as grpc from '@grpc/grpc-js';
import { authenticateGrpcRequest } from '../interceptors/auth.interceptor';
import { handleGrpcError } from '../interceptors/error.interceptor';
import { logger } from '../../../utils/logger.util';

export const matchingHandlers = {
  FindNearby: (call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) => {
    authenticateGrpcRequest(call.metadata, async (err, userId) => {
      if (err) return callback(err, null);
      
      try {
        const { radius_meters } = call.request;
        logger.info(`User ${userId} requested nearby users within ${radius_meters}m`);
        
        // TODO: Pass to Application Service to fetch from Redis H3 buckets

        const mockResponse = {
          users: [
            { user_id: 'user_2', latitude: 40.7128, longitude: -74.0060 }
          ]
        };

        callback(null, mockResponse);
      } catch (error) {
        handleGrpcError(error, callback);
      }
    });
  }
};
