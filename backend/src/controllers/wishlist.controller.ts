import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { SessionRequest } from '../middleware/session.middleware.js';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  isInWishlist,
  migrateSessionWishlistToUser,
} from '../services/wishlist.service.js';

/**
 * Get user's wishlist
 */
export const getWishlistController = async (
  req: AuthRequest & SessionRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    // Only use sessionId if user is not authenticated (guest)
    const sessionId = userId ? undefined : req.sessionId;

    // Debug in test environment
    if (process.env.NODE_ENV === 'test') {
      console.log(
        `[Wishlist Controller] getWishlist: userId=${userId}, sessionId=${sessionId}, req.user=`,
        req.user
      );
    }

    const wishlist = await getWishlist(userId, sessionId);

    res.status(200).json({
      success: true,
      data: wishlist,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add game to wishlist
 */
export const addToWishlistController = async (
  req: AuthRequest & SessionRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    // Only use sessionId if user is not authenticated (guest)
    const sessionId = userId ? undefined : req.sessionId;
    const { gameId } = req.body;

    if (!gameId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Game ID is required' },
      });
    }

    await addToWishlist(gameId, userId, sessionId);

    res.status(201).json({
      success: true,
      message: 'Game added to wishlist',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove game from wishlist
 */
export const removeFromWishlistController = async (
  req: AuthRequest & SessionRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    // Only use sessionId if user is not authenticated (guest)
    const sessionId = userId ? undefined : req.sessionId;
    const { gameId } = req.params;

    if (!gameId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Game ID is required' },
      });
    }

    await removeFromWishlist(gameId, userId, sessionId);

    res.status(200).json({
      success: true,
      message: 'Game removed from wishlist',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check if game is in wishlist
 */
export const checkWishlistController = async (
  req: AuthRequest & SessionRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    // Only use sessionId if user is not authenticated (guest)
    const sessionId = userId ? undefined : req.sessionId;
    const { gameId } = req.params;

    if (!gameId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Game ID is required' },
      });
    }

    const inWishlist = await isInWishlist(gameId, userId, sessionId);

    res.status(200).json({
      success: true,
      data: { inWishlist },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Migrate session wishlist to user wishlist (called after login)
 */
export const migrateWishlistController = async (
  req: AuthRequest & SessionRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId || !req.sessionId) {
      return res.status(400).json({
        success: false,
        error: { message: 'User ID and session ID required' },
      });
    }

    await migrateSessionWishlistToUser(req.sessionId, req.user.userId);

    res.status(200).json({
      success: true,
      message: 'Wishlist migrated successfully',
    });
  } catch (error) {
    next(error);
  }
};
