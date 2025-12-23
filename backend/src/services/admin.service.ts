import prisma from '../config/database.js';
import { 
  AdminDashboardStats, 
  UserSearchFilters, 
  TransactionFilters, 
  UserDetailsResponse,
  GameCreateInput,
  GameUpdateInput,
  BlogPostCreateInput,
  BlogPostUpdateInput
} from '../types/admin.js';
import { AppError } from '../middleware/errorHandler.js';
import { Prisma } from '@prisma/client';

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
    topSellingGames.map(async (item: any) => {
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
    })
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
    where.status = filters.status as 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
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
      order: t.order ? {
        id: t.order.id,
        status: t.order.status,
      } : undefined,
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

export const createGame = async (data: GameCreateInput) => {
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

  return {
    id: game.id,
    title: game.title,
    slug: game.slug,
    price: Number(game.price),
    createdAt: game.createdAt.toISOString(),
  };
};

export const updateGame = async (id: string, data: GameUpdateInput) => {
  const updateData: Prisma.GameUpdateInput = {};

  if (data.title !== undefined) updateData.title = data.title;
  if (data.slug !== undefined) updateData.slug = data.slug;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.price !== undefined) updateData.price = data.price;
  if (data.originalPrice !== undefined) updateData.originalPrice = data.originalPrice;
  if (data.imageUrl !== undefined) updateData.image = data.imageUrl;
  if (data.publisher !== undefined) updateData.publisher = data.publisher;
  if (data.releaseDate !== undefined) updateData.releaseDate = data.releaseDate ? new Date(data.releaseDate) : new Date();
  if (data.isPreorder !== undefined) updateData.isPreorder = data.isPreorder;
  if (data.inStock !== undefined) updateData.inStock = data.inStock;

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

  return {
    id: game.id,
    title: game.title,
    slug: game.slug,
    price: Number(game.price),
    updatedAt: game.updatedAt.toISOString(),
  };
};

export const deleteGame = async (id: string) => {
  await prisma.game.delete({
    where: { id },
  });
  return { success: true };
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

export const createBlogPost = async (data: BlogPostCreateInput, authorEmail: string) => {
  const post = await prisma.article.create({
    data: {
      title: data.title,
      slug: data.slug,
      content: data.content,
      excerpt: data.excerpt,
      coverImage: data.imageUrl || '',
      category: data.category,
      tags: data.tags,
      published: data.published || false,
      author: authorEmail,
      publishedAt: data.published ? new Date() : null,
    },
  });

  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    createdAt: post.createdAt.toISOString(),
  };
};

export const updateBlogPost = async (id: string, data: BlogPostUpdateInput) => {
  const updateData: Prisma.ArticleUpdateInput = {};

  if (data.title !== undefined) updateData.title = data.title;
  if (data.slug !== undefined) updateData.slug = data.slug;
  if (data.content !== undefined) updateData.content = data.content;
  if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
  if (data.imageUrl !== undefined) updateData.coverImage = data.imageUrl;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.tags !== undefined) updateData.tags = data.tags;
  if (data.published !== undefined) {
    updateData.published = data.published;
    if (data.published && !updateData.publishedAt) {
      updateData.publishedAt = new Date();
    }
  }

  const post = await prisma.article.update({
    where: { id },
    data: updateData,
  });

  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    updatedAt: post.updatedAt.toISOString(),
  };
};

export const deleteBlogPost = async (id: string) => {
  await prisma.article.delete({
    where: { id },
  });
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
      const keysByGameId = new Map(
        o.keys.map((k) => [k.gameId, k.key])
      );

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

export const updateOrderStatus = async (id: string, status: string) => {
  const order = await prisma.order.update({
    where: { id },
    data: { status: status as 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' },
  });

  return {
    id: order.id,
    status: order.status,
    updatedAt: order.updatedAt.toISOString(),
  };
};

export const generateFakeDataForUser = async (userId: string, webhookData: Record<string, unknown>): Promise<void> => {
  console.log(`Generating fake data for user ${userId}`);
};

export const exportUserReport = async (userId: string): Promise<Buffer> => {
  const userData = await getUserDetails(userId);
  const { generateUserSummaryPDF } = await import('./pdf.service.js');
  return await generateUserSummaryPDF(userData);
};
