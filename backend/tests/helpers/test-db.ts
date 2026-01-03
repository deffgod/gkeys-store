/**
 * Test Database Helpers
 * 
 * Provides utilities for creating test data in the database.
 * All functions use Prisma Client and handle cleanup automatically.
 */

import prisma from '../../src/config/database.js';
import { hashPassword } from '../../src/utils/bcrypt.js';
import { Decimal } from '@prisma/client/runtime/library';

export interface CreateTestUserOptions {
  email?: string;
  password?: string;
  nickname?: string;
  balance?: number;
  role?: 'USER' | 'ADMIN';
  emailVerified?: boolean;
}

export interface CreateTestGameOptions {
  title?: string;
  slug?: string;
  price?: number;
  inStock?: boolean;
  g2aProductId?: string;
  g2aStock?: boolean;
}

export interface CreateTestCartItem {
  gameId: string;
  quantity: number;
}

export interface CreateTestOrderItem {
  gameId: string;
  quantity: number;
}

export interface CreateTestOrderOptions {
  promoCode?: string;
  status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
}

export interface CreateTestPromoCodeOptions {
  code?: string;
  discount?: number;
  maxUses?: number;
  validFrom?: Date;
  validUntil?: Date;
  active?: boolean;
}

/**
 * Create a test user with configurable attributes
 */
export async function createTestUser(options: CreateTestUserOptions = {}): Promise<{
  id: string;
  email: string;
  nickname: string | null;
  balance: Decimal;
  role: 'USER' | 'ADMIN';
  emailVerified: boolean;
}> {
  const {
    email = `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`,
    password = 'TestPassword123!',
    nickname = 'Test User',
    balance = 100.0,
    role = 'USER',
    emailVerified = true,
  } = options;

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      nickname,
      balance: new Decimal(balance),
      role,
      emailVerified,
    },
  });

  return user;
}

/**
 * Create a test game with configurable attributes
 */
