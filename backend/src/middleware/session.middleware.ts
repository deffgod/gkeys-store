import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import prisma from '../config/database.js';

export interface SessionRequest extends Request {
  sessionId?: string;
}

/**
 * Session middleware for guest cart/wishlist support
 * Creates or retrieves session ID for guest users
 */
export const sessionMiddleware = async (
  req: SessionRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check if user is authenticated
    if (req.headers.authorization?.startsWith('Bearer ')) {
      // Authenticated user - no session needed
      return next();
    }

    // For guest users, get or create session ID
    let sessionId: string | undefined;

    // Try to get session ID from cookie
    const cookieSessionId = req.cookies?.sessionId;
    if (cookieSessionId) {
      sessionId = cookieSessionId;
      
      // Verify session exists and is not expired
      const session = await prisma.session.findUnique({
        where: { sessionId },
      });

      if (session?.expiresAt && session.expiresAt > new Date()) {
        req.sessionId = sessionId;
        return next();
      }
    }

    // Create new session if none exists or expired
    if (!sessionId) {
      sessionId = randomUUID();
      
      // Create session in database (expires in 24 hours)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await prisma.session.create({
        data: {
          sessionId,
          data: {},
          expiresAt,
        },
      });

      // Set session cookie
      res.cookie('sessionId', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });
    }

    req.sessionId = sessionId;
    next();
  } catch (error) {
    console.error('Session middleware error:', error);
    // Continue without session if error occurs
    next();
  }
};

/**
 * Cleanup expired sessions (should be run periodically)
 */
export const cleanupExpiredSessions = async (): Promise<void> => {
  try {
    const result = await prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    console.log(`Cleaned up ${result.count} expired sessions`);
  } catch (error) {
    console.error('Error cleaning up expired sessions:', error);
  }
};
