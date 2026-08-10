import * as grpc from '@grpc/grpc-js';
import { createJsonError } from './error.interceptor';
import { logger } from '../../../utils/logger.util';

import jwt from 'jsonwebtoken';
import { config } from '../../../config/env.config';

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
  
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as { userId: string };
    callback(null, decoded.userId);
  } catch (error) {
    logger.warn('gRPC Auth Failed: Invalid Token', error);
    const err = createJsonError(grpc.status.UNAUTHENTICATED, 'Invalid Token', {
      success: false,
      code: 'UNAUTHENTICATED',
      message: 'The provided token is invalid or expired'
    });
    return callback(err);
  }
}
