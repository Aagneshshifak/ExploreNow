import * as grpc from '@grpc/grpc-js';
import { createJsonError } from './error.interceptor';
import { logger } from '../../../utils/logger.util';

/**
 * Middleware-like function to validate JWT tokens from gRPC Metadata
 */
export function authenticateGrpcRequest(
  metadata: grpc.Metadata, 
  callback: (error: grpc.ServiceError | null, userId?: string) => void
): void {
  const authHeader = metadata.get('authorization');
  
  if (!authHeader || authHeader.length === 0) {
    logger.warn('gRPC Auth Failed: Missing Authorization header');
    const err = createJsonError(grpc.status.UNAUTHENTICATED, 'Missing Token', {
      success: false,
      code: 'UNAUTHENTICATED',
      message: 'No Authorization token provided in metadata'
    });
    return callback(err);
  }

  const token = authHeader[0].toString().replace('Bearer ', '');
  
  // TODO: Verify JWT token using jsonwebtoken library and shared secret
  // For now, we simulate a successful decoding
  if (token === 'invalid') {
    const err = createJsonError(grpc.status.UNAUTHENTICATED, 'Invalid Token', {
      success: false,
      code: 'UNAUTHENTICATED',
      message: 'The provided token is invalid or expired'
    });
    return callback(err);
  }

  // Simulated decoded user ID
  const decodedUserId = "simulated_user_id";
  callback(null, decodedUserId);
}
