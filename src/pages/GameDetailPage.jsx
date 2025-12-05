// Game Detail Page - GKEYS Gaming Store
import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Icons } from '../components/UIKit';
import { gamesApi } from '../services/gamesApi';

const theme = {
  colors: {
    primary: '#00FF66',
    background: '#0D0D0D',
    surface: '#1A1A1A',
    surfaceLight: '#2A2A2A',
    text: '#FFFFFF',
    textSecondary: '#999999',
    textMuted: '#666666',
    border: '#333333',
  },
};

// Removed static gameData and similarGames - now loaded from API

const responsiveCSS = `
  @media (max-width: 768px) {
    .desktop-nav { display: none !important; }
    .desktop-search { display: none !important; }
    .desktop-login { display: none !important; }
    .hero-section { 
      height: auto !important; 
      min-height: 400px !important; 
      padding: 24px !important; 
      flex-direction: column !important;
      align-items: flex-start !important;
    }
    .hero-content { 
      max-width: 100% !important; 
      width: 100% !important;
    }
    .hero-title { font-size: 28px !important; }
    .hero-right { 
      position: relative !important; 
      margin-top: 24px !important; 
      width: 100% !important;
      align-items: flex-start !important;
    }
    .info-grid { grid-template-columns: 1fr !important; }
    .similar-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .delivery-info { 
      flex-direction: column !important; 
      gap: 16px !important; 
    }
    .action-buttons { 
      width: 100% !important; 
    }
    .buy-button { 
      flex: 1 !important; 
    }
  }
  @media (max-width: 480px) {
    .hero-title { font-size: 24px !important; }
    .hero-section { padding: 16px !important; }
    .similar-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 12px !important; }
    .price-container { 
      flex-direction: column !important; 
      align-items: flex-start !important; 
      gap: 8px !important;
    }
    .current-price { font-size: 28px !important; }
  }
`;

