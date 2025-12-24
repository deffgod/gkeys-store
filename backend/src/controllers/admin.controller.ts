import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import {
  getDashboardStats,
  searchUsers,
  getUserDetails,
  getTransactions,
  generateFakeDataForUser,
  exportUserReport,
  getAllGames,
  createGame,
  updateGame,
  deleteGame,
  getAllBlogPosts,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  getAllOrders,
  updateOrderStatus,
  getPaymentMethods,
  getPaymentTransactions,
  processRefund,
  searchUserCarts,
  searchUserWishlists,
  getWishlistStatistics,
  getAllFAQsForAdmin,
  getAllG2AOffersForAdmin,
  getG2AOfferByIdForAdmin,
  getAllG2AReservationsForAdmin,
  cancelG2AReservationForAdmin,
  getCacheStatisticsForAdmin,
  invalidateCacheForAdmin,
  clearAllCacheForAdmin,
  updateUserBalanceForAdmin,
  updateUserRoleForAdmin,
  getUserActivityForAdmin,
} from '../services/admin.service.js';
import { 
  UserSearchFilters, 
  TransactionFilters, 
  PaymentTransactionFilters,
  CartSearchFilters,
  WishlistSearchFilters,
  FAQAdminFilters,
  FAQCreateInput,
  FAQUpdateInput,
  G2AOfferFilters,
  G2AReservationFilters,
  CacheInvalidationRequest,
  BalanceUpdateRequest,
  RoleUpdateRequest,
  ActivityFilters,
} from '../types/admin.js';
import { 
  getUserCartForAdmin, 
  updateUserCartForAdmin, 
  clearUserCartForAdmin,
  CartResponse,
} from '../services/cart.service.js';
import { 
  getUserWishlistForAdmin,
  WishlistResponse,
} from '../services/wishlist.service.js';
import {
  createFAQ,
  updateFAQ,
  deleteFAQ,
  getFAQCategories,
} from '../services/faq.service.js';

export const getDashboardController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const stats = await getDashboardStats();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

export const searchUsersController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const filters: UserSearchFilters = {
      query: req.query.query as string | undefined,
      email: req.query.email as string | undefined,
      name: req.query.name as string | undefined,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined,
    };

    const result = await searchUsers(filters);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserDetailsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userDetails = await getUserDetails(id);

    res.status(200).json({
      success: true,
      data: userDetails,
    });
  } catch (error) {
    next(error);
  }
};

export const getTransactionsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const filters: TransactionFilters = {
      method: req.query.method as string | undefined,
      status: req.query.status as string | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
      transactionHash: req.query.transactionHash as string | undefined,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined,
    };

    const result = await getTransactions(filters);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const generateFakeDataController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const webhookData = req.body;

    await generateFakeDataForUser(id, webhookData);

    res.status(200).json({
      success: true,
      message: 'Fake data generated',
    });
  } catch (error) {
    next(error);
  }
};

