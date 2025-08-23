import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import prismaRoutes from './prisma-routes';
import { seedDatabase } from './prisma-seed-runner';

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5000",
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const timestamp = new Date().toLocaleTimeString();
    console.log(`${timestamp} [express] ${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
  });
  next();
});

// Routes
app.use('/', prismaRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    data: null,
    message: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    message: `Route ${req.originalUrl} not found`
  });
});

async function startServer() {
  try {
    // Seed database
    await seedDatabase();
    
    // Start server
    const server = createServer(app);
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🔐 Admin login: admin@explorenow.com / admin123`);
      console.log(`👤 User login: user@explorenow.com / user123`);
      console.log(`🚀 ExploreNow server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();