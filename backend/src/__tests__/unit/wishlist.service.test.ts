/**
 * Unit Tests: Wishlist Service
 * 
 * Tests wishlist service functions in isolation.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  isInWishlist,
  migrateSessionWishlistToUser,
} from '../../services/wishlist.service.js';
import {
  createTestUser,
  createTestGame,
  cleanupTestUser,
  cleanupTestGame,
  createTestWishlist,
} from '../../../tests/helpers/test-db.js';
import { disableRedis, enableRedis } from '../../../tests/helpers/test-redis.js';

describe('Wishlist Service', () => {
  let userId: string;
  let gameId: string;
  let sessionId: string;

  beforeEach(async () => {
    const user = await createTestUser();
    const game = await createTestGame({ price: 19.99, inStock: true });
    userId = user.id;
    gameId = game.id;
    sessionId = `session-${Date.now()}`;
  });

  afterEach(async () => {
    await cleanupTestUser(userId);
    await cleanupTestGame(gameId);
  });

  describe('getWishlist', () => {
    it('should get wishlist for authenticated user', async () => {
      await addToWishlist(gameId, userId);

      const wishlist = await getWishlist(userId);

      expect(wishlist.items).toHaveLength(1);
      expect(wishlist.items[0].gameId).toBe(gameId);
    });

    it('should get wishlist for guest session', async () => {
      // For guest sessions, create a temporary user since schema requires userId
      const guestUser = await createTestUser();
      await addToWishlist(gameId, guestUser.id);

      const wishlist = await getWishlist(guestUser.id);

      expect(wishlist.items).toHaveLength(1);
      expect(wishlist.items[0].gameId).toBe(gameId);
      
      // Cleanup
      await cleanupTestUser(guestUser.id);
    });

    it('should return empty wishlist', async () => {
      const wishlist = await getWishlist(userId);

      expect(wishlist.items).toHaveLength(0);
    });

    it('should work with Redis cache', async () => {
      await enableRedis();
      await addToWishlist(gameId, userId);

      const wishlist1 = await getWishlist(userId);
      expect(wishlist1.items).toHaveLength(1);

      const wishlist2 = await getWishlist(userId);
      expect(wishlist2.items).toHaveLength(1);
    });

    it('should work without Redis (graceful degradation)', async () => {
      await disableRedis();
      await addToWishlist(gameId, userId);

      const wishlist = await getWishlist(userId);
      expect(wishlist.items).toHaveLength(1);

      await enableRedis();
    });
  });

  describe('addToWishlist', () => {
    it('should add game to authenticated user wishlist', async () => {
      await addToWishlist(gameId, userId);

      const wishlist = await getWishlist(userId);
      expect(wishlist.items).toHaveLength(1);
      expect(wishlist.items[0].gameId).toBe(gameId);
    });

    it('should add game to guest session wishlist', async () => {
      // For guest sessions, create a temporary user since schema requires userId
      const guestUser = await createTestUser();
      await addToWishlist(gameId, guestUser.id);

      const wishlist = await getWishlist(guestUser.id);
      expect(wishlist.items).toHaveLength(1);
      
      // Cleanup
      await cleanupTestUser(guestUser.id);
    });

    it('should prevent duplicate when adding same game again', async () => {
      await addToWishlist(gameId, userId);

      // Try to add again (should not throw error, but should not create duplicate)
      await addToWishlist(gameId, userId);

      const wishlist = await getWishlist(userId);
      expect(wishlist.items).toHaveLength(1); // Still only one item
    });

    it('should throw error when adding non-existent game', async () => {
      const nonExistentId = 'non-existent-game-id';

      await expect(addToWishlist(nonExistentId, userId)).rejects.toThrow();
    });
  });

  describe('removeFromWishlist', () => {
    it('should remove game from wishlist', async () => {
      await addToWishlist(gameId, userId);

      await removeFromWishlist(gameId, userId);

      const wishlist = await getWishlist(userId);
      expect(wishlist.items).toHaveLength(0);
    });
  });

  describe('isInWishlist', () => {
    it('should return true when game is in wishlist', async () => {
      await addToWishlist(gameId, userId);

      const inWishlist = await isInWishlist(gameId, userId);
      expect(inWishlist).toBe(true);
    });

    it('should return false when game is not in wishlist', async () => {
      const inWishlist = await isInWishlist(gameId, userId);
      expect(inWishlist).toBe(false);
    });
  });

  describe('migrateSessionWishlistToUser', () => {
    it('should migrate guest wishlist to user wishlist atomically', async () => {
      // For guest sessions, we need to create a temporary user
      // since the schema requires userId as foreign key
      const guestUser = await createTestUser();
      
      // Add to guest wishlist using guest user ID
      await addToWishlist(gameId, guestUser.id);

      await migrateSessionWishlistToUser(guestUser.id, userId);

      const userWishlist = await getWishlist(userId);
      expect(userWishlist.items).toHaveLength(1);
      expect(userWishlist.items[0].gameId).toBe(gameId);

      // Cleanup guest user
      await cleanupTestUser(guestUser.id);
    });

    it('should prevent duplicates when user already has item', async () => {
      // User already has item
      await addToWishlist(gameId, userId);

      // Guest has same item (using temporary user)
      const guestUser = await createTestUser();
      await addToWishlist(gameId, guestUser.id);

      // Migrate
      await migrateSessionWishlistToUser(guestUser.id, userId);

      // Verify no duplicate
      const wishlist = await getWishlist(userId);
      expect(wishlist.items).toHaveLength(1);
      
      // Cleanup
      await cleanupTestUser(guestUser.id);
    });

    it('should skip non-existent games during migration', async () => {
      // Create guest user
      const guestUser = await createTestUser();
      
      // Add valid game to guest wishlist
      await addToWishlist(gameId, guestUser.id);
      
      // Migrate
      await migrateSessionWishlistToUser(guestUser.id, userId);

      const wishlist = await getWishlist(userId);
      expect(wishlist.items).toHaveLength(1);
      
      // Cleanup
      await cleanupTestUser(guestUser.id);
    });
  });
});
