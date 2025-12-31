import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock prisma
vi.mock('../../config/database', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    transaction: {
      create: vi.fn(),
    },
    promoCode: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock email service
vi.mock('../../services/email.service', () => ({
  sendBalanceTopUpEmail: vi.fn(),
}));

import { convertCurrency, createBalanceTopUpIntent } from '../../services/payment.service';

describe('Payment Service', () => {
  describe('convertCurrency', () => {
    it('should return same amount for same currency', () => {
      expect(convertCurrency(100, 'EUR', 'EUR')).toBe(100);
    });

    it('should convert EUR to PLN correctly', () => {
      const result = convertCurrency(100, 'EUR', 'PLN');
      expect(result).toBeGreaterThan(100); // PLN is weaker than EUR
    });

    it('should convert EUR to USD correctly', () => {
      const result = convertCurrency(100, 'EUR', 'USD');
      expect(result).toBe(110); // EUR to USD at 1.1 rate
    });

    it('should convert PLN to EUR correctly', () => {
      const result = convertCurrency(430, 'PLN', 'EUR');
      expect(result).toBe(100); // PLN to EUR at 4.3 rate
    });
  });

  describe('createBalanceTopUpIntent', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should throw error for amount <= 0', async () => {
      await expect(
        createBalanceTopUpIntent('user-1', {
          amount: 0,
          currency: 'EUR',
          paymentMethod: 'stripe',
        })
      ).rejects.toThrow('Amount must be greater than 0');
    });

    it('should throw error for negative amount', async () => {
      await expect(
        createBalanceTopUpIntent('user-1', {
          amount: -10,
          currency: 'EUR',
          paymentMethod: 'stripe',
        })
      ).rejects.toThrow('Amount must be greater than 0');
    });

    it('should create payment intent with correct structure', async () => {
      const result = await createBalanceTopUpIntent('user-1', {
        amount: 50,
        currency: 'EUR',
        paymentMethod: 'stripe',
      });

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('amount');
      expect(result).toHaveProperty('currency');
      expect(result).toHaveProperty('redirectUrl');
      expect(result.status).toBe('pending');
    });

    it('should generate unique intent IDs', async () => {
      const result1 = await createBalanceTopUpIntent('user-1', {
        amount: 50,
        currency: 'EUR',
        paymentMethod: 'stripe',
      });

      const result2 = await createBalanceTopUpIntent('user-1', {
        amount: 50,
        currency: 'EUR',
        paymentMethod: 'stripe',
      });

      expect(result1.id).not.toBe(result2.id);
    });
  });
});
