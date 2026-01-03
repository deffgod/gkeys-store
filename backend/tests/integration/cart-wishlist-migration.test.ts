/**
 * Integration Tests: Cart and Wishlist Migration
 * 
 * Tests the migration of guest cart/wishlist to authenticated user accounts.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  createTestUser,
  createTestGame,
  cleanupTestUser,
  cleanupTestGame,
} from '../helpers/test-db.js';
import {
  addToCart,
  migrateSessionCartToUser,
  getCart,
} from '../../src/services/cart.service.js';
import {
  addToWishlist,
  migrateSessionWishlistToUser,
  getWishlist,
} from '../../src/services/wishlist.service.js';
import { disableRedis, enableRedis } from '../helpers/test-redis.js';

describe('Cart and Wishlist Migration', () => {
  let userId: string;
  let gameId: string;
  let game2Id: string;
  let sessionId: string;

  beforeAll(async () => {
    const user = await createTestUser();
    const game = await createTestGame({ price: 19.99, inStock: true });
    const game2 = await createTestGame({ price: 29.99, inStock: true });

    userId = user.id;
    gameId = game.id;
    game2Id = game2.id;
    sessionId = `test-session-${Date.now()}`;
  });

  afterAll(async () => {
    await cleanupTestUser(userId);
    await cleanupTestGame(gameId);
    await cleanupTestGame(game2Id);
  });

  beforeEach(async () => {
    // Clear carts and wishlists
    const { clearCart } = await import('../../src/services/cart.service.js');
    await clearCart(userId);
    await clearCart(undefined, sessionId);
  });

  describe('Cart Migration', () => {
    it('should migrate guest cart items to user account atomically', async () => {
      // Add items to guest cart
      await addToCart(gameId, 2, undefined, sessionId);
      await addToCart(game2Id, 1, undefined, sessionId);

      // Migrate
      await migrateSessionCartToUser(sessionId, userId);

      // Verify items in user cart
      const userCart = await getCart(userId);
      expect(userCart.items).toHaveLength(2);
      expect(userCart.items.find((item) => item.gameId === gameId)?.quantity).toBe(2);
      expect(userCart.items.find((item) => item.gameId === game2Id)?.quantity).toBe(1);

      // Verify guest cart is empty
      const guestCart = await getCart(undefined, sessionId);
      expect(guestCart.items).toHaveLength(0);
    });

    it('should merge quantities when user already has item in cart', async () => {
      // User already has item
      await addToCart(gameId, 2, userId);

      // Guest has same item
      await addToCart(gameId, 3, undefined, sessionId);

      // Migrate
      await migrateSessionCartToUser(sessionId, userId);

      // Verify merged quantity
      const cart = await getCart(userId);
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(5); // 2 + 3
    });

    it('should validate game availability before migration', async () => {
      const outOfStockGame = await createTestGame({ price: 19.99, inStock: false });

      // Add out-of-stock game to guest cart
      await addToCart(outOfStockGame.id, 1, undefined, sessionId);

      // Add in-stock game to guest cart
      await addToCart(gameId, 1, undefined, sessionId);

      // Migrate
      await migrateSessionCartToUser(sessionId, userId);

      // Verify only in-stock game migrated
      const cart = await getCart(userId);
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].gameId).toBe(gameId);
      expect(cart.items[0].gameId).not.toBe(outOfStockGame.id);

      await cleanupTestGame(outOfStockGame.id);
    });

    it('should handle migration when Redis is unavailable (SC-010)', async () => {
      await disableRedis();

      // Add items to guest cart
      await addToCart(gameId, 1, undefined, sessionId);

      // Migrate
      await migrateSessionCartToUser(sessionId, userId);

      // Verify migration succeeded
      const cart = await getCart(userId);
      expect(cart.items).toHaveLength(1);

      await enableRedis();
    });
  });

  describe('Wishlist Migration', () => {
    it('should migrate guest wishlist items to user account atomically', async () => {
      // Add items to guest wishlist
      await addToWishlist(gameId, undefined, sessionId);
      await addToWishlist(game2Id, undefined, sessionId);

      // Migrate
      await migrateSessionWishlistToUser(sessionId, userId);

      // Verify items in user wishlist
      const userWishlist = await getWishlist(userId);
      expect(userWishlist.items).toHaveLength(2);
      expect(userWishlist.items.some((item) => item.gameId === gameId)).toBe(true);
      expect(userWishlist.items.some((item) => item.gameId === game2Id)).toBe(true);

      // Verify guest wishlist is empty
      const guestWishlist = await getWishlist(undefined, sessionId);
      expect(guestWishlist.items).toHaveLength(0);
    });

    it('should prevent duplicates when migrating wishlist', async () => {
      // User already has item
      await addToWishlist(gameId, userId);

      // Guest has same item
      await addToWishlist(gameId, undefined, sessionId);

      // Migrate
      await migrateSessionWishlistToUser(sessionId, userId);

      // Verify no duplicate
      const wishlist = await getWishlist(userId);
      expect(wishlist.items).toHaveLength(1);
      expect(wishlist.items[0].gameId).toBe(gameId);
    });

    it('should validate game existence before migration', async () => {
      // Add valid game to guest wishlist
      await addToWishlist(gameId, undefined, sessionId);

      // Migrate
      await migrateSessionWishlistToUser(sessionId, userId);

      // Verify valid game migrated
      const wishlist = await getWishlist(userId);
      expect(wishlist.items).toHaveLength(1);
    });

    it('should handle migration when Redis is unavailable (SC-011)', async () => {
      await disableRedis();

      // Add item to guest wishlist
      await addToWishlist(gameId, undefined, sessionId);

      // Migrate
      await migrateSessionWishlistToUser(sessionId, userId);

      // Verify migration succeeded
      const wishlist = await getWishlist(userId);
      expect(wishlist.items).toHaveLength(1);

      await enableRedis();
    });
  });
});
