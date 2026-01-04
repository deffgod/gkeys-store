/**
 * Unit Tests: Cart Service
 *
 * Tests cart service functions in isolation.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getCart, addToCart, migrateSessionCartToUser } from '../../services/cart.service.js';
import {
  createTestUser,
  createTestGame,
  cleanupTestUser,
  cleanupTestGame,
  createTestCart,
} from '../../../tests/helpers/test-db.js';
import { disableRedis, enableRedis } from '../../../tests/helpers/test-redis.js';
import prisma from '../../config/database.js';

describe('Cart Service', () => {
  let userId: string;
  let gameId: string;
  let sessionId: string;

  beforeEach(async () => {
    // Create test user and game
    const user = await createTestUser({ balance: 100.0 });
    const game = await createTestGame({ price: 19.99, inStock: true });
    userId = user.id;
    gameId = game.id;
    sessionId = `session-${Date.now()}`;
  });

  afterEach(async () => {
    // Cleanup test data
    await cleanupTestUser(userId);
    await cleanupTestGame(gameId);
  });

  describe('getCart', () => {
    it('should get cart for authenticated user', async () => {
      // Add item to cart
      await addToCart(gameId, 1, userId);

      // Get cart
      const cart = await getCart(userId);

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].gameId).toBe(gameId);
      expect(cart.items[0].quantity).toBe(1);
      expect(Number(cart.total)).toBeCloseTo(19.99, 2);
    });

    it('should get cart for guest session', async () => {
      // For guest sessions, create a temporary user since schema requires userId
      const guestUser = await createTestUser();
      await addToCart(gameId, 1, guestUser.id);

      // Get cart
      const cart = await getCart(guestUser.id);

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].gameId).toBe(gameId);
      expect(cart.items[0].quantity).toBe(1);

      // Cleanup
      await cleanupTestUser(guestUser.id);
    });

    it('should return empty cart with zero total', async () => {
      const cart = await getCart(userId);

      expect(cart.items).toHaveLength(0);
      expect(Number(cart.total)).toBe(0);
    });

    it('should calculate cart total accurately (SC-002)', async () => {
      // Create multiple games with different prices
      const game1 = await createTestGame({ price: 19.99, inStock: true });
      const game2 = await createTestGame({ price: 29.99, inStock: true });

      // Add items to cart
      await addToCart(game1.id, 2, userId); // 19.99 * 2 = 39.98
      await addToCart(game2.id, 1, userId); // 29.99 * 1 = 29.99
      // Expected total: 69.97

      const cart = await getCart(userId);

      expect(cart.items).toHaveLength(2);
      expect(Number(cart.total)).toBeCloseTo(69.97, 2);

      // Cleanup
      await cleanupTestGame(game1.id);
      await cleanupTestGame(game2.id);
    });

    it('should work with Redis cache', async () => {
      // Ensure Redis is enabled
      await enableRedis();

      // Add item to cart
      await addToCart(gameId, 1, userId);

      // Get cart (should be cached)
      const cart1 = await getCart(userId);
      expect(cart1.items).toHaveLength(1);

      // Get cart again (should use cache)
      const cart2 = await getCart(userId);
      expect(cart2.items).toHaveLength(1);
      expect(cart2.items[0].gameId).toBe(gameId);
    });

    it('should work without Redis (graceful degradation)', async () => {
      // Disable Redis
      await disableRedis();

      // Add item to cart
      await addToCart(gameId, 1, userId);

      // Get cart (should work without cache)
      const cart = await getCart(userId);

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].gameId).toBe(gameId);

      // Re-enable Redis
      await enableRedis();
    });
  });

  describe('addToCart', () => {
    it('should add game to authenticated user cart', async () => {
      await addToCart(gameId, 1, userId);

      const cart = await getCart(userId);
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].gameId).toBe(gameId);
      expect(cart.items[0].quantity).toBe(1);
    });

    it('should add game to guest session cart', async () => {
      // For guest sessions, create a temporary user since schema requires userId
      const guestUser = await createTestUser();
      await addToCart(gameId, 1, guestUser.id);

      const cart = await getCart(guestUser.id);
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].gameId).toBe(gameId);

      // Cleanup
      await cleanupTestUser(guestUser.id);
    });

    it('should increase quantity when adding same game again', async () => {
      // Add game first time
      await addToCart(gameId, 1, userId);

      // Add same game again
      await addToCart(gameId, 1, userId);

      const cart = await getCart(userId);
      expect(cart.items).toHaveLength(1); // Still one item
      expect(cart.items[0].quantity).toBe(2); // But quantity is 2
    });

    it('should throw error when adding out-of-stock game', async () => {
      const outOfStockGame = await createTestGame({ price: 19.99, inStock: false });

      await expect(addToCart(outOfStockGame.id, 1, userId)).rejects.toThrow();

      await cleanupTestGame(outOfStockGame.id);
    });

    it('should throw error when adding non-existent game', async () => {
      const nonExistentId = 'non-existent-game-id';

      await expect(addToCart(nonExistentId, 1, userId)).rejects.toThrow();
    });
  });

  describe('migrateSessionCartToUser', () => {
    it('should migrate guest cart to user cart atomically', async () => {
      // For guest sessions, create a temporary user since schema requires userId
      const guestUser = await createTestUser();

      // Add items to guest cart
      await addToCart(gameId, 2, guestUser.id);

      // Migrate to user cart
      await migrateSessionCartToUser(guestUser.id, userId);

      // Verify items in user cart
      const userCart = await getCart(userId);
      expect(userCart.items).toHaveLength(1);
      expect(userCart.items[0].gameId).toBe(gameId);
      expect(userCart.items[0].quantity).toBe(2);

      // Cleanup
      await cleanupTestUser(guestUser.id);
    });

    it('should merge quantities when user already has item', async () => {
      // User already has item in cart
      await addToCart(gameId, 2, userId);

      // Guest has same item (using temporary user)
      const guestUser = await createTestUser();
      await addToCart(gameId, 3, guestUser.id);

      // Migrate
      await migrateSessionCartToUser(guestUser.id, userId);

      // Verify merged quantity
      const cart = await getCart(userId);
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(5); // 2 + 3

      // Cleanup
      await cleanupTestUser(guestUser.id);
    });

    it('should skip out-of-stock items during migration', async () => {
      const outOfStockGame = await createTestGame({ price: 19.99, inStock: false });
      const guestUser = await createTestUser();

      // Add out-of-stock game to guest cart directly (bypassing stock check)
      // This simulates a game that was added to cart before going out of stock
      await prisma.cartItem.create({
        data: {
          userId: guestUser.id,
          gameId: outOfStockGame.id,
          quantity: 1,
        },
      });

      // Add in-stock game to guest cart
      await addToCart(gameId, 1, guestUser.id);

      // Migrate
      await migrateSessionCartToUser(guestUser.id, userId);

      // Verify only in-stock game migrated
      const cart = await getCart(userId);
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].gameId).toBe(gameId);
      expect(cart.items[0].gameId).not.toBe(outOfStockGame.id);

      await cleanupTestGame(outOfStockGame.id);
      await cleanupTestUser(guestUser.id);
    });
  });

  describe('updateCartItem', () => {
    it('should update cart item quantity', async () => {
      // Add item to cart
      await addToCart(gameId, 2, userId);

      // Import updateCartItem
      const { updateCartItem } = await import('../../services/cart.service.js');

      // Update quantity
      await updateCartItem(gameId, 3, userId);

      const cart = await getCart(userId);
      expect(cart.items[0].quantity).toBe(3);
    });

    it('should remove item when quantity is set to 0', async () => {
      // Add item to cart
      await addToCart(gameId, 2, userId);

      // Import updateCartItem
      const { updateCartItem } = await import('../../services/cart.service.js');

      // Update quantity to 0 (should remove)
      await updateCartItem(gameId, 0, userId);

      const cart = await getCart(userId);
      expect(cart.items).toHaveLength(0);
    });
  });

  describe('removeFromCart', () => {
    it('should remove item from cart', async () => {
      // Add item to cart
      await addToCart(gameId, 1, userId);

      // Import removeFromCart
      const { removeFromCart } = await import('../../services/cart.service.js');

      // Remove item
      await removeFromCart(gameId, userId);

      const cart = await getCart(userId);
      expect(cart.items).toHaveLength(0);
    });
  });

  describe('clearCart', () => {
    it('should clear entire cart', async () => {
      // Add multiple items
      const game2 = await createTestGame({ price: 29.99, inStock: true });
      await addToCart(gameId, 1, userId);
      await addToCart(game2.id, 2, userId);

      // Import clearCart
      const { clearCart } = await import('../../services/cart.service.js');

      // Clear cart
      await clearCart(userId);

      const cart = await getCart(userId);
      expect(cart.items).toHaveLength(0);
      expect(Number(cart.total)).toBe(0);

      await cleanupTestGame(game2.id);
    });
  });
});
