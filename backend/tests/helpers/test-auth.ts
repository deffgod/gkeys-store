/**
 * Authentication Test Helpers
 * 
 * Provides utilities for authentication in tests.
 */

import { generateAccessToken, TokenPayload } from '../../src/utils/jwt.js';
import type { User } from '@prisma/client';

/**
 * Generate JWT token for a test user
 */
export function authenticateUser(user: User): string {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  return generateAccessToken(payload);
}

/**
 * Create a test session (for guest user testing)
 * Note: In the current implementation, sessions use sessionId as userId
 * This is a temporary workaround until schema supports sessionId
 */
export function createTestSession(sessionId: string): string {
  // Return the sessionId - it will be used as userId in cart/wishlist operations
  return sessionId;
}

/**
 * Get authorization headers for API requests
 */
export function getAuthHeaders(token: string): { Authorization: string } {
  return {
    Authorization: `Bearer ${token}`,
  };
}
