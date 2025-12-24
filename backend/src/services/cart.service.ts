import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

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
 * Get cart items for user (authenticated) or session (guest)
 */
export const getCart = async (userId?: string, sessionId?: string): Promise<CartResponse> => {
  if (!userId && !sessionId) {
    throw new AppError('User ID or session ID required', 400);
  }

  const cartItems = await prisma.cartItem.findMany({
    where: userId ? { userId } : { userId: sessionId },
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

  const total = cartItems.reduce(
    (sum, item) => sum + Number(item.game.price) * item.quantity,
    0
  );

  return {
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
    select: { id: true, inStock: true, g2aStock: true },
  });

  if (!game) {
    throw new AppError('Game not found', 404);
  }

  // Check both inStock and g2aStock if g2aProductId exists
  const isAvailable = game.inStock && (game.g2aStock !== false);
  if (!isAvailable) {
    throw new AppError('Game is out of stock', 400);
  }

  const identifier = userId || sessionId!;

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

  const identifier = userId || sessionId!;

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

  const identifier = userId || sessionId!;

  await prisma.cartItem.delete({
    where: {
      userId_gameId: {
        userId: identifier,
        gameId,
      },
    },
  });
};

/**
 * Clear entire cart
 */
export const clearCart = async (userId?: string, sessionId?: string): Promise<void> => {
  if (!userId && !sessionId) {
    throw new AppError('User ID or session ID required', 400);
  }

  const identifier = userId || sessionId!;

  await prisma.cartItem.deleteMany({
    where: {
      userId: identifier,
    },
  });
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

  // Invalidate cache after migration (non-blocking)
  try {
    const { invalidateCache } = await import('./cache.service.js');
    await invalidateCache(`session:${sessionId}:cart`);
    await invalidateCache(`user:${userId}:cart`);
    console.log(`[Cart Migration] Cache invalidated for session ${sessionId} and user ${userId}`);
  } catch (cacheError) {
    // Non-blocking - log but don't fail migration
    console.warn(`[Cart Migration] Failed to invalidate cache:`, cacheError);
  }
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

      const isAvailable = game.inStock && (game.g2aStock !== false);
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
