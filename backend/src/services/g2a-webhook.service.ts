import crypto from 'node:crypto';
import prisma from '../config/database.js';
import redisClient from '../config/redis.js';
import { AppError } from '../middleware/errorHandler.js';
import { G2AWebhookEvent, IdempotencyRecord } from '../types/g2a.js';
import { getG2AConfig } from '../config/g2a.js';

const CLOCK_SKEW_TOLERANCE_MS = 5 * 60 * 1000; // 5 minutes
const IDEMPOTENCY_TTL_SECONDS = 24 * 60 * 60; // 24 hours

/**
 * Validate G2A webhook signature
 * According to G2A API docs, signature is HMAC-SHA256 of payload + timestamp + nonce + secret
 */
export const validateG2AWebhookSignature = (
  payload: string,
  signature: string,
  timestamp: number,
  nonce: string
): boolean => {
  const config = getG2AConfig();
  const secret = config.apiHash; // Use API hash as webhook secret
  
  // Create expected signature: HMAC-SHA256(payload + timestamp + nonce + secret)
  const stringToSign = `${payload}${timestamp}${nonce}${secret}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(stringToSign)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
};

/**
 * Validate timestamp to prevent replay attacks
 */
export const validateTimestamp = (timestamp: number): boolean => {
  const now = Date.now();
  const skew = Math.abs(now - timestamp);
  return skew <= CLOCK_SKEW_TOLERANCE_MS;
};

/**
 * Get or create idempotency record
 */
export const getIdempotencyRecord = async (
  key: string
): Promise<IdempotencyRecord | null> => {
  try {
    // Try Redis first (faster)
    if (redisClient.isOpen) {
      const cached = await redisClient.get(`idempotency:${key}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        return {
          ...parsed,
          updated_at: new Date(parsed.updated_at),
        };
      }
    }
    
    // Fallback to database
    // Note: This assumes you have an idempotency table in Prisma schema
    // For now, we'll use a simple in-memory cache or Redis-only approach
    return null;
  } catch (err) {
    console.error(`Error getting idempotency record for ${key}`, err);
    return null;
  }
};

/**
 * Store idempotency record
 */
export const storeIdempotencyRecord = async (
  key: string,
  status: 'processing' | 'done' | 'failed',
  error?: string
): Promise<void> => {
  try {
    const record: IdempotencyRecord = {
      key,
      status,
      attempts: 1,
      last_error: error || null,
      updated_at: new Date(),
    };
    
    // Store in Redis
    if (redisClient.isOpen) {
      await redisClient.setEx(
        `idempotency:${key}`,
        IDEMPOTENCY_TTL_SECONDS,
        JSON.stringify(record)
      );
    }
    
    // TODO: Also store in database if idempotency table exists
  } catch (err) {
    console.error(`Error storing idempotency record for ${key}`, err);
  }
};

/**
 * Update idempotency record attempts
 */
export const updateIdempotencyAttempts = async (
  key: string,
  status: 'processing' | 'done' | 'failed',
  error?: string
): Promise<void> => {
  try {
    const existing = await getIdempotencyRecord(key);
    const record: IdempotencyRecord = {
      key,
      status,
      attempts: (existing?.attempts || 0) + 1,
      last_error: error || null,
      updated_at: new Date(),
    };
    
    if (redisClient.isOpen) {
      await redisClient.setEx(
        `idempotency:${key}`,
        IDEMPOTENCY_TTL_SECONDS,
        JSON.stringify(record)
      );
    }
  } catch (err) {
    console.error(`Error updating idempotency record for ${key}`, err);
  }
};

/**
 * Process G2A webhook event with full validation and idempotency
 */
