/**
 * Redis Test Utilities
 * 
 * Provides utilities for testing Redis behavior, including graceful degradation.
 */

import redisClient from '../../src/config/redis.js';

let redisOriginalState: boolean = true;
let redisDisabled: boolean = false;

/**
 * Disable Redis temporarily for graceful degradation tests
 */
export async function disableRedis(): Promise<void> {
  if (!redisDisabled) {
    redisOriginalState = redisClient.isOpen;
    redisDisabled = true;
    // Close the connection to simulate Redis unavailability
    if (redisClient.isOpen) {
      await redisClient.quit();
    }
  }
}

/**
 * Re-enable Redis after disabling
 */
export async function enableRedis(): Promise<void> {
  if (redisDisabled) {
    redisDisabled = false;
    // Reconnect if needed
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  }
}

/**
 * Clear all test cache keys
 */
export async function clearRedisCache(): Promise<void> {
  try {
    if (redisClient.isOpen) {
      // Clear all keys matching test patterns
      const keys = await redisClient.keys('cart:test-*');
      const wishlistKeys = await redisClient.keys('wishlist:test-*');
      
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
      if (wishlistKeys.length > 0) {
        await redisClient.del(wishlistKeys);
      }
    }
  } catch (error) {
    // Gracefully handle Redis unavailability
    console.warn('[Test Redis] Failed to clear cache:', error);
  }
}

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
  return redisClient.isOpen && !redisDisabled;
}
