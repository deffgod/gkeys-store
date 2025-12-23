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

  // Verify game exists and is in stock
  const game = await prisma.game.findUnique({
    where: { id: gameId },
  });

  if (!game) {
    throw new AppError('Game not found', 404);
  }

  if (!game.inStock) {
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
 */
export const migrateSessionCartToUser = async (
  sessionId: string,
  userId: string
): Promise<void> => {
  // Get session cart items
  const sessionItems = await prisma.cartItem.findMany({
    where: { userId: sessionId },
  });

  // For each session item, merge with user cart
  for (const sessionItem of sessionItems) {
    const userItem = await prisma.cartItem.findUnique({
      where: {
        userId_gameId: {
          userId,
          gameId: sessionItem.gameId,
        },
      },
    });

    if (userItem) {
      // Merge quantities
      await prisma.cartItem.update({
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
      await prisma.cartItem.create({
        data: {
          userId,
          gameId: sessionItem.gameId,
          quantity: sessionItem.quantity,
        },
      });
    }

    // Delete session item
    await prisma.cartItem.delete({
      where: {
        userId_gameId: {
          userId: sessionId,
          gameId: sessionItem.gameId,
        },
      },
    });
  }
};
