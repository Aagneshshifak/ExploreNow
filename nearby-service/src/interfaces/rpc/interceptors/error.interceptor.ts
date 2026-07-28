import * as grpc from '@grpc/grpc-js';
import { logger } from '../../../utils/logger.util';

/**
 * Helper to create a gRPC error with a JSON payload embedded in the metadata
 */
export function createJsonError(code: grpc.status, message: string, jsonPayload: any): grpc.ServiceError {
  const metadata = new grpc.Metadata();
  metadata.set('error-details-json', JSON.stringify(jsonPayload));

  return {
    name: 'GrpcJsonError',
    message: message,
    code: code,
    details: message,
    metadata: metadata,
  };
}

/**
 * Example usage wrapper for handlers to catch domain errors and return them as JSON
 */
export function handleGrpcError(error: any, callback: grpc.sendUnaryData<any>): void {
  logger.error('gRPC Handler Error', error);
  
  if (error.name === 'ZodError') {
    const jsonError = createJsonError(grpc.status.INVALID_ARGUMENT, 'Validation Failed', {
      success: false,
      code: 'VALIDATION_FAILED',
      errors: error.errors
    });
    return callback(jsonError, null);
  }

  const jsonError = createJsonError(grpc.status.INTERNAL, 'Internal Server Error', {
    success: false,
    code: 'INTERNAL_ERROR',
    message: error.message || 'An unexpected error occurred'
  });
  
  callback(jsonError, null);
}
