import { Request, Response, NextFunction } from 'express';
import { logger } from '../../../utils/logger.util';
import { ZodError } from 'zod';

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error(`[${req.method}] ${req.path} >> StatusCode:: 500, Message:: ${err.message}`, err);

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors,
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
