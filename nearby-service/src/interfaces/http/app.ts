import 'express-async-errors';
import express, { Application } from 'express';
import cors from 'cors';
import { requestLoggerMiddleware } from './middlewares/logger.middleware';
import { errorMiddleware } from './middlewares/error.middleware';
import { notFoundMiddleware } from './middlewares/not-found.middleware';
import apiRouter from './routes';

export const createApp = (): Application => {
  const app: Application = express();

  // Basic Middlewares
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Custom Middlewares
  app.use(requestLoggerMiddleware);

  // Routes
  app.use('/api', apiRouter);

  // 404 Handler
  app.use(notFoundMiddleware);

  // Global Error Handler (must be last)
  app.use(errorMiddleware);

  return app;
};
