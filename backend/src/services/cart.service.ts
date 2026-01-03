import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import redisClient from '../config/redis.js';
import { hashPassword } from '../utils/bcrypt.js';

// Cache TTL for cart (15 minutes)
const CART_CACHE_TTL = 15 * 60;

export interface CartItem {
  gameId: string;
  quantity: number;
  game: {
    id: string;
    title: string;
    slug: string;
    image: string;
    price: number;
    inStock: boolean;
  };
}

export interface CartResponse {
  items: CartItem[];
  total: number;
}

/**
 * Get cache key for cart
 */
const getCartCacheKey = (userId?: string, sessionId?: string): string => {
  const identifier = userId || sessionId!;
  return `cart:${identifier}`;
};

/**
 * Invalidate cart cache
 */
const invalidateCartCache = async (userId?: string, sessionId?: string): Promise<void> => {
  try {
    if (redisClient.isOpen) {
      const cacheKey = getCartCacheKey(userId, sessionId);
      await redisClient.del(cacheKey);
    }
  } catch (err) {
    // Gracefully handle Redis unavailability
    console.warn('[Cart Cache] Failed to invalidate cache:', err);
  }
};

/**
 * Get or create guest user for sessionId
 * This is needed because Prisma schema requires foreign key to User table
 */
const getOrCreateGuestUser = async (sessionId: string): Promise<string> => {
  // Check if guest user already exists for this session
  const guestUser = await prisma.user.findUnique({
    where: { id: sessionId },
    select: { id: true },
  });

  if (guestUser) {
    return guestUser.id;
  }

  // Create temporary guest user for this session
  // Use sessionId as both id and email (with prefix to avoid conflicts)
  const guestEmail = `guest-${sessionId}@temp.local`;
  const tempPassword = await hashPassword(`temp-${sessionId}-${Date.now()}`);

  try {
    const newGuestUser = await prisma.user.create({
      data: {
        id: sessionId,
        email: guestEmail,
        passwordHash: tempPassword,
        nickname: 'Guest',
        emailVerified: false,
        role: 'USER',
      },
      select: { id: true },
    });

    return newGuestUser.id;
  } catch (error: any) {
    // If user already exists (race condition), just return the sessionId
    if (error.code === 'P2002') {
      return sessionId;
    }
    throw error;
  }
};

/**
 * Get cart items for user (authenticated) or session (guest)
 */
export const getCart = async (userId?: string, sessionId?: string): Promise<CartResponse> => {
  if (!userId && !sessionId) {
    throw new AppError('User ID or session ID required', 400);
  }

  // For guest sessions, ensure guest user exists first
  const identifier = userId || (sessionId ? await getOrCreateGuestUser(sessionId) : undefined);
  if (!identifier) {
    throw new AppError('User ID or session ID required', 400);
  }

  const cacheKey = getCartCacheKey(userId, sessionId);

  // Try to get from cache (only after identifier is determined)
  try {
    if (redisClient.isOpen) {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }
  } catch (err) {
    // Gracefully handle Redis unavailability - continue to database
    console.warn('[Cart Cache] Failed to read from cache:', err);
  }

  // Fetch from database using the determined identifier
  const cartItems = await prisma.cartItem.findMany({
    where: { userId: identifier },
    include: {
      game: {
        select: {
          id: true,
          title: true,
          slug: true,
          image: true,
          price: true,
          inStock: true,
        },
      },
    },
    orderBy: {
      addedAt: 'desc',
    },
  });

  const total = cartItems.reduce((sum, item) => sum + Number(item.game.price) * item.quantity, 0);

  const result: CartResponse = {
    items: cartItems.map((item) => ({
      gameId: item.gameId,
      quantity: item.quantity,
      game: {
        id: item.game.id,
        title: item.game.title,
        slug: item.game.slug,
        image: item.game.image,
        price: Number(item.game.price),
        inStock: item.game.inStock,
      },
    })),
    total: Number(total.toFixed(2)),
  };

  // Cache the result
  try {
    if (redisClient.isOpen) {
      await redisClient.setEx(cacheKey, CART_CACHE_TTL, JSON.stringify(result));
    }
  } catch (err) {
    // Gracefully handle Redis unavailability
    console.warn('[Cart Cache] Failed to write to cache:', err);
  }

  return result;
};

/**
 * Add item to cart
 */
