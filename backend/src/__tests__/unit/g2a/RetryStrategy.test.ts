/**
 * Unit tests for RetryStrategy
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RetryStrategy } from '../../../lib/g2a/resilience/RetryStrategy.js';
import { G2AError, G2AErrorCode } from '../../../lib/g2a/errors/G2AError.js';
import { createLogger } from '../../../lib/g2a/utils/logger.js';

describe('RetryStrategy', () => {
  let retryStrategy: RetryStrategy;
  const logger = createLogger('error', true);

  beforeEach(() => {
    retryStrategy = new RetryStrategy(
      {
        maxRetries: 3,
        initialDelayMs: 100,
        maxDelayMs: 1000,
        backoffMultiplier: 2,
        jitter: false, // Disable jitter for predictable tests
      },
      logger
    );
  });

  describe('Retry Logic', () => {
    it('should retry on retryable errors', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new G2AError(G2AErrorCode.G2A_TIMEOUT, 'Timeout'))
        .mockRejectedValueOnce(new G2AError(G2AErrorCode.G2A_TIMEOUT, 'Timeout'))
        .mockResolvedValueOnce('Success');

      const result = await retryStrategy.execute(fn, 'testOp');

      expect(result).toBe('Success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retryable errors', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new G2AError(G2AErrorCode.G2A_AUTH_FAILED, 'Auth failed'));

      await expect(retryStrategy.execute(fn, 'testOp')).rejects.toThrow('Auth failed');

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should respect max retries', async () => {
      const fn = vi.fn().mockRejectedValue(new G2AError(G2AErrorCode.G2A_TIMEOUT, 'Timeout'));

      await expect(retryStrategy.execute(fn, 'testOp')).rejects.toThrow('Timeout');

      // Initial attempt + 3 retries = 4 total
      expect(fn).toHaveBeenCalledTimes(4);
    });
  });

  describe('Error Policies', () => {
    it('should apply different policies for different errors', () => {
      const timeoutError = new G2AError(G2AErrorCode.G2A_TIMEOUT, 'Timeout');
      const authError = new G2AError(G2AErrorCode.G2A_AUTH_FAILED, 'Auth failed');

      expect(retryStrategy.shouldRetry(timeoutError, 0)).toBe(true);
      expect(retryStrategy.shouldRetry(authError, 0)).toBe(false);
    });
  });
});
