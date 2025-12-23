import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
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

// Get cart
router.get('/', getCartController);

// Add item to cart
router.post('/', addToCartController);

// Update cart item quantity
router.put('/:gameId', updateCartItemController);

// Remove item from cart
router.delete('/:gameId', removeFromCartController);

// Clear entire cart
router.delete('/', clearCartController);

// Migrate session cart to user cart (requires authentication)
router.post('/migrate', authenticate, migrateCartController);

export default router;
