import { Router } from 'express';
import { authenticate, requireAuth } from '../middleware/auth.js';
import {
  getCartController,
  addToCartController,
  updateCartItemController,
  removeFromCartController,
  clearCartController,
  migrateCartController,
} from '../controllers/cart.controller.js';

const router = Router();

// All cart routes support both authenticated and session-based access
// authenticate middleware is optional - session middleware handles guests

// Get cart (optional auth - will use userId if token provided, sessionId if not)
router.get('/', authenticate, getCartController);

// Add item to cart (optional auth)
router.post('/', authenticate, addToCartController);

// Update cart item quantity (optional auth)
router.put('/:gameId', authenticate, updateCartItemController);

// Remove item from cart (optional auth)
router.delete('/:gameId', authenticate, removeFromCartController);

// Clear entire cart (optional auth)
router.delete('/', authenticate, clearCartController);

// Migrate session cart to user cart (requires authentication)
router.post('/migrate', requireAuth, migrateCartController);

export default router;
