/**
 * Unit tests for BatchOperations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BatchOperations } from '../../../lib/g2a/batch/BatchOperations.js';
import { createLogger } from '../../../lib/g2a/utils/logger.js';

describe('BatchOperations', () => {
  let batchOperations: BatchOperations;
  const logger = createLogger('error', true);

  beforeEach(() => {
    batchOperations = new BatchOperations(logger, {
      chunkSize: 3,
      maxConcurrency: 2,
      continueOnError: true,
    });
  });

  describe('Batch Processing', () => {
    it('should process all items successfully', async () => {
      const items = [1, 2, 3, 4, 5];
      const processor = vi.fn(async (item: number) => item * 2);

      const result = await batchOperations.execute(items, processor, 'test');

      expect(result.successCount).toBe(5);
      expect(result.failureCount).toBe(0);
      expect(result.success).toEqual([2, 4, 6, 8, 10]);
      expect(processor).toHaveBeenCalledTimes(5);
    });

    it('should handle failures and continue', async () => {
      const items = [1, 2, 3, 4, 5];
      const processor = vi.fn(async (item: number) => {
        if (item === 3) throw new Error('Failed on 3');
        return item * 2;
      });

      const result = await batchOperations.execute(items, processor, 'test');

      expect(result.successCount).toBe(4);
      expect(result.failureCount).toBe(1);
      expect(result.failures[0].index).toBe(2);
    });

    it('should respect chunk size', async () => {
      const items = [1, 2, 3, 4, 5, 6, 7];
      const processor = vi.fn(async (item: number) => item);

      await batchOperations.execute(items, processor, 'test');

      // With chunk size 3, we expect: [1,2,3], [4,5,6], [7]
      // All should be processed
      expect(processor).toHaveBeenCalledTimes(7);
    });
  });

  describe('Strict Mode', () => {
    it('should throw on partial failure', async () => {
      const items = [1, 2, 3];
      const processor = vi.fn(async (item: number) => {
        if (item === 2) throw new Error('Failed');
        return item;
      });

      await expect(batchOperations.executeStrict(items, processor, 'test'))
        .rejects.toThrow('Batch operation partially failed');
    });

    it('should return results if all succeed', async () => {
      const items = [1, 2, 3];
      const processor = vi.fn(async (item: number) => item * 2);

      const result = await batchOperations.executeStrict(items, processor, 'test');

      expect(result).toEqual([2, 4, 6]);
    });
  });
});
