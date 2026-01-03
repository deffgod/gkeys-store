import prisma from '../config/database.js';
import {
  AdminDashboardStats,
  UserSearchFilters,
  TransactionFilters,
  UserDetailsResponse,
  GameCreateInput,
  GameUpdateInput,
  BlogPostCreateInput,
  BlogPostUpdateInput,
  RefundResult,
} from '../types/admin.js';
import { AppError } from '../middleware/errorHandler.js';
import { Prisma } from '@prisma/client';

/**
 * Structured logger for Admin operations with error and audit logging
 */
const adminLogger = {
  info: (message: string, data?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    console.log(
      `[Admin] [${timestamp}] [INFO] ${message}`,
      data ? JSON.stringify(data, null, 2) : ''
    );
  },
  error: (message: string, error?: unknown, context?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    const errorData = {
      message,
      timestamp,
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            }
          : error,
      context,
    };
    console.error(`[Admin] [${timestamp}] [ERROR] ${JSON.stringify(errorData, null, 2)}`);
  },
  warn: (message: string, data?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    console.warn(
      `[Admin] [${timestamp}] [WARN] ${message}`,
      data ? JSON.stringify(data, null, 2) : ''
    );
  },
  /**
   * Audit log for admin actions
   */
  audit: (operation: string, userId: string, action: string, details?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    const auditData = {
      timestamp,
      operation,
      userId,
      action,
      details: {
        ...details,
        // Remove sensitive data from audit logs
        password: details?.password ? '[REDACTED]' : undefined,
        apiKey: details?.apiKey ? '[REDACTED]' : undefined,
      },
    };
    console.log(`[Admin] [AUDIT] ${JSON.stringify(auditData, null, 2)}`);
  },
};

export const getDashboardStats = async (): Promise<AdminDashboardStats> => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Get basic counts
  const [
    totalUsers,
    newUsersToday,
    totalGames,
    totalOrders,
    pendingOrders,
    completedOrders,
    transactionsToday,
    totalRevenueData,
    revenueTodayData,
    revenueWeekData,
    revenueMonthData,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: { createdAt: { gte: today } },
    }),
    prisma.game.count(),
    prisma.order.count(),
    prisma.order.count({
      where: { status: 'PENDING' },
    }),
    prisma.order.count({
      where: { status: 'COMPLETED' },
    }),
    prisma.transaction.count({
      where: {
        createdAt: { gte: today },
        type: 'TOP_UP',
        status: 'COMPLETED',
      },
    }),
    prisma.transaction.aggregate({
      where: {
        type: 'TOP_UP',
        status: 'COMPLETED',
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        createdAt: { gte: today },
        type: 'TOP_UP',
        status: 'COMPLETED',
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        createdAt: { gte: weekStart },
        type: 'TOP_UP',
        status: 'COMPLETED',
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        createdAt: { gte: monthStart },
        type: 'TOP_UP',
        status: 'COMPLETED',
      },
      _sum: { amount: true },
    }),
  ]);

  // Get top selling games
  const topSellingGames = await prisma.orderItem.groupBy({
    by: ['gameId'],
    _count: { gameId: true },
    _sum: { price: true },
    orderBy: { _count: { gameId: 'desc' } },
    take: 5,
  });

  const topGamesWithDetails = await Promise.all(
    topSellingGames.map(
      async (item) => {
        const game = await prisma.game.findUnique({
          where: { id: item.gameId },
          select: { id: true, title: true, slug: true },
        });
        return {
          id: item.gameId,
          title: game?.title || 'Unknown',
          slug: game?.slug || '',
          salesCount: item._count?.gameId || 0,
          revenue: Number(item._sum?.price || 0),
        };
      }
    )
  );

  // Get recent orders
  const recentOrders = await prisma.order.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { email: true } },
    },
  });

  // Get recent transactions
  const recentTransactions = await prisma.transaction.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { email: true } },
    },
  });

  // Get sales by day (last 7 days)
  const salesByDay: AdminDashboardStats['salesByDay'] = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(today);
    dayStart.setDate(dayStart.getDate() - i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const [orderCount, revenueData] = await Promise.all([
      prisma.order.count({
        where: {
          createdAt: { gte: dayStart, lt: dayEnd },
          status: 'COMPLETED',
        },
      }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: dayStart, lt: dayEnd },
          status: 'COMPLETED',
        },
        _sum: { total: true },
      }),
    ]);

    salesByDay.push({
      date: dayStart.toISOString().split('T')[0],
      count: orderCount,
      revenue: Number(revenueData._sum.total || 0),
    });
  }

  return {
    totalUsers,
    newUsersToday,
    totalGames,
    totalOrders,
    pendingOrders,
    completedOrders,
    transactionsToday,
    totalRevenue: Number(totalRevenueData._sum.amount || 0),
    revenueToday: Number(revenueTodayData._sum.amount || 0),
    revenueThisWeek: Number(revenueWeekData._sum.amount || 0),
    revenueThisMonth: Number(revenueMonthData._sum.amount || 0),
    topSellingGames: topGamesWithDetails,
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      userEmail: o.user.email,
      total: Number(o.total),
      status: o.status,
      createdAt: o.createdAt.toISOString(),
    })),
    recentTransactions: recentTransactions.map((t) => ({
      id: t.id,
      userEmail: t.user.email,
      amount: Number(t.amount),
      type: t.type,
      status: t.status,
      createdAt: t.createdAt.toISOString(),
    })),
    salesByDay,
  };
};