const GameCard = ({ game }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const badges = [];
  if (game.isBestSeller) badges.push('Best Seller');
  if (game.isNew) badges.push('New');
  if (game.isPreorder) badges.push('Preorder');
  
  const discount = game.originalPrice && game.price < game.originalPrice
    ? `-${Math.round((1 - game.price / game.originalPrice) * 100)}%`
    : null;
  
  return (
    <Link to={`/game/${game.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div 
        style={{ 
          cursor: 'pointer',
          transition: 'transform 0.2s ease',
          transform: isHovered ? 'translateY(-4px)' : 'none',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '3/4',
          borderRadius: '12px',
          overflow: 'hidden',
          marginBottom: '8px',
        }}>
          <img src={game.image} alt={game.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          {badges.length > 0 && (
            <span style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              backgroundColor: theme.colors.primary,
              color: '#000',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: '600',
            }}>{badges[0]}</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '16px', fontWeight: '600' }}>{game.price}{game.currency || '€'}</span>
          {game.originalPrice && game.originalPrice > game.price && (
            <span style={{ fontSize: '14px', color: theme.colors.textMuted, textDecoration: 'line-through' }}>
              {game.originalPrice}{game.currency || '€'}
            </span>
          )}
          {discount && (
            <span style={{ backgroundColor: theme.colors.primary, color: '#000', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>
              {discount}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default function GameDetailPage() {
  const { slug } = useParams();
  const [activeTab, setActiveTab] = useState('description');
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [game, setGame] = useState(null);
  const [similarGames, setSimilarGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load game data
  useEffect(() => {
    const loadGame = async () => {
      if (!slug) return;
      setLoading(true);
      setError(null);
      try {
        const gameData = await gamesApi.getGameBySlug(slug);
        setGame(gameData);
        
        // Load similar games
        const similar = await gamesApi.getSimilarGames(gameData.id, 10);
        setSimilarGames(similar);
      } catch (err) {
        console.error('Failed to load game:', err);
        setError('Failed to load game. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    loadGame();
  }, [slug]);

  const styles = {
    app: {
      minHeight: '100vh',
      backgroundColor: theme.colors.background,
      color: theme.colors.text,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 24px',
      backgroundColor: theme.colors.background,
      borderBottom: `1px solid ${theme.colors.border}`,
      position: 'sticky',
      top: 0,
      zIndex: 1000,
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      fontSize: '24px',
      fontWeight: '700',
      textDecoration: 'none',
      color: theme.colors.text,
    },
    nav: {
      display: 'flex',
      alignItems: 'center',
      gap: '32px',
    },
    navLink: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: theme.colors.text,
      textDecoration: 'none',
      fontSize: '16px',
    },
    rightSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    },
    iconButton: {
      width: '44px',
      height: '44px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '50%',
      backgroundColor: theme.colors.surface,
      color: theme.colors.text,
      border: 'none',
      cursor: 'pointer',
    },
    searchButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 20px',
      backgroundColor: theme.colors.surface,
      borderRadius: '50px',
      color: theme.colors.textSecondary,
      border: 'none',
      cursor: 'pointer',
    },
    loginButton: {
      padding: '10px 24px',
      backgroundColor: 'transparent',
      border: `1px solid ${theme.colors.border}`,
      borderRadius: '8px',
      color: theme.colors.text,
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
    },
    breadcrumb: {
      padding: '16px 24px',
      fontSize: '14px',
      color: theme.colors.textSecondary,
    },
    breadcrumbLink: {
      color: theme.colors.textSecondary,
      textDecoration: 'none',
    },
    breadcrumbSeparator: {
      margin: '0 8px',
    },
    breadcrumbCurrent: {
      color: theme.colors.text,
    },
    hero: (image) => ({
      position: 'relative',
      minHeight: '400px',
      backgroundImage: image ? `linear-gradient(to right, rgba(13,13,13,0.95), rgba(13,13,13,0.6)), url(${image})` : 'none',
      backgroundColor: theme.colors.background,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '48px',
      gap: '48px',
      overflow: 'hidden',
    }),
    heroContent: {
      maxWidth: '500px',
      zIndex: 1,
      position: 'relative',
    },
    badgeContainer: {
      display: 'flex',
      gap: '8px',
      marginBottom: '16px',
      flexWrap: 'wrap',
    },
    badge: (variant) => ({
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '6px 12px',
      backgroundColor: variant === 'primary' ? theme.colors.primary : theme.colors.surface,
      color: variant === 'primary' ? '#000' : theme.colors.text,
      borderRadius: '50px',
      fontSize: '12px',
      fontWeight: '600',
    }),
    heroTitle: {
      fontSize: '36px',
      fontWeight: '700',
      marginBottom: '12px',
    },
    heroDescription: {
      color: theme.colors.textSecondary,
      fontSize: '16px',
      lineHeight: '1.6',
      marginBottom: '24px',
    },
    deliveryInfo: {
      display: 'flex',
      gap: '24px',
      marginBottom: '24px',
      flexWrap: 'wrap',
    },
    deliveryItem: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    },
    deliveryLabel: {
      color: theme.colors.textSecondary,
      fontSize: '12px',
    },
    deliveryBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 16px',
      backgroundColor: theme.colors.surface,
      borderRadius: '50px',
      fontSize: '14px',
    },
    activateLink: {
      color: theme.colors.primary,
      fontSize: '14px',
      textDecoration: 'none',
    },
    heroRight: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: '16px',
      zIndex: 1,
      position: 'relative',
    },
    priceContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    currentPrice: {
      fontSize: '32px',
      fontWeight: '700',
    },
    originalPrice: {
      fontSize: '20px',
      color: theme.colors.textMuted,
      textDecoration: 'line-through',
    },
    discount: {
      backgroundColor: theme.colors.primary,
      color: '#000',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '14px',
      fontWeight: '600',
    },
    actionButtons: {
      display: 'flex',
      gap: '12px',
      width: '100%',
      maxWidth: '300px',
    },
    buyButton: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      padding: '14px 48px',
      backgroundColor: theme.colors.primary,
      color: '#000',
      border: 'none',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      flex: 1,
      transition: 'opacity 0.2s ease, transform 0.2s ease',
    },
    wishlistButton: {
      width: '48px',
      height: '48px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
      border: 'none',
      borderRadius: '8px',
      color: theme.colors.text,
      cursor: 'pointer',
      transition: 'background-color 0.2s ease, transform 0.2s ease',
    },
    container: {
      maxWidth: '1280px',
      margin: '0 auto',
      padding: '0 24px',
    },
    section: {
      padding: '48px 0',
    },
    sectionTitle: {
      fontSize: '24px',
      fontWeight: '600',
      marginBottom: '24px',
    },
    tabsContainer: {
      marginBottom: '24px',
    },
    tab: (isActive) => ({
      padding: '12px 24px',
      backgroundColor: isActive ? theme.colors.surface : 'transparent',
      border: `1px solid ${isActive ? theme.colors.border : 'transparent'}`,
      borderRadius: '8px',
      color: isActive ? theme.colors.text : theme.colors.textSecondary,
      fontSize: '14px',
      cursor: 'pointer',
    }),
    infoGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 300px',
      gap: '48px',
    },
    descriptionText: {
      color: theme.colors.textSecondary,
      fontSize: '15px',
      lineHeight: '1.8',
      whiteSpace: 'pre-line',
    },
    expandButton: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '40px',
      height: '40px',
      margin: '24px auto 0',
      backgroundColor: theme.colors.surface,
      border: 'none',
      borderRadius: '50%',
      color: theme.colors.text,
      cursor: 'pointer',
    },
    infoCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: '16px',
      padding: '24px',
    },
    infoCardTitle: {
      fontSize: '18px',
      fontWeight: '600',
      marginBottom: '16px',
    },
    infoRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      padding: '12px 0',
      borderBottom: `1px solid ${theme.colors.border}`,
    },
    infoLabel: {
      color: theme.colors.textSecondary,
      fontSize: '14px',
    },
    infoValue: {
      textAlign: 'right',
      fontSize: '14px',
    },
    infoLink: {
      color: theme.colors.primary,
      textDecoration: 'none',
    },
    similarGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      gap: '24px',
    },
    footer: {
      backgroundColor: theme.colors.background,
      borderTop: `1px solid ${theme.colors.border}`,
      padding: '48px 24px',
    },
    footerTop: {
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '24px',
      marginBottom: '32px',
      maxWidth: '1280px',
      margin: '0 auto 32px',
    },
    footerNav: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '24px',
    },
    footerLink: {
      color: theme.colors.textSecondary,
      textDecoration: 'none',
      fontSize: '14px',
    },
    footerSocial: {
      display: 'flex',
      gap: '16px',
    },
    footerBottom: {
      textAlign: 'center',
      paddingTop: '32px',
      borderTop: `1px solid ${theme.colors.border}`,
      maxWidth: '1280px',
      margin: '0 auto',
    },
    copyright: {
      color: theme.colors.textMuted,
      fontSize: '12px',
      lineHeight: '1.8',
    },
  };

  if (loading) {
    return (
      <div style={{ ...styles.app, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ color: theme.colors.text }}>Loading...</div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div style={{ ...styles.app, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ color: theme.colors.text }}>
          {error || 'Game not found'}
        </div>
      </div>
    );
  }

  const badges = [];
  if (game.isBestSeller) badges.push('Best Seller');
  if (game.isNew) badges.push('New');
  if (game.isPreorder) badges.push('Preorder');
  
  const discount = game.originalPrice && game.price < game.originalPrice
    ? `-${Math.round((1 - game.price / game.originalPrice) * 100)}%`
    : null;

  const mainPlatform = game.platforms && game.platforms.length > 0 ? game.platforms[0] : 'PC';
  const deliveryMethod = 'Key'; // Default delivery method

  return (
    <>
      <style>{responsiveCSS}</style>
      {/* Breadcrumb */}
        <nav style={styles.breadcrumb}>
          <Link to="/" style={styles.breadcrumbLink}>Main</Link>
          <span style={styles.breadcrumbSeparator}>|</span>
          <Link to="/catalog" style={styles.breadcrumbLink}>Catalog</Link>
          <span style={styles.breadcrumbSeparator}>|</span>
          <span style={styles.breadcrumbCurrent}>{game.title}</span>
        </nav>

        {/* Hero Section */}
        <section style={styles.hero(game.image)} className="hero-section">
          <div style={styles.heroContent} className="hero-content">
            <div style={styles.badgeContainer}>
              {badges.map((badge, idx) => (
                <span key={idx} style={styles.badge(idx === 0 ? 'primary' : 'secondary')}>
                  ● {badge}
                </span>
              ))}
            </div>
            <h1 style={styles.heroTitle} className="hero-title">{game.title}</h1>
            <p style={styles.heroDescription}>
              {game.shortDescription || (game.description ? game.description.substring(0, 200) + (game.description.length > 200 ? '...' : '') : '')}
            </p>
            <div style={styles.deliveryInfo} className="delivery-info">
              <div style={styles.deliveryItem}>
                <span style={styles.deliveryLabel}>Delivery Method</span>
                <span style={styles.deliveryBadge}><Icons.Key /> {deliveryMethod}</span>
              </div>
              <div style={styles.deliveryItem}>
                <span style={styles.deliveryLabel}>Platform</span>
                <span style={styles.deliveryBadge}><Icons.Steam /> {mainPlatform}</span>
              </div>
              <div style={styles.deliveryItem}>
                <a href="#" style={styles.activateLink}>How to activate?</a>
              </div>
            </div>
          </div>
          <div style={styles.heroRight} className="hero-right">
            <div style={styles.priceContainer} className="price-container">
              <span style={styles.currentPrice} className="current-price">{game.price}{game.currency || '€'}</span>
              {game.originalPrice && game.originalPrice > game.price && (
                <span style={styles.originalPrice}>{game.originalPrice}{game.currency || '€'}</span>
              )}
              {discount && <span style={styles.discount}>{discount}</span>}
            </div>
            <div style={styles.actionButtons} className="action-buttons">
              <button 
                style={styles.buyButton} 
                className="buy-button"
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                <Icons.Cart /> Buy
              </button>
              <button 
                style={styles.wishlistButton}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.surfaceLight;
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.surface;
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <Icons.Heart />
              </button>
            </div>
          </div>
        </section>

        {/* Additional Information */}
        <section style={styles.section}>
          <div style={styles.container}>
            <h2 style={styles.sectionTitle}>Additional Information</h2>
            <div style={styles.tabsContainer}>
              <button style={styles.tab(activeTab === 'description')} onClick={() => setActiveTab('description')}>
                Description
              </button>
            </div>
            <div style={styles.infoGrid} className="info-grid">
              <div>
                <p style={styles.descriptionText}>
                  {isDescriptionExpanded 
                    ? game.description 
                    : (game.description && game.description.length > 400 
                        ? game.description.substring(0, 400) + '...' 
                        : game.description)}
                </p>
                {game.description && game.description.length > 400 && (
                  <button style={styles.expandButton} onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}>
                    <Icons.ChevronDown />
                  </button>
                )}
              </div>
              <div style={styles.infoCard}>
                <h3 style={styles.infoCardTitle}>Description</h3>
                {game.genres && game.genres.length > 0 && (
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Genre:</span>
                    <span style={styles.infoValue}>
                      {game.genres.map((g, i) => (
                        <span key={g}>
                          <Link to={`/catalog?genres=${g}`} style={styles.infoLink}>{g}</Link>
                          {i < game.genres.length - 1 && '  '}
                        </span>
                      ))}
                    </span>
                  </div>
                )}
                {game.platforms && game.platforms.length > 0 && (
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Platform:</span>
                    <span style={styles.infoValue}>
                      {game.platforms.map((p, i) => (
                        <span key={p}>
                          <Link to={`/catalog?platforms=${p}`} style={styles.infoLink}>{p}</Link>
                          {i < game.platforms.length - 1 && ', '}
                        </span>
                      ))}
                    </span>
                  </div>
                )}
                {game.releaseDate && (
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Release Date:</span>
                    <span style={styles.infoValue}>
                      {new Date(game.releaseDate).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                )}
                <div style={{ ...styles.infoRow, borderBottom: 'none' }}>
                  <span style={styles.infoLabel}>In Stock:</span>
                  <span style={styles.infoValue}>
                    {game.inStock ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Similar Games */}
        {similarGames.length > 0 && (
          <section style={styles.section}>
            <div style={styles.container}>
              <h2 style={styles.sectionTitle}>Games similar to {game.title}</h2>
              <div style={styles.similarGrid} className="similar-grid">
                {similarGames.map((similarGame) => (
                  <GameCard key={similarGame.id} game={similarGame} />
                ))}
              </div>
            </div>
          </section>
        )}
    </>
  );
}

