import { Request, Response, NextFunction } from 'express';

// Cache control middleware for different types of content
export const cacheControl = {
  // No cache for dynamic content
  noCache: (_req: Request, res: Response, next: NextFunction) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    next();
  },

  // Short cache for API responses (5 minutes)
  apiCache: (_req: Request, res: Response, next: NextFunction) => {
    res.set('Cache-Control', 'private, max-age=300');
    next();
  },

  // Long cache for static assets (1 year)
  staticCache: (_req: Request, res: Response, next: NextFunction) => {
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    next();
  },

  // Medium cache for public content (1 hour)
  publicCache: (_req: Request, res: Response, next: NextFunction) => {
    res.set('Cache-Control', 'public, max-age=3600');
    next();
  }
};

// In-memory cache for expensive operations
class SimpleCache {
  private cache: Map<string, { data: any; expiry: number }> = new Map();

  get(key: string): any {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  set(key: string, data: any, ttlSeconds: number = 300) {
    this.cache.set(key, {
      data,
      expiry: Date.now() + (ttlSeconds * 1000)
    });
  }

  clear() {
    this.cache.clear();
  }

  // Clean up expired entries periodically
  startCleanup() {
    setInterval(() => {
      const now = Date.now();
      const keysToDelete: string[] = [];
      
      this.cache.forEach((item, key) => {
        if (now > item.expiry) {
          keysToDelete.push(key);
        }
      });
      
      keysToDelete.forEach(key => this.cache.delete(key));
    }, 60000); // Clean every minute
  }
}

export const memoryCache = new SimpleCache();
memoryCache.startCleanup();