export const exportUserReportController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const pdfBuffer = await exportUserReport(id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=user-report-${id}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

export const syncG2AController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { syncG2ACatalog } = await import('../services/g2a.service.js');
    const { fullSync, productIds, categories, includeRelationships } = req.body || {};
    
    const result = await syncG2ACatalog({
      fullSync: fullSync === true,
      productIds: Array.isArray(productIds) ? productIds : undefined,
      categories: Array.isArray(categories) ? categories : undefined,
      includeRelationships: includeRelationships === true,
    });

    res.status(200).json({
      success: true,
      message: 'G2A catalog sync completed',
      data: {
        synced: result.added + result.updated,
        added: result.added,
        updated: result.updated,
        removed: result.removed,
        categoriesCreated: result.categoriesCreated,
        genresCreated: result.genresCreated,
        platformsCreated: result.platformsCreated,
        errors: result.errors,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getG2AStatusController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { getG2ASyncStatus } = await import('../services/g2a.service.js');
    const status = await getG2ASyncStatus();

    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
};

export const syncG2ACategoriesController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { syncG2ACategories } = await import('../services/g2a.service.js');
    const result = await syncG2ACategories();

    res.status(200).json({
      success: true,
      data: {
        categories: result.categories.map(c => ({
          id: c.slug, // Using slug as identifier for response
          name: c.name,
          slug: c.slug,
        })),
        created: result.created,
        errors: result.errors,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const syncG2AGenresController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { syncG2AGenres } = await import('../services/g2a.service.js');
    const result = await syncG2AGenres();

    res.status(200).json({
      success: true,
      data: {
        genres: result.genres.map(g => ({
          id: g.slug, // Using slug as identifier for response
          name: g.name,
          slug: g.slug,
        })),
        created: result.created,
        errors: result.errors,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const syncG2APlatformsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { syncG2APlatforms } = await import('../services/g2a.service.js');
    const result = await syncG2APlatforms();

    res.status(200).json({
      success: true,
      data: {
        platforms: result.platforms.map(p => ({
          id: p.slug, // Using slug as identifier for response
          name: p.name,
          slug: p.slug,
        })),
        created: result.created,
        errors: result.errors,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getG2ASyncProgressController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { getG2ASyncProgress } = await import('../services/g2a.service.js');
    const progress = await getG2ASyncProgress();

    res.status(200).json({
      success: true,
      data: progress,
    });
  } catch (error) {
    next(error);
  }
};

export const testG2AConnectionController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { testConnection } = await import('../services/g2a.service.js');
    const result = await testConnection();

    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.details,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.details,
      });
    }
  } catch (error) {
    next(error);
  }
};

// Games CRUD controllers
export const getGamesController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : 20;

    const result = await getAllGames(page, pageSize);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const createGameController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await createGame(req.body);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const updateGameController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const result = await updateGame(id, req.body);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteGameController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    await deleteGame(id);

    res.status(200).json({
      success: true,
      message: 'Game deleted',
    });
  } catch (error) {
    next(error);
  }
};

// Blog Posts CRUD controllers
export const getBlogPostsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : 20;

    const result = await getAllBlogPosts(page, pageSize);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const createBlogPostController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await createBlogPost(req.body, req.user!.email);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const updateBlogPostController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const result = await updateBlogPost(id, req.body);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBlogPostController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    await deleteBlogPost(id);

    res.status(200).json({
      success: true,
      message: 'Blog post deleted',
    });
  } catch (error) {
    next(error);
  }
};

// Orders controllers
export const getOrdersController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : 20;
    const status = req.query.status as string | undefined;

    const result = await getAllOrders(page, pageSize, status);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatusController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await updateOrderStatus(id, status);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getG2AMetricsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { getG2AMetrics, getLatencyStats } = await import('../services/g2a-metrics.service.js');
    const metrics = await getG2AMetrics();
    const latencyStats = await getLatencyStats();

    res.status(200).json({
      success: true,
      data: {
        ...metrics,
        latency: latencyStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Payment Management Controllers

export const getPaymentMethodsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const methods = await getPaymentMethods();

    res.status(200).json({
      success: true,
      data: { methods },
    });
  } catch (error) {
    next(error);
  }
};

export const getPaymentTransactionsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const filters: PaymentTransactionFilters = {
      method: req.query.method as string | undefined,
      status: req.query.status as string | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined,
    };

    const result = await getPaymentTransactions(filters);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const refundTransactionController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { amount, reason } = req.body;

    const result = await processRefund(id, amount, reason);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Cart Management Controllers

export const getUserCartsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const filters: CartSearchFilters = {
      userId: req.query.userId as string | undefined,
      email: req.query.email as string | undefined,
      hasItems: req.query.hasItems === 'true' ? true : req.query.hasItems === 'false' ? false : undefined,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined,
    };

    const result = await searchUserCarts(filters);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserCartController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const cart = await getUserCartForAdmin(userId);

    res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserCartController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const { items } = req.body;

    if (!Array.isArray(items)) {
      throw new Error('Items must be an array');
    }

    await updateUserCartForAdmin(userId, items);

    res.status(200).json({
      success: true,
      message: 'Cart updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const clearUserCartController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    await clearUserCartForAdmin(userId);

    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Wishlist Management Controllers

export const getUserWishlistsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const filters: WishlistSearchFilters = {
      userId: req.query.userId as string | undefined,
      email: req.query.email as string | undefined,
      hasItems: req.query.hasItems === 'true' ? true : req.query.hasItems === 'false' ? false : undefined,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined,
    };

    const result = await searchUserWishlists(filters);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserWishlistController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const wishlist = await getUserWishlistForAdmin(userId);

    res.status(200).json({
      success: true,
      data: wishlist,
    });
  } catch (error) {
    next(error);
  }
};

export const getWishlistStatisticsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const statistics = await getWishlistStatistics();

    res.status(200).json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    next(error);
  }
};

