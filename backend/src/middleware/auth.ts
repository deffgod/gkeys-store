import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt.js';

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
        error: { message: 'Authentication required. Please provide a valid token.' },
      });
    }

    const token = authHeader.substring(7);

    if (!token || token.trim() === '') {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid token format. Please provide a valid token.' },
      });
    }

    let decoded: TokenPayload;
    try {
      decoded = verifyAccessToken(token);
    } catch (jwtError) {
      // Check if it's a token expiration error
      if (jwtError instanceof Error && jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: { message: 'Token has expired. Please refresh your token or login again.' },
        });
      }
      // Other JWT errors (invalid signature, malformed token, etc.)
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid or expired token. Please login again.' },
      });
    }

    // Verify decoded token has required fields
    if (!decoded.userId || !decoded.email || !decoded.role) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid token payload. Please login again.' },
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    // Unexpected errors
    console.error('Unexpected error in requireAuth middleware:', error);
    return res.status(401).json({
      success: false,
      error: { message: 'Authentication error. Please try again.' },
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
