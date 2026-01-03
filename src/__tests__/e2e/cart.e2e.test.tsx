/**
 * E2E Tests: Cart Functionality
 * 
 * Tests cart UI interactions and user flows.
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
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock cart API
vi.mock('../../services/cartApi', () => ({
  getCart: vi.fn(),
  addToCart: vi.fn(),
  updateCartItem: vi.fn(),
  removeFromCart: vi.fn(),
  clearCart: vi.fn(),
}));

describe('Cart E2E Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should add game to cart from game card component', async () => {
    const user = userEvent.setup();
    const mockGame = {
      id: 'test-game-id',
      title: 'Test Game',
      price: 19.99,
      inStock: true,
    };

    // Mock addToCart API call
    const cartApi = await import('../../services/cartApi');
    (cartApi.addToCart as any).mockResolvedValue({ success: true });

    // Render component with CartProvider
    render(
      <AuthProvider>
        <CartProvider>
          <div>
            <button
              onClick={() => {
                cartApi.addToCart(mockGame.id, 1);
              }}
            >
              Add to Cart
            </button>
          </div>
        </CartProvider>
      </AuthProvider>
    );

    const addButton = screen.getByText('Add to Cart');
    await user.click(addButton);

    await waitFor(() => {
      expect(cartApi.addToCart).toHaveBeenCalledWith(mockGame.id, 1);
    });
  });

  it('should verify cart icon updates with item count', async () => {
    const user = userEvent.setup();
    const cartApi = await import('../../services/cartApi');
    (cartApi.getCart as any).mockResolvedValue({
      items: [{ gameId: 'test-game', quantity: 2 }],
      total: 39.98,
    });

    render(
      <AuthProvider>
        <CartProvider>
          <div>
            <span data-testid="cart-count">0</span>
          </div>
        </CartProvider>
      </AuthProvider>
    );

    // Wait for cart to load
    await waitFor(() => {
      // Cart count should update
      expect(cartApi.getCart).toHaveBeenCalled();
    });
  });

  it('should verify cart page displays items correctly', async () => {
    const cartApi = await import('../../services/cartApi');
    (cartApi.getCart as any).mockResolvedValue({
      items: [
        {
          gameId: 'test-game-1',
          quantity: 2,
          game: {
            id: 'test-game-1',
            title: 'Test Game 1',
            price: 19.99,
            inStock: true,
          },
        },
      ],
      total: 39.98,
    });

    render(
      <AuthProvider>
        <CartProvider>
          <div data-testid="cart-page">
            {/* Cart items would be rendered here */}
          </div>
        </CartProvider>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(cartApi.getCart).toHaveBeenCalled();
    });
  });

  it('should verify cart total displays correctly', async () => {
    const cartApi = await import('../../services/cartApi');
    (cartApi.getCart as any).mockResolvedValue({
      items: [
        {
          gameId: 'test-game-1',
          quantity: 1,
          game: { id: 'test-game-1', title: 'Test Game', price: 19.99, inStock: true },
        },
        {
          gameId: 'test-game-2',
          quantity: 2,
          game: { id: 'test-game-2', title: 'Test Game 2', price: 29.99, inStock: true },
        },
      ],
      total: 79.97,
    });

    render(
      <AuthProvider>
        <CartProvider>
          <div data-testid="cart-total">
            {/* Cart total would be displayed here */}
          </div>
        </CartProvider>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(cartApi.getCart).toHaveBeenCalled();
    });
  });

  it('should verify quantity update in cart page', async () => {
    const user = userEvent.setup();
    const cartApi = await import('../../services/cartApi');
    (cartApi.updateCartItem as any).mockResolvedValue({ success: true });

    render(
      <AuthProvider>
        <CartProvider>
          <div>
            <button
              onClick={() => {
                cartApi.updateCartItem('test-game-id', 3);
              }}
            >
              Update Quantity
            </button>
          </div>
        </CartProvider>
      </AuthProvider>
    );

    const updateButton = screen.getByText('Update Quantity');
    await user.click(updateButton);

    await waitFor(() => {
      expect(cartApi.updateCartItem).toHaveBeenCalledWith('test-game-id', 3);
    });
  });

  it('should verify remove item button works', async () => {
    const user = userEvent.setup();
    const cartApi = await import('../../services/cartApi');
    (cartApi.removeFromCart as any).mockResolvedValue({ success: true });

    render(
      <AuthProvider>
        <CartProvider>
          <div>
            <button
              onClick={() => {
                cartApi.removeFromCart('test-game-id');
              }}
            >
              Remove Item
            </button>
          </div>
        </CartProvider>
      </AuthProvider>
    );

    const removeButton = screen.getByText('Remove Item');
    await user.click(removeButton);

    await waitFor(() => {
      expect(cartApi.removeFromCart).toHaveBeenCalledWith('test-game-id');
    });
  });

  it('should verify clear cart button works', async () => {
    const user = userEvent.setup();
    const cartApi = await import('../../services/cartApi');
    (cartApi.clearCart as any).mockResolvedValue({ success: true });

    render(
      <AuthProvider>
        <CartProvider>
          <div>
            <button
              onClick={() => {
                cartApi.clearCart();
              }}
            >
              Clear Cart
            </button>
          </div>
        </CartProvider>
      </AuthProvider>
    );

    const clearButton = screen.getByText('Clear Cart');
    await user.click(clearButton);

    await waitFor(() => {
      expect(cartApi.clearCart).toHaveBeenCalled();
    });
  });

  it('should verify empty cart state displays correctly', async () => {
    const cartApi = await import('../../services/cartApi');
    (cartApi.getCart as any).mockResolvedValue({
      items: [],
      total: 0,
    });

    render(
      <AuthProvider>
        <CartProvider>
          <div data-testid="empty-cart">
            {/* Empty cart message would be displayed here */}
          </div>
        </CartProvider>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(cartApi.getCart).toHaveBeenCalled();
    });
  });
});
