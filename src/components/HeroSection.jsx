import React, { useState, useEffect, useCallback } from 'react';
import { gamesApi } from '../services/gamesApi';
import { HeroCarousel } from './home/HeroCarousel';
import { HeroContent } from './home/HeroContent';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

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


export default function HeroSection() {
  const [heroGames, setHeroGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  useEffect(() => {
    const fetchHeroGames = async () => {
      try {
        // Fetch all games for hero carousel - try multiple sources
        let allGames = [];
        
        // Try to get best sellers first
        try {
          const bestSellers = await gamesApi.getBestSellers();
          allGames = [...allGames, ...bestSellers];
        } catch (e) {
          console.warn('Failed to load best sellers:', e);
        }
        
        // Try to get new games
        try {
          const newGames = await gamesApi.getNewGames();
          allGames = [...allGames, ...newGames];
        } catch (e) {
          console.warn('Failed to load new games:', e);
        }
        
        // Try to get random games to fill up
        try {
          const randomGames = await gamesApi.getRandomGames(30);
          allGames = [...allGames, ...randomGames];
        } catch (e) {
          console.warn('Failed to load random games:', e);
        }
        
        // Remove duplicates by id
        const uniqueGames = Array.from(
          new Map(allGames.map(game => [game.id, game])).values()
        );
        
        if (uniqueGames.length > 0) {
          // Transform to hero format with images array
          const transformed = uniqueGames.map(game => ({
            ...game,
            // Use first image from images array or fallback to image
            image: game.images && game.images.length > 0 ? game.images[0] : game.image,
          }));
          setHeroGames(transformed);
          // Set first game as selected
          if (transformed.length > 0) {
            setSelectedGame(transformed[0]);
          }
        }
      } catch (error) {
        console.error('Failed to load hero games:', error);
        setHeroGames([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHeroGames();
  }, []);

  const handleGameSelect = useCallback((game) => {
    setSelectedGame(game);
  }, []);

  const handleBuyClick = useCallback(() => {
    if (selectedGame) {
      addToCart(selectedGame);
    }
  }, [selectedGame, addToCart]);

  const handleWishlistClick = useCallback(() => {
    if (selectedGame) {
      if (isInWishlist(selectedGame.id)) {
        removeFromWishlist(selectedGame.id);
      } else {
        addToWishlist(selectedGame);
      }
    }
  }, [selectedGame, addToWishlist, removeFromWishlist, isInWishlist]);

  // Show loading or empty state
  if (loading) {
    return (
      <section
        style={{
          position: 'relative',
          width: '100%',
          backgroundColor: theme.colors.background,
          padding: '24px 0',
        }}
      >
        <div style={{ color: theme.colors.textSecondary, textAlign: 'center' }}>Loading featured games...</div>
      </section>
    );
  }

  if (!selectedGame || heroGames.length === 0) {
    return null;
  }

  return (
    <section
      style={{
        position: 'relative',
        width: '100%',
        backgroundColor: theme.colors.background,
        marginBottom: '0',
        overflow: 'visible',
      }}
      className="hero-section"
    >
      {/* Main Hero Content */}
      <HeroContent
        game={selectedGame}
        onBuyClick={handleBuyClick}
        onWishlistClick={handleWishlistClick}
      />

      {/* Carousel Slider - Overlay on top */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          maxWidth: '1400px',
          margin: '0 auto',
          padding: 'clamp(12px, 2vw, 16px) clamp(12px, 2vw, 16px) clamp(8px, 1.5vw, 12px)',
          zIndex: 10,
          pointerEvents: 'none',
          maxHeight: 'clamp(140px, 20vw, 160px)',
          overflow: 'hidden',
        }}
        className="hero-carousel-container"
      >
        <div style={{ pointerEvents: 'auto' }}>
          <HeroCarousel
            games={heroGames}
            selectedGame={selectedGame}
            onGameSelect={handleGameSelect}
            autoPlay={true}
            autoPlayInterval={5000}
          />
        </div>
      </div>
      <style>{`
        @media (max-width: 768px) {
          .hero-section {
            margin-bottom: 0 !important;
          }
          .hero-carousel-container {
            padding: 12px 12px 8px !important;
            max-height: 140px !important;
          }
        }
        @media (max-width: 480px) {
          .hero-carousel-container {
            padding: 10px 8px 6px !important;
            max-height: 120px !important;
          }
        }
      `}</style>
    </section>
  );
}
