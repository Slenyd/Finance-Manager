import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../config/database';
import { AuthenticatedRequest, JwtPayload } from '../interfaces';
import { AuthenticationError } from '../utils/errors';

export const authenticate = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
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

    // Fix 3: Verify tokenVersion against DB to detect invalidated sessions
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { tokenVersion: true, isLocked: true },
    });

    if (!user || user.isLocked) {
      throw new AuthenticationError('Account unavailable');
    }

    if (user.tokenVersion !== (decoded.tokenVersion ?? 0)) {
      throw new AuthenticationError('Token has been invalidated');
    }

    req.user = {
      id: decoded.userId,
      name: decoded.name ?? '',
      email: decoded.email ?? '',
      role: decoded.role,
      isVerified: decoded.isVerified ?? false,
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