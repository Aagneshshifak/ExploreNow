import { Router, Request, Response } from 'express';
import nearbyRoutes from './nearby.routes';

const router = Router();

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Nearby Service is up and running',
    timestamp: new Date().toISOString(),
  });
});

// Mount Nearby REST API
router.use('/v1', nearbyRoutes);

export default router;
