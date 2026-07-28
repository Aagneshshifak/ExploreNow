import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { logger } from '../../utils/logger.util';
import { config } from '../../config/env.config';
import { locationHandlers } from './handlers/location.handler';
import { matchingHandlers } from './handlers/matching.handler';
import { notificationHandlers } from './handlers/notification.handler';
import { connectionHandlers } from './handlers/connection.handler';

const PROTO_PATH = path.join(__dirname, './proto/nearby.proto');

export const startGrpcServer = (): void => {
  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });

  const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
  const nearbyProto = protoDescriptor.nearby;

  const server = new grpc.Server();

  // Register Services and their Handlers
  server.addService(nearbyProto.LocationService.service, locationHandlers);
  server.addService(nearbyProto.MatchingService.service, matchingHandlers);
  server.addService(nearbyProto.NotificationService.service, notificationHandlers);
  server.addService(nearbyProto.ConnectionService.service, connectionHandlers);

  const address = `0.0.0.0:${config.GRPC_PORT}`;

  server.bindAsync(address, grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) {
      logger.error('Failed to bind gRPC server', err);
      process.exit(1);
    }
    
    server.start();
    logger.info(`🔌 gRPC Server is listening on port ${port}`);
  });
};
