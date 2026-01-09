import prisma from '../config/database.js';
import { CreateOrderRequest, OrderResponse } from '../types/order.js';
import { AppError } from '../middleware/errorHandler.js';
import { validateGameStock } from './g2a.service.js';
import { G2AError, G2AErrorCode } from '../lib/g2a/errors/G2AError.js';
import { sendGameKeyEmail } from './email.service.js';
import { G2AIntegrationClient } from '../lib/g2a/G2AIntegrationClient.js';

/**
 * Structured logger for Order operations with audit logging
 */
const orderLogger = {
  info: (message: string, data?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    console.log(
      `[Order] [${timestamp}] [INFO] ${message}`,
      data ? JSON.stringify(data, null, 2) : ''
    );
  },
  error: (message: string, error?: unknown, context?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    const errorData = {
      message,
      timestamp,
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            }
          : error,
      context,
    };
    console.error(`[Order] [${timestamp}] [ERROR] ${JSON.stringify(errorData, null, 2)}`);
  },
  warn: (message: string, data?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    console.warn(
      `[Order] [${timestamp}] [WARN] ${message}`,
      data ? JSON.stringify(data, null, 2) : ''
    );
  },
  /**
   * Audit log for order operations
   */
  audit: (
    operation: string,
    userId: string,
    orderId: string,
    data?: Record<string, unknown>
  ) => {
    const timestamp = new Date().toISOString();
    const auditData = {
      timestamp,
      operation,
      userId,
      orderId,
      data: data || {},
    };
    console.log(`[Order] [${timestamp}] [AUDIT] ${JSON.stringify(auditData, null, 2)}`);
  },
};

