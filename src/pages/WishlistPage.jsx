// Wishlist Page - GKEYS Gaming Store
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Icons } from '../components/UIKit';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../hooks/useWishlist';
import { useCart } from '../hooks/useCart';
import { gamesApi } from '../services/gamesApi';
import { Container } from '@/components/ui/container';
import { ProfileSidebar } from '@/components/profile/ProfileSidebar';
import GameCard from '../components/GameCard';
import { typography } from '../styles/design-tokens';

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
    error: '#FF4444',
  },
  spacing: { xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px', xxl: '48px' },
  borderRadius: { sm: '4px', md: '8px', lg: '12px', xl: '16px', full: '9999px' },
};

const sidebarItems = [
  { id: 'profile', label: 'Profile', path: '/profile/orders' },
  { id: 'orders', label: 'Orders', path: '/profile/orders' },
  { id: 'wishlist', label: 'Wishlist', path: '/wishlist' },
  { id: 'balance', label: 'Balance', path: '/profile/balance' },
  { id: 'edit-profile', label: 'Edit Profile', path: '/profile/edit', badge: '+5' },
];

// Mock user stats
const userStats = {
  totalGames: 24,
  totalSaved: 156.50,
  daysSinceRegistration: 127,
};

const responsiveCSS = `
  @media (max-width: 768px) {
    .desktop-nav { display: none !important; }
    .desktop-search { display: none !important; }
    .desktop-login { display: none !important; }
    .profile-layout { flex-direction: column !important; }
    .profile-sidebar { width: 100% !important; flex-direction: column !important; gap: 8px !important; padding-bottom: 16px !important; }
    .sidebar-nav { display: flex !important; flex-direction: row !important; overflow-x: auto !important; gap: 8px !important; }
    .sidebar-item { white-space: nowrap !important; padding: 10px 16px !important; }
    .user-stats { display: none !important; }
    .wishlist-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 12px !important; }
    .wishlist-grid > * { min-width: 0 !important; width: 100% !important; }
    .random-games-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 12px !important; }
    .random-games-grid > * { min-width: 0 !important; width: 100% !important; }
  }
  @media (max-width: 480px) {
    .wishlist-grid { grid-template-columns: 1fr !important; }
    .random-games-grid { grid-template-columns: 1fr !important; }
  }
  .wishlist-grid {
    display: grid;
    width: 100%;
  }
  .random-games-grid {
    display: grid;
    width: 100%;
    justify-items: center;
  }
  .random-games-grid > div {
    display: flex;
    justify-content: center;
    width: 100%;
  }
`;

