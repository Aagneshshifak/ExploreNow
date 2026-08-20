import 'express-async-errors';
import express, { Application } from 'express';
import cors from 'cors';
import { requestLoggerMiddleware } from './middlewares/logger.middleware';
import { errorMiddleware } from './middlewares/error.middleware';
import { notFoundMiddleware } from './middlewares/not-found.middleware';
import apiRouter from './routes';

export const createApp = (): Application => {
  const app: Application = express();

  // CORS Configuration - allow frontend to connect
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : [
        'https://explorenow.onrender.com',
        'http://localhost:5173',
        'http://localhost:5001'
      ];

  const corsOptions = {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie'],
    optionsSuccessStatus: 200
  };

  app.use(cors(corsOptions));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Custom Middlewares
  app.use(requestLoggerMiddleware);

  // Health Check Endpoint (For Render and Docker)
  app.get('/api/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Keep-alive ping (prevents Render from sleeping on free tier)
  app.get('/ping', (req, res) => {
    res.status(200).send('pong');
  });

  // Routes
  app.use('/api', apiRouter);

  // 404 Handler
  app.use(notFoundMiddleware);

  // Global Error Handler (must be last)
  app.use(errorMiddleware);

  return app;
};
