import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import HeroSection from '../components/HeroSection';
import GameSection from '../components/GameSection';
import GameCard from '../components/GameCard';
import { gamesApi } from '../services/gamesApi';
import { homepageSections } from '../config/homepageSections';
import hitMeWithSmthGoodBg from '../assets/hit-me-with-smth-good-bg.png';

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

// Sparkle icon
const SparkleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-label="Sparkle">
    <title>Sparkle</title>
    <path d="M12 2L14 8L20 10L14 12L12 18L10 12L4 10L10 8L12 2Z" fill="#FFD93D" />
  </svg>
);

// Chevron icons for carousel
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

// Random Picks Section Component
const RandomPicksSection = ({ games, loading }) => {
  const scrollContainerRef = useRef(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div
        style={{
          padding: '60px 80px',
          backgroundColor: theme.colors.background,
        }}
      >
        <div style={{ marginBottom: '32px' }}>
          <div
            style={{
              width: '200px',
              height: '24px',
              backgroundColor: theme.colors.surface,
              borderRadius: '4px',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '16px', overflow: 'hidden' }}>
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              style={{
                minWidth: '292px',
                height: '292px',
                backgroundColor: theme.colors.surface,
                borderRadius: '36px',
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '60px 80px',
        backgroundColor: theme.colors.background,
        backgroundImage: `url(${hitMeWithSmthGoodBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
      }}
    >
      {/* Overlay for better text readability */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 0,
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Section Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '32px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <SparkleIcon />
            <h2
              style={{
                fontSize: '32px',
                fontWeight: '700',
                color: theme.colors.text,
                margin: 0,
              }}
            >
              Hit me with something good
            </h2>
          </div>
        </div>

        {/* Games Carousel */}
        <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
          {games && games.length > 0 ? (
            <div style={{ position: 'relative', width: '100%' }}>
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
                ref={scrollContainerRef}
                style={{
                  display: 'flex',
                  gap: '16px',
                  overflowX: 'auto',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  scrollSnapType: 'x mandatory',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
                className="carousel-scroll"
              >
                {games.map((game) => (
                  <div
                    key={game.id}
                    className="carousel-card-wrapper"
                    style={{
                      flexShrink: 0,
                      scrollSnapAlign: 'start',
                    }}
                  >
                    <GameCard game={game} size="medium" />
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
            <p style={{ color: theme.colors.textSecondary, textAlign: 'center', padding: '40px' }}>
              No games available at the moment.
            </p>
          )}

          <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center' }}>
            <Link to="/catalog" style={{ textDecoration: 'none' }}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  padding: '12px 32px',
                  backgroundColor: theme.colors.primary,
                  color: '#000',
                  border: 'none',
                  borderRadius: '50px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                See more
              </motion.button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to fetch section data based on configuration
const fetchSectionData = async (section) => {
  try {
    const { dataSource } = section;

    if (dataSource.type === 'api') {
      const method = dataSource.method;
      const params = dataSource.params || {};

      switch (method) {
        case 'getBestSellers':
          return { success: true, games: await gamesApi.getBestSellers(params.genre), error: null };
        case 'getNewInCatalog':
          return { success: true, games: await gamesApi.getNewInCatalog(), error: null };
        case 'getPreorders':
          return { success: true, games: await gamesApi.getPreorders(), error: null };
        case 'getNewGames':
          return { success: true, games: await gamesApi.getNewGames(), error: null };
        case 'getGamesByGenre':
          return { success: true, games: await gamesApi.getGamesByGenre(params.genre), error: null };
        default:
          // Fallback to random games if method not found
          console.warn(`Unknown API method: ${method}, falling back to random games`);
          return { success: true, games: await gamesApi.getRandomGames(12), error: null };
      }
    } else if (dataSource.type === 'collection') {
      // For collections, use random games as fallback for now
      // In production, you would have a specific API endpoint for collections
      console.warn(`Collection ${dataSource.collectionId} not implemented, using random games`);
      return { success: true, games: await gamesApi.getRandomGames(12), error: null };
    }

    return {
      success: false,
      games: [],
      error: 'Invalid data source configuration',
    };
  } catch (error) {
    console.error(`Error fetching section ${section.id}:`, error);
    return {
      success: false,
      games: [],
      error: error?.message || 'Failed to load games',
    };
  }
};

export default function HomePage() {
  // Initialize state for all sections
  const [sectionStates, setSectionStates] = useState(() => {
    const initialState = {};
    homepageSections.forEach((section) => {
      initialState[section.id] = {
        id: section.id,
        games: [],
        loading: true,
        error: null,
        lastFetched: null,
        activeTab: null, // Track active tab for sections with tabs
      };
    });
    // Add random picks section state
    initialState['random-picks'] = {
      id: 'random-picks',
      games: [],
      loading: true,
      error: null,
      lastFetched: null,
    };
    return initialState;
  });

  const [randomPicks, setRandomPicks] = useState([]);
  const [randomPicksLoading, setRandomPicksLoading] = useState(true);
  const [bestSellersTabs, setBestSellersTabs] = useState(['All']);

  // Load genres for Best Sellers tabs
  useEffect(() => {
    const loadGenres = async () => {
      try {
        const genres = await gamesApi.getAllGenres();
        // Create tabs: 'All' + genre names
        const genreNames = genres.map(g => g.name);
        setBestSellersTabs(['All', ...genreNames]);
      } catch (error) {
        console.error('Failed to load genres for Best Sellers tabs:', error);
        // Fallback to default tabs
        setBestSellersTabs(['All', 'Adventure', 'Action', 'Sci-Fi', 'Open World', 'Horror', 'RPG', 'Battle Royale']);
      }
    };
    loadGenres();
  }, []);

  // Handle tab change for sections (especially Best Sellers)
  const handleTabChange = async (sectionId, tab) => {
    // Update active tab in state for all sections
    setSectionStates((prev) => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        activeTab: tab,
        loading: sectionId === 'best-sellers', // Only show loading for Best Sellers
      },
    }));

    // For Best Sellers, fetch new data with genre filter
    if (sectionId === 'best-sellers') {
      try {
        const genre = tab === 'All' ? undefined : tab;
        const games = await gamesApi.getBestSellers(genre);
        setSectionStates((prev) => ({
          ...prev,
          [sectionId]: {
            ...prev[sectionId],
            games,
            loading: false,
            error: null,
            lastFetched: Date.now(),
          },
        }));
      } catch (error) {
        console.error(`Error fetching Best Sellers for genre ${tab}:`, error);
        setSectionStates((prev) => ({
          ...prev,
          [sectionId]: {
            ...prev[sectionId],
            loading: false,
            error: error?.message || 'Failed to load games',
          },
        }));
      }
    }
    // For other sections, filtering happens client-side in GameSection component
    // No need to fetch new data - just update activeTab state
  };

  // Fetch data for all sections in parallel
  useEffect(() => {
    const fetchAllSections = async () => {
      // Fetch regular sections
      const sectionPromises = homepageSections.map((section) =>
        fetchSectionData(section).then((result) => ({
          sectionId: section.id,
          ...result,
        }))
      );

      // Fetch random picks separately (20 games)
      const randomPicksPromise = gamesApi
        .getRandomGames(20)
        .then((games) => ({ success: true, games, error: null }))
        .catch((error) => ({
          success: false,
          games: [],
          error: error.message || 'Failed to load random picks',
        }));

      // Wait for all promises to settle
      const results = await Promise.allSettled([...sectionPromises, randomPicksPromise]);

      // Update section states
      results.forEach((result, index) => {
        if (index < homepageSections.length) {
          // Regular section
          const { sectionId, success, games, error } =
            result.status === 'fulfilled' ? result.value : { sectionId: homepageSections[index].id, success: false, games: [], error: 'Failed to fetch' };

          setSectionStates((prev) => ({
            ...prev,
            [sectionId]: {
              id: sectionId,
              games,
              loading: false,
              error: success ? null : error,
              lastFetched: success ? Date.now() : null,
            },
          }));
        } else {
          // Random picks
          const { success, games, error } =
            result.status === 'fulfilled' ? result.value : { success: false, games: [], error: 'Failed to fetch' };

          setRandomPicks(games);
          setRandomPicksLoading(false);
          // Also mark the random-picks section as finished to unblock the homepage skeleton
          setSectionStates((prev) => ({
            ...prev,
            'random-picks': {
              ...prev['random-picks'],
              games,
              loading: false,
              error: success ? null : error,
              lastFetched: success ? Date.now() : null,
            },
          }));
        }
      });
    };

    fetchAllSections();
  }, []);

  // Calculate overall loading state
  const allLoading = useMemo(() => {
    return Object.values(sectionStates).some((state) => state.loading) || randomPicksLoading;
  }, [sectionStates, randomPicksLoading]);

  // Calculate if any section has error
  const hasErrors = useMemo(() => {
    return Object.values(sectionStates).some((state) => state.error !== null);
  }, [sectionStates]);

  // Loading skeleton
  if (allLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: theme.colors.background,
          color: theme.colors.text,
        }}
      >
        {/* Hero Skeleton */}
        <div
          style={{
            height: '600px',
            backgroundColor: theme.colors.surface,
            marginBottom: '60px',
          }}
        />

        {/* Section Skeletons */}
        <div style={{ padding: '0 80px' }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{ marginBottom: '60px' }}>
              <div
                style={{
                  width: '200px',
                  height: '32px',
                  backgroundColor: theme.colors.surface,
                  borderRadius: '4px',
                  marginBottom: '24px',
                }}
              />
              <div style={{ display: 'flex', gap: '16px', overflow: 'hidden' }}>
                {[...Array(6)].map((_, j) => (
                  <div
                    key={j}
                    style={{
                      minWidth: '292px',
                      height: '292px',
                      backgroundColor: theme.colors.surface,
                      borderRadius: '36px',
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
      }}
    >
      {/* Hero Section */}
      <HeroSection />

      {/* Render all sections from configuration */}
      {homepageSections.map((section) => {
        const sectionState = sectionStates[section.id];
        const games = sectionState?.games || [];

        // Use dynamic tabs for Best Sellers (from DB), otherwise use section.tabs
        const tabs = section.id === 'best-sellers' && bestSellersTabs.length > 1
          ? bestSellersTabs
          : section.tabs;

        // Always render section, even if empty (GameSection will handle loading/empty states)
        return (
          <GameSection
            key={section.id}
            sectionId={section.id}
            title={section.title}
            subtitle={section.subtitle}
            description={section.description}
            games={games}
            tabs={tabs}
            showCheckAll={section.display.showCheckAll}
            checkAllLink={section.display.checkAllLink}
            checkAllText={section.display.checkAllText || 'Check all'}
            columns={section.display.columns}
            carousel={section.display.carousel}
            loading={sectionState?.loading}
            error={sectionState?.error}
            onTabChange={handleTabChange}
          />
        );
      })}

      {/* Hit me with something good - Random Picks */}
      <RandomPicksSection games={randomPicks} loading={randomPicksLoading} />
    </div>
  );
}