export const searchUsers = async (filters: UserSearchFilters) => {
  const where: Prisma.UserWhereInput = {};
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 50;

  if (filters.query) {
    where.OR = [
      { email: { contains: filters.query, mode: 'insensitive' } },
      { nickname: { contains: filters.query, mode: 'insensitive' } },
      { firstName: { contains: filters.query, mode: 'insensitive' } },
      { lastName: { contains: filters.query, mode: 'insensitive' } },
    ];
  }

  if (filters.email) {
    where.email = { contains: filters.email, mode: 'insensitive' };
  }

  if (filters.name) {
    where.OR = [
      { firstName: { contains: filters.name, mode: 'insensitive' } },
      { lastName: { contains: filters.name, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        nickname: true,
        firstName: true,
        lastName: true,
        balance: true,
        role: true,
        createdAt: true,
        _count: {
          select: { orders: true },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users: users.map((user) => ({
      id: user.id,
      email: user.email,
      nickname: user.nickname || 'Newbie Guy',
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      balance: Number(user.balance),
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      ordersCount: user._count.orders,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
};

export const getUserDetails = async (userId: string): Promise<UserDetailsResponse> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      orders: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          total: true,
          createdAt: true,
        },
      },
      transactions: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          type: true,
          amount: true,
          status: true,
          createdAt: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return {
    id: user.id,
    email: user.email,
    nickname: user.nickname || 'Newbie Guy',
    firstName: user.firstName || undefined,
    lastName: user.lastName || undefined,
    balance: Number(user.balance),
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    orders: user.orders.map((order) => ({
      id: order.id,
      status: order.status,
      total: Number(order.total),
      createdAt: order.createdAt.toISOString(),
    })),
    transactions: user.transactions.map((t) => ({
      id: t.id,
      type: t.type,
      amount: Number(t.amount),
      status: t.status,
      createdAt: t.createdAt.toISOString(),
    })),
  };
};

export const getTransactions = async (filters?: TransactionFilters) => {
  const where: Prisma.TransactionWhereInput = {};
  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 100;

  if (filters?.method) {
    where.method = filters.method;
  }

  if (filters?.status) {
    where.status = filters.status as
      | 'PENDING'
      | 'PROCESSING'
      | 'COMPLETED'
      | 'FAILED'
      | 'CANCELLED';
  }

  if (filters?.transactionHash) {
    where.transactionHash = { contains: filters.transactionHash, mode: 'insensitive' };
  }

  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      where.createdAt.lte = new Date(filters.endDate);
    }
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nickname: true,
          },
        },
        order: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    }),
    prisma.transaction.count({ where }),
  ]);

  return {
    transactions: transactions.map((t) => ({
      id: t.id,
      userId: t.userId,
      user: {
        id: t.user.id,
        email: t.user.email,
        nickname: t.user.nickname || 'Newbie Guy',
      },
      orderId: t.orderId || undefined,
      order: t.order
        ? {
            id: t.order.id,
            status: t.order.status,
          }
        : undefined,
      type: t.type,
      amount: Number(t.amount),
      currency: t.currency,
      method: t.method || undefined,
      status: t.status,
      description: t.description || undefined,
      transactionHash: t.transactionHash || undefined,
      createdAt: t.createdAt.toISOString(),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
};

// Games CRUD
export const getAllGames = async (page = 1, pageSize = 20) => {
  const [games, total] = await Promise.all([
    prisma.game.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { orderItems: true },
        },
        platforms: {
          include: {
            platform: true,
          },
          take: 1,
        },
        genres: {
          include: {
            genre: true,
          },
          take: 1,
        },
      },
    }),
    prisma.game.count(),
  ]);

  return {
    games: games.map((g) => ({
      id: g.id,
      title: g.title,
      slug: g.slug,
      price: Number(g.price),
      originalPrice: g.originalPrice ? Number(g.originalPrice) : null,
      platform: g.platforms.length > 0 ? g.platforms[0].platform.name : '',
      genre: g.genres.length > 0 ? g.genres[0].genre.name : '',
      inStock: g.inStock,
      isPreorder: g.isPreorder,
      imageUrl: g.image,
      salesCount: g._count.orderItems,
      createdAt: g.createdAt.toISOString(),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
};

export const getGameById = async (id: string) => {
  const game = await prisma.game.findUnique({
    where: { id },
    include: {
      platforms: {
        include: {
          platform: true,
        },
      },
      genres: {
        include: {
          genre: true,
        },
      },
      tags: {
        include: {
          tag: true,
        },
      },
      categories: {
        include: {
          category: true,
        },
      },
    },
  });

  if (!game) {
    throw new AppError('Game not found', 404);
  }

  return {
    id: game.id,
    title: game.title,
    slug: game.slug,
    description: game.description || '',
    price: Number(game.price),
    originalPrice: game.originalPrice ? Number(game.originalPrice) : null,
    imageUrl: game.image,
    platform: game.platforms.length > 0 ? game.platforms[0].platform.name : '',
    platforms: game.platforms.map((p) => p.platform.name),
    genre: game.genres.length > 0 ? game.genres[0].genre.name : '',
    genres: game.genres.map((g) => g.genre.name),
    tags: game.tags.map((t) => t.tag.name),
    categories: game.categories.map((c) => c.category.name),
    publisher: game.publisher || '',
    releaseDate: game.releaseDate ? game.releaseDate.toISOString().split('T')[0] : '',
    isPreorder: game.isPreorder,
    inStock: game.inStock,
    g2aProductId: game.g2aProductId || undefined,
    g2aStock: game.g2aStock,
  };
};

export const createGame = async (data: GameCreateInput, adminUserId?: string) => {
  try {
    adminLogger.audit('GAME_CREATE', adminUserId || 'system', 'create_game', {
      title: data.title,
      slug: data.slug,
      platform: data.platform,
      genre: data.genre,
    });

    // Find or create platform
    let platform = await prisma.platform.findUnique({
      where: { slug: data.platform.toLowerCase().replace(/\s+/g, '-') },
    });
    if (!platform) {
      platform = await prisma.platform.create({
        data: {
          name: data.platform,
          slug: data.platform.toLowerCase().replace(/\s+/g, '-'),
        },
      });
    }

    // Find or create genre
    let genre = await prisma.genre.findUnique({
      where: { slug: data.genre.toLowerCase().replace(/\s+/g, '-') },
    });
    if (!genre) {
      genre = await prisma.genre.create({
        data: {
          name: data.genre,
          slug: data.genre.toLowerCase().replace(/\s+/g, '-'),
        },
      });
    }

    // Create or find tags
    const tagConnections = await Promise.all(
      data.tags.map(async (tagName) => {
        let tag = await prisma.tag.findUnique({
          where: { slug: tagName.toLowerCase().replace(/\s+/g, '-') },
        });
        if (!tag) {
          tag = await prisma.tag.create({
            data: {
              name: tagName,
              slug: tagName.toLowerCase().replace(/\s+/g, '-'),
            },
          });
        }
        return { tagId: tag.id };
      })
    );

    const game = await prisma.game.create({
      data: {
        title: data.title,
        slug: data.slug,
        description: data.description,
        price: data.price,
        originalPrice: data.originalPrice,
        image: data.imageUrl,
        publisher: data.publisher,
        releaseDate: data.releaseDate ? new Date(data.releaseDate) : new Date(),
        isPreorder: data.isPreorder || false,
        inStock: data.inStock !== false,
        g2aProductId: data.g2aProductId,
        g2aStock: data.g2aStock !== undefined ? data.g2aStock : false,
        platforms: {
          create: {
            platformId: platform.id,
          },
        },
        genres: {
          create: {
            genreId: genre.id,
          },
        },
        tags: {
          create: tagConnections,
        },
      },
    });

    // Invalidate cache after game creation
    try {
      const { invalidateCache } = await import('./cache.service.js');
      await invalidateCache('home:*');
      await invalidateCache('game:*');
      await invalidateCache('catalog:*');
    } catch (cacheError) {
      adminLogger.warn('Failed to invalidate cache after game creation', {
        gameId: game.id,
        error: cacheError,
      });
      // Don't fail creation if cache invalidation fails
    }

    adminLogger.info('Game created successfully', { gameId: game.id, title: game.title });
    return {
      id: game.id,
      title: game.title,
      slug: game.slug,
      price: Number(game.price),
      createdAt: game.createdAt.toISOString(),
    };
  } catch (error) {
    adminLogger.error('Failed to create game', error, {
      title: data.title,
      slug: data.slug,
      adminUserId: adminUserId || 'unknown',
    });
    throw error;
  }
};

export const updateGame = async (id: string, data: GameUpdateInput, adminUserId?: string) => {
  try {
    adminLogger.audit('GAME_UPDATE', adminUserId || 'system', 'update_game', {
      gameId: id,
      fields: Object.keys(data),
    });

    const updateData: Prisma.GameUpdateInput = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.originalPrice !== undefined) updateData.originalPrice = data.originalPrice;
    if (data.imageUrl !== undefined) updateData.image = data.imageUrl;
    if (data.publisher !== undefined) updateData.publisher = data.publisher;
    if (data.releaseDate !== undefined)
      updateData.releaseDate = data.releaseDate ? new Date(data.releaseDate) : new Date();
    if (data.isPreorder !== undefined) updateData.isPreorder = data.isPreorder;
    if (data.inStock !== undefined) updateData.inStock = data.inStock;
    // G2A fields
    if (data.g2aProductId !== undefined) updateData.g2aProductId = data.g2aProductId;
    if (data.g2aStock !== undefined) updateData.g2aStock = data.g2aStock;
    if (data.g2aLastSync !== undefined)
      updateData.g2aLastSync = data.g2aLastSync ? new Date(data.g2aLastSync) : null;

    // Handle platform update - do this before the main update
    if (data.platform !== undefined) {
      let platform = await prisma.platform.findUnique({
        where: { slug: data.platform.toLowerCase().replace(/\s+/g, '-') },
      });
      if (!platform) {
        platform = await prisma.platform.create({
          data: {
            name: data.platform,
            slug: data.platform.toLowerCase().replace(/\s+/g, '-'),
          },
        });
      }
      // Delete old platform connections
      await prisma.gamePlatform.deleteMany({ where: { gameId: id } });
      // Create new connection
      await prisma.gamePlatform.create({
        data: {
          gameId: id,
          platformId: platform.id,
        },
      });
    }

    // Handle genre update - do this before the main update
    if (data.genre !== undefined) {
      let genre = await prisma.genre.findUnique({
        where: { slug: data.genre.toLowerCase().replace(/\s+/g, '-') },
      });
      if (!genre) {
        genre = await prisma.genre.create({
          data: {
            name: data.genre,
            slug: data.genre.toLowerCase().replace(/\s+/g, '-'),
          },
        });
      }
      // Delete old genre connections
      await prisma.gameGenre.deleteMany({ where: { gameId: id } });
      // Create new connection
      await prisma.gameGenre.create({
        data: {
          gameId: id,
          genreId: genre.id,
        },
      });
    }

    // Handle categories update - do this before the main update
    if (data.categories !== undefined) {
      const categoryConnections = await Promise.all(
        data.categories.map(async (categoryName) => {
          let category = await prisma.category.findUnique({
            where: { slug: categoryName.toLowerCase().replace(/\s+/g, '-') },
          });
          if (!category) {
            category = await prisma.category.create({
              data: {
                name: categoryName,
                slug: categoryName.toLowerCase().replace(/\s+/g, '-'),
              },
            });
          }
          return { gameId: id, categoryId: category.id };
        })
      );
      // Delete old category connections
      await prisma.gameCategory.deleteMany({ where: { gameId: id } });
      // Create new connections
      if (categoryConnections.length > 0) {
        await prisma.gameCategory.createMany({
          data: categoryConnections,
        });
      }
    }

    // Handle tags update - do this before the main update
    if (data.tags !== undefined) {
      const tagConnections = await Promise.all(
        data.tags.map(async (tagName) => {
          let tag = await prisma.tag.findUnique({
            where: { slug: tagName.toLowerCase().replace(/\s+/g, '-') },
          });
          if (!tag) {
            tag = await prisma.tag.create({
              data: {
                name: tagName,
                slug: tagName.toLowerCase().replace(/\s+/g, '-'),
              },
            });
          }
          return { gameId: id, tagId: tag.id };
        })
      );
      // Delete old tag connections
      await prisma.gameTag.deleteMany({ where: { gameId: id } });
      // Create new connections
      if (tagConnections.length > 0) {
        await prisma.gameTag.createMany({
          data: tagConnections,
        });
      }
    }

    // Update the game itself
    const game = await prisma.game.update({
      where: { id },
      data: updateData,
    });

    // Invalidate cache after game update
    try {
      const { invalidateCache } = await import('./cache.service.js');
      await invalidateCache('home:*');
      await invalidateCache('game:*');
      await invalidateCache('catalog:*');
    } catch (cacheError) {
      adminLogger.warn('Failed to invalidate cache after game update', {
        gameId: id,
        error: cacheError,
      });
      // Don't fail update if cache invalidation fails
    }

    adminLogger.info('Game updated successfully', { gameId: game.id, title: game.title });
    return {
      id: game.id,
      title: game.title,
      slug: game.slug,
      price: Number(game.price),
      updatedAt: game.updatedAt.toISOString(),
    };
  } catch (error) {
    adminLogger.error('Failed to update game', error, {
      gameId: id,
      adminUserId: adminUserId || 'unknown',
    });
    throw error;
  }
};

export const deleteGame = async (id: string, adminUserId?: string) => {
  try {
    // Get game info before deletion for audit log
    const game = await prisma.game.findUnique({
      where: { id },
      select: { id: true, title: true, slug: true },
    });

    if (!game) {
      throw new AppError('Game not found', 404);
    }

    adminLogger.audit('GAME_DELETE', adminUserId || 'system', 'delete_game', {
      gameId: id,
      title: game.title,
      slug: game.slug,
    });

    await prisma.game.delete({
      where: { id },
    });

    // Invalidate cache after game deletion
    try {
      const { invalidateCache } = await import('./cache.service.js');
      await invalidateCache('home:*');
      await invalidateCache('game:*');
      await invalidateCache('catalog:*');
    } catch (cacheError) {
      adminLogger.warn('Failed to invalidate cache after game deletion', {
        gameId: id,
        error: cacheError,
      });
      // Don't fail deletion if cache invalidation fails
    }

    adminLogger.info('Game deleted successfully', { gameId: id, title: game.title });
    return { success: true };
  } catch (error) {
    adminLogger.error('Failed to delete game', error, {
      gameId: id,
      adminUserId: adminUserId || 'unknown',
    });
    throw error;
  }
};

// Helper function to calculate read time from content
const calculateReadTime = (content: string): number => {
  // Remove HTML tags and count words
  const text = content
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const wordCount = text.split(/\s+/).filter((word) => word.length > 0).length;
  // Average reading speed: 200 words per minute
  return Math.ceil(wordCount / 200);
};

// Helper function to generate slug from title
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

// Blog Posts CRUD (using Article model)
export const getAllBlogPosts = async (page = 1, pageSize = 20) => {
  const [posts, total] = await Promise.all([
    prisma.article.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.article.count(),
  ]);

  return {
    posts: posts.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      category: p.category,
      published: p.published,
      author: p.author || 'Unknown',
      createdAt: p.createdAt.toISOString(),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
};

export const getBlogPostById = async (id: string) => {
  const post = await prisma.article.findUnique({
    where: { id },
  });

  if (!post) {
    throw new AppError('Blog post not found', 404);
  }

  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    content: post.content,
    excerpt: post.excerpt,
    coverImage: post.coverImage || undefined,
    category: post.category,
    tags: post.tags || [],
    published: post.published,
    author: post.author || undefined,
    publishedAt: post.publishedAt?.toISOString(),
    readTime: post.readTime || undefined,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };
};

export const createBlogPost = async (data: BlogPostCreateInput, authorEmail: string) => {
  // Generate slug from title if not provided
  let slug = data.slug || generateSlug(data.title);

  // Check slug uniqueness
  const existingPost = await prisma.article.findUnique({
    where: { slug },
  });

  if (existingPost) {
    // Append timestamp to make it unique
    slug = `${slug}-${Date.now()}`;
  }

  // Calculate read time
  const readTime = calculateReadTime(data.content);

  // Set publishedAt based on published status
  const publishedAt = data.published ? new Date() : null;

  const post = await prisma.article.create({
    data: {
      title: data.title,
      slug,
      content: data.content,
      excerpt: data.excerpt,
      coverImage: data.imageUrl || '',
      category: data.category,
      tags: data.tags,
      published: data.published || false,
      author: authorEmail,
      publishedAt,
      readTime,
    },
  });

  // Invalidate cache after blog post creation
  try {
    const { invalidateCache } = await import('./cache.service.js');
    await invalidateCache(`blog:${post.slug}`);
    await invalidateCache(`blog:category:${post.category}`);
    await invalidateCache('blog:recent');
  } catch (cacheError) {
    console.warn('[Blog Post Create] Failed to invalidate cache:', cacheError);
  }

  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    createdAt: post.createdAt.toISOString(),
  };
};

export const updateBlogPost = async (id: string, data: BlogPostUpdateInput) => {
  // Get existing post to check slug and calculate read time
  const existingPost = await prisma.article.findUnique({
    where: { id },
  });

  if (!existingPost) {
    throw new AppError('Blog post not found', 404);
  }

  const updateData: Prisma.ArticleUpdateInput = {};
  const oldSlug = existingPost.slug;
  let oldCategory = existingPost.category;

  if (data.title !== undefined) {
    updateData.title = data.title;
    // Auto-generate slug if title changed and slug not provided
    if (data.slug === undefined) {
      updateData.slug = generateSlug(data.title);
      // Check uniqueness of new slug
      const slugCheck = await prisma.article.findUnique({
        where: { slug: updateData.slug as string },
      });
      if (slugCheck && slugCheck.id !== id) {
        updateData.slug = `${updateData.slug}-${Date.now()}`;
      }
    }
  }

  if (data.slug !== undefined) {
    // Check slug uniqueness if it's different
    if (data.slug !== existingPost.slug) {
      const slugCheck = await prisma.article.findUnique({
        where: { slug: data.slug },
      });
      if (slugCheck) {
        throw new AppError('Blog post with this slug already exists', 409);
      }
    }
    updateData.slug = data.slug;
  }

  if (data.content !== undefined) {
    updateData.content = data.content;
    // Recalculate read time when content changes
    updateData.readTime = calculateReadTime(data.content);
  }

  if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
  if (data.imageUrl !== undefined) updateData.coverImage = data.imageUrl;
  if (data.category !== undefined) {
    updateData.category = data.category;
    oldCategory = data.category;
  }
  if (data.tags !== undefined) updateData.tags = data.tags;

  if (data.published !== undefined) {
    updateData.published = data.published;
    if (data.published) {
      // Set publishedAt when publishing
      updateData.publishedAt = new Date();
    } else {
      // Clear publishedAt when unpublishing
      updateData.publishedAt = null;
    }
  }

  const post = await prisma.article.update({
    where: { id },
    data: updateData,
  });

  // Invalidate cache after blog post update
  try {
    const { invalidateCache } = await import('./cache.service.js');
    // Invalidate old and new slugs/categories
    await invalidateCache(`blog:${oldSlug}`);
    await invalidateCache(`blog:${post.slug}`);
    await invalidateCache(`blog:category:${oldCategory}`);
    if (post.category !== oldCategory) {
      await invalidateCache(`blog:category:${post.category}`);
    }
    await invalidateCache('blog:recent');
  } catch (cacheError) {
    console.warn('[Blog Post Update] Failed to invalidate cache:', cacheError);
  }

  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    updatedAt: post.updatedAt.toISOString(),
  };
};

