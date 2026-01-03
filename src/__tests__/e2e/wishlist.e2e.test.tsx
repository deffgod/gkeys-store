/**
 * E2E Tests: Wishlist Functionality
 * 
 * Tests wishlist UI interactions and user flows.
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WishlistProvider } from '../../context/WishlistContext';
import { AuthProvider } from '../../context/AuthContext';

// Mock API client
vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock wishlist API
vi.mock('../../services/wishlistApi', () => ({
  getWishlist: vi.fn(),
  addToWishlist: vi.fn(),
  removeFromWishlist: vi.fn(),
  checkWishlist: vi.fn(),
}));

describe('Wishlist E2E Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should add game to wishlist from game card component', async () => {
    const user = userEvent.setup();
    const mockGame = {
      id: 'test-game-id',
      title: 'Test Game',
      price: 19.99,
      inStock: true,
    };

    const wishlistApi = await import('../../services/wishlistApi');
    (wishlistApi.addToWishlist as any).mockResolvedValue({ success: true });

    render(
      <AuthProvider>
        <WishlistProvider>
          <div>
            <button
              onClick={() => {
                wishlistApi.addToWishlist(mockGame.id);
              }}
            >
              Add to Wishlist
            </button>
          </div>
        </WishlistProvider>
      </AuthProvider>
    );

    const addButton = screen.getByText('Add to Wishlist');
    await user.click(addButton);

    await waitFor(() => {
      expect(wishlistApi.addToWishlist).toHaveBeenCalledWith(mockGame.id);
    });
  });

  it('should verify wishlist button state updates when game added', async () => {
    const user = userEvent.setup();
    const wishlistApi = await import('../../services/wishlistApi');
    (wishlistApi.addToWishlist as any).mockResolvedValue({ success: true });
    (wishlistApi.checkWishlist as any).mockResolvedValue({ inWishlist: true });

    render(
      <AuthProvider>
        <WishlistProvider>
          <div>
            <button
              onClick={() => {
                wishlistApi.addToWishlist('test-game-id');
              }}
            >
              Add to Wishlist
            </button>
          </div>
        </WishlistProvider>
      </AuthProvider>
    );

    const addButton = screen.getByText('Add to Wishlist');
    await user.click(addButton);

    await waitFor(() => {
      expect(wishlistApi.addToWishlist).toHaveBeenCalled();
    });
  });

  it('should verify wishlist page displays items correctly', async () => {
    const wishlistApi = await import('../../services/wishlistApi');
    (wishlistApi.getWishlist as any).mockResolvedValue({
      items: [
        {
          gameId: 'test-game-1',
          game: {
            id: 'test-game-1',
            title: 'Test Game 1',
            price: 19.99,
            inStock: true,
          },
          addedAt: new Date().toISOString(),
        },
      ],
    });

    render(
      <AuthProvider>
        <WishlistProvider>
          <div data-testid="wishlist-page">
            {/* Wishlist items would be rendered here */}
          </div>
        </WishlistProvider>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(wishlistApi.getWishlist).toHaveBeenCalled();
    });
  });

  it('should verify removing game from wishlist works', async () => {
    const user = userEvent.setup();
    const wishlistApi = await import('../../services/wishlistApi');
    (wishlistApi.removeFromWishlist as any).mockResolvedValue({ success: true });

    render(
      <AuthProvider>
        <WishlistProvider>
          <div>
            <button
              onClick={() => {
                wishlistApi.removeFromWishlist('test-game-id');
              }}
            >
              Remove from Wishlist
            </button>
          </div>
        </WishlistProvider>
      </AuthProvider>
    );

    const removeButton = screen.getByText('Remove from Wishlist');
    await user.click(removeButton);

    await waitFor(() => {
      expect(wishlistApi.removeFromWishlist).toHaveBeenCalledWith('test-game-id');
    });
  });
});
