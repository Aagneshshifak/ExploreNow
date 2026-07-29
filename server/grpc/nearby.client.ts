import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import jwt from 'jsonwebtoken';

const PROTO_PATH = path.resolve(process.cwd(), 'server', 'grpc', 'nearby.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const nearbyProto = grpc.loadPackageDefinition(packageDefinition).nearby as any;

const GRPC_URL = process.env.NEARBY_SERVICE_GRPC_URL || 'localhost:50051';
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

// Instantiate the clients
// If the URL ends with 443 (default HTTPS port), use SSL. Otherwise, use insecure (for local dev or internal network).
const isSecure = GRPC_URL.endsWith(':443');
const credentials = isSecure ? grpc.credentials.createSsl() : grpc.credentials.createInsecure();

export const locationClient = new nearbyProto.LocationService(
  GRPC_URL,
  credentials
);

export const matchingClient = new nearbyProto.MatchingService(
  GRPC_URL,
  credentials
);

export const connectionClient = new nearbyProto.ConnectionService(
  GRPC_URL,
  credentials
);

// Helper to create authenticated metadata
export const getAuthMetadata = (userId: string): grpc.Metadata => {
  const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1h' });
  const meta = new grpc.Metadata();
  meta.add('authorization', `Bearer ${token}`);
  return meta;
};

// Wrappers for Promise-based execution
export const grpcPingLocation = (userId: string, latitude: number, longitude: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    locationClient.UpdateLocation(
      { user_id: userId, latitude, longitude, speed: 0, direction: 0 },
      getAuthMetadata(userId),
      (error: any, response: any) => {
        if (error) return reject(error);
        if (!response.success) return reject(new Error('Failed to ping location'));
        resolve();
      }
    );
  });
};

export const grpcFindNearby = (userId: string, latitude: number, longitude: number, radiusMeters: number): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    matchingClient.FindNearby(
      { user_id: userId, radius_meters: radiusMeters },
      getAuthMetadata(userId),
      (error: any, response: any) => {
        if (error) return reject(error);
        resolve(response.users || []);
      }
    );
  });
};

export const grpcSendConnectionRequest = (senderId: string, receiverId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    connectionClient.SendRequest(
      { target_user_id: receiverId },
      getAuthMetadata(senderId),
      (error: any, response: any) => {
        if (error) return reject(error);
        if (!response.success) return reject(new Error('Failed to send connection request'));
        resolve();
      }
    );
  });
};

export const grpcRespondToConnection = (responderId: string, senderId: string, status: 'ACCEPTED' | 'REJECTED'): Promise<void> => {
  return new Promise((resolve, reject) => {
    connectionClient.RespondToRequest(
      { target_user_id: senderId, status },
      getAuthMetadata(responderId),
      (error: any, response: any) => {
        if (error) return reject(error);
        if (!response.success) return reject(new Error('Failed to respond to connection request'));
        resolve();
      }
    );
  });
};
