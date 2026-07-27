import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { AuthorizationError } from '../utils/errors';

/**
 * CSRF protection via Origin / Referer header validation.
 * Safe methods (GET, HEAD, OPTIONS) are skipped.
 * Must be registered AFTER cors middleware so request headers are present.
 */
export function csrfOriginCheck(req: Request, _res: Response, next: NextFunction): void {
  // Skip safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method.toUpperCase())) {
    next();
    return;
  }

  // Skip CSRF for cron endpoints (authenticated via x-cron-secret, not browser-origin)
  if (req.path.startsWith('/api/v1/cron/')) {
    return next();
  }

  const allowedOrigins: string[] = Array.isArray(config.cors.origin)
    ? config.cors.origin
    : [config.cors.origin];

  if (allowedOrigins.length === 0) {
    // No origins configured — let it through (trust proxy / same-origin only)
    next();
    return;
  }

  const origin = req.headers['origin'] as string | undefined;
  const referer = req.headers['referer'] as string | undefined;
  const source = origin || referer;

  if (!source) {
    throw new AuthorizationError('CSRF check failed: missing Origin or Referer header');
  }

  // Strip trailing slash for comparison
  const normalizedSource = source.replace(/\/+$/, '');

  const isAllowed = allowedOrigins.some((allowed) => {
    const normalizedAllowed = allowed.replace(/\/+$/, '');
    return normalizedSource === normalizedAllowed || normalizedSource.startsWith(normalizedAllowed + '/');
  });

  if (!isAllowed) {
    throw new AuthorizationError('CSRF check failed: invalid Origin or Referer');
  }

  next();
}
