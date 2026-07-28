import * as grpc from '@grpc/grpc-js';
import { authenticateGrpcRequest } from '../interceptors/auth.interceptor';
import { handleGrpcError } from '../interceptors/error.interceptor';
import { logger } from '../../../utils/logger.util';
import { MatchingService } from '../../../application/services/matching.service';
import { RedisLocationRepository } from '../../../infrastructure/repositories/redis.location.repository';
import { PostgresPrivacyRepository } from '../../../infrastructure/repositories/postgres.privacy.repository';
import { HttpProfileRepository } from '../../../infrastructure/repositories/http.profile.repository';
import { PostgresConnectionRepository } from '../../../infrastructure/repositories/postgres.connection.repository';

// Instantiate dependencies
const locationRepo = new RedisLocationRepository();
const privacyRepo = new PostgresPrivacyRepository();
const profileRepo = new HttpProfileRepository();
const connectionRepo = new PostgresConnectionRepository();
const matchingService = new MatchingService(locationRepo, privacyRepo, profileRepo, connectionRepo);

export const matchingHandlers = {
  FindNearby: (call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) => {
    authenticateGrpcRequest(call.metadata, async (err, userId) => {
      if (err) return callback(err, null);
      if (!userId) return callback({ code: grpc.status.INTERNAL }, null);
      
      try {
        const { radius_meters } = call.request;
        
        // 1. Get searcher's own location
        const searcherLocation = await locationRepo.getLocationByUserId(userId);
        if (!searcherLocation) {
           return callback(
             { code: grpc.status.FAILED_PRECONDITION, details: 'Searcher location not found' }, 
             null
           );
        }

        // 2. Discover candidates
        const candidates = await matchingService.findNearbyCandidates(
          userId, 
          searcherLocation.lat, 
          searcherLocation.lng, 
          radius_meters
        );

        // 3. Map to proto response format
        const response = {
          users: candidates.map(c => ({
            user_id: c.userId,
            username: c.username,
            avatar_url: c.avatarUrl,
            approximate_distance_meters: c.approximateDistanceMeters,
            is_connected: c.isConnected,
            exact_latitude: c.exactLatitude, // Will be undefined if not connected, which protobuf handles
            exact_longitude: c.exactLongitude
          }))
        };

        callback(null, response);
      } catch (error) {
        handleGrpcError(error, callback);
      }
    });
  }
};
