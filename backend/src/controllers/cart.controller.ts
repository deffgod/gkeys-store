import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { SessionRequest } from '../middleware/session.middleware.js';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  migrateSessionCartToUser,
} from '../services/cart.service.js';

/**
 * Get user's cart
 */
export const getCartController = async (
  req: AuthRequest & SessionRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    const sessionId = req.sessionId;

    const cart = await getCart(userId, sessionId);

    res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add item to cart
 */
export const addToCartController = async (
  req: AuthRequest & SessionRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    const sessionId = req.sessionId;
    const { gameId, quantity = 1 } = req.body;

    if (!gameId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Game ID is required' },
      });
    }

    await addToCart(gameId, quantity, userId, sessionId);

    res.status(201).json({
      success: true,
      message: 'Item added to cart',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update cart item quantity
 */
export const updateCartItemController = async (
  req: AuthRequest & SessionRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    const sessionId = req.sessionId;
    const { gameId } = req.params;
    const { quantity } = req.body;

    if (!gameId || quantity === undefined) {
      return res.status(400).json({
        success: false,
        error: { message: 'Game ID and quantity are required' },
      });
    }

    await updateCartItem(gameId, quantity, userId, sessionId);

    res.status(200).json({
      success: true,
      message: 'Cart item updated',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove item from cart
 */
export const removeFromCartController = async (
  req: AuthRequest & SessionRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    const sessionId = req.sessionId;
    const { gameId } = req.params;

    if (!gameId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Game ID is required' },
      });
    }

    await removeFromCart(gameId, userId, sessionId);

    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Clear entire cart
 */
export const clearCartController = async (
  req: AuthRequest & SessionRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    const sessionId = req.sessionId;

    await clearCart(userId, sessionId);

    res.status(200).json({
      success: true,
      message: 'Cart cleared',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Migrate session cart to user cart (called after login)
 */
export const migrateCartController = async (
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

    await migrateSessionCartToUser(req.sessionId, req.user.userId);

    res.status(200).json({
      success: true,
      message: 'Cart migrated successfully',
    });
  } catch (error) {
    next(error);
  }
};