export const addToCart = async (
  gameId: string,
  quantity: number = 1,
  userId?: string,
  sessionId?: string
): Promise<void> => {
  if (!userId && !sessionId) {
    throw new AppError('User ID or session ID required', 400);
  }

  if (quantity <= 0) {
    throw new AppError('Quantity must be greater than 0', 400);
  }

  // Verify game exists and is in stock
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { id: true, inStock: true, g2aStock: true, g2aProductId: true },
  });

  if (!game) {
    throw new AppError('Game not found', 404);
  }

  // Check stock: inStock must be true, and if game has G2A productId, g2aStock must also be true
  if (!game.inStock) {
    throw new AppError('Game is out of stock', 400);
  }

  // Only check g2aStock if game has G2A productId
  if (game.g2aProductId && game.g2aStock === false) {
    throw new AppError('Game is out of stock on G2A', 400);
  }

  // For guest sessions, ensure guest user exists
  const identifier = userId || (sessionId ? await getOrCreateGuestUser(sessionId) : undefined);
  if (!identifier) {
    throw new AppError('User ID or session ID required', 400);
  }

  // Check if item already in cart
  const existingItem = await prisma.cartItem.findUnique({
    where: {
      userId_gameId: {
        userId: identifier,
        gameId,
      },
    },
  });

  if (existingItem) {
    // Update quantity
    await prisma.cartItem.update({
      where: {
        userId_gameId: {
          userId: identifier,
          gameId,
        },
      },
      data: {
        quantity: existingItem.quantity + quantity,
      },
    });
  } else {
    // Create new cart item
    await prisma.cartItem.create({
      data: {
        userId: identifier,
        gameId,
        quantity,
      },
    });
  }

  // Invalidate cache after modification
  await invalidateCartCache(userId, sessionId);
};

/**
 * Update cart item quantity
 */
export const updateCartItem = async (
  gameId: string,
  quantity: number,
  userId?: string,
  sessionId?: string
): Promise<void> => {
  if (!userId && !sessionId) {
    throw new AppError('User ID or session ID required', 400);
  }

  if (quantity <= 0) {
    // Remove item if quantity is 0 or less
    await removeFromCart(gameId, userId, sessionId);
    return;
  }

  // For guest sessions, ensure guest user exists
  const identifier = userId || (sessionId ? await getOrCreateGuestUser(sessionId) : undefined);
  if (!identifier) {
    throw new AppError('User ID or session ID required', 400);
  }

  await prisma.cartItem.update({
    where: {
      userId_gameId: {
        userId: identifier,
        gameId,
      },
    },
    data: {
      quantity,
    },
  });

  // Invalidate cache after modification
  await invalidateCartCache(userId, sessionId);
};

/**
 * Remove item from cart
 */
export const removeFromCart = async (
  gameId: string,
  userId?: string,
  sessionId?: string
): Promise<void> => {
  if (!userId && !sessionId) {
    throw new AppError('User ID or session ID required', 400);
  }

  // For guest sessions, ensure guest user exists
  const identifier = userId || (sessionId ? await getOrCreateGuestUser(sessionId) : undefined);
  if (!identifier) {
    throw new AppError('User ID or session ID required', 400);
  }

  await prisma.cartItem.delete({
    where: {
      userId_gameId: {
        userId: identifier,
        gameId,
      },
    },
  });

  // Invalidate cache after modification
  await invalidateCartCache(userId, sessionId);
};

/**
 * Clear entire cart
 */
export const clearCart = async (userId?: string, sessionId?: string): Promise<void> => {
  if (!userId && !sessionId) {
    throw new AppError('User ID or session ID required', 400);
  }

  // For guest sessions, ensure guest user exists
  const identifier = userId || (sessionId ? await getOrCreateGuestUser(sessionId) : undefined);
  if (!identifier) {
    throw new AppError('User ID or session ID required', 400);
  }

  await prisma.cartItem.deleteMany({
    where: {
      userId: identifier,
    },
  });

  // Invalidate cache after modification
  await invalidateCartCache(userId, sessionId);
};

/**
 * Migrate session cart to user cart (when guest logs in)
 * Uses transaction to ensure atomicity
 */
