import { Queue, Worker, Job } from 'bullmq';
import prisma from '../config/database.js';
import { G2AIntegrationClient } from '../lib/g2a/G2AIntegrationClient.js';
import { G2AError, G2AErrorCode } from '../lib/g2a/errors/G2AError.js';
import { sendGameKeyEmail } from '../services/email.service.js';
import { getG2AConfig } from '../config/g2a.js';
import { getDefaultConfig } from '../lib/g2a/config/defaults.js';

/**
 * Queue for processing G2A orders asynchronously
 * This allows the order creation to return quickly while G2A processing happens in background
 * 
 * Note: Queue is optional - if Redis is not available, orders will be processed synchronously
 */

interface OrderProcessingJobData {
  orderId: string;
  userId: string;
  userEmail: string;
  items: Array<{
    gameId: string;
    gameTitle: string;
    quantity: number;
    g2aProductId: string | null;
    price: number;
    platforms: Array<{ platform: { name: string } }>;
  }>;
  total: number;
}

// Parse Redis URL for BullMQ connection
function getRedisConnection() {
  const redisUrl = process.env.REDIS_GKEYS_REDIS_URL || process.env.REDIS_URL || 'redis://localhost:6379';
  
  try {
    const url = new URL(redisUrl);
    return {
      host: url.hostname,
      port: Number(url.port) || 6379,
      password: url.password || undefined,
    };
  } catch {
    // Fallback for simple format
    const parts = redisUrl.replace('redis://', '').split(':');
    return {
      host: parts[0] || 'localhost',
      port: Number(parts[1]) || 6379,
    };
  }
}

const redisConnection = getRedisConnection();

// Create queue and worker (only if Redis is available)
let orderProcessingQueue: Queue<OrderProcessingJobData> | null = null;
let orderProcessingWorker: Worker<OrderProcessingJobData> | null = null;