export async function createTestGame(options: CreateTestGameOptions = {}): Promise<{
  id: string;
  title: string;
  slug: string;
  price: Decimal;
  inStock: boolean;
  g2aProductId: string | null;
  g2aStock: boolean;
}> {
  const {
    title = `Test Game ${Date.now()}`,
    slug = `test-game-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    price = 19.99,
    inStock = true,
    g2aProductId,
    g2aStock = false,
  } = options;

  const game = await prisma.game.create({
    data: {
      title,
      slug,
      description: `Test description for ${title}`,
      price: new Decimal(price),
      image: 'https://via.placeholder.com/300x400',
      inStock,
      g2aProductId: g2aProductId || null,
      g2aStock,
      releaseDate: new Date(),
    },
  });

  return game;
}

/**
 * Create cart with items for a user or session
 */
export async function createTestCart(
  userId: string,
  items: CreateTestCartItem[]
): Promise<void> {
  for (const item of items) {
    await prisma.cartItem.upsert({
      where: {
        userId_gameId: {
          userId,
          gameId: item.gameId,
        },
      },
      update: {
        quantity: item.quantity,
      },
      create: {
        userId,
        gameId: item.gameId,
        quantity: item.quantity,
      },
    });
  }
}

/**
 * Create wishlist with items for a user or session
 */
export async function createTestWishlist(
  userId: string,
  gameIds: string[]
): Promise<void> {
  for (const gameId of gameIds) {
    await prisma.wishlist.upsert({
      where: {
        userId_gameId: {
          userId,
          gameId,
        },
      },
      update: {},
      create: {
        userId,
        gameId,
      },
    });
  }
}

/**
 * Create order with items and optional promo code
 */
export async function createTestOrder(
  userId: string,
  items: CreateTestOrderItem[],
  options: CreateTestOrderOptions = {}
): Promise<{
  id: string;
  userId: string;
  status: string;
  total: Decimal;
}> {
  const { promoCode, status = 'PENDING' } = options;

  // Get games to calculate totals
  const gameIds = items.map((item) => item.gameId);
  const games = await prisma.game.findMany({
    where: { id: { in: gameIds } },
  });

  if (games.length !== gameIds.length) {
    throw new Error('Some games not found');
  }

  // Calculate subtotal
  let subtotal = new Decimal(0);
  for (const item of items) {
    const game = games.find((g) => g.id === item.gameId);
    if (game) {
      subtotal = subtotal.plus(game.price.times(item.quantity));
    }
  }

  // Apply promo code discount if provided
  let discount = new Decimal(0);
  if (promoCode) {
    const promo = await prisma.promoCode.findUnique({
      where: { code: promoCode },
    });
    if (promo && promo.active) {
      // Simple percentage discount calculation
      discount = subtotal.times(promo.discount).dividedBy(100);
    }
  }

  const total = subtotal.minus(discount);

  const order = await prisma.order.create({
    data: {
      userId,
      status,
      subtotal,
      discount,
      total,
      promoCode: promoCode || null,
      items: {
        create: items.map((item) => {
          const game = games.find((g) => g.id === item.gameId)!;
          return {
            gameId: item.gameId,
            quantity: item.quantity,
            price: game.price,
          };
        }),
      },
    },
  });

  return order;
}

/**
 * Create promo code with configurable attributes
 */
export async function createTestPromoCode(
  options: CreateTestPromoCodeOptions = {}
): Promise<{
  id: string;
  code: string;
  discount: Decimal;
  maxUses: number | null;
  usedCount: number;
  validFrom: Date;
  validUntil: Date;
  active: boolean;
}> {
  const {
    code = `TEST${Date.now()}`,
    discount = 10,
    maxUses = null,
    validFrom = new Date(),
    validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    active = true,
  } = options;

  const promoCode = await prisma.promoCode.create({
    data: {
      code,
      discount: new Decimal(discount),
      maxUses,
      usedCount: 0,
      validFrom,
      validUntil,
      active,
    },
  });

  return promoCode;
}

/**
 * Clean up all test data for a user
 */
export async function cleanupTestUser(userId: string): Promise<void> {
  try {
    // Delete in order to respect foreign key constraints
    await prisma.transaction.deleteMany({ where: { userId } });
    await prisma.orderItem.deleteMany({
      where: { order: { userId } },
    });
    await prisma.order.deleteMany({ where: { userId } });
    await prisma.cartItem.deleteMany({ where: { userId } });
    await prisma.wishlist.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
  } catch (error) {
    // Ignore errors if user doesn't exist or already deleted
    console.warn(`Failed to cleanup user ${userId}:`, error);
  }
}

/**
 * Clean up test data for a game
 */
export async function cleanupTestGame(gameId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Delete in order to respect foreign key constraints
    await tx.gameKey.deleteMany({ where: { gameId } });
    await tx.orderItem.deleteMany({ where: { gameId } });
    await tx.cartItem.deleteMany({ where: { gameId } });
    await tx.wishlist.deleteMany({ where: { gameId } });
    await tx.gameCategory.deleteMany({ where: { gameId } });
    await tx.gameGenre.deleteMany({ where: { gameId } });
    await tx.gamePlatform.deleteMany({ where: { gameId } });
    await tx.gameTag.deleteMany({ where: { gameId } });
    await tx.game.delete({ where: { id: gameId } });
  });
}

/**
 * Clean up all test data (truncate test tables)
 * Use with caution - only in afterAll hooks
 */
export async function cleanupAllTestData(): Promise<void> {
  // Note: Prisma doesn't support TRUNCATE directly
  // Delete all test data in reverse dependency order
  await prisma.$transaction(async (tx) => {
    await tx.transaction.deleteMany({});
    await tx.gameKey.deleteMany({});
    await tx.orderItem.deleteMany({});
    await tx.order.deleteMany({});
    await tx.cartItem.deleteMany({});
    await tx.wishlist.deleteMany({});
    await tx.promoCode.deleteMany({});
    await tx.user.deleteMany({});
    await tx.game.deleteMany({});
  });
}
