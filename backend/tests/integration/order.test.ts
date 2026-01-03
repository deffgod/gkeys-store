/**
 * Integration Tests: Order API
 * 
 * Tests order API endpoints with real Express app and database.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import app from '../../src/index.js';
import {
  createTestUser,
  createTestGame,
  createTestPromoCode,
  cleanupTestUser,
  cleanupTestGame,
} from '../helpers/test-db.js';
import { authenticateUser, getAuthHeaders } from '../helpers/test-auth.js';

// Mock G2A service
vi.mock('../../src/services/g2a.service.js', () => ({
  validateGameStock: vi.fn().mockResolvedValue({ available: true, stock: 10 }),
  purchaseGameKey: vi.fn().mockResolvedValue({ key: 'TEST-KEY-123' }),
}));

// Mock email service
vi.mock('../../src/services/email.service.js', () => ({
  sendGameKeyEmail: vi.fn().mockResolvedValue(undefined),
}));

describe('Order API Integration Tests', () => {
  let userToken: string;
  let userId: string;
  let gameId: string;
  let game2Id: string;

  beforeAll(async () => {
    const user = await createTestUser({ balance: 100.0 });
    const game = await createTestGame({ price: 19.99, inStock: true });
    const game2 = await createTestGame({ price: 29.99, inStock: true });

    userId = user.id;
    gameId = game.id;
    game2Id = game2.id;
    userToken = authenticateUser(user);
  });

  afterAll(async () => {
    await cleanupTestUser(userId);
    await cleanupTestGame(gameId);
    await cleanupTestGame(game2Id);
  });

  describe('POST /api/orders', () => {
    it('should create order with single item', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set(getAuthHeaders(userToken))
        .send({
          items: [{ gameId, quantity: 1 }],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.userId).toBe(userId);
      expect(response.body.data.status).toBe('PENDING');
      expect(response.body.data.items).toHaveLength(1);
      expect(Number(response.body.data.total)).toBeCloseTo(19.99, 2);
    });

    it('should create order with multiple items', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set(getAuthHeaders(userToken))
        .send({
          items: [
            { gameId, quantity: 2 },
            { gameId: game2Id, quantity: 1 },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(2);
      // Total: 19.99 * 2 + 29.99 * 1 = 69.97
      expect(Number(response.body.data.total)).toBeCloseTo(69.97, 2);
    });

    it('should create order with promo code', async () => {
      const promoCode = await createTestPromoCode({ discount: 10, active: true });

      const response = await request(app)
        .post('/api/orders')
        .set(getAuthHeaders(userToken))
        .send({
          items: [{ gameId, quantity: 1 }],
          promoCode: promoCode.code,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.promoCode).toBe(promoCode.code);
      expect(Number(response.body.data.discount)).toBeGreaterThan(0);
      expect(Number(response.body.data.total)).toBeLessThan(19.99);
    });

    it('should return 400 when game is out of stock', async () => {
      const outOfStockGame = await createTestGame({ price: 19.99, inStock: false });

      const response = await request(app)
        .post('/api/orders')
        .set(getAuthHeaders(userToken))
        .send({
          items: [{ gameId: outOfStockGame.id, quantity: 1 }],
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);

      await cleanupTestGame(outOfStockGame.id);
    });

    it('should return 400 when user has insufficient balance', async () => {
      const poorUser = await createTestUser({ balance: 10.0 });
      const expensiveGame = await createTestGame({ price: 50.0, inStock: true });
      const poorUserToken = authenticateUser(poorUser);

      const response = await request(app)
        .post('/api/orders')
        .set(getAuthHeaders(poorUserToken))
        .send({
          items: [{ gameId: expensiveGame.id, quantity: 1 }],
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('balance');

      await cleanupTestUser(poorUser.id);
      await cleanupTestGame(expensiveGame.id);
    });

    it('should return 400 when promo code is invalid', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set(getAuthHeaders(userToken))
        .send({
          items: [{ gameId, quantity: 1 }],
          promoCode: 'INVALID-CODE',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .post('/api/orders')
        .send({
          items: [{ gameId, quantity: 1 }],
        });

      expect(response.status).toBe(401);
    });

    it('should complete order creation in under 30 seconds (SC-006)', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .post('/api/orders')
        .set(getAuthHeaders(userToken))
        .send({
          items: [{ gameId, quantity: 1 }],
        });

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(30000);
      expect(response.status).toBe(201);
    });

    it('should prevent out-of-stock purchases 100% of the time (SC-008)', async () => {
      const outOfStockGame = await createTestGame({ price: 19.99, inStock: false });

      const response = await request(app)
        .post('/api/orders')
        .set(getAuthHeaders(userToken))
        .send({
          items: [{ gameId: outOfStockGame.id, quantity: 1 }],
        });

      // Should always fail
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);

      await cleanupTestGame(outOfStockGame.id);
    });

    it('should prevent insufficient fund purchases 100% of the time (SC-009)', async () => {
      const poorUser = await createTestUser({ balance: 5.0 });
      const expensiveGame = await createTestGame({ price: 50.0, inStock: true });
      const poorUserToken = authenticateUser(poorUser);

      const response = await request(app)
        .post('/api/orders')
        .set(getAuthHeaders(poorUserToken))
        .send({
          items: [{ gameId: expensiveGame.id, quantity: 1 }],
        });

      // Should always fail
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);

      await cleanupTestUser(poorUser.id);
      await cleanupTestGame(expensiveGame.id);
    });
  });

  describe('GET /api/orders', () => {
    it('should retrieve user order history', async () => {
      // Create an order first
      await request(app)
        .post('/api/orders')
        .set(getAuthHeaders(userToken))
        .send({
          items: [{ gameId, quantity: 1 }],
        });

      const response = await request(app)
        .get('/api/orders')
        .set(getAuthHeaders(userToken));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should filter orders by status', async () => {
      const response = await request(app)
        .get('/api/orders?status=PENDING')
        .set(getAuthHeaders(userToken));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/orders/:id', () => {
    it('should retrieve individual order details', async () => {
      // Create an order first
      const createResponse = await request(app)
        .post('/api/orders')
        .set(getAuthHeaders(userToken))
        .send({
          items: [{ gameId, quantity: 1 }],
        });

      const orderId = createResponse.body.data.id;

      const response = await request(app)
        .get(`/api/orders/${orderId}`)
        .set(getAuthHeaders(userToken));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(orderId);
      expect(response.body.data.userId).toBe(userId);
    });

    it('should return 403 when retrieving another user order', async () => {
      const otherUser = await createTestUser();
      const otherUserToken = authenticateUser(otherUser);

      // Create order for other user
      const createResponse = await request(app)
        .post('/api/orders')
        .set(getAuthHeaders(otherUserToken))
        .send({
          items: [{ gameId, quantity: 1 }],
        });

      const orderId = createResponse.body.data.id;

      // Try to get other user's order
      const response = await request(app)
        .get(`/api/orders/${orderId}`)
        .set(getAuthHeaders(userToken));

      expect(response.status).toBe(403);

      await cleanupTestUser(otherUser.id);
    });
  });
});
