import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt.js';
import prisma from '../config/database.js';
import { login, register, refreshToken } from '../services/auth.service.js';
import { AppError } from './errorHandler.js';

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // For optional authentication, continue without user
      // This allows routes to work for both authenticated and guest users
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    req.user = decoded;
    next();
  } catch {
    // For optional authentication, continue without user on error
    // This allows routes to work for both authenticated and guest users
    next();
  }
};

/**
 * Require authentication (non-optional)
 * Returns 401 if no valid token is provided
 */
export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: { message: 'No token provided' },
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid or expired token' },
    });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: { message: 'Admin access required' },
    });
  }
  next();
};
