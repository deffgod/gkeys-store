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
 */
export const migrateSessionWishlistToUser = async (
  sessionId: string,
  userId: string
): Promise<void> => {
  // Get session wishlist items
  const sessionItems = await prisma.wishlist.findMany({
    where: { userId: sessionId },
  });

  // For each session item, add to user wishlist if not already there
  for (const sessionItem of sessionItems) {
    const userItem = await prisma.wishlist.findUnique({
      where: {
        userId_gameId: {
          userId,
          gameId: sessionItem.gameId,
        },
      },
    });

    if (!userItem) {
      // Add to user wishlist
      await prisma.wishlist.create({
        data: {
          userId,
          gameId: sessionItem.gameId,
        },
      });
    }

    // Delete session item
    await prisma.wishlist.delete({
      where: {
        userId_gameId: {
          userId: sessionId,
          gameId: sessionItem.gameId,
        },
      },
    });
  }
};
