import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AuthenticatedRequest, JwtPayload } from '../interfaces';
import { AuthenticationError, AuthorizationError } from '../utils/errors';

export const authenticate = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.accessSecret) as JwtPayload;

    if (decoded.type !== 'access') {
      throw new AuthenticationError('Invalid token type');
    }

    req.user = {
      id: decoded.userId,
      name: decoded.name ?? '',
      email: decoded.email ?? '',
      role: decoded.role,
      isVerified: decoded.isVerified ?? true,
    };

    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      next(error);
      return;
    }
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      next(new AuthenticationError('Invalid or expired token'));
      return;
    }
    next(new AuthenticationError('Authentication failed'));
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AuthenticationError('Not authenticated'));
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(new AuthorizationError('Insufficient permissions'));
      return;
    }
    next();
  };
};
