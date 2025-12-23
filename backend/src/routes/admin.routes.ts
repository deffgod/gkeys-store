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

export default router;