export const deleteBlogPost = async (id: string) => {
  // Get post before deletion for cache invalidation
  const post = await prisma.article.findUnique({
    where: { id },
  });

  if (!post) {
    throw new AppError('Blog post not found', 404);
  }

  await prisma.article.delete({
    where: { id },
  });

  // Invalidate cache after blog post deletion
  try {
    const { invalidateCache } = await import('./cache.service.js');
    await invalidateCache(`blog:${post.slug}`);
    await invalidateCache(`blog:category:${post.category}`);
    await invalidateCache('blog:recent');
  } catch (cacheError) {
    console.warn('[Blog Post Delete] Failed to invalidate cache:', cacheError);
  }

  return { success: true };
};

// Orders management
export const getAllOrders = async (page = 1, pageSize = 20, status?: string) => {
  const where: Prisma.OrderWhereInput = {};
  if (status) {
    where.status = status as 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { email: true, nickname: true },
        },
        items: {
          include: {
            game: {
              select: { title: true, id: true },
            },
          },
        },
        keys: {
          select: {
            key: true,
            gameId: true,
          },
        },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders: orders.map((o) => {
      // Map keys to items by gameId
      const keysByGameId = new Map(o.keys.map((k) => [k.gameId, k.key]));

      return {
        id: o.id,
        userEmail: o.user.email,
        userNickname: o.user.nickname || 'Newbie Guy',
        total: Number(o.total),
        status: o.status,
        itemsCount: o.items.length,
        items: o.items.map((i) => ({
          gameTitle: i.game.title,
          price: Number(i.price),
          key: keysByGameId.get(i.gameId) || undefined,
        })),
        createdAt: o.createdAt.toISOString(),
      };
    }),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
};

