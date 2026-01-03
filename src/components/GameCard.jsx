import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { colors } from '../styles/design-tokens';
import bestSellerBadge from '../assets/best-sellers-full-badge.png';
import newBadge from '../assets/new-games-full-badge.png';
import preorderBadge from '../assets/preorder-full-badge.png';
import wishlistIcon from '../assets/wishlist.svg';
import cartIcon from '../assets/cart.svg';

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

// Heart icon
const HeartIcon = ({ filled }) => (
  <img 
    src={wishlistIcon} 
    alt="Wishlist" 
    width="18" 
    height="18" 
    style={{ 
      display: 'block',
      opacity: filled ? 1 : 0.6,
      filter: filled ? 'none' : 'brightness(0.8)'
    }} 
  />
);

// Cart icon
const CartIcon = () => (
  <img src={cartIcon} alt="Cart" width="18" height="18" style={{ display: 'block' }} />
);

export default function GameCard({ game, size = 'medium', showNewBadge = false }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const sizeStyles = {
    small: {
      width: '100%',
      aspectRatio: '1/1',
    },
    medium: {
      width: '100%',
      aspectRatio: '1/1',
    },
    large: {
      width: '100%',
      aspectRatio: '1/1',
    },
  };

  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
  };

  const handleCartClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Add to cart:', game.title);
  };

  const borderRadiusMap = {
    small: '24px',
    medium: '36px',
    large: '12px',
  };

  return (
    <Link to={`/game/${game.slug}`} style={{ textDecoration: 'none' }}>
      <motion.div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'relative',
          borderRadius: borderRadiusMap[size] || '12px',
          overflow: 'hidden',
          backgroundColor: theme.colors.surface,
          cursor: 'pointer',
          ...sizeStyles[size],
        }}
      >
        {/* Best Seller Badge */}
        {game.isBestSeller && (
          <img
            src={bestSellerBadge}
            alt="Best Seller"
            style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              zIndex: 10,
              width: 'auto',
              height: '24px',
            }}
          />
        )}

        {/* Preorder Badge */}
        {game.isPreorder && (
          <img
            src={preorderBadge}
            alt="Pre-order"
            style={{
              position: 'absolute',
              top: '8px',
              left: game.isBestSeller ? '80px' : '8px',
              zIndex: 10,
              width: 'auto',
              height: '24px',
            }}
          />
        )}

        {/* "New" Badge */}
        {(game.isNew || showNewBadge) && (
          <img
            src={newBadge}
            alt="New"
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              zIndex: 10,
              width: 'auto',
              height: '24px',
            }}
          />
        )}

        {/* Out of Stock Badge */}
        {!game.inStock && !(game.isNew || showNewBadge) && (
          <div
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              zIndex: 10,
              backgroundColor: 'rgba(255, 68, 68, 0.9)',
              color: '#fff',
              padding: '4px 8px',
              borderRadius: '50px',
              fontSize: '10px',
              fontWeight: '600',
            }}
          >
            Out of Stock
          </div>
        )}

        {/* Game Image */}
        <div
          style={{
            width: '100%',
            height: '100%',
            position: 'relative',
          }}
        >
          <img
            src={game.image}
            alt={game.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.3s ease',
              transform: isHovered ? 'scale(1.05)' : 'scale(1)',
            }}
            loading="lazy"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/300x400?text=Game';
            }}
          />

          {/* Hover Actions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              zIndex: 10,
            }}
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleWishlistClick}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isWishlisted ? theme.colors.primary : '#fff',
              }}
            >
              <HeartIcon filled={isWishlisted} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleCartClick}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: theme.colors.primary,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000',
              }}
            >
              <CartIcon />
            </motion.button>
          </motion.div>

          {/* Price Overlay */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '40px 12px 12px',
              background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 50%, transparent 100%)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: theme.colors.text,
                }}
              >
                {game.price}€
              </span>
              {game.originalPrice && (
                <span
                  style={{
                    fontSize: '12px',
                    color: theme.colors.textMuted,
                    textDecoration: 'line-through',
                  }}
                >
                  {game.originalPrice}€
                </span>
              )}
              {game.discount && (
                <span
                  style={{
                    backgroundColor: theme.colors.primary,
                    color: '#000',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '700',
                  }}
                >
                  -{game.discount}%
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
