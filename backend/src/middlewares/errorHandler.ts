import { Request, Response, NextFunction } from 'express';
import { ApiError, ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';
import { config } from '../config';

const isProduction = config.env === 'production';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof ValidationError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      errors: err.errors,
    });
    return;
  }

  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
    });
    return;
  }

  logger.error('Unhandled error:', err);

  res.status(500).json({
    success: false,
    message: isProduction ? 'Internal server error' : (err.message || 'Internal server error'),
    code: 'INTERNAL_ERROR',
  });
};
