import prisma from '../config/database.js';
import { CreateOrderRequest, OrderResponse } from '../types/order.js';
import { AppError } from '../middleware/errorHandler.js';
import { purchaseGameKey, validateGameStock } from './g2a.service.js';
import { G2AError, G2AErrorCode } from '../types/g2a.js';
import { sendGameKeyEmail } from './email.service.js';

export const createOrder = async (
  userId: string,
  data: CreateOrderRequest
): Promise<OrderResponse> => {
  const { items, promoCode } = data;

  // Get user with balance
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Get games and calculate totals
  const gameIds = items.map((item) => item.gameId);
  const games = await prisma.game.findMany({
    where: { id: { in: gameIds } },
    include: {
      platforms: {
        include: { platform: true },
      },
    },
  });

  if (games.length !== gameIds.length) {
    throw new AppError('Some games not found', 404);
  }

  // Check stock (both local and G2A if applicable)
  for (const item of items) {
    const game = games.find((g) => g.id === item.gameId);
    if (!game || !game.inStock) {
      throw new AppError(`Game ${game?.title || item.gameId} is out of stock`, 400);
    }
    
    // Validate G2A stock if game has G2A product ID
    if (game.g2aProductId) {
      try {
        const stockResult = await validateGameStock(game.g2aProductId);
        if (!stockResult.available || stockResult.stock < item.quantity) {
          throw new AppError(
            `Game ${game.title} is out of stock on G2A. Available: ${stockResult.stock}, Requested: ${item.quantity}`,
            400
          );
        }
      } catch (error) {
        // If G2A validation fails, log but don't block order (graceful degradation)
        console.warn(`G2A stock check failed for ${game.g2aProductId}, proceeding with local stock check:`, error);
      }
    }
  }

  // Calculate subtotal
  let subtotal = 0;
  const orderItems = items.map((item) => {
    const game = games.find((g) => g.id === item.gameId)!;
    const itemPrice = Number(game.price) * item.quantity;
    subtotal += itemPrice;
    return {
      gameId: item.gameId,
      quantity: item.quantity,
      price: Number(game.price),
      discount: 0,
    };
  });

  // Apply promo code if provided
  let discount = 0;
  if (promoCode) {
    const promo = await prisma.promoCode.findUnique({
      where: { code: promoCode },
    });

    if (promo?.active && (promo.usedCount ?? 0) < (promo.maxUses ?? Infinity)) {
      const now = new Date();
      if (now >= promo.validFrom && now <= promo.validUntil) {
        discount = Number((subtotal * Number(promo.discount) / 100).toFixed(2));
        // Update promo code usage
        await prisma.promoCode.update({
          where: { id: promo.id },
          data: { usedCount: promo.usedCount + 1 },
        });
      }
    }
  }

  const total = subtotal - discount;

  // Check balance
  if (Number(user.balance) < total) {
    throw new AppError('Insufficient balance', 400);
  }

  // Check for existing order with same items (idempotency check)
  // This is a simple check - in production, you might want a more sophisticated approach
  const existingOrder = await prisma.order.findFirst({
    where: {
      userId,
      status: { in: ['PENDING', 'PROCESSING'] },
      createdAt: {
        gte: new Date(Date.now() - 5 * 60 * 1000), // Within last 5 minutes
      },
    },
    include: {
      items: true,
    },
  });

  if (existingOrder && 'items' in existingOrder && Array.isArray(existingOrder.items)) {
    // Check if items match (simple idempotency check)
    const existingItemIds = existingOrder.items.map((i: any) => i.gameId).sort().join(',');
    const newItemIds = items.map(i => i.gameId).sort().join(',');
    
    if (existingItemIds === newItemIds) {
      // Return existing order to prevent duplicate
      const orderResponse = await getOrderById(userId, existingOrder.id);
      if (orderResponse) {
        return orderResponse;
      }
    }
  }

  // Create order, deduct balance, and create transaction atomically
  const order = await prisma.$transaction(async (tx) => {
    // Create order with PENDING status initially
    const newOrder = await tx.order.create({
      data: {
        userId,
        status: 'PENDING', // Will be updated to PROCESSING when G2A API call starts
        subtotal,
        discount,
        total,
        promoCode,
        paymentStatus: 'PENDING',
        items: {
          create: orderItems,
        },
      },
      include: {
        items: {
          include: {
            game: {
              select: {
                id: true,
                title: true,
                image: true,
                slug: true,
                g2aProductId: true,
                platforms: {
                  include: { platform: true },
                },
              },
            },
          },
        },
      },
    });

    // Deduct balance
    await tx.user.update({
      where: { id: userId },
      data: {
        balance: {
          decrement: total,
        },
      },
    });

    // Create transaction
    await tx.transaction.create({
      data: {
        userId,
        orderId: newOrder.id,
        type: 'PURCHASE',
        amount: -total,
        currency: 'EUR',
        status: 'COMPLETED',
        description: `Order ${newOrder.id}`,
      },
    });

    // Update order status to PROCESSING when G2A API calls start
    await tx.order.update({
      where: { id: newOrder.id },
      data: {
        status: 'PROCESSING',
      },
    });

    return newOrder;
  });

  // Invalidate cache after order creation
  try {
    const { invalidateCache } = await import('./cache.service.js');
    await invalidateCache(`user:${userId}:orders`);
    await invalidateCache(`user:${userId}:cart`);
    console.log(`[Order] Cache invalidated for user ${userId} after order creation`);
  } catch (cacheError) {
    // Non-blocking - log but don't fail order creation
    console.warn(`[Order] Failed to invalidate cache after order creation:`, cacheError);
  }

  // Purchase keys from G2A and send emails
  const gameKeys: Array<{
    id: string;
    gameId: string;
    key: string;
    orderId: string | null;
    activated: boolean;
    activationDate: Date | null;
    createdAt: Date;
  }> = [];
  const purchaseErrors: Array<{ gameId: string; error: string }> = [];
  
  for (const item of items) {
    const game = games.find((g) => g.id === item.gameId)!;
    
    if (game.g2aProductId) {
      try {
        // Purchase keys from G2A (returns array of keys)
        const g2aKeys = await purchaseGameKey(game.g2aProductId, item.quantity);
        
        // Create game key records for all keys received
        // NOTE: Game keys are currently stored in plain text in the database.
        // For production, consider implementing encryption at rest:
        // - Use AES-256 encryption for key field
        // - Store encryption key in secure key management service
        // - Decrypt keys only when needed for delivery
        // This is a security consideration documented per task T046
        for (const g2aKey of g2aKeys) {
          const gameKey = await prisma.gameKey.create({
            data: {
              gameId: game.id,
              key: g2aKey.key, // TODO: Consider encrypting this field for production
              orderId: order.id,
              activated: false,
            },
          });
          gameKeys.push(gameKey);

          // Send email with key
          try {
            await sendGameKeyEmail(user.email, {
              gameTitle: game.title,
              key: g2aKey.key,
              platform: game.platforms[0]?.platform.name || 'PC',
            });
          } catch (emailError) {
            console.error(`Failed to send email for key ${gameKey.id}:`, emailError);
            // Don't fail order if email fails - key is still delivered
          }
        }
      } catch (error) {
        const errorMessage = error instanceof G2AError 
          ? error.message 
          : error instanceof Error 
            ? error.message 
            : 'Unknown error';
        
        purchaseErrors.push({
          gameId: game.id,
          error: errorMessage,
        });
        
        console.error(`Failed to purchase key for game ${game.id}:`, error);
        
        // If it's a critical error (out of stock, API error), mark order as failed
        if (error instanceof G2AError && 
            (error.code === G2AErrorCode.G2A_OUT_OF_STOCK || 
             error.code === G2AErrorCode.G2A_AUTH_FAILED ||
             error.code === G2AErrorCode.G2A_API_ERROR)) {
          // Mark order as failed
          await prisma.order.update({
            where: { id: order.id },
            data: {
              status: 'FAILED',
              paymentStatus: 'FAILED',
            },
          });
          
          // Refund user balance
          await prisma.user.update({
            where: { id: userId },
            data: {
              balance: {
                increment: total,
              },
            },
          });
          
          // Create refund transaction
          await prisma.transaction.create({
            data: {
              userId,
              orderId: order.id,
              type: 'REFUND',
              amount: total,
              currency: 'EUR',
              status: 'COMPLETED',
              description: `Refund for failed order ${order.id}`,
            },
          });
          
          throw new AppError(
            `Order failed: ${errorMessage}. Balance has been refunded.`,
            400
          );
        }
        // For other errors, continue with other games
      }
    }
  }

  // Update order status based on results
  let finalStatus: 'COMPLETED' | 'FAILED' = 'COMPLETED';
  if (purchaseErrors.length > 0 && gameKeys.length === 0) {
    // All purchases failed
    finalStatus = 'FAILED';
  } else if (purchaseErrors.length > 0) {
    // Partial success - some keys purchased, some failed
    // Order is completed but with errors logged
    console.warn(`Order ${order.id} completed with ${purchaseErrors.length} errors`);
  }

  const completedOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: finalStatus,
      paymentStatus: finalStatus === 'COMPLETED' ? 'COMPLETED' : 'FAILED',
      completedAt: finalStatus === 'COMPLETED' ? new Date() : null,
    },
    include: {
      items: {
        include: {
          game: {
            select: {
              id: true,
              title: true,
              image: true,
              slug: true,
            },
          },
        },
      },
      keys: true,
    },
  });

  return {
    id: completedOrder.id,
    userId: completedOrder.userId,
    status: completedOrder.status,
    subtotal: Number(completedOrder.subtotal),
    discount: Number(completedOrder.discount),
    total: Number(completedOrder.total),
    paymentMethod: completedOrder.paymentMethod || undefined,
    paymentStatus: completedOrder.paymentStatus || undefined,
    promoCode: completedOrder.promoCode || undefined,
    createdAt: completedOrder.createdAt.toISOString(),
    completedAt: completedOrder.completedAt?.toISOString(),
    items: completedOrder.items.map((item) => ({
      id: item.id,
      gameId: item.gameId,
      game: item.game,
      quantity: item.quantity,
      price: Number(item.price),
      discount: Number(item.discount),
    })),
    keys: completedOrder.keys.map((key) => ({
      id: key.id,
      gameId: key.gameId,
      key: key.key,
      activated: key.activated,
      activationDate: key.activationDate?.toISOString(),
    })),
  };
};

