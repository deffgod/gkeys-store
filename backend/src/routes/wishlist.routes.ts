import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
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

// Get wishlist
router.get('/', getWishlistController);

// Add game to wishlist
router.post('/', addToWishlistController);

// Remove game from wishlist
router.delete('/:gameId', removeFromWishlistController);

// Check if game is in wishlist
router.get('/:gameId/check', checkWishlistController);

// Migrate session wishlist to user wishlist (requires authentication)
router.post('/migrate', authenticate, migrateWishlistController);

export default router;
