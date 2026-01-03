/**
 * Cart Test Helpers
 * 
 * Provides utilities for cart operations in tests.
 */

import { addToCart, getCart, updateCartItem, removeFromCart, clearCart } from '../../src/services/cart.service.js';
import { expect } from 'vitest';

/**
 * Add item to cart (helper wrapper)
 */
export async function addItemToCart(
  userId: string | undefined,
  gameId: string,
  quantity: number,
  sessionId?: string
): Promise<void> {
  await addToCart(gameId, quantity, userId, sessionId);
}

/**
 * Get cart items (helper wrapper)
 */
export async function getCartItems(
  userId?: string,
  sessionId?: string
): Promise<Array<{ gameId: string; quantity: number }>> {
  const cart = await getCart(userId, sessionId);
  return cart.items;
}

/**
 * Clear cart items (helper wrapper)
 */
export async function clearCartItems(
  userId?: string,
  sessionId?: string
): Promise<void> {
  await clearCart(userId, sessionId);
}

/**
 * Verify cart total matches expected value
 */
export async function verifyCartTotal(
  userId: string | undefined,
  expectedTotal: number,
  sessionId?: string
): Promise<void> {
  const cart = await getCart(userId, sessionId);
  const actualTotal = Number(cart.total);
  expect(actualTotal).toBeCloseTo(expectedTotal, 2);
}
