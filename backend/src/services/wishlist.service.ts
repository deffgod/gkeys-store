import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import redisClient from '../config/redis.js';
import { hashPassword } from '../utils/bcrypt.js';

// Cache TTL for wishlist (30 minutes)
const WISHLIST_CACHE_TTL = 30 * 60;

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
 * Get cache key for wishlist
 */
const getWishlistCacheKey = (userId?: string, sessionId?: string): string => {
  // For authenticated users, use userId
  // For guest sessions, use sessionId (but we'll create guest user with sessionId as id)
  const identifier = userId || sessionId!;
  return `wishlist:${identifier}`;
};

/**
 * Invalidate wishlist cache
 */
const invalidateWishlistCache = async (userId?: string, sessionId?: string): Promise<void> => {
  try {
    if (redisClient.isOpen) {
      const cacheKey = getWishlistCacheKey(userId, sessionId);
      await redisClient.del(cacheKey);
    }
  } catch (err) {
    // Gracefully handle Redis unavailability
    console.warn('[Wishlist Cache] Failed to invalidate cache:', err);
  }
};

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

  // For authenticated users, always use userId (ignore sessionId if userId is present)
  // For guest sessions, ensure guest user exists
  const identifier = userId || (sessionId ? await getOrCreateGuestUser(sessionId) : undefined);
  if (!identifier) {
    throw new AppError('User ID or session ID required', 400);
  }

  const cacheKey = getWishlistCacheKey(userId, sessionId);

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
    console.warn('[Wishlist Cache] Failed to read from cache:', err);
  }

  // Fetch from database using the determined identifier
  const wishlistItems = await prisma.wishlist.findMany({
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

  // Debug: log wishlist query result
  if (process.env.NODE_ENV === 'test') {
    console.log(
      `[Wishlist Debug] getWishlist called with userId=${userId}, sessionId=${sessionId}, identifier=${identifier}, found ${wishlistItems.length} items`
    );
  }

  const result: WishlistResponse = {
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

  // Cache the result
  try {
    if (redisClient.isOpen) {
      await redisClient.setEx(cacheKey, WISHLIST_CACHE_TTL, JSON.stringify(result));
    }
  } catch (err) {
    // Gracefully handle Redis unavailability
    console.warn('[Wishlist Cache] Failed to write to cache:', err);
  }

  return result;
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    // If user already exists (race condition), just return the sessionId
    if (error.code === 'P2002') {
      return sessionId;
    }
    throw error;
  }
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

  // For guest sessions, ensure guest user exists
  const identifier = userId || (await getOrCreateGuestUser(sessionId!));

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

  // Invalidate cache after modification
  await invalidateWishlistCache(userId, sessionId);
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

  // For guest sessions, ensure guest user exists
  const identifier = userId || (sessionId ? await getOrCreateGuestUser(sessionId) : undefined);
  if (!identifier) {
    throw new AppError('User ID or session ID required', 400);
  }

  await prisma.wishlist.delete({
    where: {
      userId_gameId: {
        userId: identifier,
        gameId,
      },
    },
  });

  // Invalidate cache after modification
  await invalidateWishlistCache(userId, sessionId);
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

  // For guest sessions, ensure guest user exists
  const identifier = userId || (sessionId ? await getOrCreateGuestUser(sessionId) : undefined);
  if (!identifier) {
    return false;
  }

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
  const migratedCount = await prisma.$transaction(async (tx) => {
    // Get session wishlist items
    const sessionItems = await tx.wishlist.findMany({
      where: { userId: sessionId },
    });

    if (sessionItems.length === 0) {
      // No items to migrate
      return 0;
    }

    let migrated = 0;

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
        try {
          await tx.wishlist.create({
            data: {
              userId,
              gameId: sessionItem.gameId,
            },
          });
          migrated++;
          console.log(
            `[Wishlist Migration] Created wishlist item for user ${userId}, game ${sessionItem.gameId}`
          );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (createError: any) {
          console.error(`[Wishlist Migration] Failed to create wishlist item:`, createError);
          // If creation fails, skip this item but continue migration
          continue;
        }
      } else {
        console.log(
          `[Wishlist Migration] User ${userId} already has game ${sessionItem.gameId} in wishlist, skipping`
        );
      }

      // Delete session item
      try {
        await tx.wishlist.delete({
          where: {
            userId_gameId: {
              userId: sessionId,
              gameId: sessionItem.gameId,
            },
          },
        });
        console.log(
          `[Wishlist Migration] Deleted session wishlist item for session ${sessionId}, game ${sessionItem.gameId}`
        );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (deleteError: any) {
        // If delete fails, log but continue (item might already be deleted)
        console.warn(
          `[Wishlist Migration] Failed to delete session item (may already be deleted):`,
          deleteError
        );
      }
    }

    return migrated;
  });

  // Log migration result
  if (migratedCount > 0) {
    console.log(
      `[Wishlist Migration] Successfully migrated ${migratedCount} item(s) from session ${sessionId} to user ${userId}`
    );
  }

  // Invalidate both session and user wishlist caches
  // Invalidate session cache
  await invalidateWishlistCache(undefined, sessionId);
  // Invalidate user cache - ensure we pass userId correctly
  await invalidateWishlistCache(userId, undefined);

  // Force clear user cache to ensure fresh data after migration
  try {
    if (redisClient.isOpen) {
      // Clear cache for userId (authenticated user)
      const userCacheKey = `wishlist:${userId}`;
      await redisClient.del(userCacheKey);
      // Also try clearing with undefined sessionId
      const userCacheKey2 = getWishlistCacheKey(userId, undefined);
      await redisClient.del(userCacheKey2);
    }
  } catch (err) {
    // Gracefully handle Redis unavailability
    console.warn('[Wishlist Migration] Failed to clear user cache:', err);
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
