import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { colors } from '@/styles/design-tokens';

const ChevronRightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-label="Next">
    <title>Next</title>
    <polyline points="9,18 15,12 9,6"/>
  </svg>
);

const ChevronLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: 'rotate(180deg)' }} aria-label="Previous">
    <title>Previous</title>
    <polyline points="9,18 15,12 9,6"/>
  </svg>
);

interface Game {
  id: string;
  title: string;
  image: string;
  shortDescription?: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  slug: string;
}

interface HeroCarouselProps {
  games: Game[];
  selectedGame: Game | null;
  onGameSelect: (game: Game) => void;
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({
  games,
  selectedGame,
  onGameSelect,
  autoPlay = true,
  autoPlayInterval = 5000,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const autoPlayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const updateScrollState = useCallback(() => {
    if (!containerRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
    // Use requestAnimationFrame for smooth updates
    requestAnimationFrame(() => {
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    });
  }, []);

  const scrollLeft = useCallback(() => {
    if (!containerRef.current) return;
    containerRef.current.scrollBy({ left: -140, behavior: 'smooth' });
  }, []);

  const scrollRight = useCallback(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const { scrollLeft, scrollWidth, clientWidth } = container;

    if (scrollLeft >= scrollWidth - clientWidth - 10) {
      container.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      container.scrollBy({ left: 140, behavior: 'smooth' });
    }
  }, []);

  const startAutoPlay = useCallback(() => {
    if (!autoPlay || autoPlayTimerRef.current) return;

    autoPlayTimerRef.current = setInterval(() => {
      scrollRight();
    }, autoPlayInterval);
  }, [autoPlay, autoPlayInterval, scrollRight]);

  const stopAutoPlay = useCallback(() => {
    if (autoPlayTimerRef.current) {
      clearInterval(autoPlayTimerRef.current);
      autoPlayTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    updateScrollState();
    if (autoPlay) {
      startAutoPlay();
    }

    const container = containerRef.current;
    if (container) {
      // Use passive listener for better performance
      container.addEventListener('scroll', updateScrollState, { passive: true });
    }

    return () => {
      stopAutoPlay();
      if (container) {
        container.removeEventListener('scroll', updateScrollState);
      }
    };
  }, [autoPlay, updateScrollState, startAutoPlay, stopAutoPlay]);

  return (
    <div style={{ position: 'relative', marginBottom: '16px', pointerEvents: 'auto', zIndex: 15 }}>
      {canScrollLeft && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={scrollLeft}
          onMouseEnter={stopAutoPlay}
          onMouseLeave={() => autoPlay && startAutoPlay()}
          style={{
            position: 'absolute',
            left: '4px',
            top: '50%',
            transform: 'translateY(-50%) translateZ(0)',
            zIndex: 20,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: '#fff',
            padding: 'clamp(6px, 1.5vw, 8px)',
            borderRadius: '50%',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            willChange: 'transform',
            minWidth: '32px',
            minHeight: '32px',
          }}
          aria-label="Previous"
        >
          <ChevronLeftIcon />
        </motion.button>
      )}

      <div
        ref={containerRef}
          style={{
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            scrollSnapType: 'x mandatory',
            display: 'flex',
            gap: 'clamp(8px, 2vw, 12px)',
            padding: '8px 0',
            willChange: 'scroll-position',
            WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
          }}
        onMouseEnter={stopAutoPlay}
        onMouseLeave={() => autoPlay && startAutoPlay()}
      >
        <style>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {games.map((game, index) => {
          const isSelected = selectedGame?.id === game.id;
          return (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
              }}
              transition={{ 
                delay: Math.min(index * 0.03, 0.3),
                duration: 0.2,
                ease: [0.4, 0, 0.2, 1],
              }}
              onClick={() => onGameSelect(game)}
              style={{
                flexShrink: 0,
                width: 'clamp(80px, 15vw, 120px)',
                height: 'clamp(80px, 15vw, 120px)',
                borderRadius: '12px',
                overflow: 'hidden',
                cursor: 'pointer',
                border: isSelected ? `3px solid ${colors.accent}` : '2px solid transparent',
                scrollSnapAlign: 'start',
                position: 'relative',
                pointerEvents: 'auto',
                zIndex: 11,
                willChange: 'transform',
                transform: 'translateZ(0)', // GPU acceleration
              }}
              className="hero-carousel-item"
              whileHover={{ 
                scale: 1.1,
                transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
              }}
              whileTap={{ scale: 0.98 }}
            >
              <img
                src={game.image}
                alt={game.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  willChange: 'transform',
                  transform: 'translateZ(0)', // GPU acceleration
                }}
                loading="lazy"
              />
              {isSelected && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(135deg, rgba(0, 200, 194, 0.2) 0%, transparent 100%)',
                    pointerEvents: 'none',
                    willChange: 'opacity',
                  }}
                />
              )}
              {/* Optimized box-shadow using pseudo-element for selected state */}
              {isSelected && (
                <div
                  style={{
                    position: 'absolute',
                    inset: '-4px',
                    borderRadius: '16px',
                    boxShadow: '0 0 20px rgba(0, 200, 194, 0.6), 0 0 40px rgba(0, 200, 194, 0.3)',
                    pointerEvents: 'none',
                    zIndex: -1,
                    willChange: 'opacity',
                  }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {canScrollRight && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={scrollRight}
          onMouseEnter={stopAutoPlay}
          onMouseLeave={() => autoPlay && startAutoPlay()}
          style={{
            position: 'absolute',
            right: '4px',
            top: '50%',
            transform: 'translateY(-50%) translateZ(0)',
            zIndex: 20,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: '#fff',
            padding: 'clamp(6px, 1.5vw, 8px)',
            borderRadius: '50%',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            willChange: 'transform',
            minWidth: '32px',
            minHeight: '32px',
          }}
          aria-label="Next"
        >
          <ChevronRightIcon />
        </motion.button>
      )}
      <style>{`
        @media (max-width: 768px) {
          .hero-carousel-item {
            width: 100px !important;
            height: 100px !important;
          }
        }
        @media (max-width: 480px) {
          .hero-carousel-item {
            width: 80px !important;
            height: 80px !important;
            border-radius: 8px !important;
          }
        }
      `}</style>
    </div>
  );
};