export const processG2AWebhook = async (
  event: G2AWebhookEvent,
  headers: Record<string, string>
): Promise<{ success: boolean; message: string }> => {
  // Record webhook total metric
  import('./g2a-metrics.service.js').then(m => m.incrementMetric('webhook_total')).catch(() => {});
  
  const { event_id, order_id, type, payload, signature, nonce, timestamp } = event;
  
  // Validate required fields
  if (!event_id || !order_id || !type || !signature || !nonce || !timestamp) {
    throw new AppError('Missing required webhook fields', 400);
  }
  
  // Validate timestamp (prevent replay attacks)
  if (!validateTimestamp(timestamp)) {
    throw new AppError('Webhook timestamp is too old or too far in future', 400);
  }
  
  // Check idempotency (prevent duplicate processing)
  const idempotencyKey = `${event_id}:${order_id}:${type}`;
  const existing = await getIdempotencyRecord(idempotencyKey);
  
  if (existing?.status === 'done') {
    return { success: true, message: 'Event already processed' };
  }
  
  if (existing?.status === 'processing') {
    // If still processing, wait a bit and check again (simple retry logic)
    await new Promise(resolve => setTimeout(resolve, 1000));
    const recheck = await getIdempotencyRecord(idempotencyKey);
    if (recheck?.status === 'done') {
      return { success: true, message: 'Event already processed' };
    }
  }
  
  // Mark as processing
  await storeIdempotencyRecord(idempotencyKey, 'processing');
  
  try {
    // Validate signature
    const payloadString = JSON.stringify(payload);
    if (!validateG2AWebhookSignature(payloadString, signature, timestamp, nonce)) {
      await updateIdempotencyAttempts(idempotencyKey, 'failed', 'Invalid signature');
      // Record invalid webhook metric
      import('./g2a-metrics.service.js').then(m => m.incrementMetric('webhook_invalid')).catch(() => {});
      throw new AppError('Invalid webhook signature', 401);
    }
    
    // Record valid webhook metric
    import('./g2a-metrics.service.js').then(m => m.incrementMetric('webhook_valid')).catch(() => {});
    
    // Process webhook based on type
    switch (type) {
      case 'order.status_changed':
      case 'order.completed':
      case 'order.failed':
        await handleOrderStatusWebhook(order_id, payload);
        break;
      default:
        console.log(`Unhandled webhook type: ${type}`, payload);
    }
    
    // Mark as done
    await storeIdempotencyRecord(idempotencyKey, 'done');
    
    return { success: true, message: 'Webhook processed successfully' };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    await updateIdempotencyAttempts(idempotencyKey, 'failed', errorMsg);
    throw err;
  }
};

/**
 * Handle order status webhook
 */
const handleOrderStatusWebhook = async (
  orderId: string,
  payload: Record<string, unknown>
): Promise<void> => {
  if (!prisma) {
    throw new AppError('Database not available', 503);
  }
  
  // Find order in database
  const order = await prisma.order.findFirst({
    where: {
      OR: [
        { id: orderId },
        { externalOrderId: orderId },
      ],
    },
  });
  
  if (!order) {
    console.warn(`Order not found for webhook: ${orderId}`);
    return;
  }
  
  // Update order status based on payload
  const status = payload.status as string;
  if (status) {
    const orderStatusMap: Record<string, 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'> = {
      pending: 'PENDING',
      processing: 'PROCESSING',
      completed: 'COMPLETED',
      failed: 'FAILED',
      cancelled: 'CANCELLED',
    };
    
    const mappedStatus = orderStatusMap[status.toLowerCase()];
    if (mappedStatus) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: mappedStatus },
      });
      
      console.log(`Order ${order.id} status updated to ${mappedStatus} via webhook`);
      
      // Invalidate cache after order status update
      try {
        const { invalidateCache } = await import('./cache.service.js');
        await invalidateCache(`order:${order.id}`);
        await invalidateCache(`user:${order.userId}:orders`);
        console.log(`[Webhook] Cache invalidated for order ${order.id}`);
      } catch (cacheError) {
        // Non-blocking - log but don't fail webhook processing
        console.warn(`[Webhook] Failed to invalidate cache for order ${order.id}:`, cacheError);
      }
    }
  }
};
