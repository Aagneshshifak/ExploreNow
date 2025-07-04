import { Request, Response, NextFunction } from 'express';

interface PerformanceMetrics {
  endpoint: string;
  method: string;
  count: number;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  lastUpdated: Date;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private requestTimings: WeakMap<Request, number> = new WeakMap();

  // Middleware to track request timing
  track() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Skip non-API routes
      if (!req.path.startsWith('/api/')) {
        return next();
      }

      // Record start time
      this.requestTimings.set(req, Date.now());

      // Hook into response finish event
      const cleanup = () => {
        const startTime = this.requestTimings.get(req);
        if (!startTime) return;

        const duration = Date.now() - startTime;
        const key = `${req.method}:${req.path}`;
        
        // Update metrics
        const existing = this.metrics.get(key) || {
          endpoint: req.path,
          method: req.method,
          count: 0,
          totalTime: 0,
          avgTime: 0,
          minTime: Infinity,
          maxTime: 0,
          lastUpdated: new Date()
        };

        existing.count++;
        existing.totalTime += duration;
        existing.avgTime = existing.totalTime / existing.count;
        existing.minTime = Math.min(existing.minTime, duration);
        existing.maxTime = Math.max(existing.maxTime, duration);
        existing.lastUpdated = new Date();

        this.metrics.set(key, existing);
        this.requestTimings.delete(req);
      };

      res.on('finish', cleanup);
      res.on('close', cleanup);

      next();
    };
  }

  // Get performance report
  getReport(): PerformanceMetrics[] {
    return Array.from(this.metrics.values())
      .sort((a, b) => b.avgTime - a.avgTime);
  }

  // Get slow endpoints (avg > threshold ms)
  getSlowEndpoints(thresholdMs: number = 200): PerformanceMetrics[] {
    return this.getReport().filter(m => m.avgTime > thresholdMs);
  }

  // Clear metrics
  reset() {
    this.metrics.clear();
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Add performance endpoint to monitor API
export function addPerformanceEndpoint(app: any) {
  app.get('/api/performance', (_req: Request, res: Response) => {
    res.json({
      metrics: performanceMonitor.getReport(),
      slowEndpoints: performanceMonitor.getSlowEndpoints(),
      timestamp: new Date()
    });
  });
}