try {
  orderProcessingQueue = new Queue<OrderProcessingJobData>('order-processing', {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: {
        age: 24 * 3600, // Keep completed jobs for 24 hours
        count: 1000, // Keep last 1000 completed jobs
      },
      removeOnFail: {
        age: 7 * 24 * 3600, // Keep failed jobs for 7 days
      },
    },
  });

  // Create worker
  orderProcessingWorker = new Worker<OrderProcessingJobData>(
    'order-processing',
    async (job: Job<OrderProcessingJobData>) => {
      const { orderId, userId, userEmail, items, total } = job.data;

      console.log(`[Order Queue] Processing order ${orderId} for user ${userId}`);

      // Get G2A client
      let g2aClient: G2AIntegrationClient | null = null;
      try {
        const g2aConfig = await getG2AConfig();
        if (g2aConfig.apiKey && g2aConfig.apiHash) {
          const defaultConfig = getDefaultConfig(g2aConfig.env || 'sandbox');
          g2aClient = await G2AIntegrationClient.getInstance({
            env: g2aConfig.env || 'sandbox',
            apiKey: g2aConfig.apiKey,
            apiHash: g2aConfig.apiHash,
            email: g2aConfig.email || 'Welcome@nalytoo.com',
            baseUrl: g2aConfig.baseUrl || defaultConfig.baseUrl,
            timeoutMs: g2aConfig.timeoutMs || defaultConfig.timeoutMs,
          });
        }
      } catch (error) {
        console.error(`[Order Queue] Failed to get G2A client for order ${orderId}:`, error);
        throw error;
      }

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
      const g2aOrderIds: string[] = [];

      // Process each item
      for (const item of items) {
        if (item.g2aProductId && g2aClient) {
          // Process each quantity as a separate G2A order
          for (let qty = 0; qty < item.quantity; qty++) {
            try {
              // Step 1: Create G2A order
              const g2aOrder = await g2aClient.orders.create({
                product_id: item.g2aProductId,
                currency: 'EUR',
                max_price: item.price,
              });

              const g2aOrderId = g2aOrder.order_id;
              g2aOrderIds.push(g2aOrderId);

              // Step 2: Pay for the G2A order
              let paymentResult;
              try {
                paymentResult = await g2aClient.orders.pay(g2aOrderId);
              } catch (payError) {
                if (payError instanceof G2AError && payError.code === G2AErrorCode.G2A_INVALID_REQUEST) {
                  const errorCode = payError.metadata?.errorCode;
                  if (errorCode === 'ORD03' && payError.metadata?.retryable) {
                    // Retry after delay
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    paymentResult = await g2aClient.orders.pay(g2aOrderId);
                  } else {
                    throw payError;
                  }
                } else {
                  throw payError;
                }
              }

              // Step 3: Get order key
              await new Promise(resolve => setTimeout(resolve, 1000));
              const keyResponse = await g2aClient.orders.getKey(g2aOrderId);
              const gameKeyValue = keyResponse.key;

              // Create game key record
              const gameKey = await prisma.gameKey.create({
                data: {
                  gameId: item.gameId,
                  orderId,
                  key: gameKeyValue,
                  activated: false,
                },
              });

              gameKeys.push(gameKey);

              // Send email with key
              try {
                await sendGameKeyEmail(userEmail, {
                  gameTitle: item.gameTitle,
                  key: gameKeyValue,
                  platform: item.platforms[0]?.platform?.name || 'PC',
                });
              } catch (emailError) {
                console.error(`[Order Queue] Failed to send email for key ${gameKey.id}:`, emailError);
              }
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : String(error);
              purchaseErrors.push({
                gameId: item.gameId,
                error: errorMessage,
              });

              // If critical error, mark order as failed and refund
              if (
                error instanceof G2AError &&
                (error.code === G2AErrorCode.G2A_OUT_OF_STOCK ||
                  error.code === G2AErrorCode.G2A_AUTH_FAILED ||
                  error.code === G2AErrorCode.G2A_API_ERROR)
              ) {
                await prisma.$transaction(async (tx) => {
                  await tx.order.update({
                    where: { id: orderId },
                    data: {
                      status: 'FAILED',
                      paymentStatus: 'FAILED',
                    },
                  });

                  await tx.user.update({
                    where: { id: userId },
                    data: {
                      balance: {
                        increment: total,
                      },
                    },
                  });

                  await tx.transaction.create({
                    data: {
                      userId,
                      orderId,
                      type: 'REFUND',
                      amount: total,
                      currency: 'EUR',
                      status: 'COMPLETED',
                      description: `Refund for failed order ${orderId}`,
                    },
                  });
                });

                throw new Error(`Order failed: ${errorMessage}. Balance has been refunded.`);
              }
            }
          }
        }
      }

      // Store G2A order IDs
      if (g2aOrderIds.length > 0) {
        await prisma.order.update({
          where: { id: orderId },
          data: {
            externalOrderId: g2aOrderIds.join(','),
          },
        });
      }

      // Update order status
      const hasG2AGames = items.some((item) => item.g2aProductId);
      let finalStatus: 'COMPLETED' | 'FAILED' | 'PENDING' = 'PENDING';

      if (hasG2AGames) {
        finalStatus = 'COMPLETED';
        if (purchaseErrors.length > 0 && gameKeys.length === 0) {
          finalStatus = 'FAILED';
        }
      }

      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: finalStatus,
          paymentStatus:
            finalStatus === 'COMPLETED' ? 'COMPLETED' : finalStatus === 'FAILED' ? 'FAILED' : 'PENDING',
          completedAt: finalStatus === 'COMPLETED' ? new Date() : null,
        },
      });

      console.log(`[Order Queue] Order ${orderId} processed: ${finalStatus}, keys: ${gameKeys.length}, errors: ${purchaseErrors.length}`);

      return {
        orderId,
        status: finalStatus,
        keysCount: gameKeys.length,
        errorsCount: purchaseErrors.length,
      };
    },
    {
      connection: redisConnection,
      concurrency: 5, // Process up to 5 orders concurrently
    }
  );

  // Worker event handlers
  orderProcessingWorker.on('completed', (job) => {
    console.log(`[Order Queue] Job ${job.id} completed for order ${job.data.orderId}`);
  });

  orderProcessingWorker.on('failed', (job, err) => {
    console.error(`[Order Queue] Job ${job?.id} failed for order ${job?.data.orderId}:`, err);
  });

  orderProcessingWorker.on('error', (err) => {
    console.error(`[Order Queue] Worker error:`, err);
  });

  console.log('[Order Queue] Queue and worker initialized successfully');
} catch (error) {
  console.warn('[Order Queue] Failed to initialize queue (Redis may not be available). Orders will be processed synchronously:', error);
}

/**
 * Add order to processing queue
 * Returns true if added to queue, false if queue is not available (will process synchronously)
 */
export const addOrderToQueue = async (data: OrderProcessingJobData): Promise<boolean> => {
  if (!orderProcessingQueue) {
    return false;
  }

  try {
    await orderProcessingQueue.add('process-order', data, {
      jobId: `order-${data.orderId}`, // Unique job ID to prevent duplicates
      priority: 1, // Higher priority for new orders
    });
    console.log(`[Order Queue] Added order ${data.orderId} to processing queue`);
    return true;
  } catch (error) {
    console.error(`[Order Queue] Failed to add order ${data.orderId} to queue:`, error);
    return false;
  }
};

/**
 * Check if queue is available
 */
export const isQueueAvailable = (): boolean => {
  return orderProcessingQueue !== null;
};

export { orderProcessingQueue, orderProcessingWorker };
