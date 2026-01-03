/**
 * Integration Tests: Wishlist API
 * 
 * Tests wishlist API endpoints with real Express app and database.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/index.js';
import {
  createTestUser,
  createTestGame,
  cleanupTestUser,
  cleanupTestGame,
} from '../helpers/test-db.js';
import { authenticateUser, getAuthHeaders } from '../helpers/test-auth.js';

describe('Wishlist API Integration Tests', () => {
  let userToken: string;
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
    userToken = authenticateUser(user);
    sessionId = `test-session-${Date.now()}`;
  });

  afterAll(async () => {
    await cleanupTestUser(userId);
    await cleanupTestGame(gameId);
    await cleanupTestGame(game2Id);
  });

  beforeEach(async () => {
    // Clear wishlist before each test
    const { removeFromWishlist } = await import('../../src/services/wishlist.service.js');
    try {
      await removeFromWishlist(gameId, userId);
      await removeFromWishlist(game2Id, userId);
      await removeFromWishlist(gameId, undefined, sessionId);
      await removeFromWishlist(game2Id, undefined, sessionId);
    } catch {
      // Ignore errors if items don't exist
    }
  });

  describe('GET /api/wishlist', () => {
    it('should get wishlist for authenticated user', async () => {
      // Add item first
      const { addToWishlist } = await import('../../src/services/wishlist.service.js');
      await addToWishlist(gameId, userId);

      const response = await request(app)
        .get('/api/wishlist')
        .set(getAuthHeaders(userToken));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].gameId).toBe(gameId);
    });

    it('should get wishlist for guest session', async () => {
      const { addToWishlist } = await import('../../src/services/wishlist.service.js');
      await addToWishlist(gameId, undefined, sessionId);

      const response = await request(app)
        .get('/api/wishlist')
        .set('Cookie', `sessionId=${sessionId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
    });

    it('should return empty wishlist', async () => {
      const response = await request(app)
        .get('/api/wishlist')
        .set(getAuthHeaders(userToken));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(0);
    });
  });

  describe('POST /api/wishlist', () => {
    it('should add game to wishlist (authenticated user)', async () => {
      const response = await request(app)
        .post('/api/wishlist')
        .set(getAuthHeaders(userToken))
        .send({ gameId });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('added to wishlist');

      // Verify item in wishlist
      const wishlistResponse = await request(app)
        .get('/api/wishlist')
        .set(getAuthHeaders(userToken));

      expect(wishlistResponse.body.data.items).toHaveLength(1);
    });

    it('should add game to wishlist (guest session)', async () => {
      const response = await request(app)
        .post('/api/wishlist')
        .set('Cookie', `sessionId=${sessionId}`)
        .send({ gameId });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should handle adding same game again gracefully', async () => {
      // Add game first time
      await request(app)
        .post('/api/wishlist')
        .set(getAuthHeaders(userToken))
        .send({ gameId });

      // Try to add again (should not error)
      const response = await request(app)
        .post('/api/wishlist')
        .set(getAuthHeaders(userToken))
        .send({ gameId });

      // Should succeed (no error, but no duplicate created)
      expect(response.status).toBe(201);

      // Verify only one item
      const wishlistResponse = await request(app)
        .get('/api/wishlist')
        .set(getAuthHeaders(userToken));

      expect(wishlistResponse.body.data.items).toHaveLength(1);
    });

    it('should return 400 when gameId is missing', async () => {
      const response = await request(app)
        .post('/api/wishlist')
        .set(getAuthHeaders(userToken))
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should complete wishlist operations in under 2 seconds (SC-004)', async () => {
      const startTime = Date.now();

      await request(app)
        .post('/api/wishlist')
        .set(getAuthHeaders(userToken))
        .send({ gameId });

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('DELETE /api/wishlist/:gameId', () => {
    it('should remove game from wishlist', async () => {
      // Add item first
      await request(app)
        .post('/api/wishlist')
        .set(getAuthHeaders(userToken))
        .send({ gameId });

      // Remove item
      const response = await request(app)
        .delete(`/api/wishlist/${gameId}`)
        .set(getAuthHeaders(userToken));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify item removed
      const wishlistResponse = await request(app)
        .get('/api/wishlist')
        .set(getAuthHeaders(userToken));

      expect(wishlistResponse.body.data.items).toHaveLength(0);
    });
  });

  describe('GET /api/wishlist/:gameId/check', () => {
    it('should return true when game is in wishlist', async () => {
      // Add item first
      await request(app)
        .post('/api/wishlist')
        .set(getAuthHeaders(userToken))
        .send({ gameId });

      const response = await request(app)
        .get(`/api/wishlist/${gameId}/check`)
        .set(getAuthHeaders(userToken));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.inWishlist).toBe(true);
    });

    it('should return false when game is not in wishlist', async () => {
      const response = await request(app)
        .get(`/api/wishlist/${gameId}/check`)
        .set(getAuthHeaders(userToken));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.inWishlist).toBe(false);
    });
  });

  describe('POST /api/wishlist/migrate', () => {
    it('should migrate guest wishlist to user wishlist', async () => {
      // Add item to guest wishlist
      await request(app)
        .post('/api/wishlist')
        .set('Cookie', `sessionId=${sessionId}`)
        .send({ gameId });

      // Migrate wishlist
      const response = await request(app)
        .post('/api/wishlist/migrate')
        .set(getAuthHeaders(userToken))
        .set('Cookie', `sessionId=${sessionId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify items in user wishlist
      const userWishlistResponse = await request(app)
        .get('/api/wishlist')
        .set(getAuthHeaders(userToken));

      expect(userWishlistResponse.body.data.items).toHaveLength(1);
    });

    it('should require authentication for migration', async () => {
      const response = await request(app)
        .post('/api/wishlist/migrate')
        .set('Cookie', `sessionId=${sessionId}`);

      expect(response.status).toBe(401);
    });
  });
});
