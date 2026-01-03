/**
 * Integration Tests: Complete E-commerce Flows
 * 
 * Tests complete user flows from browsing to order completion.
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
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
import {
  addToCart,
  getCart,
} from '../../src/services/cart.service.js';
import {
  addToWishlist,
  getWishlist,
} from '../../src/services/wishlist.service.js';
import { createOrder } from '../../src/services/order.service.js';
import { CreateOrderRequest } from '../../src/types/order.js';

// Mock G2A and email services
vi.mock('../../src/services/g2a.service.js', () => ({
  validateGameStock: vi.fn().mockResolvedValue({ available: true, stock: 10 }),
  purchaseGameKey: vi.fn().mockResolvedValue({ key: 'TEST-KEY-123' }),
}));

vi.mock('../../src/services/email.service.js', () => ({
  sendGameKeyEmail: vi.fn().mockResolvedValue(undefined),
}));

describe('Complete E-commerce Flows', () => {
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

  it('should complete flow: browse → add to cart → checkout → create order', async () => {
    // Step 1: Add items to cart
    await addToCart(gameId, 1, userId);
    await addToCart(game2Id, 2, userId);

    // Step 2: Verify cart
    const cart = await getCart(userId);
    expect(cart.items).toHaveLength(2);

    // Step 3: Create order
    const orderData: CreateOrderRequest = {
      items: cart.items.map((item) => ({
        gameId: item.gameId,
        quantity: item.quantity,
      })),
    };

    const order = await createOrder(userId, orderData);

    expect(order).toBeDefined();
    expect(order.userId).toBe(userId);
    expect(order.items).toHaveLength(2);
  });

  it('should complete flow: browse → add to wishlist → add to cart from wishlist → checkout', async () => {
    // Step 1: Add to wishlist
    await addToWishlist(gameId, userId);

    // Step 2: Verify wishlist
    const wishlist = await getWishlist(userId);
    expect(wishlist.items).toHaveLength(1);

    // Step 3: Add to cart from wishlist
    await addToCart(gameId, 1, userId);

    // Step 4: Verify cart
    const cart = await getCart(userId);
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].gameId).toBe(gameId);

    // Step 5: Create order
    const orderData: CreateOrderRequest = {
      items: [{ gameId, quantity: 1 }],
    };

    const order = await createOrder(userId, orderData);
    expect(order).toBeDefined();
  });

  it('should complete guest flow: add to cart → login → cart migrated → checkout', async () => {
    const sessionId = `test-session-${Date.now()}`;
    const newUser = await createTestUser({ balance: 100.0 });
    const newUserToken = authenticateUser(newUser);

    // Step 1: Add to cart as guest
    await addToCart(gameId, 2, undefined, sessionId);

    // Step 2: Verify guest cart
    const guestCart = await getCart(undefined, sessionId);
    expect(guestCart.items).toHaveLength(1);

    // Step 3: Migrate cart (simulate login)
    const { migrateSessionCartToUser } = await import('../../src/services/cart.service.js');
    await migrateSessionCartToUser(sessionId, newUser.id);

    // Step 4: Verify cart migrated
    const userCart = await getCart(newUser.id);
    expect(userCart.items).toHaveLength(1);
    expect(userCart.items[0].quantity).toBe(2);

    // Step 5: Create order
    const orderData: CreateOrderRequest = {
      items: [{ gameId, quantity: 2 }],
    };

    const order = await createOrder(newUser.id, orderData);
    expect(order).toBeDefined();

    await cleanupTestUser(newUser.id);
  });

  it('should complete guest flow: add to wishlist → login → wishlist migrated', async () => {
    const sessionId = `test-session-${Date.now()}`;
    const newUser = await createTestUser();
    const newUserToken = authenticateUser(newUser);

    // Step 1: Add to wishlist as guest
    await addToWishlist(gameId, undefined, sessionId);

    // Step 2: Verify guest wishlist
    const guestWishlist = await getWishlist(undefined, sessionId);
    expect(guestWishlist.items).toHaveLength(1);

    // Step 3: Migrate wishlist (simulate login)
    const { migrateSessionWishlistToUser } = await import('../../src/services/wishlist.service.js');
    await migrateSessionWishlistToUser(sessionId, newUser.id);

    // Step 4: Verify wishlist migrated
    const userWishlist = await getWishlist(newUser.id);
    expect(userWishlist.items).toHaveLength(1);
    expect(userWishlist.items[0].gameId).toBe(gameId);

    await cleanupTestUser(newUser.id);
  });

  it('should complete promo code flow: apply code → verify discount → create order', async () => {
    const promoCode = await createTestPromoCode({ discount: 10, active: true });

    // Step 1: Add to cart
    await addToCart(gameId, 1, userId);

    // Step 2: Create order with promo code
    const orderData: CreateOrderRequest = {
      items: [{ gameId, quantity: 1 }],
      promoCode: promoCode.code,
    };

    const order = await createOrder(userId, orderData);

    expect(order).toBeDefined();
    expect(order.promoCode).toBe(promoCode.code);
    expect(Number(order.discount)).toBeGreaterThan(0);
    expect(Number(order.total)).toBeLessThan(19.99);
  });

  it('should handle error flow: out-of-stock game → error message → order not created', async () => {
    const outOfStockGame = await createTestGame({ price: 19.99, inStock: false });

    // Step 1: Try to create order with out-of-stock game
    const orderData: CreateOrderRequest = {
      items: [{ gameId: outOfStockGame.id, quantity: 1 }],
    };

    // Step 2: Verify error
    await expect(createOrder(userId, orderData)).rejects.toThrow();

    await cleanupTestGame(outOfStockGame.id);
  });

  it('should handle error flow: insufficient balance → error message → order not created', async () => {
    const poorUser = await createTestUser({ balance: 5.0 });
    const expensiveGame = await createTestGame({ price: 50.0, inStock: true });

    // Step 1: Try to create order with insufficient balance
    const orderData: CreateOrderRequest = {
      items: [{ gameId: expensiveGame.id, quantity: 1 }],
    };

    // Step 2: Verify error
    await expect(createOrder(poorUser.id, orderData)).rejects.toThrow();

    await cleanupTestUser(poorUser.id);
    await cleanupTestGame(expensiveGame.id);
  });
});