export const getOrderDetails = async (id: string) => {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          nickname: true,
          firstName: true,
          lastName: true,
        },
      },
      items: {
        include: {
          game: {
            select: {
              id: true,
              title: true,
              slug: true,
              image: true,
              price: true,
            },
          },
        },
      },
      keys: {
        select: {
          id: true,
          gameId: true,
          key: true,
          activated: true,
          activationDate: true,
        },
      },
      transaction: {
        select: {
          id: true,
          type: true,
          amount: true,
          currency: true,
          method: true,
          status: true,
          description: true,
          transactionHash: true,
          createdAt: true,
        },
      },
    },
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Map keys to items by gameId
  const keysByGameId = new Map(order.keys.map((k) => [k.gameId, k]));

  return {
    id: order.id,
    userId: order.userId,
    user: {
      id: order.user.id,
      email: order.user.email,
      nickname: order.user.nickname || 'Newbie Guy',
      firstName: order.user.firstName || undefined,
      lastName: order.user.lastName || undefined,
    },
    status: order.status,
    subtotal: Number(order.subtotal),
    discount: Number(order.discount),
    total: Number(order.total),
    paymentMethod: order.paymentMethod || undefined,
    paymentStatus: order.paymentStatus || undefined,
    promoCode: order.promoCode || undefined,
    externalOrderId: order.externalOrderId || undefined,
    createdAt: order.createdAt.toISOString(),
    completedAt: order.completedAt?.toISOString(),
    items: order.items.map((item) => ({
      id: item.id,
      gameId: item.gameId,
      game: item.game,
      quantity: item.quantity,
      price: Number(item.price),
      discount: Number(item.discount),
      key: keysByGameId.get(item.gameId)?.key || undefined,
      keyActivated: keysByGameId.get(item.gameId)?.activated || false,
    })),
    transaction: order.transaction
      ? {
          id: order.transaction.id,
          type: order.transaction.type,
          amount: Number(order.transaction.amount),
          currency: order.transaction.currency,
          method: order.transaction.method || undefined,
          status: order.transaction.status,
          description: order.transaction.description || undefined,
          transactionHash: order.transaction.transactionHash || undefined,
          createdAt: order.transaction.createdAt.toISOString(),
        }
      : undefined,
  };
};

export interface OrderUpdateInput {
  status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  paymentStatus?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  paymentMethod?: string;
  promoCode?: string;
}

// Valid status transitions
const validStatusTransitions: Record<string, string[]> = {
  PENDING: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['COMPLETED', 'FAILED', 'CANCELLED'],
  COMPLETED: ['CANCELLED'], // Can only cancel completed orders (for refunds)
  FAILED: ['PENDING', 'PROCESSING'], // Can retry failed orders
  CANCELLED: [], // Cannot transition from cancelled
};

export const updateOrder = async (id: string, data: OrderUpdateInput) => {
  // Get current order
  const currentOrder = await prisma.order.findUnique({
    where: { id },
    select: { status: true },
  });

  if (!currentOrder) {
    throw new AppError('Order not found', 404);
  }

  // Validate status transition if status is being updated
  if (data.status && data.status !== currentOrder.status) {
    const allowedTransitions = validStatusTransitions[currentOrder.status] || [];
    if (!allowedTransitions.includes(data.status)) {
      throw new AppError(
        `Invalid status transition from ${currentOrder.status} to ${data.status}. Allowed transitions: ${allowedTransitions.join(', ')}`,
        400
      );
    }
  }

  // Prepare update data
  const updateData: Prisma.OrderUpdateInput = {};
  if (data.status !== undefined) {
    updateData.status = data.status;
    // Set completedAt if status is COMPLETED
    if (data.status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }
  }
  if (data.paymentStatus !== undefined) updateData.paymentStatus = data.paymentStatus;
  if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod;
  if (data.promoCode !== undefined) updateData.promoCode = data.promoCode;

  // Update order
  const order = await prisma.order.update({
    where: { id },
    data: updateData,
  });

  // Invalidate cache (non-blocking)
  try {
    const { invalidateCache } = await import('./cache.service.js');
    await invalidateCache(`order:${id}`);
    await invalidateCache(`user:${order.userId}:orders`);
  } catch (cacheError) {
    console.warn('[Order Update] Failed to invalidate cache:', cacheError);
  }

  return {
    id: order.id,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    updatedAt: order.createdAt.toISOString(),
  };
};

// Keep updateOrderStatus for backward compatibility
export const updateOrderStatus = async (id: string, status: string) => {
  return updateOrder(id, {
    status: status as 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED',
  });
};

export const cancelOrder = async (id: string, reason?: string): Promise<void> => {
  // Get order with all related data
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, balance: true },
      },
      items: {
        include: {
          game: {
            select: { id: true, inStock: true },
          },
        },
      },
      keys: {
        select: { id: true, gameId: true, key: true },
      },
      transaction: {
        select: {
          id: true,
          type: true,
          amount: true,
          currency: true,
          method: true,
          status: true,
          transactionHash: true,
        },
      },
    },
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Check if order can be cancelled
  if (order.status === 'CANCELLED') {
    throw new AppError('Order is already cancelled', 400);
  }

  if (order.status === 'COMPLETED' && order.keys.length > 0) {
    // For completed orders with keys, we need to handle refund and key deactivation
    // Note: Keys cannot be "restored" to inventory as they're already issued
    // But we can refund the payment
  }

  // Use transaction to ensure atomicity
  await prisma.$transaction(async (tx) => {
    // 1. Update order status to CANCELLED
    await tx.order.update({
      where: { id },
      data: { status: 'CANCELLED', paymentStatus: 'CANCELLED' },
    });

    // 2. Refund payment if order was paid
    if (
      order.transaction &&
      order.transaction.status === 'COMPLETED' &&
      order.transaction.type === 'PURCHASE'
    ) {
      // Check if already refunded
      const existingRefund = await tx.transaction.findFirst({
        where: {
          orderId: id,
          type: 'REFUND',
          status: 'COMPLETED',
        },
      });

      if (!existingRefund) {
        // Refund through payment service
        try {
          const { refundTransaction } = await import('./payment.service.js');
          await refundTransaction(
            order.transaction.id,
            undefined,
            reason || `Order ${id} cancelled by admin`
          );
        } catch (refundError) {
          // If refund fails, still cancel the order but log the error
          console.error(
            `[Order Cancel] Failed to refund transaction ${order.transaction.id}:`,
            refundError
          );
          // Create a manual refund transaction record
          await tx.transaction.create({
            data: {
              userId: order.userId,
              orderId: id,
              type: 'REFUND',
              amount: order.total,
              currency: 'EUR',
              method: order.transaction.method,
              status: 'PENDING', // Mark as pending since automatic refund failed
              description: reason || `Order ${id} cancelled by admin - refund pending`,
            },
          });
          // Update user balance manually
          await tx.user.update({
            where: { id: order.userId },
            data: {
              balance: {
                increment: order.total,
              },
            },
          });
        }
      }
    } else if (order.status === 'PENDING' || order.status === 'PROCESSING') {
      // For pending/processing orders, just restore balance (no payment gateway refund needed)
      await tx.user.update({
        where: { id: order.userId },
        data: {
          balance: {
            increment: order.total,
          },
        },
      });

      // Create refund transaction record
      await tx.transaction.create({
        data: {
          userId: order.userId,
          orderId: id,
          type: 'REFUND',
          amount: order.total,
          currency: 'EUR',
          method: order.paymentMethod || 'balance',
          status: 'COMPLETED',
          description: reason || `Order ${id} cancelled by admin`,
        },
      });
    }

    // 3. Delete game keys if order was not completed (keys not yet issued)
    if (order.status !== 'COMPLETED' && order.keys.length > 0) {
      await tx.gameKey.deleteMany({
        where: { orderId: id },
      });
    }

    // Note: For completed orders, keys are already issued and cannot be "restored"
    // Inventory restoration is not applicable for digital keys
  });

  // Invalidate cache (non-blocking)
  try {
    const { invalidateCache } = await import('./cache.service.js');
    await invalidateCache(`order:${id}`);
    await invalidateCache(`user:${order.userId}:orders`);
  } catch (cacheError) {
    console.warn('[Order Cancel] Failed to invalidate cache:', cacheError);
  }
};

