import prisma from '../config/database.js';
import { hashPassword, comparePassword } from '../utils/bcrypt.js';
import {
  UserProfileResponse,
  UpdateProfileRequest,
  ChangePasswordRequest,
  UserStatsResponse,
  BalanceResponse,
  TransactionResponse,
  WishlistResponse,
} from '../types/user.js';
import { AppError } from '../middleware/errorHandler.js';

export const getUserProfile = async (userId: string): Promise<UserProfileResponse> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      orders: {
        where: { status: 'COMPLETED' },
        include: {
          items: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Calculate stats
  const gamesPurchased = user.orders.reduce(
    (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0
  );

  const totalSaved = user.orders.reduce(
    (sum, order) => sum + Number(order.discount),
    0
  );

  const daysSinceRegistration = Math.floor(
    (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Count empty fields
  const emptyFieldsCount = [
    !user.firstName,
    !user.lastName,
    !user.avatar,
  ].filter(Boolean).length;

  return {
    id: user.id,
    email: user.email,
    nickname: user.nickname || 'Newbie Guy',
    firstName: user.firstName || undefined,
    lastName: user.lastName || undefined,
    avatar: user.avatar || undefined,
    balance: Number(user.balance),
    role: user.role,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt.toISOString(),
    stats: {
      gamesPurchased,
      totalSaved,
      daysSinceRegistration,
      emptyFieldsCount,
    },
  };
};

export const updateUserProfile = async (
  userId: string,
  data: UpdateProfileRequest
): Promise<UserProfileResponse> => {
  const updateData: {
    nickname?: string;
    firstName?: string | null;
    lastName?: string | null;
    passwordHash?: string;
  } = {};

  if (data.nickname !== undefined) {
    updateData.nickname = data.nickname || 'Newbie Guy';
  }
  if (data.firstName !== undefined) {
    updateData.firstName = data.firstName;
  }
  if (data.lastName !== undefined) {
    updateData.lastName = data.lastName;
  }
  if (data.password) {
    updateData.passwordHash = await hashPassword(data.password);
  }

  await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  return getUserProfile(userId);
};

export const getUserBalance = async (userId: string): Promise<BalanceResponse> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { balance: true },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return {
    balance: Number(user.balance),
    currency: 'EUR',
  };
};

export const getUserTransactions = async (userId: string): Promise<TransactionResponse[]> => {
  const transactions = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return transactions.map((t) => ({
    id: t.id,
    type: t.type,
    amount: Number(t.amount),
    currency: t.currency,
    method: t.method || undefined,
    status: t.status,
    description: t.description || undefined,
    transactionHash: t.transactionHash || undefined,
    createdAt: t.createdAt.toISOString(),
    orderId: t.orderId || undefined,
  }));
};

export const getUserWishlist = async (userId: string): Promise<WishlistResponse[]> => {
  const wishlist = await prisma.wishlist.findMany({
    where: { userId },
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
    orderBy: { addedAt: 'desc' },
  });

  return wishlist.map((item) => ({
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
  }));
};

export const addToWishlist = async (userId: string, gameId: string): Promise<void> => {
  // Check if game exists
  const game = await prisma.game.findUnique({
    where: { id: gameId },
  });

  if (!game) {
    throw new AppError('Game not found', 404);
  }

  // Add to wishlist (upsert to avoid duplicates)
  await prisma.wishlist.upsert({
    where: {
      userId_gameId: {
        userId,
        gameId,
      },
    },
    create: {
      userId,
      gameId,
    },
    update: {},
  });
};

export const removeFromWishlist = async (userId: string, gameId: string): Promise<void> => {
  await prisma.wishlist.deleteMany({
    where: {
      userId,
      gameId,
    },
  });
};

export const changeUserPassword = async (
  userId: string,
  data: ChangePasswordRequest
): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Verify current password
  const isValid = await comparePassword(data.currentPassword, user.passwordHash);
  if (!isValid) {
    throw new AppError('Current password is incorrect', 401);
  }

  // Hash and update new password
  const newPasswordHash = await hashPassword(data.newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newPasswordHash },
  });
};

export const getUserStats = async (userId: string): Promise<UserStatsResponse> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      orders: {
        where: { status: 'COMPLETED' },
        include: {
          items: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Calculate stats
  const totalGames = user.orders.reduce(
    (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0
  );

  const totalSaved = user.orders.reduce(
    (sum, order) => sum + Number(order.discount),
    0
  );

  const daysSinceRegistration = Math.floor(
    (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  const totalOrders = user.orders.length;

  return {
    totalGames,
    totalSaved,
    daysSinceRegistration,
    totalOrders,
    balance: Number(user.balance),
  };
};

/**
 * Update user balance (admin function)
 */
export const updateUserBalance = async (
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
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { balance: true },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const previousBalance = Number(user.balance);
  const newBalance = previousBalance + amount;

  // Prevent negative balance (or allow if business logic requires)
  if (newBalance < 0) {
    throw new AppError('Balance cannot be negative', 400);
  }

  // Update balance and create transaction record atomically
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { balance: newBalance },
    });

    await tx.transaction.create({
      data: {
        userId,
        type: amount > 0 ? 'DEPOSIT' : 'WITHDRAWAL',
        amount,
        currency: 'EUR',
        status: 'COMPLETED',
        description: reason || `Admin balance adjustment: ${amount > 0 ? '+' : ''}${amount} EUR`,
      },
    });
  });

  // Invalidate user-related cache (non-blocking)
  try {
    const { invalidateCache } = await import('./cache.service.js');
    await invalidateCache(`user:${userId}:*`);
  } catch (cacheError) {
    console.warn('[User Balance Update] Failed to invalidate cache:', cacheError);
  }

  return {
    userId,
    previousBalance,
    newBalance,
    amount,
    reason,
  };
};

/**
 * Update user role (admin function)
 */
export const updateUserRole = async (
  userId: string,
  role: 'USER' | 'ADMIN'
): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  // Invalidate user-related cache (non-blocking)
  try {
    const { invalidateCache } = await import('./cache.service.js');
    await invalidateCache(`user:${userId}:*`);
  } catch (cacheError) {
    console.warn('[User Role Update] Failed to invalidate cache:', cacheError);
  }
};