export const migrateSessionCartToUser = async (
  sessionId: string,
  userId: string
): Promise<void> => {
  if (!sessionId || !userId) {
    throw new AppError('Session ID and User ID are required for migration', 400);
  }

  // Use transaction to ensure atomicity
  await prisma.$transaction(async (tx) => {
    // Get session cart items
    const sessionItems = await tx.cartItem.findMany({
      where: { userId: sessionId },
    });

    if (sessionItems.length === 0) {
      // No items to migrate
      return;
    }

    // For each session item, merge with user cart
    for (const sessionItem of sessionItems) {
      // Verify game still exists and is in stock
      const game = await tx.game.findUnique({
        where: { id: sessionItem.gameId },
        select: { id: true, inStock: true },
      });

      if (!game) {
        // Game no longer exists, skip this item
        console.warn(`[Cart Migration] Game ${sessionItem.gameId} not found, skipping`);
        // Delete session item
        await tx.cartItem.delete({
          where: {
            userId_gameId: {
              userId: sessionId,
              gameId: sessionItem.gameId,
            },
          },
        });
        continue;
      }

      if (!game.inStock) {
        // Game out of stock, skip this item
        console.warn(`[Cart Migration] Game ${sessionItem.gameId} out of stock, skipping`);
        // Delete session item
        await tx.cartItem.delete({
          where: {
            userId_gameId: {
              userId: sessionId,
              gameId: sessionItem.gameId,
            },
          },
        });
        continue;
      }

      const userItem = await tx.cartItem.findUnique({
        where: {
          userId_gameId: {
            userId,
            gameId: sessionItem.gameId,
          },
        },
      });

      if (userItem) {
        // Merge quantities
        await tx.cartItem.update({
          where: {
            userId_gameId: {
              userId,
              gameId: sessionItem.gameId,
            },
          },
          data: {
            quantity: userItem.quantity + sessionItem.quantity,
          },
        });
      } else {
        // Move item to user cart
        await tx.cartItem.create({
          data: {
            userId,
            gameId: sessionItem.gameId,
            quantity: sessionItem.quantity,
          },
        });
      }

      // Delete session item
      await tx.cartItem.delete({
        where: {
          userId_gameId: {
            userId: sessionId,
            gameId: sessionItem.gameId,
          },
        },
      });
    }
  });

  // Invalidate both session and user cart caches
  await invalidateCartCache(undefined, sessionId);
  await invalidateCartCache(userId, undefined);
};

/**
 * Admin: Get user cart (for admin panel)
 */
export const getUserCartForAdmin = async (userId: string): Promise<CartResponse> => {
  if (!userId) {
    throw new AppError('User ID required', 400);
  }

  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return getCart(userId);
};

/**
 * Admin: Update user cart (for admin panel)
 */
export const updateUserCartForAdmin = async (
  userId: string,
  items: Array<{ gameId: string; quantity: number }>
): Promise<void> => {
  if (!userId) {
    throw new AppError('User ID required', 400);
  }

  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Use transaction to ensure atomicity
  await prisma.$transaction(async (tx) => {
    // Clear existing cart
    await tx.cartItem.deleteMany({
      where: { userId },
    });

    // Add new items
    for (const item of items) {
      if (item.quantity <= 0) continue;

      // Verify game exists and is in stock
      const game = await tx.game.findUnique({
        where: { id: item.gameId },
        select: { id: true, inStock: true, g2aStock: true },
      });

      if (!game) {
        console.warn(`[Admin Cart Update] Game ${item.gameId} not found, skipping`);
        continue;
      }

      const isAvailable = game.inStock && game.g2aStock !== false;
      if (!isAvailable) {
        console.warn(`[Admin Cart Update] Game ${item.gameId} out of stock, skipping`);
        continue;
      }

      await tx.cartItem.create({
        data: {
          userId,
          gameId: item.gameId,
          quantity: item.quantity,
        },
      });
    }
  });

  // Invalidate cache
  try {
    const { invalidateCache } = await import('./cache.service.js');
    await invalidateCache(`user:${userId}:cart`);
  } catch (cacheError) {
    console.warn(`[Admin Cart Update] Failed to invalidate cache:`, cacheError);
  }
};

/**
 * Admin: Clear user cart (for admin panel)
 */
export const clearUserCartForAdmin = async (userId: string): Promise<void> => {
  if (!userId) {
    throw new AppError('User ID required', 400);
  }

  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  await clearCart(userId);

  // Invalidate cache
  try {
    const { invalidateCache } = await import('./cache.service.js');
    await invalidateCache(`user:${userId}:cart`);
  } catch (cacheError) {
    console.warn(`[Admin Cart Clear] Failed to invalidate cache:`, cacheError);
  }
};