export const generateFakeDataForUser = async (
  userId: string,
  webhookData: Record<string, unknown>
): Promise<void> => {
  console.log(`Generating fake data for user ${userId}`);
};

export const exportUserReport = async (userId: string): Promise<Buffer> => {
  const userData = await getUserDetails(userId);
  const { generateUserSummaryPDF } = await import('./pdf.service.js');
  return await generateUserSummaryPDF(userData);
};

// Payment Management Functions

/**
 * Get all payment methods with status and configuration
 */
export const getPaymentMethods = async (): Promise<
  Array<{
    id: string;
    name: string;
    type: 'stripe' | 'paypal' | 'mollie' | 'terminal';
    icon?: string;
    available: boolean;
    order: number;
    config?: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
  }>
> => {
  const methods = await prisma.paymentMethod.findMany({
    orderBy: { order: 'asc' },
  });

  return methods.map((method) => ({
    id: method.id,
    name: method.name,
    type: method.type as 'stripe' | 'paypal' | 'mollie' | 'terminal',
    icon: method.icon || undefined,
    available: method.available,
    order: method.order,
    config: method.config as Record<string, unknown> | undefined,
    createdAt: method.createdAt.toISOString(),
    updatedAt: method.updatedAt.toISOString(),
  }));
};

/**
 * Get payment transactions with filters
 */
