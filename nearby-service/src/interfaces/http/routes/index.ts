import { Router, Request, Response } from 'express';

const router = Router();

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Nearby Service is up and running',
    timestamp: new Date().toISOString(),
  });
});

// Future API routes will be mounted here
// e.g., router.use('/v1/locations', locationRoutes);

export default router;
