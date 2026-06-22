import { Request, Response, NextFunction } from 'express';

interface CacheEntry {
  data: unknown;
  timestamp: number;
  etag: string;
}

const cache = new Map<string, CacheEntry>();

export function cacheMiddleware(ttlSeconds: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') return next();

    // Skip caching for authenticated endpoints with different users
    // Use the full URL + user ID as cache key
    const userId = (req as any).user?.id || 'anonymous';
    const cacheKey = `${req.originalUrl}:${userId}`;

    const cached = cache.get(cacheKey);
    if (cached) {
      const age = (Date.now() - cached.timestamp) / 1000;
      if (age < ttlSeconds) {
        // Check If-None-Match for ETag support
        if (req.headers['if-none-match'] === cached.etag) {
          return res.status(304).end();
        }
        res.set('Cache-Control', `private, max-age=${ttlSeconds}`);
        res.set('ETag', cached.etag);
        return res.json(cached.data);
      }
      cache.delete(cacheKey);
    }

    // Intercept res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = function(body: unknown) {
      if (res.statusCode === 200) {
        const etag = `"${Date.now().toString(36)}"`;
        cache.set(cacheKey, {
          data: body,
          timestamp: Date.now(),
          etag,
        });
        res.set('Cache-Control', `private, max-age=${ttlSeconds}`);
        res.set('ETag', etag);
      }
      return originalJson(body);
    };

    next();
  };
}

export function clearCache(pattern?: string) {
  if (!pattern) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
}
