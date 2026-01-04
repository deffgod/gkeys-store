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
import { authenticate, requireAuth } from '../middleware/auth.js';
import { getGamesController } from '../controllers/game.controller.js';
import { getGameByIdController } from '../controllers/game.controller.js';
import { sessionMiddleware } from '../middleware/session.middleware.js';
import { logoutController } from '../controllers/auth.controller.js';
import { migrateWishlistController } from '../controllers/wishlist.controller.js';
import { getUserOrdersController } from '../controllers/order.controller.js';
const router = Router();

// All user routes require authentication
router.use(authenticate);
router.use(sessionMiddleware);
router.use(requireAuth);

router.get('/profile', getProfileController);
router.put('/profile', updateProfileController);
router.put('/password', changePasswordController);
router.post('/logout', authenticate, sessionMiddleware, logoutController);
router.get('/catalog', getGamesController);
router.get('/catalog/:id', getGameByIdController);
router.get('/stats', getUserStatsController);
router.get('/orders', getUserOrdersController);

router.get('/balance', getBalanceController);
router.get('/transactions', getTransactionsController);
router.get('/wishlist', getWishlistController);
router.post('/wishlist/:gameId', addToWishlistController);
router.delete('/wishlist/:gameId', removeFromWishlistController);
router.post('/wishlist/migrate', migrateWishlistController);

export default router;