// FAQ Management Controllers

export const getAllFAQsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const filters: FAQAdminFilters = {
      category: req.query.category as string | undefined,
      search: req.query.search as string | undefined,
      active: req.query.active === 'true' ? true : req.query.active === 'false' ? false : undefined,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined,
    };

    const result = await getAllFAQsForAdmin(filters);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const createFAQController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const data: FAQCreateInput = req.body;
    const faq = await createFAQ(data);

    res.status(201).json({
      success: true,
      data: faq,
    });
  } catch (error) {
    next(error);
  }
};

export const updateFAQController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const data: FAQUpdateInput = req.body;
    const faq = await updateFAQ(id, data);

    res.status(200).json({
      success: true,
      data: faq,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteFAQController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    await deleteFAQ(id);

    res.status(200).json({
      success: true,
      message: 'FAQ deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getFAQCategoriesController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const categories = await getFAQCategories();

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

// G2A Management Controllers

export const getG2AOffersController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const filters: G2AOfferFilters = {
      productId: req.query.productId as string | undefined,
      status: req.query.status as string | undefined,
      offerType: req.query.offerType as string | undefined,
      active: req.query.active === 'true' ? true : req.query.active === 'false' ? false : undefined,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      perPage: req.query.perPage ? parseInt(req.query.perPage as string) : undefined,
    };

    const result = await getAllG2AOffersForAdmin(filters);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getG2AOfferByIdController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { offerId } = req.params;
    const offer = await getG2AOfferByIdForAdmin(offerId);

    res.status(200).json({
      success: true,
      data: offer,
    });
  } catch (error) {
    next(error);
  }
};

export const getG2AReservationsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const filters: G2AReservationFilters = {
      orderId: req.query.orderId as string | undefined,
      status: req.query.status as string | undefined,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined,
    };

    const result = await getAllG2AReservationsForAdmin(filters);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelG2AReservationController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    await cancelG2AReservationForAdmin(id);

    res.status(200).json({
      success: true,
      message: 'Reservation cancellation attempted (note: G2A API may not support direct cancellation)',
    });
  } catch (error) {
    next(error);
  }
};

// Cache Management Controllers

export const getCacheStatisticsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const statistics = await getCacheStatisticsForAdmin();

    res.status(200).json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    next(error);
  }
};

export const invalidateCacheController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { pattern } = req.body as CacheInvalidationRequest;
    
    if (!pattern) {
      throw new Error('Pattern is required');
    }

    const result = await invalidateCacheForAdmin(pattern);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const clearAllCacheController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await clearAllCacheForAdmin();

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Enhanced User Management Controllers

export const updateUserBalanceController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { amount, reason } = req.body as BalanceUpdateRequest;

    if (typeof amount !== 'number') {
      throw new Error('Amount must be a number');
    }

    if (!reason || typeof reason !== 'string') {
      throw new Error('Reason is required');
    }

    const result = await updateUserBalanceForAdmin(id, amount, reason);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserRoleController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { role } = req.body as RoleUpdateRequest;

    if (!role || (role !== 'USER' && role !== 'ADMIN')) {
      throw new Error('Role must be USER or ADMIN');
    }

    await updateUserRoleForAdmin(id, role);

    res.status(200).json({
      success: true,
      message: `User role updated to ${role}`,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserActivityController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const filters: ActivityFilters = {
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
      activityType: req.query.activityType as 'login' | 'order' | 'transaction' | 'all' | undefined,
    };

    const activity = await getUserActivityForAdmin(id, filters);

    res.status(200).json({
      success: true,
      data: activity,
    });
  } catch (error) {
    next(error);
  }
};
