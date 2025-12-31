/**
 * Unit tests for RateLimiter
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RateLimiter } from '../../../lib/g2a/resilience/RateLimiter.js';

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter(
      true, // enabled
      5, // globalRequestsPerSecond
      10, // globalBurstSize
      {} // no endpoint-specific limits
    );
  });

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      const canProceed = await rateLimiter.checkLimit('/test');
      expect(canProceed).toBe(true);
    });

    it('should block requests exceeding burst size', async () => {
      // Exhaust burst size
      for (let i = 0; i < 10; i++) {
        await rateLimiter.checkLimit('/test');
      }

      // Next request should be blocked
      const canProceed = await rateLimiter.checkLimit('/test');
      expect(canProceed).toBe(false);
    });

    it('should refill tokens over time', async () => {
      // Exhaust burst size
      for (let i = 0; i < 10; i++) {
        await rateLimiter.checkLimit('/test');
      }

      // Wait for token refill (1 second = 5 tokens at 5 req/s)
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Should be able to make requests again
      const canProceed = await rateLimiter.checkLimit('/test');
      expect(canProceed).toBe(true);
    });

    it('should track remaining tokens', () => {
      const initial = rateLimiter.getRemainingTokens();
      expect(initial).toBe(10); // Initial burst size

      rateLimiter.checkLimit('/test');

      const after = rateLimiter.getRemainingTokens();
      expect(after).toBe(9);
    });
  });

  describe('Endpoint-Specific Limits', () => {
    it('should apply endpoint-specific rate limits', async () => {
      rateLimiter = new RateLimiter(true, 10, 20, {
        '/restricted': { requestsPerSecond: 1, burstSize: 2 },
      });

      // Exhaust endpoint-specific burst
      await rateLimiter.checkLimit('/restricted');
      await rateLimiter.checkLimit('/restricted');

      const canProceed = await rateLimiter.checkLimit('/restricted');
      expect(canProceed).toBe(false);
    });
  });
});
