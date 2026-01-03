/**
 * Integration Tests: Cart API
 * 
 * Tests cart API endpoints with real Express app and database.
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

describe('Cart API Integration Tests', () => {
  let userToken: string;
  let userId: string;
  let gameId: string;
  let game2Id: string;
  let sessionId: string;

  beforeAll(async () => {
    // Create test user and games
    const user = await createTestUser({ balance: 100.0 });
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
    // Clear cart before each test
    const { clearCart } = await import('../../src/services/cart.service.js');
    await clearCart(userId);
    await clearCart(undefined, sessionId);
  });

  describe('GET /api/cart', () => {
    it('should get cart for authenticated user', async () => {
      // Add item first
      const { addToCart } = await import('../../src/services/cart.service.js');
      await addToCart(gameId, 1, userId);

      const response = await request(app)
        .get('/api/cart')
        .set(getAuthHeaders(userToken));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].gameId).toBe(gameId);
      expect(Number(response.body.data.total)).toBeCloseTo(19.99, 2);
    });

    it('should get cart for guest session', async () => {
      // Add item as guest
      const { addToCart } = await import('../../src/services/cart.service.js');
      await addToCart(gameId, 1, undefined, sessionId);

      const response = await request(app)
        .get('/api/cart')
        .set('Cookie', `sessionId=${sessionId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
    });

    it('should return empty cart', async () => {
      const response = await request(app)
        .get('/api/cart')
        .set(getAuthHeaders(userToken));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(0);
      expect(Number(response.body.data.total)).toBe(0);
    });
  });

  describe('POST /api/cart', () => {
    it('should add item to cart (authenticated user)', async () => {
      const response = await request(app)
        .post('/api/cart')
        .set(getAuthHeaders(userToken))
        .send({ gameId, quantity: 1 });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('added to cart');

      // Verify item in cart
      const cartResponse = await request(app)
        .get('/api/cart')
        .set(getAuthHeaders(userToken));

      expect(cartResponse.body.data.items).toHaveLength(1);
    });

    it('should add item to cart (guest session)', async () => {
      const response = await request(app)
        .post('/api/cart')
        .set('Cookie', `sessionId=${sessionId}`)
        .send({ gameId, quantity: 1 });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should increase quantity when adding same item', async () => {
      // Add item first time
      await request(app)
        .post('/api/cart')
        .set(getAuthHeaders(userToken))
        .send({ gameId, quantity: 1 });

      // Add same item again
      const response = await request(app)
        .post('/api/cart')
        .set(getAuthHeaders(userToken))
        .send({ gameId, quantity: 1 });

      expect(response.status).toBe(201);

      // Verify quantity increased
      const cartResponse = await request(app)
        .get('/api/cart')
        .set(getAuthHeaders(userToken));

      expect(cartResponse.body.data.items).toHaveLength(1);
      expect(cartResponse.body.data.items[0].quantity).toBe(2);
    });

    it('should return 400 when adding out-of-stock game', async () => {
      const outOfStockGame = await createTestGame({ price: 19.99, inStock: false });

      const response = await request(app)
        .post('/api/cart')
        .set(getAuthHeaders(userToken))
        .send({ gameId: outOfStockGame.id, quantity: 1 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);

      await cleanupTestGame(outOfStockGame.id);
    });

    it('should return 400 when gameId is missing', async () => {
      const response = await request(app)
        .post('/api/cart')
        .set(getAuthHeaders(userToken))
        .send({ quantity: 1 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should complete cart operations in under 2 seconds (SC-001)', async () => {
      const startTime = Date.now();

      await request(app)
        .post('/api/cart')
        .set(getAuthHeaders(userToken))
        .send({ gameId, quantity: 1 });

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('PUT /api/cart/:gameId', () => {
    it('should update cart item quantity', async () => {
      // Add item first
      await request(app)
        .post('/api/cart')
        .set(getAuthHeaders(userToken))
        .send({ gameId, quantity: 2 });

      // Update quantity
      const response = await request(app)
        .put(`/api/cart/${gameId}`)
        .set(getAuthHeaders(userToken))
        .send({ quantity: 3 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify quantity updated
      const cartResponse = await request(app)
        .get('/api/cart')
        .set(getAuthHeaders(userToken));

      expect(cartResponse.body.data.items[0].quantity).toBe(3);
    });

    it('should remove item when quantity is set to 0', async () => {
      // Add item first
      await request(app)
        .post('/api/cart')
        .set(getAuthHeaders(userToken))
        .send({ gameId, quantity: 1 });

      // Update quantity to 0
      await request(app)
        .put(`/api/cart/${gameId}`)
        .set(getAuthHeaders(userToken))
        .send({ quantity: 0 });

      // Verify item removed
      const cartResponse = await request(app)
        .get('/api/cart')
        .set(getAuthHeaders(userToken));

      expect(cartResponse.body.data.items).toHaveLength(0);
    });
  });

  describe('DELETE /api/cart/:gameId', () => {
    it('should remove item from cart', async () => {
      // Add item first
      await request(app)
        .post('/api/cart')
        .set(getAuthHeaders(userToken))
        .send({ gameId, quantity: 1 });

      // Remove item
      const response = await request(app)
        .delete(`/api/cart/${gameId}`)
        .set(getAuthHeaders(userToken));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify item removed
      const cartResponse = await request(app)
        .get('/api/cart')
        .set(getAuthHeaders(userToken));

      expect(cartResponse.body.data.items).toHaveLength(0);
    });
  });

  describe('DELETE /api/cart', () => {
    it('should clear entire cart', async () => {
      // Add multiple items
      await request(app)
        .post('/api/cart')
        .set(getAuthHeaders(userToken))
        .send({ gameId, quantity: 1 });

      await request(app)
        .post('/api/cart')
        .set(getAuthHeaders(userToken))
        .send({ gameId: game2Id, quantity: 2 });

      // Clear cart
      const response = await request(app)
        .delete('/api/cart')
        .set(getAuthHeaders(userToken));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify cart is empty
      const cartResponse = await request(app)
        .get('/api/cart')
        .set(getAuthHeaders(userToken));

      expect(cartResponse.body.data.items).toHaveLength(0);
      expect(Number(cartResponse.body.data.total)).toBe(0);
    });
  });

  describe('POST /api/cart/migrate', () => {
    it('should migrate guest cart to user cart', async () => {
      // Add item to guest cart
      await request(app)
        .post('/api/cart')
        .set('Cookie', `sessionId=${sessionId}`)
        .send({ gameId, quantity: 2 });

      // Migrate cart
      const response = await request(app)
        .post('/api/cart/migrate')
        .set(getAuthHeaders(userToken))
        .set('Cookie', `sessionId=${sessionId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify items in user cart
      const userCartResponse = await request(app)
        .get('/api/cart')
        .set(getAuthHeaders(userToken));

      expect(userCartResponse.body.data.items).toHaveLength(1);
      expect(userCartResponse.body.data.items[0].quantity).toBe(2);
    });

    it('should require authentication for migration', async () => {
      const response = await request(app)
        .post('/api/cart/migrate')
        .set('Cookie', `sessionId=${sessionId}`);

      expect(response.status).toBe(401);
    });
  });

  describe('Cart Total Calculation Accuracy (SC-002)', () => {
    it('should calculate cart total accurately with multiple items', async () => {
      // Add items with different prices
      await request(app)
        .post('/api/cart')
        .set(getAuthHeaders(userToken))
        .send({ gameId, quantity: 2 }); // 19.99 * 2 = 39.98

      await request(app)
        .post('/api/cart')
        .set(getAuthHeaders(userToken))
        .send({ gameId: game2Id, quantity: 1 }); // 29.99 * 1 = 29.99
      // Expected total: 69.97

      const response = await request(app)
        .get('/api/cart')
        .set(getAuthHeaders(userToken));

      expect(Number(response.body.data.total)).toBeCloseTo(69.97, 2);
    });
  });
});
