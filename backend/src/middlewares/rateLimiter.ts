import rateLimit from 'express-rate-limit';
import { config } from '../config';
import { UpstashRateLimitStore } from './rateLimitStore';

const isTest = config.env === 'test';

export const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  skip: () => isTest,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  store: new UpstashRateLimitStore(config.rateLimit.windowMs),
});

export const authLimiter = rateLimit({
  windowMs: config.rateLimit.authWindowMs,
  max: config.rateLimit.authMax,
  skip: () => isTest,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  store: new UpstashRateLimitStore(config.rateLimit.authWindowMs),
});

export const cronLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  skip: () => isTest,
  message: {
    success: false,
    message: 'Too many cron requests, please try again later',
    code: 'CRON_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  store: new UpstashRateLimitStore(60 * 60 * 1000),
});