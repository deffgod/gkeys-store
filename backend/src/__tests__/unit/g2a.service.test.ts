import { describe, it, expect, vi } from 'vitest';

// Mock prisma
vi.mock('../../config/database', () => ({
  default: {
    game: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    orderItem: {
      groupBy: vi.fn(),
    },
  },
}));

import { applyMarkup } from '../../services/g2a.service';

describe('G2A Service', () => {
  describe('applyMarkup', () => {
    it('should apply 2% markup to price', () => {
      expect(applyMarkup(100)).toBe(102);
    });

    it('should handle decimal prices', () => {
      expect(applyMarkup(49.99)).toBe(50.99); // 49.99 * 1.02 = 50.9898, rounded to 50.99
    });

    it('should handle small prices', () => {
      expect(applyMarkup(1)).toBe(1.02);
    });

    it('should handle zero price', () => {
      expect(applyMarkup(0)).toBe(0);
    });

    it('should return number with max 2 decimal places', () => {
      const result = applyMarkup(33.33);
      const decimalPlaces = (result.toString().split('.')[1] || '').length;
      expect(decimalPlaces).toBeLessThanOrEqual(2);
    });
  });
});
