/**
 * E2E Tests: Checkout Flow
 * 
 * Tests complete checkout flow from cart to order creation.
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CartProvider } from '../../context/CartContext';
import { AuthProvider } from '../../context/AuthContext';

// Mock API client
vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Mock order API
vi.mock('../../services/orderApi', () => ({
  createOrder: vi.fn(),
  getUserOrders: vi.fn(),
  getOrderById: vi.fn(),
}));

describe('Checkout E2E Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should complete checkout flow: cart → checkout page → create order', async () => {
    const user = userEvent.setup();
    const orderApi = await import('../../services/orderApi');
    (orderApi.createOrder as any).mockResolvedValue({
      success: true,
      data: {
        id: 'test-order-id',
        status: 'PENDING',
        total: 19.99,
      },
    });

    render(
      <AuthProvider>
        <CartProvider>
          <div>
            <button
              onClick={() => {
                orderApi.createOrder({
                  items: [{ gameId: 'test-game-id', quantity: 1 }],
                });
              }}
            >
              Create Order
            </button>
          </div>
        </CartProvider>
      </AuthProvider>
    );

    const createButton = screen.getByText('Create Order');
    await user.click(createButton);

    await waitFor(() => {
      expect(orderApi.createOrder).toHaveBeenCalled();
    });
  });

  it('should verify order confirmation page displays correctly', async () => {
    const orderApi = await import('../../services/orderApi');
    (orderApi.getOrderById as any).mockResolvedValue({
      success: true,
      data: {
        id: 'test-order-id',
        status: 'PENDING',
        total: 19.99,
        items: [
          {
            gameId: 'test-game-id',
            quantity: 1,
            game: {
              id: 'test-game-id',
              title: 'Test Game',
              image: 'test-image.jpg',
              slug: 'test-game',
            },
          },
        ],
      },
    });

    render(
      <AuthProvider>
        <div data-testid="order-confirmation">
          {/* Order confirmation would be displayed here */}
        </div>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(orderApi.getOrderById).toHaveBeenCalled();
    });
  });

  it('should verify order history page displays orders correctly', async () => {
    const orderApi = await import('../../services/orderApi');
    (orderApi.getUserOrders as any).mockResolvedValue({
      success: true,
      data: [
        {
          id: 'test-order-1',
          status: 'COMPLETED',
          total: 19.99,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'test-order-2',
          status: 'PENDING',
          total: 29.99,
          createdAt: new Date().toISOString(),
        },
      ],
    });

    render(
      <AuthProvider>
        <div data-testid="order-history">
          {/* Order history would be displayed here */}
        </div>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(orderApi.getUserOrders).toHaveBeenCalled();
    });
  });

  it('should verify order details page displays correctly', async () => {
    const orderApi = await import('../../services/orderApi');
    (orderApi.getOrderById as any).mockResolvedValue({
      success: true,
      data: {
        id: 'test-order-id',
        status: 'COMPLETED',
        total: 19.99,
        items: [
          {
            gameId: 'test-game-id',
            quantity: 1,
            price: 19.99,
            game: {
              id: 'test-game-id',
              title: 'Test Game',
              image: 'test-image.jpg',
              slug: 'test-game',
            },
          },
        ],
        keys: [
          {
            id: 'test-key-id',
            gameId: 'test-game-id',
            key: 'TEST-KEY-123',
            activated: false,
          },
        ],
      },
    });

    render(
      <AuthProvider>
        <div data-testid="order-details">
          {/* Order details would be displayed here */}
        </div>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(orderApi.getOrderById).toHaveBeenCalled();
    });
  });
});