export default function WishlistPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { wishlist, loading: wishlistLoading, removeFromWishlist: removeFromWishlistContext } = useWishlist();
  const { addToCart: addToCartContext } = useCart();
  const [randomGames, setRandomGames] = useState([]);
  const [loadingRandom, setLoadingRandom] = useState(true);
  const [notification, setNotification] = useState(null);
  const [skeletonKeys] = useState(() => 
    Array.from({ length: 8 }, () => `skeleton-${Math.random().toString(36).substring(2, 15)}`)
  );

  // Load random games (8 games that change on refresh)
  useEffect(() => {
    const loadRandomGames = async () => {
      try {
        setLoadingRandom(true);
        const games = await gamesApi.getRandomGames(8);
        if (games && games.length > 0) {
          setRandomGames(games);
        } else {
          console.warn('No random games returned from API');
          setRandomGames([]);
        }
      } catch (error) {
        console.error('Failed to load random games:', error);
        setRandomGames([]);
        // Error is handled gracefully - empty state will show message
      } finally {
        setLoadingRandom(false);
      }
    };

    loadRandomGames();
  }, []);

  const removeFromWishlist = async (gameId) => {
    try {
      await removeFromWishlistContext(gameId);
      showNotification('Removed from wishlist');
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
      showNotification('Failed to remove item');
    }
  };

  const addToCart = async (game) => {
    try {
      await addToCartContext(game.id || game.gameId, 1);
      showNotification(`${game.title || game.game?.title} added to cart`);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      showNotification('Failed to add to cart');
    }
  };

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Extract games from wishlist items
  const wishlistGames = wishlist?.items?.map(item => item.game) || [];
  
  const totalValue = wishlistGames.reduce((sum, game) => sum + (game?.price || 0), 0);
  const totalSavings = wishlistGames.reduce((sum, game) => {
    if (game?.originalPrice && game.originalPrice > game.price) {
      return sum + (game.originalPrice - game.price);
    }
    return sum;
  }, 0);

  const styles = {
    app: {
      minHeight: '100vh',
      backgroundColor: theme.colors.background,
      color: theme.colors.text,
      fontFamily: typography.fontFamily,
      display: 'flex',
      flexDirection: 'column',
    },
    main: {
      flex: 1,
      padding: '48px 24px',
      maxWidth: '1280px',
      margin: '0 auto',
      width: '100%',
    },
    profileLayout: {
      display: 'flex',
      gap: '48px',
    },
    sidebar: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      minWidth: '220px',
    },
    sidebarItem: (isActive) => ({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 24px',
      backgroundColor: isActive ? theme.colors.surface : 'transparent',
      borderRadius: '8px',
      color: isActive ? theme.colors.text : theme.colors.textSecondary,
      fontSize: '16px',
      border: 'none',
      cursor: 'pointer',
      textAlign: 'left',
      transition: 'all 0.2s ease',
      textDecoration: 'none',
    }),
    sidebarBadge: {
      backgroundColor: theme.colors.primary,
      color: '#000',
      padding: '2px 8px',
      borderRadius: '50px',
      fontSize: '12px',
      fontWeight: '600',
    },
    logoutButton: {
      padding: '16px 24px',
      backgroundColor: 'transparent',
      border: 'none',
      color: theme.colors.error,
      fontSize: '16px',
      textAlign: 'left',
      cursor: 'pointer',
      marginTop: '16px',
    },
    userStatsCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '24px',
    },
    userName: {
      fontSize: '18px',
      fontWeight: '600',
      marginBottom: '16px',
    },
    statsGrid: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    },
    statItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    statLabel: {
      fontSize: '13px',
      color: theme.colors.textSecondary,
    },
    statValue: {
      fontSize: '14px',
      fontWeight: '600',
    },
    statValuePrimary: {
      fontSize: '14px',
      fontWeight: '600',
      color: theme.colors.primary,
    },
    content: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
    },
    pageHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px',
    },
    pageTitle: {
      fontSize: '28px',
      fontWeight: '700',
    },
    addAllButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '12px 24px',
      backgroundColor: theme.colors.primary,
      color: '#000',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
    },
    wishlistGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
      gap: '20px',
      width: '100%',
    },
    gameCard: {
      backgroundColor: theme.colors.surfaceLight,
      borderRadius: '16px',
      overflow: 'hidden',
      position: 'relative',
      transition: 'transform 0.2s ease',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
    },
    gameImage: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    },
    removeButton: {
      position: 'absolute',
      top: '12px',
      right: '12px',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      border: 'none',
      borderRadius: '50%',
      width: '36px',
      height: '36px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      color: theme.colors.text,
      transition: 'all 0.2s',
      zIndex: 10,
    },
    discountBadge: {
      position: 'absolute',
      top: '12px',
      left: '12px',
      backgroundColor: theme.colors.error,
      color: '#fff',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: '600',
      zIndex: 10,
    },
    bestSellerBadge: {
      position: 'absolute',
      top: '12px',
      left: '12px',
      backgroundColor: theme.colors.primary,
      color: '#000',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: '600',
      zIndex: 10,
    },
    gameInfo: {
      padding: '16px',
    },
    gameTitle: {
      fontSize: '16px',
      fontWeight: '600',
      marginBottom: '8px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    gameMeta: {
      fontSize: '12px',
      color: theme.colors.textSecondary,
      marginBottom: '12px',
    },
    priceRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '12px',
    },
    gamePrice: {
      fontSize: '18px',
      fontWeight: '700',
      color: theme.colors.primary,
    },
    originalPrice: {
      fontSize: '14px',
      color: theme.colors.textMuted,
      textDecoration: 'line-through',
    },
    addToCartButton: {
      width: '100%',
      padding: '12px',
      backgroundColor: theme.colors.surface,
      border: 'none',
      borderRadius: '8px',
      color: theme.colors.text,
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      transition: 'background-color 0.2s ease',
    },
    emptyState: {
      textAlign: 'center',
      padding: '80px 20px',
      backgroundColor: theme.colors.surface,
      borderRadius: '16px',
      position: 'relative',
      overflow: 'hidden',
    },
    emptyBackground: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      opacity: 0.1,
      backgroundImage: 'url(https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1920&h=1080&fit=crop)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },
    emptyContent: {
      position: 'relative',
      zIndex: 1,
    },
    emptyIcon: {
      fontSize: '64px',
      marginBottom: '24px',
    },
    emptyTitle: {
      fontSize: '28px',
      fontWeight: '700',
      marginBottom: '12px',
    },
    emptyText: {
      color: theme.colors.textSecondary,
      marginBottom: '32px',
      maxWidth: '400px',
      margin: '0 auto 32px',
      fontSize: '16px',
      lineHeight: '1.6',
    },
    browseButton: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '14px 32px',
      backgroundColor: theme.colors.primary,
      color: '#000',
      border: 'none',
      borderRadius: '10px',
      fontSize: '15px',
      fontWeight: '600',
      cursor: 'pointer',
      textDecoration: 'none',
    },
    randomSection: {
      marginTop: '48px',
      paddingTop: '48px',
      borderTop: `1px solid ${theme.colors.border}`,
    },
    randomTitle: {
      fontSize: '24px',
      fontWeight: '700',
      marginBottom: '24px',
    },
    randomGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
      width: '100%',
      gap: '20px',
    },
    randomCard: {
      backgroundColor: theme.colors.surfaceLight,
      borderRadius: '12px',
      overflow: 'hidden',
      transition: 'transform 0.2s ease',
      textDecoration: 'none',
      color: 'inherit',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
    },
    randomImage: {
      width: '100%',
      aspectRatio: '3/4',
      objectFit: 'cover',
    },
    randomInfo: {
      padding: '12px',
    },
    randomGameTitle: {
      fontSize: '14px',
      fontWeight: '500',
      marginBottom: '8px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    randomPriceRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    randomPrice: {
      fontSize: '16px',
      fontWeight: '700',
      color: theme.colors.primary,
    },
    randomOriginalPrice: {
      fontSize: '12px',
      color: theme.colors.textMuted,
      textDecoration: 'line-through',
    },
    notification: {
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: theme.colors.surface,
      border: `1px solid ${theme.colors.border}`,
      padding: '16px 24px',
      borderRadius: '10px',
      fontSize: '14px',
      fontWeight: '500',
      zIndex: 1000,
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    },
  };

  if (wishlistLoading) {
    return (
      <div style={styles.app}>
        <main style={styles.main}>
          <div style={{ textAlign: 'center', padding: '48px', color: theme.colors.textSecondary }}>
            Loading wishlist...
          </div>
        </main>
      </div>
    );
  }

  return (
    <>
      <style>{responsiveCSS}</style>
      {notification && <div style={styles.notification}>{notification}</div>}
      
      <main className="min-h-screen bg-design-background text-design-text py-12">
        <Container>
          <div className="flex flex-col design-tablet:flex-row gap-12 design-mobile:gap-6">
            {/* Sidebar */}
            <ProfileSidebar
              userName={user?.nickname || user?.username || 'Newbie Guy'}
              userStats={userStats}
              items={sidebarItems}
              onLogout={handleLogout}
              showUserStats={true}
            />

            {/* Wishlist Content */}
            <div className="flex-1 flex flex-col gap-6">
            {wishlistGames.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-3xl font-bold text-design-text">Wishlist</h1>
                  <button 
                    type="button"
                    className="px-6 py-3 bg-design-primary text-black font-semibold rounded-design-lg hover:opacity-90 transition-opacity flex items-center gap-2"
                    onClick={async () => {
                      try {
                        for (const game of wishlistGames) {
                          if (game?.id) {
                            await addToCartContext(game.id, 1);
                          }
                        }
                        showNotification(`${wishlistGames.length} items added to cart`);
                      } catch (error) {
                        console.error('Failed to add all to cart:', error);
                        showNotification('Failed to add some items to cart');
                      }
                    }}
                  >
                    <Icons.Cart /> Add All to Cart
                  </button>
                </div>

                <div className="grid grid-cols-1 design-tablet:grid-cols-2 design-desktop:grid-cols-3 gap-6 wishlist-grid">
                  {wishlistGames.map((game) => {
                    if (!game) return null;
                    const discount = game.originalPrice && game.price < game.originalPrice
                      ? Math.round((1 - game.price / game.originalPrice) * 100)
                      : null;

                    return (
                      <div key={game.id} className="w-full" style={styles.gameCard}>
                        <Link to={`/game/${game.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          <div style={{ position: 'relative', width: '100%', aspectRatio: '3/4', overflow: 'hidden' }}>
                            <img 
                              src={game.image || game.images?.[0]} 
                              alt={game.title} 
                              style={styles.gameImage} 
                            />
                            
                            {/* Dark gradient for bottom overlay */}
                            <div
                              style={{
                                position: 'absolute',
                                left: 0,
                                right: 0,
                                bottom: 0,
                                height: '50%',
                                background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 50%, transparent 100%)',
                                pointerEvents: 'none',
                              }}
                            />
                            
                            {/* Price overlay at bottom */}
                            <div
                              style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                padding: '12px',
                                zIndex: 10,
                              }}
                            >
                              <div style={{ 
                                display: 'flex', 
                                alignItems: 'baseline', 
                                gap: '8px', 
                                flexWrap: 'wrap' 
                              }}>
                                <span style={{ 
                                  fontSize: '18px', 
                                  fontWeight: '700', 
                                  color: '#FFFFFF',
                                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)',
                                }}>
                                  €{game.price?.toFixed(2) || '0.00'}
                                </span>
                                {game.originalPrice && game.originalPrice > game.price && (
                                  <>
                                    <span style={{ 
                                      fontSize: '12px', 
                                      color: 'rgba(255, 255, 255, 0.7)', 
                                      textDecoration: 'line-through',
                                      textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)',
                                    }}>
                                      €{game.originalPrice.toFixed(2)}
                                    </span>
                                    {discount && (
                                      <span style={{ 
                                        backgroundColor: theme.colors.primary, 
                                        color: '#000', 
                                        padding: '2px 6px', 
                                        borderRadius: '4px', 
                                        fontSize: '10px', 
                                        fontWeight: '700',
                                        whiteSpace: 'nowrap',
                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                                      }}>
                                        -{discount}%
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                            
                            {/* Badges */}
                            {game.isBestSeller && (
                              <span style={styles.bestSellerBadge}>Best Seller</span>
                            )}
                            {discount && !game.isBestSeller && (
                              <span style={styles.discountBadge}>-{discount}%</span>
                            )}
                          </div>
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeFromWishlist(game.id)}
                          style={styles.removeButton}
                          title="Remove from wishlist"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 68, 68, 0.9)';
                            e.currentTarget.style.transform = 'scale(1.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        >
                          <Icons.Heart />
                        </button>
                        <div style={styles.gameInfo}>
                          <Link to={`/game/${game.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <h3 style={styles.gameTitle}>{game.title}</h3>
                          </Link>
                          <p style={styles.gameMeta}>
                            {game.platforms?.[0] || 'PC'} • {game.genres?.[0] || 'Game'}
                          </p>
                          <button
                            type="button"
                            onClick={() => addToCart(game)}
                            style={styles.addToCartButton}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = theme.colors.surfaceLight;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = theme.colors.surface;
                            }}
                          >
                            <Icons.Cart /> Add to Cart
                          </button>
                        </div>
                      </div>
                    );
                  }).filter(Boolean)}
                </div>

                {/* Random Games Section - 8 random games */}
                <section className="mt-12 pt-12 border-t border-design-border">
                  <h2 className="text-2xl font-bold text-design-text mb-6">You might also like</h2>
                  {loadingRandom ? (
                    <div className="grid grid-cols-1 design-tablet:grid-cols-2 design-desktop:grid-cols-4 gap-6 random-games-grid">
                      {skeletonKeys.map((key) => (
                        <div
                          key={key}
                          className="w-full bg-design-surface rounded-design-lg overflow-hidden animate-pulse"
                          style={{ aspectRatio: '3/4', maxWidth: '240px', margin: '0 auto' }}
                        >
                          <div className="w-full h-full bg-design-surfaceLight" />
                          <div className="p-3">
                            <div className="h-4 bg-design-surfaceLight rounded mb-2" />
                            <div className="h-3 bg-design-surfaceLight rounded w-2/3" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : randomGames.length > 0 ? (
                    <div className="grid grid-cols-1 design-tablet:grid-cols-2 design-desktop:grid-cols-4 gap-6 random-games-grid" style={{ width: '100%', justifyItems: 'center' }}>
                      {randomGames.map((game) => (
                        <div key={game.id} style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                          <GameCard game={game} size="small" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-design-text-secondary">
                      <p>Unable to load recommendations at this time.</p>
                    </div>
                  )}
                </section>
              </>
            ) : (
              <>
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="mb-4">
                    <Heart className="h-16 w-16 text-[#00C8C2]" fill="#00C8C2" />
                  </div>
                  <h2 className="text-2xl font-bold text-design-text mb-2">Your wishlist is empty</h2>
                  <p className="text-design-text-secondary mb-6">
                    Add items using the <Icons.Heart /> button. We'll notify you when they go on sale!
                  </p>
                  <Link 
                    to="/catalog" 
                    className="px-6 py-3 bg-design-primary text-black font-semibold rounded-design-lg hover:opacity-90 transition-opacity"
                  >
                    Go to Catalog
                  </Link>
                </div>

                {/* Random Games Section - also shown when wishlist is empty (8 random games) */}
                <section className="mt-12 pt-12 border-t border-design-border">
                  <h2 className="text-2xl font-bold text-design-text mb-6">You might also like</h2>
                  {loadingRandom ? (
                    <div className="grid grid-cols-1 design-tablet:grid-cols-2 design-desktop:grid-cols-4 gap-6 random-games-grid">
                      {skeletonKeys.map((key) => (
                        <div
                          key={`empty-${key}`}
                          className="w-full bg-design-surface rounded-design-lg overflow-hidden animate-pulse"
                          style={{ aspectRatio: '3/4', maxWidth: '240px', margin: '0 auto' }}
                        >
                          <div className="w-full h-full bg-design-surfaceLight" />
                          <div className="p-3">
                            <div className="h-4 bg-design-surfaceLight rounded mb-2" />
                            <div className="h-3 bg-design-surfaceLight rounded w-2/3" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : randomGames.length > 0 ? (
                    <div className="grid grid-cols-1 design-tablet:grid-cols-2 design-desktop:grid-cols-4 gap-6 random-games-grid" style={{ width: '100%', justifyItems: 'center' }}>
                      {randomGames.map((game) => (
                        <div key={game.id} style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                          <GameCard game={game} size="small" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-design-text-secondary">
                      <p>Unable to load recommendations at this time.</p>
                    </div>
                  )}
                </section>
              </>
            )}
            </div>
          </div>
        </Container>
      </main>
    </>
  );
}
