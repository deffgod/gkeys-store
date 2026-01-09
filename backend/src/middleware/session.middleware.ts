import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import prisma from '../config/database.js';
import redisClient from '../config/redis.js';

// Lazy validation - check on first use, not at module load
function validateDependencies() {
  if (!redisClient) {
    console.warn('⚠️  Redis client not initialized, session middleware will work without Redis');
  }

  if (!prisma) {
    console.warn(
      '⚠️  Prisma client not initialized, session middleware will work without database'
    );
  }
}

export interface SessionRequest extends Request {
  sessionId?: string;
}

/**
 * Session middleware for guest cart/wishlist support
 * Creates or retrieves session ID for guest users
 */
export const sessionMiddleware = async (req: SessionRequest, res: Response, next: NextFunction) => {
  try {
    // Validate dependencies on first use
    validateDependencies();

    // Always try to get/create session for guest users
    // Even authenticated users might need session for cart/wishlist migration

    // For guest users, get or create session ID
    let sessionId: string | undefined;

    // Check if Prisma is available
    if (!prisma) {
      console.warn('⚠️  Prisma not initialized, skipping session creation');
      return next();
    }

    // Try to get session ID from cookie
    const cookieSessionId = req.cookies?.sessionId;
    if (cookieSessionId) {
      sessionId = cookieSessionId;

      try {
        // Verify session exists and is not expired
        const session = await prisma.session.findUnique({
          where: { sessionId },
        });

        if (session?.expiresAt && session.expiresAt > new Date()) {
          req.sessionId = sessionId;
          return next();
        }
      } catch (dbError) {
        // Database error - continue without session
        console.warn(
          '⚠️  Database error in session middleware, continuing without session:',
          dbError
        );
        return next();
      }
    }

    // Create new session if none exists or expired
    if (!sessionId) {
      sessionId = randomUUID();

      try {
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
      } catch (dbError) {
        // Database error - continue without session
        console.warn(
          '⚠️  Failed to create session in database, continuing without session:',
          dbError
        );
        return next();
      }

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
