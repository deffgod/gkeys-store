import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../context/AuthContext';
import { CartItem as CartItemComponent } from '../components/cart/CartItem';
import { CheckoutSummary } from '../components/cart/CheckoutSummary';
import { gamesApi } from '../services/gamesApi';
import { orderApi } from '../services/orderApi';
import { Container } from '../components/ui/container';
import type { Game } from '../services/gamesApi';

const theme = {
  colors: {
    primary: '#00C8C2',
    background: '#0D0D0D',
    surface: '#1A1A1A',
    surfaceLight: '#2A2A2A',
    text: '#FFFFFF',
    textSecondary: '#999999',
    textMuted: '#666666',
    border: '#333333',
  },
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, loading: cartLoading, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [recommendedGames, setRecommendedGames] = useState<Game[]>([]);
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [processing, setProcessing] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Redirect if cart is empty
  useEffect(() => {
    if (!cartLoading && cart && cart.items.length === 0) {
      navigate('/cart');
    }
  }, [cart, cartLoading, navigate]);

  // Load recommended games
  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        // Get similar games based on cart items
        if (cart && cart.items.length > 0) {
          const firstGameId = cart.items[0].gameId;
          const similar = await gamesApi.getSimilarGames(firstGameId, 8);
          setRecommendedGames(similar);
        } else {
          const random = await gamesApi.getRandomGames(8);
          setRecommendedGames(random);
        }
      } catch (error) {
        console.error('Failed to load recommendations:', error);
        setRecommendedGames([]);
      }
    };
    loadRecommendations();
  }, [cart]);

  const handlePromoApply = async (code: string): Promise<{ success: boolean; discount: number }> => {
    // TODO: Implement promo code validation via API
    // For now, simple mock validation
    if (code.toUpperCase() === 'GKEYS10') {
      setPromoDiscount(10);
      return { success: true, discount: 10 };
    }
    return { success: false, discount: 0 };
  };

  const handleCreateOrder = async (promoCode?: string) => {
    if (!cart || cart.items.length === 0) return;

    setProcessing(true);
    try {
      const orderData = {
        items: cart.items.map(item => ({
          gameId: item.gameId,
          quantity: item.quantity,
        })),
        promoCode: promoCode || undefined,
      };

      const order = await orderApi.createOrder(orderData);
      
      // Clear cart after successful order creation
      try {
        await clearCart();
      } catch (clearError) {
        console.warn('Failed to clear cart after order:', clearError);
        // Don't fail the order if cart clearing fails
      }
      
      // Small delay to ensure state is updated before navigation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Navigate to orders page on success with order ID in state
      navigate('/profile/orders', { 
        state: { 
          orderCreated: true,
          orderId: order.id 
        },
        replace: true // Use replace to prevent back navigation to checkout
      });
    } catch (err) {
      console.error('Failed to create order:', err);
      throw err;
    } finally {
      setProcessing(false);
    }
  };

  if (cartLoading || !cart) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: theme.colors.background,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: theme.colors.text,
        }}
      >
        Loading...
      </div>
    );
  }

  if (cart.items.length === 0) {
    return null; // Will redirect via useEffect
  }

  const responsiveCSS = `
    .checkout-layout {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 32px;
    }
    .cart-items {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .recommended-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 16px;
      width: 100%;
    }
    .recommended-grid > * {
      min-width: 0;
    }
    @media (max-width: 1024px) {
      .checkout-layout {
        grid-template-columns: 1fr;
        padding: 0 12px;
      }
      .order-summary {
        position: static;
      }
      .recommended-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }
    @media (max-width: 768px) {
      .checkout-layout {
        padding: 0 12px;
      }
      .recommended-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    @media (max-width: 480px) {
      .recommended-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }
    }
  `;

  return (
    <>
      <style>{responsiveCSS}</style>
      <main style={{ minHeight: '100vh', backgroundColor: theme.colors.background }}>
        <Container padding="md">
          <h1
            style={{
              fontSize: '28px',
              fontWeight: '700',
              marginBottom: '8px',
              color: theme.colors.text,
            }}
          >
            Checkout
          </h1>
          <p
            style={{
              color: theme.colors.textMuted,
              fontSize: '14px',
              marginBottom: '32px',
            }}
          >
            {cart.items.length} {cart.items.length === 1 ? 'item' : 'items'} in your cart
          </p>

          <div className="checkout-layout">
            {/* Cart Items */}
            <div>
              <div className="cart-items">
                {cart.items.map((item) => (
                  <CartItemComponent key={item.gameId} item={item} />
                ))}
              </div>

              {/* Recommended Games */}
              {recommendedGames.length > 0 && (
                <>
                  <h2
                    style={{
                      fontSize: '20px',
                      fontWeight: '700',
                      marginBottom: '20px',
                      marginTop: '48px',
                      color: theme.colors.text,
                    }}
                  >
                    You might also like
                  </h2>
                  <div className="recommended-grid">
                    {recommendedGames.map((game) => (
                      <motion.div
                        key={game.id}
                        whileHover={{ scale: 1.05 }}
                        style={{
                          background: theme.colors.surface,
                          borderRadius: '10px',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          border: `1px solid ${theme.colors.border}`,
                        }}
                      >
                        <a
                          href={`/game/${game.slug}`}
                          style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                          <img
                            src={game.image}
                            alt={game.title}
                            style={{
                              width: '100%',
                              aspectRatio: '3/4',
                              objectFit: 'cover',
                            }}
                            loading="lazy"
                          />
                          <div style={{ padding: '12px' }}>
                            <p
                              style={{
                                fontSize: '13px',
                                fontWeight: '500',
                                marginBottom: '4px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                color: theme.colors.text,
                              }}
                            >
                              {game.title}
                            </p>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginBottom: '8px',
                              }}
                            >
                              <p
                                style={{
                                  fontSize: '15px',
                                  fontWeight: '700',
                                  color: theme.colors.primary,
                                }}
                              >
                                €{game.price?.toFixed(2)}
                              </p>
                              {game.originalPrice && game.originalPrice > game.price && (
                                <span
                                  style={{
                                    fontSize: '12px',
                                    color: theme.colors.textMuted,
                                    textDecoration: 'line-through',
                                  }}
                                >
                                  €{game.originalPrice.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                        </a>
                      </motion.div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Order Summary */}
            <CheckoutSummary
              cart={cart}
              promoCode={promoCode}
              onPromoCodeChange={setPromoCode}
              onPromoApply={handlePromoApply}
              onCreateOrder={handleCreateOrder}
            />
          </div>
        </Container>
      </main>
    </>
  );
}