export const getUserOrders = async (userId: string): Promise<OrderResponse[]> => {
  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: {
          game: {
            select: {
              id: true,
              title: true,
              image: true,
              slug: true,
            },
          },
        },
      },
      keys: true,
    },
  });

  return orders.map((order) => ({
    id: order.id,
    userId: order.userId,
    status: order.status,
    subtotal: Number(order.subtotal),
    discount: Number(order.discount),
    total: Number(order.total),
    paymentMethod: order.paymentMethod || undefined,
    paymentStatus: order.paymentStatus || undefined,
    promoCode: order.promoCode || undefined,
    createdAt: order.createdAt.toISOString(),
    completedAt: order.completedAt?.toISOString(),
    items: order.items.map((item) => ({
      id: item.id,
      gameId: item.gameId,
      game: item.game,
      quantity: item.quantity,
      price: Number(item.price),
      discount: Number(item.discount),
    })),
    keys: order.keys.map((key) => ({
      id: key.id,
      gameId: key.gameId,
      key: key.key,
      activated: key.activated,
      activationDate: key.activationDate?.toISOString(),
    })),
  }));
};

export const getOrderById = async (
  userId: string,
  orderId: string
): Promise<OrderResponse | null> => {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
    },
    include: {
      items: {
        include: {
          game: {
            select: {
              id: true,
              title: true,
              image: true,
              slug: true,
            },
          },
        },
      },
      keys: true,
    },
  });

  if (!order) return null;

  return {
    id: order.id,
    userId: order.userId,
    status: order.status,
    subtotal: Number(order.subtotal),
    discount: Number(order.discount),
    total: Number(order.total),
    paymentMethod: order.paymentMethod || undefined,
    paymentStatus: order.paymentStatus || undefined,
    promoCode: order.promoCode || undefined,
    createdAt: order.createdAt.toISOString(),
    completedAt: order.completedAt?.toISOString(),
    items: order.items.map((item) => ({
      id: item.id,
      gameId: item.gameId,
      game: item.game,
      quantity: item.quantity,
      price: Number(item.price),
      discount: Number(item.discount),
    })),
    keys: order.keys.map((key) => ({
      id: key.id,
      gameId: key.gameId,
      key: key.key,
      activated: key.activated,
      activationDate: key.activationDate?.toISOString(),
    })),
  };
};

