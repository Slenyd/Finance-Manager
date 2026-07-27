import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { AuthorizationError } from '../utils/errors';

const isTest = config.env === 'test';

/**
 * CSRF protection via Origin / Referer header validation.
 * Safe methods (GET, HEAD, OPTIONS) are skipped.
 * Must be registered AFTER cors middleware so request headers are present.
 */
export function csrfOriginCheck(req: Request, _res: Response, next: NextFunction): void {
  // Skip in test environment (supertest requests don't send Origin/Referer)
  if (isTest) {
    next();
    return;
  }

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

  // Only enforce the Origin allowlist when CORS_ORIGIN was explicitly
  // configured by the operator. When unset, the allowlist falls back to
  // localhost dev defaults which won't match production deployments, so
  // enforcing it would block legitimate same-origin requests. CSRF is still
  // mitigated by sameSite=strict cookies + Bearer-token auth.
  if (!config.cors.isExplicitlyConfigured) {
    next();
    return;
  }

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
