import { Router } from 'express';
import {
  getDashboardController,
  searchUsersController,
  getUserDetailsController,
  getTransactionsController,
  generateFakeDataController,
  exportUserReportController,
  syncG2AController,
  testG2AConnectionController,
  getG2AStatusController,
  syncG2ACategoriesController,
  syncG2AGenresController,
  syncG2APlatformsController,
  getG2ASyncProgressController,
  getGamesController,
  createGameController,
  updateGameController,
  deleteGameController,
  getBlogPostsController,
  createBlogPostController,
  updateBlogPostController,
  deleteBlogPostController,
  getOrdersController,
  updateOrderStatusController,
  getG2AMetricsController,
  getPaymentMethodsController,
  getPaymentTransactionsController,
  refundTransactionController,
  getUserCartsController,
  getUserCartController,
  updateUserCartController,
  clearUserCartController,
  getUserWishlistsController,
  getUserWishlistController,
  getWishlistStatisticsController,
  getAllFAQsController,
  createFAQController,
  updateFAQController,
  deleteFAQController,
  getFAQCategoriesController,
  getG2AOffersController,
  getG2AOfferByIdController,
  getG2AReservationsController,
  cancelG2AReservationController,
  getCacheStatisticsController,
  invalidateCacheController,
  clearAllCacheController,
  updateUserBalanceController,
  updateUserRoleController,
  getUserActivityController,
} from '../controllers/admin.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// Dashboard
router.get('/dashboard', getDashboardController);

// Users
router.get('/users', searchUsersController);
router.get('/users/:id', getUserDetailsController);
router.get('/users/:id/export', exportUserReportController);
router.post('/users/:id/generate-fake-data', generateFakeDataController);

// Transactions
router.get('/transactions', getTransactionsController);

// Games CRUD
router.get('/games', getGamesController);
router.post('/games', createGameController);
router.put('/games/:id', updateGameController);
router.delete('/games/:id', deleteGameController);

// Blog Posts CRUD
router.get('/blog', getBlogPostsController);
router.post('/blog', createBlogPostController);
router.put('/blog/:id', updateBlogPostController);
router.delete('/blog/:id', deleteBlogPostController);

// Orders
router.get('/orders', getOrdersController);
router.put('/orders/:id/status', updateOrderStatusController);

// G2A Integration
router.get('/g2a/test-connection', testG2AConnectionController);
router.get('/g2a/status', getG2AStatusController);
router.get('/g2a/sync-progress', getG2ASyncProgressController);
router.get('/g2a/metrics', getG2AMetricsController);
router.post('/g2a/sync', syncG2AController);
router.post('/g2a/sync-categories', syncG2ACategoriesController);
router.post('/g2a/sync-genres', syncG2AGenresController);
router.post('/g2a/sync-platforms', syncG2APlatformsController);

// Payment Management
router.get('/payments/methods', getPaymentMethodsController);
router.get('/payments/transactions', getPaymentTransactionsController);
router.post('/payments/transactions/:id/refund', refundTransactionController);

// Cart Management
router.get('/carts', getUserCartsController);
router.get('/carts/user/:userId', getUserCartController);
router.put('/carts/user/:userId', updateUserCartController);
router.delete('/carts/user/:userId', clearUserCartController);

// Wishlist Management
router.get('/wishlists', getUserWishlistsController);
router.get('/wishlists/user/:userId', getUserWishlistController);
router.get('/wishlists/statistics', getWishlistStatisticsController);

// FAQ Management
router.get('/faqs', getAllFAQsController);
router.post('/faqs', createFAQController);
router.put('/faqs/:id', updateFAQController);
router.delete('/faqs/:id', deleteFAQController);
router.get('/faqs/categories', getFAQCategoriesController);

// G2A Advanced Management
router.get('/g2a/offers', getG2AOffersController);
router.get('/g2a/offers/:offerId', getG2AOfferByIdController);
router.get('/g2a/reservations', getG2AReservationsController);
router.post('/g2a/reservations/:id/cancel', cancelG2AReservationController);

// Cache Management
router.get('/cache/statistics', getCacheStatisticsController);
router.post('/cache/invalidate', invalidateCacheController);
router.post('/cache/clear', clearAllCacheController);

// Enhanced User Management
router.put('/users/:id/balance', updateUserBalanceController);
router.put('/users/:id/role', updateUserRoleController);
router.get('/users/:id/activity', getUserActivityController);

export default router;