export const getPaymentTransactions = async (
  filters: TransactionFilters
): Promise<{
  transactions: Array<{
    id: string;
    userId: string;
    user: {
      id: string;
      email: string;
      nickname: string;
    };
    orderId?: string;
    order?: {
      id: string;
      status: string;
    };
    type: 'TOP_UP' | 'PURCHASE' | 'REFUND';
    amount: number;
    currency: string;
    method?: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    description?: string;
    transactionHash?: string;
    createdAt: string;
  }>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> => {
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 20;
  const skip = (page - 1) * pageSize;

  const where: Prisma.TransactionWhereInput = {};

  if (filters.method) {
    where.method = { contains: filters.method, mode: 'insensitive' };
  }

  if (filters.status) {
    where.status = filters.status as any;
  }

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      where.createdAt.lte = new Date(filters.endDate);
    }
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nickname: true,
          },
        },
        order: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    }),
    prisma.transaction.count({ where }),
  ]);

  return {
    transactions: transactions.map((t) => ({
      id: t.id,
      userId: t.userId,
      user: {
        id: t.user.id,
        email: t.user.email,
        nickname: t.user.nickname || 'Newbie Guy',
      },
      orderId: t.orderId || undefined,
      order: t.order
        ? {
            id: t.order.id,
            status: t.order.status,
          }
        : undefined,
      type: t.type,
      amount: Number(t.amount),
      currency: t.currency,
      method: t.method || undefined,
      status: t.status,
      description: t.description || undefined,
      transactionHash: t.transactionHash || undefined,
      createdAt: t.createdAt.toISOString(),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
};

/**
 * Process refund for a transaction
 */
export const processRefund = async (
  transactionId: string,
  amount?: number,
  reason?: string
): Promise<RefundResult> => {
  const { refundTransaction } = await import('./payment.service.js');
  return await refundTransaction(transactionId, amount, reason);
};

// Cart and Wishlist Management Functions

export interface CartSearchFilters {
  userId?: string;
  email?: string;
  hasItems?: boolean;
  page?: number;
  pageSize?: number;
}

export interface CartSearchResult {
  carts: Array<{
    userId: string;
    user: {
      id: string;
      email: string;
      nickname: string;
    };
    itemCount: number;
    total: number;
    lastUpdated: string;
  }>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface WishlistSearchFilters {
  userId?: string;
  email?: string;
  hasItems?: boolean;
  page?: number;
  pageSize?: number;
}

export interface WishlistSearchResult {
  wishlists: Array<{
    userId: string;
    user: {
      id: string;
      email: string;
      nickname: string;
    };
    itemCount: number;
    lastUpdated: string;
  }>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface WishlistStatistics {
  totalWishlists: number;
  totalItems: number;
  averageItemsPerWishlist: number;
  mostWishedGames: Array<{
    gameId: string;
    game: {
      id: string;
      title: string;
      slug: string;
    };
    wishlistCount: number;
  }>;
  wishlistGrowth: Array<{
    date: string;
    count: number;
  }>;
}

/**
 * Search user carts with filters
 */
export const searchUserCarts = async (filters: CartSearchFilters): Promise<CartSearchResult> => {
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 20;
  const skip = (page - 1) * pageSize;

  const where: Prisma.UserWhereInput = {};

  if (filters.email) {
    where.email = { contains: filters.email, mode: 'insensitive' };
  }

  if (filters.userId) {
    where.id = filters.userId;
  }

  // Get users with cart items
  const users = await prisma.user.findMany({
    where,
    skip,
    take: pageSize,
    include: {
      cart: {
        include: {
          game: {
            select: {
              id: true,
              price: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Filter by hasItems if specified
  let filteredUsers = users;
  if (filters.hasItems !== undefined) {
    filteredUsers = users.filter((user) => {
      const hasItems = user.cart.length > 0;
      return filters.hasItems ? hasItems : !hasItems;
    });
  }

  // Calculate totals and last updated
  const carts = filteredUsers.map((user) => {
    const total = user.cart.reduce((sum, item) => sum + Number(item.game.price) * item.quantity, 0);
    const lastUpdated =
      user.cart.length > 0
        ? user.cart.reduce(
            (latest, item) => (item.addedAt > latest ? item.addedAt : latest),
            user.cart[0].addedAt
          )
        : user.updatedAt;

    return {
      userId: user.id,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname || 'Newbie Guy',
      },
      itemCount: user.cart.length,
      total: Number(total.toFixed(2)),
      lastUpdated: lastUpdated.toISOString(),
    };
  });

  // Get total count
  const totalUsers = await prisma.user.count({ where });
  const total = filters.hasItems !== undefined ? filteredUsers.length : totalUsers;

  return {
    carts,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
};

/**
 * Search user wishlists with filters
 */
export const searchUserWishlists = async (
  filters: WishlistSearchFilters
): Promise<WishlistSearchResult> => {
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 20;
  const skip = (page - 1) * pageSize;

  const where: Prisma.UserWhereInput = {};

  if (filters.email) {
    where.email = { contains: filters.email, mode: 'insensitive' };
  }

  if (filters.userId) {
    where.id = filters.userId;
  }

  // Get users with wishlist items
  const users = await prisma.user.findMany({
    where,
    skip,
    take: pageSize,
    include: {
      wishlist: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // Filter by hasItems if specified
  let filteredUsers = users;
  if (filters.hasItems !== undefined) {
    filteredUsers = users.filter((user) => {
      const hasItems = user.wishlist.length > 0;
      return filters.hasItems ? hasItems : !hasItems;
    });
  }

  // Calculate last updated
  const wishlists = filteredUsers.map((user) => {
    const lastUpdated =
      user.wishlist.length > 0
        ? user.wishlist.reduce(
            (latest, item) => (item.addedAt > latest ? item.addedAt : latest),
            user.wishlist[0].addedAt
          )
        : user.updatedAt;

    return {
      userId: user.id,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname || 'Newbie Guy',
      },
      itemCount: user.wishlist.length,
      lastUpdated: lastUpdated.toISOString(),
    };
  });

  // Get total count
  const totalUsers = await prisma.user.count({ where });
  const total = filters.hasItems !== undefined ? filteredUsers.length : totalUsers;

  return {
    wishlists,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
};

/**
 * Get wishlist statistics
 */
export const getWishlistStatistics = async (): Promise<WishlistStatistics> => {
  // Get all wishlist items
  const allWishlists = await prisma.wishlist.findMany({
    include: {
      user: {
        select: { id: true },
      },
      game: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
    },
  });

  // Calculate statistics
  const uniqueUsers = new Set(allWishlists.map((w) => w.userId));
  const totalWishlists = uniqueUsers.size;
  const totalItems = allWishlists.length;
  const averageItemsPerWishlist =
    totalWishlists > 0 ? Number((totalItems / totalWishlists).toFixed(2)) : 0;

  // Most wished games
  const gameCounts = new Map<string, { game: (typeof allWishlists)[0]['game']; count: number }>();
  for (const wishlist of allWishlists) {
    const gameId = wishlist.gameId;
    const existing = gameCounts.get(gameId);
    if (existing) {
      existing.count++;
    } else {
      gameCounts.set(gameId, {
        game: wishlist.game,
        count: 1,
      });
    }
  }

  const mostWishedGames = Array.from(gameCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map((item) => ({
      gameId: item.game.id,
      game: {
        id: item.game.id,
        title: item.game.title,
        slug: item.game.slug,
      },
      wishlistCount: item.count,
    }));

  // Wishlist growth (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentWishlists = await prisma.wishlist.findMany({
    where: {
      addedAt: { gte: thirtyDaysAgo },
    },
    select: {
      addedAt: true,
    },
    orderBy: {
      addedAt: 'asc',
    },
  });

  // Group by date
  const growthMap = new Map<string, number>();
  for (const wishlist of recentWishlists) {
    const date = wishlist.addedAt.toISOString().split('T')[0];
    growthMap.set(date, (growthMap.get(date) || 0) + 1);
  }

  const wishlistGrowth = Array.from(growthMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalWishlists,
    totalItems,
    averageItemsPerWishlist,
    mostWishedGames,
    wishlistGrowth,
  };
};

// FAQ Management Functions

export interface FAQAdminFilters {
  category?: string;
  search?: string;
  active?: boolean;
  page?: number;
  pageSize?: number;
}

export interface FAQAdminResult {
  faqs: Array<{
    id: string;
    category: string;
    question: string;
    answer: string;
    order: number;
    active: boolean;
    createdAt: string;
  }>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Get all FAQs for admin with pagination and filters
 */
export const getAllFAQsForAdmin = async (filters: FAQAdminFilters): Promise<FAQAdminResult> => {
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 20;
  const skip = (page - 1) * pageSize;

  const where: Prisma.FAQWhereInput = {};

  if (filters.category) {
    where.category = { contains: filters.category, mode: 'insensitive' };
  }

  if (filters.active !== undefined) {
    where.active = filters.active;
  }

  if (filters.search) {
    where.OR = [
      { question: { contains: filters.search, mode: 'insensitive' } },
      { answer: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const [faqs, total] = await Promise.all([
    prisma.fAQ.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: [{ category: 'asc' }, { order: 'asc' }],
    }),
    prisma.fAQ.count({ where }),
  ]);

  return {
    faqs: faqs.map((faq) => ({
      id: faq.id,
      category: faq.category,
      question: faq.question,
      answer: faq.answer,
      order: faq.order,
      active: faq.active,
      createdAt: faq.createdAt.toISOString(),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
};

// G2A Management Functions (wrappers for existing services)

export const getAllG2AOffersForAdmin = async (filters: {
  productId?: string;
  status?: string;
  offerType?: string;
  active?: boolean;
  page?: number;
  perPage?: number;
}): Promise<{
  data: Array<{
    id: string;
    type: string;
    productId: string;
    productName?: string;
    price: number;
    visibility: string;
    status: string;
    active: boolean;
    inventory?: {
      size: number;
      sold: number;
      type: string;
    };
    createdAt?: string;
    updatedAt?: string;
    promoStatus?: string;
  }>;
  meta?: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
  };
}> => {
  const { getAllOffersForAdmin } = await import('./g2a-offer.service.js');
  // Convert string filters to proper types - cast to any first, then to proper type
  const typedFilters = {
    productId: filters.productId,
    status: filters.status,
    offerType: filters.offerType,
    active: filters.active,
    page: filters.page,
    perPage: filters.perPage,
  } as Parameters<typeof getAllOffersForAdmin>[0];
  return getAllOffersForAdmin(typedFilters);
};

export const getG2AOfferByIdForAdmin = async (
  offerId: string
): Promise<{
  id: string;
  type: string;
  productId: string;
  productName?: string;
  price: number;
  visibility: string;
  status: string;
  active: boolean;
  inventory?: {
    size: number;
    sold: number;
    type: string;
  };
  createdAt?: string;
  updatedAt?: string;
  promoStatus?: string;
}> => {
  const { getOfferByIdForAdmin } = await import('./g2a-offer.service.js');
  return getOfferByIdForAdmin(offerId);
};

export const getAllG2AReservationsForAdmin = async (filters: {
  orderId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<{
  reservations: Array<{
    reservationId: string;
    orderId: string;
    productId: string;
    quantity: number;
    status: string;
    expiresAt: string;
    createdAt: string;
    order?: {
      id: string;
      status: string;
      total: number;
      user: {
        id: string;
        email: string;
        nickname: string;
      };
    };
  }>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> => {
  const { getAllReservationsForAdmin } = await import('./g2a-reservation.service.js');
  // Convert string status to ReservationStatus type - cast to any first, then to proper type
  const typedFilters = {
    orderId: filters.orderId,
    status: filters.status,
    page: filters.page,
    pageSize: filters.pageSize,
  } as Parameters<typeof getAllReservationsForAdmin>[0];
  return getAllReservationsForAdmin(typedFilters);
};

export const cancelG2AReservationForAdmin = async (reservationId: string): Promise<void> => {
  const { cancelReservationForAdmin } = await import('./g2a-reservation.service.js');
  return cancelReservationForAdmin(reservationId);
};

// Cache Management Functions

export const getCacheStatisticsForAdmin = async (): Promise<{
  totalKeys: number;
  memoryUsage: number;
  redisStatus: 'connected' | 'disconnected' | 'error';
  keysByPattern: Record<string, number>;
}> => {
  const { getCacheStatistics } = await import('./cache.service.js');
  return getCacheStatistics();
};

export const invalidateCacheForAdmin = async (
  pattern: string
): Promise<{
  keysInvalidated: number;
  pattern: string;
  message: string;
}> => {
  const { invalidateCache, getCacheKeys } = await import('./cache.service.js');

  // Get keys before invalidation to count them
  const keysBefore = await getCacheKeys(pattern);
  const countBefore = keysBefore.length;

  // Invalidate cache
  await invalidateCache(pattern);

  // Get keys after invalidation to verify
  const keysAfter = await getCacheKeys(pattern);
  const countAfter = keysAfter.length;
  const keysInvalidated = countBefore - countAfter;

  return {
    keysInvalidated,
    pattern,
    message: `Invalidated ${keysInvalidated} cache keys matching pattern: ${pattern}`,
  };
};

export const clearAllCacheForAdmin = async (): Promise<{
  keysInvalidated: number;
  pattern: string;
  message: string;
}> => {
  const { clearAllCache } = await import('./cache.service.js');
  const keysInvalidated = await clearAllCache();

  return {
    keysInvalidated,
    pattern: '*',
    message: `Cleared all cache: ${keysInvalidated} keys invalidated`,
  };
};

// Enhanced User Management Functions

export const updateUserBalanceForAdmin = async (
  userId: string,
  amount: number,
  reason: string
): Promise<{
  userId: string;
  previousBalance: number;
  newBalance: number;
  amount: number;
  reason: string;
}> => {
  const { updateUserBalance } = await import('./user.service.js');
  return updateUserBalance(userId, amount, reason);
};

export const updateUserRoleForAdmin = async (
  userId: string,
  role: 'USER' | 'ADMIN'
): Promise<void> => {
  const { updateUserRole } = await import('./user.service.js');
  return updateUserRole(userId, role);
};

export interface UserUpdateInput {
  nickname?: string;
  firstName?: string;
  lastName?: string;
  role?: 'USER' | 'ADMIN';
  balance?: number;
}

export const updateUser = async (
  userId: string,
  data: UserUpdateInput
): Promise<UserDetailsResponse> => {
  // Validate role if provided
  if (data.role && !['USER', 'ADMIN'].includes(data.role)) {
    throw new AppError('Invalid role. Must be USER or ADMIN', 400);
  }

  // Validate balance if provided
  if (data.balance !== undefined && (isNaN(data.balance) || data.balance < 0)) {
    throw new AppError('Balance must be a non-negative number', 400);
  }

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, balance: true },
  });

  if (!existingUser) {
    throw new AppError('User not found', 404);
  }

  // Prepare update data
  const updateData: Prisma.UserUpdateInput = {};
  if (data.nickname !== undefined) updateData.nickname = data.nickname;
  if (data.firstName !== undefined) updateData.firstName = data.firstName;
  if (data.lastName !== undefined) updateData.lastName = data.lastName;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.balance !== undefined) {
    // If balance is being updated, create a transaction record
    const balanceChange = data.balance - Number(existingUser.balance);
    if (balanceChange !== 0) {
      updateData.balance = data.balance;
      // Create transaction record for balance change
      await prisma.transaction.create({
        data: {
          userId,
          type: balanceChange > 0 ? 'TOP_UP' : 'REFUND',
          amount: Math.abs(balanceChange),
          currency: 'USD',
          status: 'COMPLETED',
          description: `Admin balance adjustment: ${balanceChange > 0 ? '+' : ''}${balanceChange.toFixed(2)}`,
        },
      });
    }
  }

  // Update user
  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    include: {
      orders: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          total: true,
          createdAt: true,
        },
      },
      transactions: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          type: true,
          amount: true,
          status: true,
          createdAt: true,
        },
      },
    },
  });

  // Invalidate cache (non-blocking)
  try {
    const { invalidateCache } = await import('./cache.service.js');
    await invalidateCache(`user:${userId}:*`);
  } catch (cacheError) {
    console.warn('[User Update] Failed to invalidate cache:', cacheError);
  }

  return {
    id: user.id,
    email: user.email,
    nickname: user.nickname || 'Newbie Guy',
    firstName: user.firstName || undefined,
    lastName: user.lastName || undefined,
    balance: Number(user.balance),
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    orders: user.orders.map((order) => ({
      id: order.id,
      status: order.status,
      total: Number(order.total),
      createdAt: order.createdAt.toISOString(),
    })),
    transactions: user.transactions.map((t) => ({
      id: t.id,
      type: t.type,
      amount: Number(t.amount),
      status: t.status,
      createdAt: t.createdAt.toISOString(),
    })),
  };
};

export const deleteUser = async (userId: string): Promise<void> => {
  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      _count: {
        select: {
          orders: true,
          transactions: true,
          cart: true,
          wishlist: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Check for dependencies
  if (user._count.orders > 0) {
    throw new AppError(
      `Cannot delete user with ${user._count.orders} active order(s). Please cancel or complete orders first.`,
      409
    );
  }

  // Use transaction to ensure atomicity
  await prisma.$transaction(async (tx) => {
    // Delete user's cart items
    if (user._count.cart > 0) {
      await tx.cartItem.deleteMany({
        where: { userId },
      });
    }

    // Delete user's wishlist items
    if (user._count.wishlist > 0) {
      await tx.wishlist.deleteMany({
        where: { userId },
      });
    }

    // Delete user's transactions (if any)
    if (user._count.transactions > 0) {
      await tx.transaction.deleteMany({
        where: { userId },
      });
    }

    // Delete user's login history
    await tx.loginHistory.deleteMany({
      where: { userId },
    });

    // Delete user's sessions (sessions don't have userId, they use sessionId)
    // Sessions are managed separately and don't need to be deleted here

    // Finally, delete the user
    await tx.user.delete({
      where: { id: userId },
    });
  });

  // Invalidate cache (non-blocking)
  try {
    const { invalidateCache } = await import('./cache.service.js');
    await invalidateCache(`user:${userId}:*`);
  } catch (cacheError) {
    console.warn('[User Delete] Failed to invalidate cache:', cacheError);
  }
};

// Catalog Metadata Management Functions

export const getAllCategories = async () => {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { games: true },
      },
    },
  });

  return categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    gamesCount: cat._count.games,
  }));
};

export const createCategory = async (data: { name: string; description?: string }) => {
  const slug = data.name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  // Check if category with same slug already exists
  const existing = await prisma.category.findUnique({
    where: { slug },
  });

  if (existing) {
    throw new AppError('Category with this name already exists', 409);
  }

  const category = await prisma.category.create({
    data: {
      name: data.name,
      slug,
    },
  });

  // Invalidate cache
  try {
    const { invalidateCache } = await import('./cache.service.js');
    await invalidateCache('catalog:*');
    await invalidateCache('home:*');
    await invalidateCache('game:*');
  } catch (cacheError) {
    console.warn('[Category Create] Failed to invalidate cache:', cacheError);
  }

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
    };
};

export const updateCategory = async (id: string, data: { name?: string; description?: string }) => {
  const updateData: Prisma.CategoryUpdateInput = {};

  if (data.name !== undefined) {
    const slug = data.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    // Check if another category with same slug exists
    const existing = await prisma.category.findUnique({
      where: { slug },
    });
    if (existing && existing.id !== id) {
      throw new AppError('Category with this name already exists', 409);
    }
    updateData.name = data.name;
    updateData.slug = slug;
  }

  // Description field is not in the schema, removed

  const category = await prisma.category.update({
    where: { id },
    data: updateData,
  });

  // Invalidate cache
  try {
    const { invalidateCache } = await import('./cache.service.js');
    await invalidateCache('catalog:*');
    await invalidateCache('home:*');
    await invalidateCache('game:*');
  } catch (cacheError) {
    console.warn('[Category Update] Failed to invalidate cache:', cacheError);
  }

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
    };
};

export const deleteCategory = async (id: string) => {
  // Check if category has associated games
  const gamesCount = await prisma.gameCategory.count({
    where: { categoryId: id },
  });

  if (gamesCount > 0) {
    throw new AppError(
      `Cannot delete category with ${gamesCount} associated game(s). Please remove games from this category first.`,
      409
    );
  }

  await prisma.category.delete({
    where: { id },
  });

  // Invalidate cache
  try {
    const { invalidateCache } = await import('./cache.service.js');
    await invalidateCache('catalog:*');
    await invalidateCache('home:*');
    await invalidateCache('game:*');
  } catch (cacheError) {
    console.warn('[Category Delete] Failed to invalidate cache:', cacheError);
  }
};

export const getAllGenres = async () => {
  const genres = await prisma.genre.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { games: true },
      },
    },
  });

  return genres.map((genre) => ({
    id: genre.id,
    name: genre.name,
    slug: genre.slug,
    gamesCount: genre._count.games,
  }));
};

export const createGenre = async (data: { name: string; description?: string }) => {
  const slug = data.name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  // Check if genre with same slug already exists
  const existing = await prisma.genre.findUnique({
    where: { slug },
  });

  if (existing) {
    throw new AppError('Genre with this name already exists', 409);
  }

  const genre = await prisma.genre.create({
    data: {
      name: data.name,
      slug,
    },
  });

  // Invalidate cache
  try {
    const { invalidateCache } = await import('./cache.service.js');
    await invalidateCache('catalog:*');
    await invalidateCache('home:*');
    await invalidateCache('game:*');
  } catch (cacheError) {
    console.warn('[Genre Create] Failed to invalidate cache:', cacheError);
  }

    return {
      id: genre.id,
      name: genre.name,
      slug: genre.slug,
    };
};

export const updateGenre = async (id: string, data: { name?: string; description?: string }) => {
  const updateData: Prisma.GenreUpdateInput = {};

  if (data.name !== undefined) {
    const slug = data.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    // Check if another genre with same slug exists
    const existing = await prisma.genre.findUnique({
      where: { slug },
    });
    if (existing && existing.id !== id) {
      throw new AppError('Genre with this name already exists', 409);
    }
    updateData.name = data.name;
    updateData.slug = slug;
  }

  // Description field is not in the schema, removed

  const genre = await prisma.genre.update({
    where: { id },
    data: updateData,
  });

  // Invalidate cache
  try {
    const { invalidateCache } = await import('./cache.service.js');
    await invalidateCache('catalog:*');
    await invalidateCache('home:*');
    await invalidateCache('game:*');
  } catch (cacheError) {
    console.warn('[Genre Update] Failed to invalidate cache:', cacheError);
  }

    return {
      id: genre.id,
      name: genre.name,
      slug: genre.slug,
    };
};

export const deleteGenre = async (id: string) => {
  // Check if genre has associated games
  const gamesCount = await prisma.gameGenre.count({
    where: { genreId: id },
  });

  if (gamesCount > 0) {
    throw new AppError(
      `Cannot delete genre with ${gamesCount} associated game(s). Please remove games from this genre first.`,
      409
    );
  }

  await prisma.genre.delete({
    where: { id },
  });

  // Invalidate cache
  try {
    const { invalidateCache } = await import('./cache.service.js');
    await invalidateCache('catalog:*');
    await invalidateCache('home:*');
    await invalidateCache('game:*');
  } catch (cacheError) {
    console.warn('[Genre Delete] Failed to invalidate cache:', cacheError);
  }
};

export const getAllPlatforms = async () => {
  const platforms = await prisma.platform.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { games: true },
      },
    },
  });

  return platforms.map((platform) => ({
    id: platform.id,
    name: platform.name,
    slug: platform.slug,
    gamesCount: platform._count.games,
  }));
};

