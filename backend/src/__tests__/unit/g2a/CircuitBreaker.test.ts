/**
 * Unit tests for CircuitBreaker
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CircuitBreaker, CircuitState } from '../../../lib/g2a/resilience/CircuitBreaker.js';

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker(
      true, // enabled
      3, // failureThreshold
      1000, // failureWindowMs
      500, // resetTimeoutMs
      1 // halfOpenSuccessThreshold
    );
  });

  describe('State Transitions', () => {
    it('should start in CLOSED state', () => {
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should transition to OPEN after failure threshold', async () => {
      const failingFn = vi.fn().mockRejectedValue(new Error('Failure'));

      // Trigger failures
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingFn, 'testOp');
        } catch {
          // Expected failure
        }
      }

      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
    });

    it('should reject requests when OPEN', async () => {
      const failingFn = vi.fn().mockRejectedValue(new Error('Failure'));

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingFn, 'testOp');
        } catch {
          // Expected failure to open circuit
        }
      }

      // Should now reject without calling function
      await expect(circuitBreaker.execute(vi.fn(), 'testOp')).rejects.toThrow(
        'Circuit breaker is open'
      );
    });

    it('should transition to HALF_OPEN after reset timeout', async () => {
      const failingFn = vi.fn().mockRejectedValue(new Error('Failure'));

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingFn, 'testOp');
        } catch {
          // Expected failure to open circuit
        }
      }

      // Wait for reset timeout
      await new Promise((resolve) => setTimeout(resolve, 600));

      expect(circuitBreaker.getState()).toBe(CircuitState.HALF_OPEN);
    });

    it('should close circuit after successful requests in HALF_OPEN', async () => {
      const failingFn = vi.fn().mockRejectedValue(new Error('Failure'));
      const successFn = vi.fn().mockResolvedValue('Success');

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingFn, 'testOp');
        } catch {
          // Expected failure to open circuit
        }
      }

      // Wait for reset timeout
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Successful request should close circuit
      await circuitBreaker.execute(successFn, 'testOp');

      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
    });
  });

  describe('Statistics', () => {
    it('should track failures and successes', async () => {
      const successFn = vi.fn().mockResolvedValue('Success');
      const failingFn = vi.fn().mockRejectedValue(new Error('Failure'));

      await circuitBreaker.execute(successFn, 'testOp');
      try {
        await circuitBreaker.execute(failingFn, 'testOp');
      } catch {
        // Expected failure
      }

      const stats = circuitBreaker.getStats();
      expect(stats.successes).toBe(1);
      expect(stats.failures).toBe(1);
    });
  });
});
