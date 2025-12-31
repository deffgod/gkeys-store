import { Router } from 'express';
import {
  getProfileController,
  updateProfileController,
  changePasswordController,
  getUserStatsController,
  getBalanceController,
  getTransactionsController,
  getWishlistController,
  addToWishlistController,
  removeFromWishlistController,
} from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All user routes require authentication
router.use(authenticate);

router.get('/profile', getProfileController);
router.put('/profile', updateProfileController);
router.put('/password', changePasswordController);
router.get('/stats', getUserStatsController);
router.get('/balance', getBalanceController);
router.get('/transactions', getTransactionsController);
router.get('/wishlist', getWishlistController);
router.post('/wishlist/:gameId', addToWishlistController);
router.delete('/wishlist/:gameId', removeFromWishlistController);

export default router;