export const createOrder = async (
  userId: string,
  data: CreateOrderRequest
): Promise<OrderResponse> => {
  const { items, promoCode } = data;

  // Audit log: Order creation started
  orderLogger.audit('ORDER_CREATE_START', userId, 'pending', {
    itemsCount: items.length,
    gameIds: items.map(i => i.gameId),
    promoCode: promoCode || null,
  });

  // Get user with balance
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    orderLogger.error('User not found during order creation', undefined, { userId });
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
        orderLogger.warn('G2A stock check failed, proceeding with local stock check', {
          gameId: game.id,
          g2aProductId: game.g2aProductId,
          error: error instanceof Error ? error.message : String(error),
        });
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

    if (!promo) {
      throw new AppError('Invalid promo code', 400);
    }

    if (!promo.active) {
      throw new AppError('Promo code is not active', 400);
    }

    const now = new Date();
    if (now < promo.validFrom || now > promo.validUntil) {
      throw new AppError('Promo code is not valid at this time', 400);
    }

    if ((promo.usedCount ?? 0) >= (promo.maxUses ?? Infinity)) {
      throw new AppError('Promo code has reached maximum uses', 400);
    }

    discount = Number(((subtotal * Number(promo.discount)) / 100).toFixed(2));
    // Update promo code usage
    await prisma.promoCode.update({
      where: { id: promo.id },
      data: { usedCount: promo.usedCount + 1 },
    });
  }

  const total = subtotal - discount;

  // Check balance
  if (Number(user.balance) < total) {
    orderLogger.audit('ORDER_CREATE_FAILED', userId, 'failed', {
      reason: 'INSUFFICIENT_BALANCE',
      userBalance: Number(user.balance),
      orderTotal: total,
      difference: total - Number(user.balance),
    });
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
    const existingItemIds = existingOrder.items
      .map((i: any) => i.gameId)
      .sort()
      .join(',');
    const newItemIds = items
      .map((i) => i.gameId)
      .sort()
      .join(',');

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
    orderLogger.info('Starting order transaction', {
      userId,
      total,
      itemsCount: items.length,
      promoCode: promoCode || null,
    });

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

    // Update order status to PROCESSING only if there are G2A games
    // Otherwise keep it as PENDING (manual processing)
    const hasG2AGames = items.some((item) => {
      const game = games.find((g) => g.id === item.gameId);
      return game?.g2aProductId;
    });

    if (hasG2AGames) {
      await tx.order.update({
        where: { id: newOrder.id },
        data: {
          status: 'PROCESSING',
        },
      });
    }

    orderLogger.info('Order transaction completed successfully', {
      orderId: newOrder.id,
      userId,
      total,
      status: newOrder.status,
    });

    return newOrder;
  });

  // Audit log: Order created successfully
  orderLogger.audit('ORDER_CREATED', userId, order.id, {
    total,
    subtotal,
    discount,
    itemsCount: items.length,
    status: order.status,
    paymentStatus: order.paymentStatus,
  });

  // Invalidate cache after order creation
  try {
    const { invalidateCache } = await import('./cache.service.js');
    await invalidateCache(`user:${userId}:orders`);
    await invalidateCache(`user:${userId}:cart`);
    orderLogger.info('Cache invalidated after order creation', { userId, orderId: order.id });
  } catch (cacheError) {
    // Non-blocking - log but don't fail order creation
    orderLogger.warn('Failed to invalidate cache after order creation', {
      userId,
      orderId: order.id,
      error: cacheError instanceof Error ? cacheError.message : String(cacheError),
    });
  }

  // Try to add order to processing queue (if available)
  // If queue is not available, process synchronously
  try {
    const { addOrderToQueue, isQueueAvailable } = await import('../queues/order-processing.queue.js');
    
    if (isQueueAvailable()) {
      const queueData = {
        orderId: order.id,
        userId,
        userEmail: user.email,
        items: order.items.map((item) => ({
          gameId: item.gameId,
          gameTitle: item.game.title,
          quantity: item.quantity,
          g2aProductId: item.game.g2aProductId,
          price: Number(item.price),
          platforms: item.game.platforms || [],
        })),
        total,
      };

      const addedToQueue = await addOrderToQueue(queueData);
      if (addedToQueue) {
        orderLogger.info('Order added to processing queue', {
          orderId: order.id,
          userId,
        });
        
        // Update order status to PROCESSING
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'PROCESSING',
          },
        });

        // Return order immediately (processing happens in background)
        return {
          id: order.id,
          userId: order.userId,
          status: 'PROCESSING',
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
          keys: [],
        };
      }
    }
  } catch (queueError) {
    orderLogger.warn('Failed to add order to queue, processing synchronously', {
      orderId: order.id,
      error: queueError instanceof Error ? queueError.message : String(queueError),
    });
  }

  // Purchase keys from G2A using Orders API (create -> pay -> get key)
  // This runs synchronously if queue is not available or failed
  const gameKeys: Array<{
    id: string;
    gameId: string;
    key: string;
    orderId: string | null;
    activated: boolean;
    activationDate: Date | null;
    createdAt: Date;
  }> = [];
  const purchaseErrors: Array<{ gameId: string; error: string; g2aOrderId?: string }> = [];
  const g2aOrderIds: string[] = []; // Track G2A order IDs for this order

  // Get G2A client instance
  let g2aClient: G2AIntegrationClient | null = null;
  try {
    // Get G2A config from database or environment
    const { getG2AConfig } = await import('../config/g2a.js');
    const g2aConfig = await getG2AConfig();
    
    if (g2aConfig.apiKey && g2aConfig.apiHash) {
      const { getDefaultConfig } = await import('../lib/g2a/config/defaults.js');
      const defaultConfig = getDefaultConfig(g2aConfig.env || 'sandbox');
      
      g2aClient = await G2AIntegrationClient.getInstance({
        env: g2aConfig.env || 'sandbox',
        apiKey: g2aConfig.apiKey,
        apiHash: g2aConfig.apiHash,
        email: g2aConfig.email || 'Welcome@nalytoo.com',
        baseUrl: g2aConfig.baseUrl || defaultConfig.baseUrl,
        timeoutMs: g2aConfig.timeoutMs || defaultConfig.timeoutMs,
      });
      
      orderLogger.info('G2A client initialized for order processing', {
        orderId: order.id,
        env: g2aConfig.env,
      });
    }
  } catch (error) {
    orderLogger.warn('Failed to get G2A client, continuing without G2A', {
      orderId: order.id,
      error: error instanceof Error ? error.message : String(error),
    });
    // Continue without G2A if client unavailable (for non-G2A games)
  }

  for (const item of items) {
    const game = games.find((g) => g.id === item.gameId)!;

    if (game.g2aProductId && g2aClient) {
      // Process each quantity as a separate G2A order (G2A API creates one order per product)
      for (let qty = 0; qty < item.quantity; qty++) {
        try {
          // Step 1: Create G2A order
          const g2aOrder = await g2aClient.orders.create({
            product_id: game.g2aProductId,
            currency: 'EUR',
            max_price: Number(game.price), // Max price per item
          });

          const g2aOrderId = g2aOrder.order_id;
          g2aOrderIds.push(g2aOrderId);

          orderLogger.info('G2A order created', {
            orderId: order.id,
            g2aOrderId,
            gameId: game.id,
            itemNumber: qty + 1,
            totalItems: item.quantity,
          });

          // Step 2: Pay for the G2A order
          let paymentResult;
          try {
            paymentResult = await g2aClient.orders.pay(g2aOrderId);
            orderLogger.info('G2A order paid', {
              orderId: order.id,
              g2aOrderId,
              transactionId: paymentResult.transaction_id,
            });
          } catch (payError) {
            // Handle payment errors
            if (payError instanceof G2AError && payError.code === G2AErrorCode.G2A_INVALID_REQUEST) {
              // Check if it's a retryable error (ORD03 - payment not ready yet)
              const errorCode = payError.metadata?.errorCode;
              if (errorCode === 'ORD03' && payError.metadata?.retryable) {
                // Payment not ready yet - retry after delay
                orderLogger.warn('G2A payment not ready, retrying', {
                  orderId: order.id,
                  g2aOrderId,
                  errorCode: 'ORD03',
                });
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
                try {
                  paymentResult = await g2aClient.orders.pay(g2aOrderId);
                } catch (retryError) {
                  // Retry failed, throw original error
                  throw payError;
                }
              } else {
                throw payError;
              }
            } else {
              throw payError;
            }
          }

          // Step 3: Get order key (can only be downloaded once)
          // Wait a bit for order to be processed after payment
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const keyResponse = await g2aClient.orders.getKey(g2aOrderId);
          const gameKeyValue = keyResponse.key;

          // Create game key record
          // NOTE: Game keys are currently stored in plain text in the database.
          // For production, consider implementing encryption at rest:
          // - Use AES-256 encryption for key field
          // - Store encryption key in secure key management service
          // - Decrypt keys only when needed for delivery
          const gameKey = await prisma.gameKey.create({
            data: {
              gameId: game.id,
              key: gameKeyValue, // TODO: Consider encrypting this field for production
              orderId: order.id,
              activated: false,
            },
          });
          gameKeys.push(gameKey);

          // Send email with key
          try {
            await sendGameKeyEmail(user.email, {
              gameTitle: game.title,
              key: gameKeyValue,
              platform: game.platforms[0]?.platform.name || 'PC',
            });
            orderLogger.info('Game key email sent', {
              orderId: order.id,
              gameId: game.id,
              keyId: gameKey.id,
              userEmail: user.email,
            });
          } catch (emailError) {
            orderLogger.error('Failed to send game key email', emailError, {
              orderId: order.id,
              gameId: game.id,
              keyId: gameKey.id,
              userEmail: user.email,
            });
            // Don't fail order if email fails - key is still delivered
          }
        } catch (error) {
          // If error occurs for one item, log but continue with next item
          const errorMessage =
            error instanceof G2AError
              ? error.message
              : error instanceof Error
                ? error.message
                : 'Unknown error';

          purchaseErrors.push({
            gameId: game.id,
            error: errorMessage,
          });

          orderLogger.error('Failed to purchase G2A key', error, {
            orderId: order.id,
            gameId: game.id,
            itemNumber: qty + 1,
            totalItems: item.quantity,
            g2aOrderId: g2aOrderIds[g2aOrderIds.length - 1],
          });
          
          // If it's a critical error, handle refund in transaction
          if (
            error instanceof G2AError &&
            (error.code === G2AErrorCode.G2A_OUT_OF_STOCK ||
              error.code === G2AErrorCode.G2A_AUTH_FAILED ||
              error.code === G2AErrorCode.G2A_API_ERROR)
          ) {
            // Use transaction to ensure atomic refund
            await prisma.$transaction(async (tx) => {
              // Mark order as failed
              await tx.order.update({
                where: { id: order.id },
                data: {
                  status: 'FAILED',
                  paymentStatus: 'FAILED',
                },
              });

              // Refund user balance
              await tx.user.update({
                where: { id: userId },
                data: {
                  balance: {
                    increment: total,
                  },
                },
              });

              // Create refund transaction
              await tx.transaction.create({
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
            });

            // Audit log: Order failed and refunded
            orderLogger.audit('ORDER_FAILED_REFUNDED', userId, order.id, {
              reason: errorMessage,
              errorCode: error instanceof G2AError ? error.code : 'UNKNOWN',
              refundAmount: total,
            });

            throw new AppError(`Order failed: ${errorMessage}. Balance has been refunded.`, 400);
          }
          // For other errors, continue with next item
        }
      }
    } else {
      // Non-G2A game - skip processing (manual processing required)
      orderLogger.info('Non-G2A game, skipping G2A processing', {
        orderId: order.id,
        gameId: game.id,
        gameTitle: game.title,
      });
    }
  }

  // Store G2A order IDs in externalOrderId (comma-separated if multiple)
  if (g2aOrderIds.length > 0) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        externalOrderId: g2aOrderIds.join(','), // Store all G2A order IDs
      },
    });
  }

  // Update order status based on results
  // If no games have G2A productId, keep order in PENDING status (manual processing)
  const hasG2AGames = items.some((item) => {
    const game = games.find((g) => g.id === item.gameId);
    return game?.g2aProductId;
  });

  let finalStatus: 'COMPLETED' | 'FAILED' | 'PENDING' = 'PENDING';

  if (hasG2AGames) {
    // Only process status if there are G2A games
    finalStatus = 'COMPLETED';
    if (purchaseErrors.length > 0 && gameKeys.length === 0) {
      // All purchases failed
      finalStatus = 'FAILED';
    } else if (purchaseErrors.length > 0) {
      // Partial success - some keys purchased, some failed
      // Order is completed but with errors logged
      orderLogger.warn('Order completed with partial errors', {
        orderId: order.id,
        errorsCount: purchaseErrors.length,
        keysPurchased: gameKeys.length,
        errors: purchaseErrors,
      });
    }
  }
  // If no G2A games, keep status as PENDING (set in transaction)

  const completedOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: finalStatus,
      paymentStatus:
        finalStatus === 'COMPLETED' ? 'COMPLETED' : finalStatus === 'FAILED' ? 'FAILED' : 'PENDING',
      completedAt: finalStatus === 'COMPLETED' ? new Date() : null,
    },
  });

  // Get completed order with all relations
  const completedOrderWithRelations = await prisma.order.findUnique({
    where: { id: order.id },
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

  if (!completedOrderWithRelations) {
    throw new AppError('Order not found after processing', 404);
  }

  // Audit log: Order completion
  orderLogger.audit('ORDER_COMPLETED', userId, order.id, {
    finalStatus,
    keysCount: gameKeys.length,
    errorsCount: purchaseErrors.length,
    g2aOrderIds: g2aOrderIds.length > 0 ? g2aOrderIds : null,
  });

  return {
    id: completedOrderWithRelations.id,
    userId: completedOrderWithRelations.userId,
    status: completedOrderWithRelations.status,
    subtotal: Number(completedOrderWithRelations.subtotal),
    discount: Number(completedOrderWithRelations.discount),
    total: Number(completedOrderWithRelations.total),
    paymentMethod: completedOrderWithRelations.paymentMethod || undefined,
    paymentStatus: completedOrderWithRelations.paymentStatus || undefined,
    promoCode: completedOrderWithRelations.promoCode || undefined,
    createdAt: completedOrderWithRelations.createdAt.toISOString(),
    completedAt: completedOrderWithRelations.completedAt?.toISOString(),
    items: completedOrderWithRelations.items.map((item) => ({
      id: item.id,
      gameId: item.gameId,
      game: item.game,
      quantity: item.quantity,
      price: Number(item.price),
      discount: Number(item.discount),
    })),
    keys: completedOrderWithRelations.keys.map((key) => ({
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