export const createPlatform = async (data: { name: string; description?: string }) => {
  const slug = data.name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  // Check if platform with same slug already exists
  const existing = await prisma.platform.findUnique({
    where: { slug },
  });

  if (existing) {
    throw new AppError('Platform with this name already exists', 409);
  }

  const platform = await prisma.platform.create({
    data: {
      name: data.name,
      slug,
    },
  });

  // Invalidate cache
  try {
    const { invalidateCache } = await import('./cache.service.js');
    await invalidateCache('catalog:*');
    await invalidateCache('home:*');
    await invalidateCache('game:*');
  } catch (cacheError) {
    console.warn('[Platform Create] Failed to invalidate cache:', cacheError);
  }

    return {
      id: platform.id,
      name: platform.name,
      slug: platform.slug,
    };
};

export const updatePlatform = async (id: string, data: { name?: string; description?: string }) => {
  const updateData: Prisma.PlatformUpdateInput = {};

  if (data.name !== undefined) {
    const slug = data.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    // Check if another platform with same slug exists
    const existing = await prisma.platform.findUnique({
      where: { slug },
    });
    if (existing && existing.id !== id) {
      throw new AppError('Platform with this name already exists', 409);
    }
    updateData.name = data.name;
    updateData.slug = slug;
  }

  // Description field is not in the schema, removed

  const platform = await prisma.platform.update({
    where: { id },
    data: updateData,
  });

  // Invalidate cache
  try {
    const { invalidateCache } = await import('./cache.service.js');
    await invalidateCache('catalog:*');
    await invalidateCache('home:*');
    await invalidateCache('game:*');
  } catch (cacheError) {
    console.warn('[Platform Update] Failed to invalidate cache:', cacheError);
  }

    return {
      id: platform.id,
      name: platform.name,
      slug: platform.slug,
    };
};

