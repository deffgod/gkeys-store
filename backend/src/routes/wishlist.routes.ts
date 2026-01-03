import { Router } from 'express';
import { authenticate, requireAuth } from '../middleware/auth.js';
import {
  getWishlistController,
  addToWishlistController,
  removeFromWishlistController,
  checkWishlistController,
  migrateWishlistController,
} from '../controllers/wishlist.controller.js';

const router = Router();

// All wishlist routes support both authenticated and session-based access
// authenticate middleware is optional - session middleware handles guests

// Get wishlist (optional auth - will use userId if token provided, sessionId if not)
router.get('/', authenticate, getWishlistController);

// Add game to wishlist (optional auth)
router.post('/', authenticate, addToWishlistController);

// Remove game from wishlist (optional auth)
router.delete('/:gameId', authenticate, removeFromWishlistController);

// Check if game is in wishlist (optional auth)
router.get('/:gameId/check', authenticate, checkWishlistController);

// Migrate session wishlist to user wishlist (requires authentication)
router.post('/migrate', requireAuth, migrateWishlistController);

export default router;
