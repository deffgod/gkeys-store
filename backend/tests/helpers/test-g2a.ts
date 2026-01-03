/**
 * G2A Service Mocking Helpers
 * 
 * Provides utilities for mocking G2A API calls in tests.
 * 
 * Usage in tests:
 * ```typescript
 * import { vi } from 'vitest';
 * import * as g2aService from '../../src/services/g2a.service.js';
 * 
 * vi.mock('../../src/services/g2a.service.js', () => ({
 *   validateGameStock: vi.fn(),
 *   purchaseGameKey: vi.fn(),
 * }));
 * 
 * // Then in test:
 * (g2aService.validateGameStock as any).mockResolvedValue({ available: true, stock: 10 });
 * ```
 */

import { vi } from 'vitest';

/**
 * Setup G2A service mocks
 * This should be called at the top of test files that need G2A mocking
 * 
 * Example:
 * ```typescript
 * vi.mock('../../src/services/g2a.service.js', () => ({
 *   validateGameStock: vi.fn(),
 *   purchaseGameKey: vi.fn(),
 * }));
 * ```
 */
export function setupG2AMocks(): void {
  // Note: Actual mocking should be done with vi.mock() at the top of test files
  // This function is a placeholder for documentation
  // In actual tests, use:
  // vi.mock('../../src/services/g2a.service.js', () => ({
  //   validateGameStock: vi.fn(),
  //   purchaseGameKey: vi.fn(),
  // }));
}

/**
 * Mock successful stock validation
 * Use this helper after importing the mocked module
 * 
 * Example:
 * ```typescript
 * import * as g2aService from '../../src/services/g2a.service.js';
 * mockG2AStockAvailable(g2aService, 10);
 * ```
 */
export function mockG2AStockAvailable(
  g2aService: any,
  stock: number = 10
): void {
  if (g2aService.validateGameStock) {
    g2aService.validateGameStock.mockResolvedValue({
      available: true,
      stock,
    });
  }
}

/**
 * Mock out-of-stock response
 */
export function mockG2AStockUnavailable(g2aService: any): void {
  if (g2aService.validateGameStock) {
    g2aService.validateGameStock.mockResolvedValue({
      available: false,
      stock: 0,
    });
  }
}

/**
 * Mock successful key purchase
 */
export function mockG2AKeyPurchase(
  g2aService: any,
  key: string = 'TEST-KEY-123'
): void {
  if (g2aService.purchaseGameKey) {
    g2aService.purchaseGameKey.mockResolvedValue({
      key,
      success: true,
    });
  }
}

/**
 * Mock G2A API error
 */
export function mockG2AAPIError(
  g2aService: any,
  errorMessage: string = 'G2A API error'
): void {
  if (g2aService.validateGameStock) {
    g2aService.validateGameStock.mockRejectedValue(new Error(errorMessage));
  }
  if (g2aService.purchaseGameKey) {
    g2aService.purchaseGameKey.mockRejectedValue(new Error(errorMessage));
  }
}

/**
 * Reset all G2A mocks
 */
export function resetG2AMocks(g2aService: any): void {
  if (g2aService.validateGameStock) {
    g2aService.validateGameStock.mockReset();
  }
  if (g2aService.purchaseGameKey) {
    g2aService.purchaseGameKey.mockReset();
  }
}