export const deletePlatform = async (id: string) => {
  // Check if platform has associated games
  const gamesCount = await prisma.gamePlatform.count({
    where: { platformId: id },
  });

  if (gamesCount > 0) {
    throw new AppError(
      `Cannot delete platform with ${gamesCount} associated game(s). Please remove games from this platform first.`,
      409
    );
  }

  await prisma.platform.delete({
    where: { id },
  });

  // Invalidate cache
  try {
    const { invalidateCache } = await import('./cache.service.js');
    await invalidateCache('catalog:*');
    await invalidateCache('home:*');
    await invalidateCache('game:*');
  } catch (cacheError) {
    console.warn('[Platform Delete] Failed to invalidate cache:', cacheError);
  }
};

export const getAllTags = async () => {
  const tags = await prisma.tag.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { games: true },
      },
    },
  });

  return tags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    gamesCount: tag._count.games,
  }));
};

export const createTag = async (data: { name: string }) => {
  const slug = data.name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  // Check if tag with same slug already exists
  const existing = await prisma.tag.findUnique({
    where: { slug },
  });

  if (existing) {
    throw new AppError('Tag with this name already exists', 409);
  }

  const tag = await prisma.tag.create({
    data: {
      name: data.name,
      slug,
    },
  });

  // Invalidate cache
  try {
    const { invalidateCache } = await import('./cache.service.js');
    await invalidateCache('catalog:*');
    await invalidateCache('home:*');
    await invalidateCache('game:*');
  } catch (cacheError) {
    console.warn('[Tag Create] Failed to invalidate cache:', cacheError);
  }

    return {
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
    };
};

export const updateTag = async (id: string, data: { name?: string }) => {
  const updateData: Prisma.TagUpdateInput = {};

  if (data.name !== undefined) {
    const slug = data.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    // Check if another tag with same slug exists
    const existing = await prisma.tag.findUnique({
      where: { slug },
    });
    if (existing && existing.id !== id) {
      throw new AppError('Tag with this name already exists', 409);
    }
    updateData.name = data.name;
    updateData.slug = slug;
  }

  const tag = await prisma.tag.update({
    where: { id },
    data: updateData,
  });

  // Invalidate cache
  try {
    const { invalidateCache } = await import('./cache.service.js');
    await invalidateCache('catalog:*');
    await invalidateCache('home:*');
    await invalidateCache('game:*');
  } catch (cacheError) {
    console.warn('[Tag Update] Failed to invalidate cache:', cacheError);
  }

    return {
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
    };
};

export const deleteTag = async (id: string) => {
  // Check if tag has associated games
  const gamesCount = await prisma.gameTag.count({
    where: { tagId: id },
  });

  if (gamesCount > 0) {
    throw new AppError(
      `Cannot delete tag with ${gamesCount} associated game(s). Please remove games from this tag first.`,
      409
    );
  }

  await prisma.tag.delete({
    where: { id },
  });

  // Invalidate cache
  try {
    const { invalidateCache } = await import('./cache.service.js');
    await invalidateCache('catalog:*');
    await invalidateCache('home:*');
    await invalidateCache('game:*');
  } catch (cacheError) {
    console.warn('[Tag Delete] Failed to invalidate cache:', cacheError);
  }
};

export const getUserActivityForAdmin = async (
  userId: string,
  filters?: {
    startDate?: string;
    endDate?: string;
    activityType?: 'login' | 'order' | 'transaction' | 'all';
  }
): Promise<{
  userId: string;
  loginHistory: Array<{
    id: string;
    ipAddress?: string;
    userAgent?: string;
    success: boolean;
    createdAt: string;
  }>;
  orders: Array<{
    id: string;
    status: string;
    total: number;
    createdAt: string;
  }>;
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    status: string;
    createdAt: string;
  }>;
}> => {
  const where: Prisma.LoginHistoryWhereInput = { userId };
  const orderWhere: Prisma.OrderWhereInput = { userId };
  const transactionWhere: Prisma.TransactionWhereInput = { userId };

  if (filters?.startDate) {
    const startDate = new Date(filters.startDate);
    where.createdAt = { gte: startDate };
    orderWhere.createdAt = { gte: startDate };
    transactionWhere.createdAt = { gte: startDate };
  }

  if (filters?.endDate) {
    const endDate = new Date(filters.endDate);
    const existingWhereDate = where.createdAt as { gte?: Date } | undefined;
    const existingOrderDate = orderWhere.createdAt as { gte?: Date } | undefined;
    const existingTransactionDate = transactionWhere.createdAt as { gte?: Date } | undefined;

    where.createdAt = existingWhereDate ? { ...existingWhereDate, lte: endDate } : { lte: endDate };
    orderWhere.createdAt = existingOrderDate
      ? { ...existingOrderDate, lte: endDate }
      : { lte: endDate };
    transactionWhere.createdAt = existingTransactionDate
      ? { ...existingTransactionDate, lte: endDate }
      : { lte: endDate };
  }

  const [loginHistory, orders, transactions] = await Promise.all([
    filters?.activityType === 'order' || filters?.activityType === 'transaction'
      ? []
      : prisma.loginHistory.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: 100,
        }),
    filters?.activityType === 'login' || filters?.activityType === 'transaction'
      ? []
      : prisma.order.findMany({
          where: orderWhere,
          orderBy: { createdAt: 'desc' },
          take: 100,
          select: {
            id: true,
            status: true,
            total: true,
            createdAt: true,
          },
        }),
    filters?.activityType === 'login' || filters?.activityType === 'order'
      ? []
      : prisma.transaction.findMany({
          where: transactionWhere,
          orderBy: { createdAt: 'desc' },
          take: 100,
          select: {
            id: true,
            type: true,
            amount: true,
            status: true,
            createdAt: true,
          },
        }),
  ]);

  return {
    userId,
    loginHistory: loginHistory.map((lh) => ({
      id: lh.id,
      ipAddress: lh.ipAddress || undefined,
      userAgent: lh.userAgent || undefined,
      success: lh.success,
      createdAt: lh.createdAt.toISOString(),
    })),
    orders: orders.map((order) => ({
      id: order.id,
      status: order.status,
      total: Number(order.total),
      createdAt: order.createdAt.toISOString(),
    })),
    transactions: transactions.map((t) => ({
      id: t.id,
      type: t.type,
      amount: Number(t.amount),
      status: t.status,
      createdAt: t.createdAt.toISOString(),
    })),
  };
};
