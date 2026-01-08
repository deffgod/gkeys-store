import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import GameCard from './GameCard';
import { colors, spacing, borderRadius, typography } from '../styles/design-tokens';
import newGamesBg from '../assets/new-games-bg.jpg';
import noirBg from '../assets/noir-bg.jpg';

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

const ChevronLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
    },
  },
};

export default function GameSection({
  title,
  subtitle,
  description,
  games,
  tabs,
  showCheckAll = true,
  checkAllLink = '/catalog',
  checkAllText = 'Check all',
  columns = 6,
  carousel = false,
  sectionStyle = {},
  loading = false,
  error = null,
  onTabChange,
  sectionId,
}) {
  const [activeTab, setActiveTab] = useState(tabs?.[0] || null);
  const scrollRef = useRef(null);

  // Update activeTab when tabs change (e.g., when genres load from DB)
  useEffect(() => {
    if (tabs && tabs.length > 0 && (!activeTab || !tabs.includes(activeTab))) {
      setActiveTab(tabs[0]);
    }
  }, [tabs, activeTab]);

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (onTabChange && sectionId) {
      onTabChange(sectionId, tab);
    }
  };

  // For Best Sellers, don't filter on client - data comes from API
  // For other sections, keep client-side filtering as fallback
  const filteredGames = (title === 'Best Sellers' || sectionId === 'best-sellers')
    ? games // Best Sellers: games already filtered by API
    : (activeTab && activeTab !== 'All' 
        ? games.filter(game => {
            // Check if game has matching genre in genres array
            if (game.genres && Array.isArray(game.genres)) {
              return game.genres.some(genre => 
                typeof genre === 'string' 
                  ? genre.toLowerCase() === activeTab.toLowerCase()
                  : (genre.name || genre).toLowerCase() === activeTab.toLowerCase()
              );
            }
            // Fallback to old structure
            return game.genre === activeTab || game.tags?.includes(activeTab);
          })
        : games);

  // Show empty state if no games and not loading
  if (!loading && filteredGames.length === 0 && !error) {
    return (
      <section
        style={{
          padding: '40px 0',
          ...sectionStyle,
        }}
      >
        <div
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '0 24px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '24px',
            }}
          >
            <h2
              style={{
                fontSize: '28px',
                fontWeight: '700',
                color: theme.colors.text,
                margin: 0,
              }}
            >
              {title}
            </h2>
          </div>
          <p style={{ color: theme.colors.textSecondary, textAlign: 'center', padding: '40px' }}>
            No games available at the moment.
          </p>
        </div>
      </section>
    );
  }

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  return (
    <section
      style={{
        padding: '40px 0',
        paddingTop: title === 'Best Sellers' ? '60px' : '40px',
        marginTop: title === 'Best Sellers' ? '0' : '0',
        position: 'relative',
        zIndex: 2,
        ...sectionStyle,
      }}
    >
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 24px',
          width: '100%',
          boxSizing: 'border-box',
        }}
        className="game-section-container"
      >
        {/* Container wrapper for description sections */}
        {description ? (
          <div
            style={{
              backgroundColor: colors.surface,
              borderRadius: title === 'Noir' || description.title === 'Noir' ? '36px' : borderRadius.xl,
              padding: `${spacing.xl} ${spacing.xxl}`,
              position: 'relative',
              backgroundImage: title === 'New games' || description.title === 'New games' 
                ? `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${newGamesBg})` 
                : title === 'Noir' || description.title === 'Noir'
                ? `url(${noirBg})`
                : 'linear-gradient(135deg, rgba(0, 200, 194, 0.05) 0%, rgba(26, 26, 26, 0.8) 50%, rgba(0, 0, 0, 0.1) 100%)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Header with large typography for description sections */}
            <div
              style={{
                marginBottom: '24px',
              }}
            >
              <h2
                style={{
                  fontSize: '2.5rem',
                  fontWeight: typography.fontWeight.bold,
                  color: colors.text,
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                {description.title}
              </h2>
              <p
                style={{
                  fontSize: '1.125rem',
                  fontWeight: typography.fontWeight.normal,
                  color: colors.textSecondary,
                  margin: '12px 0 0 0',
                }}
              >
                {description.text}
              </p>
            </div>

            {/* Tabs */}
            {tabs && tabs.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  marginBottom: '24px',
                  overflowX: 'auto',
                  overflowY: 'hidden',
                  paddingBottom: '8px',
                  WebkitOverflowScrolling: 'touch',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
                className="tabs-scroll"
              >
                {tabs.map((tab) => (
                  <motion.button
                    key={tab}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleTabChange(tab)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: activeTab === tab ? theme.colors.primary : theme.colors.surface,
                      color: activeTab === tab ? '#000' : theme.colors.text,
                      border: activeTab === tab ? 'none' : `1px solid ${theme.colors.border}`,
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s ease',
                      flexShrink: 0,
                    }}
                  >
                    {tab}
                  </motion.button>
                ))}
              </div>
            )}

            {/* Games Grid or Carousel */}
            {carousel ? (
              <div style={{ position: 'relative' }}>
                {/* Scroll Buttons */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={scrollLeft}
                  style={{
                    position: 'absolute',
                    left: '-20px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: theme.colors.surface,
                    border: `1px solid ${theme.colors.border}`,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: theme.colors.text,
                    zIndex: 10,
                  }}
                  className="carousel-btn-left"
                >
                  <ChevronLeftIcon />
                </motion.button>

                <div
                  ref={scrollRef}
                  style={{
                    display: 'flex',
                    gap: '16px',
                    overflowX: 'auto',
                    scrollSnapType: 'x mandatory',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    paddingBottom: '8px',
                  }}
                  className="carousel-scroll"
                >
                  {filteredGames.map((game) => (
                    <div
                      key={game.id}
                      className="carousel-card-wrapper"
                      style={{
                        flexShrink: 0,
                        scrollSnapAlign: 'start',
                      }}
                    >
                      <GameCard game={game} size="medium" showNewBadge={game.isNew} />
                    </div>
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={scrollRight}
                  style={{
                    position: 'absolute',
                    right: '-20px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: theme.colors.surface,
                    border: `1px solid ${theme.colors.border}`,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: theme.colors.text,
                    zIndex: 10,
                  }}
                  className="carousel-btn-right"
                >
                  <ChevronRightIcon />
                </motion.button>
              </div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-50px' }}
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${columns}, 1fr)`,
                  gap: '16px',
                }}
                className={`games-grid games-grid-${columns}`}
              >
                {filteredGames.map((game) => (
                  <motion.div key={game.id} variants={itemVariants}>
                    <GameCard game={game} size="medium" />
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Check All Button (for sections with description) */}
            {showCheckAll && (
              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
                <Link to={checkAllLink} style={{ textDecoration: 'none' }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      padding: '12px 32px',
                      backgroundColor: colors.accent,
                      color: '#000',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    {checkAllText}
                  </motion.button>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Header for non-description sections */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: tabs ? '16px' : '24px',
                flexWrap: 'wrap',
                gap: '16px',
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: '28px',
                    fontWeight: '700',
                    color: theme.colors.text,
                    margin: 0,
                  }}
                >
                  {title}
                </h2>
                {subtitle && (
                  <p
                    style={{
                      fontSize: '14px',
                      color: theme.colors.textSecondary,
                      margin: '8px 0 0 0',
                    }}
                  >
                    {subtitle}
                  </p>
                )}
              </div>
              {showCheckAll && (
                <Link
                  to={checkAllLink}
                  style={{
                    color: theme.colors.primary,
                    fontSize: '14px',
                    fontWeight: '500',
                    textDecoration: 'none',
                  }}
                >
                  {checkAllText}
                </Link>
              )}
            </div>

            {/* Tabs */}
            {tabs && tabs.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  marginBottom: '24px',
                  overflowX: 'auto',
                  overflowY: 'hidden',
                  paddingBottom: '8px',
                  WebkitOverflowScrolling: 'touch',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
                className="tabs-scroll"
              >
                {tabs.map((tab) => (
                  <motion.button
                    key={tab}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleTabChange(tab)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: activeTab === tab ? theme.colors.primary : theme.colors.surface,
                      color: activeTab === tab ? '#000' : theme.colors.text,
                      border: activeTab === tab ? 'none' : `1px solid ${theme.colors.border}`,
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s ease',
                      flexShrink: 0,
                    }}
                  >
                    {tab}
                  </motion.button>
                ))}
              </div>
            )}

            {/* Games Grid or Carousel */}
            {carousel ? (
              <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
                {/* Scroll Buttons */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={scrollLeft}
                  style={{
                    position: 'absolute',
                    left: '-20px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: theme.colors.surface,
                    border: `1px solid ${theme.colors.border}`,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: theme.colors.text,
                    zIndex: 10,
                  }}
                  className="carousel-btn-left"
                >
                  <ChevronLeftIcon />
                </motion.button>

                <div
                  ref={scrollRef}
                  style={{
                    display: 'flex',
                    gap: '16px',
                    overflowX: 'auto',
                    scrollSnapType: 'x mandatory',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    paddingBottom: '8px',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                  className="carousel-scroll"
                >
                  {filteredGames.map((game) => (
                    <div
                      key={game.id}
                      className="carousel-card-wrapper carousel-card-wrapper-small"
                      style={{
                        flexShrink: 0,
                        scrollSnapAlign: 'start',
                      }}
                    >
                      <GameCard game={game} size="small" />
                    </div>
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={scrollRight}
                  style={{
                    position: 'absolute',
                    right: '-20px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: theme.colors.surface,
                    border: `1px solid ${theme.colors.border}`,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: theme.colors.text,
                    zIndex: 10,
                  }}
                  className="carousel-btn-right"
                >
                  <ChevronRightIcon />
                </motion.button>
              </div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-50px' }}
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${columns}, 1fr)`,
                  gap: '16px',
                }}
                className={`games-grid games-grid-${columns}`}
              >
                {filteredGames.map((game) => (
                  <motion.div key={game.id} variants={itemVariants}>
                    <GameCard game={game} size="small" />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </>
        )}
      </div>

      <style>
        {`
          .tabs-scroll::-webkit-scrollbar,
          .carousel-scroll::-webkit-scrollbar {
            display: none;
          }
          
          .tabs-scroll {
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          
          .carousel-card-wrapper {
            min-width: 292px;
            max-width: 292px;
            aspect-ratio: 1/1;
          }
          
          .carousel-card-wrapper-small {
            min-width: 240px;
            max-width: 240px;
            aspect-ratio: 1/1;
          }
          
          .games-grid-6 {
            grid-template-columns: repeat(6, 1fr);
          }
          .games-grid-5 {
            grid-template-columns: repeat(5, 1fr);
          }
          .games-grid-4 {
            grid-template-columns: repeat(4, 1fr);
          }
          
          @media (max-width: 1200px) {
            .games-grid-6, .games-grid-5 {
              grid-template-columns: repeat(4, 1fr) !important;
            }
          }
          
          @media (max-width: 900px) {
            .games-grid-6, .games-grid-5, .games-grid-4 {
              grid-template-columns: repeat(3, 1fr) !important;
            }
          }
          
          @media (max-width: 768px) {
            .tabs-scroll {
              gap: 6px !important;
              marginBottom: 20px !important;
            }
            .tabs-scroll button {
              padding: 6px 12px !important;
              font-size: 12px !important;
              white-space: nowrap !important;
            }
            .games-grid-6, .games-grid-5, .games-grid-4 {
              grid-template-columns: repeat(2, 1fr) !important;
              gap: 12px !important;
            }
            .carousel-btn-left, .carousel-btn-right {
              display: none !important;
            }
            .carousel-scroll {
              gap: 12px !important;
              padding-left: 0 !important;
              padding-right: 0 !important;
            }
            .carousel-card-wrapper {
              min-width: calc(50vw - 24px) !important;
              max-width: calc(50vw - 24px) !important;
            }
            .carousel-card-wrapper-small {
              min-width: calc(50vw - 24px) !important;
              max-width: calc(50vw - 24px) !important;
            }
          }
          
          @media (max-width: 480px) {
            .game-section-container {
              padding: 0 12px !important;
            }
            .tabs-scroll {
              gap: 4px !important;
              marginBottom: 16px !important;
              paddingLeft: 0 !important;
              paddingRight: 0 !important;
            }
            .tabs-scroll button {
              padding: 6px 10px !important;
              font-size: 11px !important;
            }
            .games-grid-6, .games-grid-5, .games-grid-4 {
              grid-template-columns: repeat(2, 1fr) !important;
              gap: 10px !important;
            }
            .carousel-scroll {
              gap: 10px !important;
              padding-left: 0 !important;
              padding-right: 0 !important;
            }
            .carousel-card-wrapper {
              min-width: calc(50vw - 20px) !important;
              max-width: calc(50vw - 20px) !important;
            }
            .carousel-card-wrapper-small {
              min-width: calc(50vw - 20px) !important;
              max-width: calc(50vw - 20px) !important;
            }
          }
        `}
      </style>
    </section>
  );
}
