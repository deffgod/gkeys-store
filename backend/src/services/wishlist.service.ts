import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

export interface WishlistItem {
  gameId: string;
  game: {
    id: string;
    title: string;
    slug: string;
    image: string;
    price: number;
    inStock: boolean;
  };
  addedAt: string;
}

export interface WishlistResponse {
  items: WishlistItem[];
}

/**
 * Get wishlist items for user (authenticated) or session (guest)
 */
export const getWishlist = async (
  userId?: string,
  sessionId?: string
): Promise<WishlistResponse> => {
  if (!userId && !sessionId) {
    throw new AppError('User ID or session ID required', 400);
  }

  const wishlistItems = await prisma.wishlist.findMany({
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

  return {
    items: wishlistItems.map((item) => ({
      gameId: item.gameId,
      game: {
        id: item.game.id,
        title: item.game.title,
        slug: item.game.slug,
        image: item.game.image,
        price: Number(item.game.price),
        inStock: item.game.inStock,
      },
      addedAt: item.addedAt.toISOString(),
    })),
  };
};

/**
 * Add game to wishlist
 */
export const addToWishlist = async (
  gameId: string,
  userId?: string,
  sessionId?: string
): Promise<void> => {
  if (!userId && !sessionId) {
    throw new AppError('User ID or session ID required', 400);
  }

  // Verify game exists
  const game = await prisma.game.findUnique({
    where: { id: gameId },
  });

  if (!game) {
    throw new AppError('Game not found', 404);
  }

  const identifier = userId || sessionId!;

  // Check if already in wishlist
  const existing = await prisma.wishlist.findUnique({
    where: {
      userId_gameId: {
        userId: identifier,
        gameId,
      },
    },
  });

  if (existing) {
    // Already in wishlist, no action needed
    return;
  }

  // Add to wishlist
  await prisma.wishlist.create({
    data: {
      userId: identifier,
      gameId,
    },
  });
};

/**
 * Remove game from wishlist
 */
export const removeFromWishlist = async (
  gameId: string,
  userId?: string,
  sessionId?: string
): Promise<void> => {
  if (!userId && !sessionId) {
    throw new AppError('User ID or session ID required', 400);
  }

  const identifier = userId || sessionId!;

  await prisma.wishlist.delete({
    where: {
      userId_gameId: {
        userId: identifier,
        gameId,
      },
    },
  });
};

/**
 * Check if game is in wishlist
 */
export const isInWishlist = async (
  gameId: string,
  userId?: string,
  sessionId?: string
): Promise<boolean> => {
  if (!userId && !sessionId) {
    return false;
  }

  const identifier = userId || sessionId!;

  const item = await prisma.wishlist.findUnique({
    where: {
      userId_gameId: {
        userId: identifier,
        gameId,
      },
    },
  });

  return !!item;
};

/**
 * Migrate session wishlist to user wishlist (when guest logs in)
 * Uses transaction to ensure atomicity
 */
export const migrateSessionWishlistToUser = async (
  sessionId: string,
  userId: string
): Promise<void> => {
  if (!sessionId || !userId) {
    throw new AppError('Session ID and User ID are required for migration', 400);
  }

  // Use transaction to ensure atomicity
  await prisma.$transaction(async (tx) => {
    // Get session wishlist items
    const sessionItems = await tx.wishlist.findMany({
      where: { userId: sessionId },
    });

    if (sessionItems.length === 0) {
      // No items to migrate
      return;
    }

    // For each session item, add to user wishlist if not already there
    for (const sessionItem of sessionItems) {
      // Verify game still exists
      const game = await tx.game.findUnique({
        where: { id: sessionItem.gameId },
        select: { id: true },
      });

      if (!game) {
        // Game no longer exists, skip this item
        console.warn(`[Wishlist Migration] Game ${sessionItem.gameId} not found, skipping`);
        // Delete session item
        await tx.wishlist.delete({
          where: {
            userId_gameId: {
              userId: sessionId,
              gameId: sessionItem.gameId,
            },
          },
        });
        continue;
      }

      const userItem = await tx.wishlist.findUnique({
        where: {
          userId_gameId: {
            userId,
            gameId: sessionItem.gameId,
          },
        },
      });

      if (!userItem) {
        // Add to user wishlist
        await tx.wishlist.create({
          data: {
            userId,
            gameId: sessionItem.gameId,
          },
        });
      }

      // Delete session item
      await tx.wishlist.delete({
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
    await invalidateCache(`session:${sessionId}:wishlist`);
    await invalidateCache(`user:${userId}:wishlist`);
    console.log(`[Wishlist Migration] Cache invalidated for session ${sessionId} and user ${userId}`);
  } catch (cacheError) {
    // Non-blocking - log but don't fail migration
    console.warn(`[Wishlist Migration] Failed to invalidate cache:`, cacheError);
  }
};

/**
 * Admin: Get user wishlist (for admin panel)
 */
export const getUserWishlistForAdmin = async (userId: string): Promise<WishlistResponse> => {
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

  return getWishlist(userId);
};
