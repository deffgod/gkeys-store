// UI-Kit: Core Components for GKEYS
import React, { useState, createContext, useContext, useRef, useEffect } from 'react';
// Import centralized design tokens
import { colors, spacing, borderRadius, breakpoints, typography, animations, shadows } from '../styles/design-tokens';
import catalogIcon from '../assets/catalog.svg';
import mediaIcon from '../assets/media.svg';
import wishlistIcon from '../assets/wishlist.svg';
import cartIcon from '../assets/cart.svg';

// ============ THEME & CONTEXT ============
const ThemeContext = createContext();

// Use centralized design tokens - single source of truth
export const theme = {
  colors,
  spacing,
  borderRadius,
  breakpoints,
  animations,
  shadows,
};

// ============ STYLES ============
const styles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: ${typography.fontFamily};
    background-color: ${theme.colors.background};
    color: ${theme.colors.text};
    line-height: 1.5;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  button {
    cursor: pointer;
    border: none;
    background: none;
    font-family: inherit;
  }

  input {
    font-family: inherit;
  }

  /* Scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: ${theme.colors.surface};
  }

  ::-webkit-scrollbar-thumb {
    background: ${theme.colors.surfaceLight};
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${theme.colors.surfaceHover};
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

// Inject global styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

// ============ BUTTON COMPONENT ============
export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  disabled = false,
  loading = false,
  icon,
  onClick,
  className = '',
  ...props 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontWeight: '600',
    borderRadius: theme.borderRadius.md,
    transition: theme.animations.transitions.all,
    cursor: (disabled || loading) ? 'not-allowed' : 'pointer',
    opacity: (disabled || loading) ? 0.6 : 1,
    width: fullWidth ? '100%' : 'auto',
    position: 'relative',
    overflow: 'hidden',
    transform: isHovered && !disabled && !loading ? 'translateY(-1px)' : 'translateY(0)',
    boxShadow: isHovered && !disabled && !loading
      ? (variant === 'primary' ? theme.shadows.glow : theme.shadows.sm)
      : 'none',
  };

  const getVariantStyles = () => {
    const base = {
      primary: {
        backgroundColor: isHovered && !disabled ? theme.colors.accent : theme.colors.primary,
        color: '#000000',
        border: 'none',
      },
      secondary: {
        backgroundColor: isHovered && !disabled ? theme.colors.surfaceHover : 'transparent',
        color: theme.colors.text,
        border: `1px solid ${isHovered && !disabled ? theme.colors.primary : theme.colors.border}`,
      },
      ghost: {
        backgroundColor: isHovered && !disabled ? theme.colors.surfaceHover : 'transparent',
        color: theme.colors.text,
        border: 'none',
      },
      outline: {
        backgroundColor: isHovered && !disabled ? `${theme.colors.primary}15` : 'transparent',
        color: theme.colors.primary,
        border: `1px solid ${theme.colors.primary}`,
      },
    };
    return base[variant];
  };

  const sizes = {
    sm: { padding: '8px 16px', fontSize: '14px' },
    md: { padding: '12px 24px', fontSize: '16px' },
    lg: { padding: '16px 32px', fontSize: '18px' },
  };

  const focusRingStyle = isFocused && !disabled ? {
    outline: `2px solid ${theme.colors.primary}`,
    outlineOffset: '2px',
  } : {};

  return (
    <button
      style={{ ...baseStyles, ...getVariantStyles(), ...sizes[size], ...focusRingStyle }}
      onClick={onClick}
      disabled={disabled}
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      {...props}
    >
      {loading && (
        <span style={{ 
          display: 'inline-block',
          width: '16px',
          height: '16px',
          border: `2px solid ${variant === 'primary' ? '#000' : theme.colors.text}`,
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 0.6s linear infinite',
        }} />
      )}
      {!loading && icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
      {!loading && children}
    </button>
  );
};

// ============ INPUT COMPONENT ============
export const Input = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  icon,
  error,
  fullWidth = false,
  size = 'md',
  className = '',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  const containerStyle = {
    position: 'relative',
    width: fullWidth ? '100%' : 'auto',
    display: 'inline-flex',
    alignItems: 'center',
  };

  const sizes = {
    sm: { padding: '8px 12px', fontSize: '14px' },
    md: { padding: '12px 16px', fontSize: '16px' },
    lg: { padding: '16px 20px', fontSize: '18px' },
  };

  const inputStyle = {
    width: '100%',
    backgroundColor: theme.colors.surface,
    border: `1px solid ${error ? theme.colors.error : isFocused ? theme.colors.primary : theme.colors.border}`,
    borderRadius: theme.borderRadius.md,
    color: theme.colors.text,
    outline: 'none',
    transition: theme.animations.transitions.all,
    paddingLeft: icon ? '44px' : sizes[size].padding,
    boxShadow: isFocused && !error 
      ? `0 0 0 3px ${theme.colors.primary}20`
      : 'none',
    ...sizes[size],
  };

  const iconStyle = {
    position: 'absolute',
    left: '16px',
    color: isFocused ? theme.colors.primary : theme.colors.textSecondary,
    pointerEvents: 'none',
    transition: theme.animations.transitions.colors,
    zIndex: 1,
  };

  return (
    <div style={containerStyle} className={className}>
      {icon && <span style={iconStyle}>{icon}</span>}
      <input
        ref={inputRef}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={inputStyle}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />
    </div>
  );
};

// ============ CARD COMPONENT ============
export const Card = ({
  children,
  padding = 'md',
  hover = false,
  onClick,
  className = '',
  style = {},
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const paddings = {
    none: '0',
    sm: theme.spacing.sm,
    md: theme.spacing.md,
    lg: theme.spacing.lg,
  };

  const cardStyle = {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: paddings[padding],
    transition: theme.animations.transitions.all,
    cursor: onClick ? 'pointer' : 'default',
    transform: hover && isHovered ? 'translateY(-4px) scale(1.01)' : 'scale(1)',
    boxShadow: hover && isHovered 
      ? theme.shadows.card
      : 'none',
    border: hover && isHovered 
      ? `1px solid ${theme.colors.primary}40`
      : `1px solid transparent`,
    ...style,
  };

  return (
    <div
      style={cardStyle}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={className}
      {...props}
    >
      {children}
    </div>
  );
};

// ============ GAME CARD COMPONENT ============
export const GameCard = ({
  image,
  title,
  price,
  originalPrice,
  discount,
  badges = [],
  onBuy,
  onWishlist,
  onClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const cardStyle = {
    width: '100%',
    maxWidth: '200px',
    cursor: 'pointer',
    transition: theme.animations.transitions.all,
    transform: isHovered ? 'translateY(-6px) scale(1.02)' : 'translateY(0) scale(1)',
  };

  const imageContainerStyle = {
    position: 'relative',
    width: '100%',
    aspectRatio: '3/4',
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    marginBottom: theme.spacing.sm,
  };

  const imageStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: theme.animations.transitions.all,
    transform: isHovered ? 'scale(1.05)' : 'scale(1)',
  };

  const badgeContainerStyle = {
    position: 'absolute',
    top: theme.spacing.sm,
    left: theme.spacing.sm,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.xs,
  };

  const badgeStyle = {
    backgroundColor: theme.colors.primary,
    color: '#000',
    padding: '4px 8px',
    borderRadius: theme.borderRadius.sm,
    fontSize: '12px',
    fontWeight: '600',
  };

  const priceContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  };

  const currentPriceStyle = {
    color: theme.colors.text,
    fontSize: '16px',
    fontWeight: '600',
  };

  const originalPriceStyle = {
    color: theme.colors.textMuted,
    fontSize: '14px',
    textDecoration: 'line-through',
  };

  const discountStyle = {
    backgroundColor: theme.colors.primary,
    color: '#000',
    padding: '2px 6px',
    borderRadius: theme.borderRadius.sm,
    fontSize: '12px',
    fontWeight: '600',
  };

  return (
    <div
      style={cardStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div style={imageContainerStyle}>
        <img src={image} alt={title} style={imageStyle} />
        {badges.length > 0 && (
          <div style={badgeContainerStyle}>
            {badges.map((badge, index) => (
              <span key={index} style={badgeStyle}>{badge}</span>
            ))}
          </div>
        )}
      </div>
      <div style={priceContainerStyle}>
        <span style={currentPriceStyle}>{price}€</span>
        {originalPrice && (
          <>
            <span style={originalPriceStyle}>{originalPrice}€</span>
            {discount && <span style={discountStyle}>{discount}</span>}
          </>
        )}
      </div>
    </div>
  );
};

// ============ BADGE COMPONENT ============
export const Badge = ({
  children,
  variant = 'primary',
  size = 'md',
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const variants = {
    primary: { backgroundColor: theme.colors.primary, color: '#000' },
    secondary: { backgroundColor: theme.colors.surface, color: theme.colors.text },
    success: { backgroundColor: theme.colors.success, color: '#000' },
    warning: { backgroundColor: theme.colors.warning, color: '#000' },
    error: { backgroundColor: theme.colors.error, color: '#fff' },
  };

  const sizes = {
    sm: { padding: '2px 6px', fontSize: '10px' },
    md: { padding: '4px 8px', fontSize: '12px' },
    lg: { padding: '6px 12px', fontSize: '14px' },
  };

  const style = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.sm,
    fontWeight: '600',
    transition: theme.animations.transitions.all,
    transform: isHovered ? 'scale(1.05)' : 'scale(1)',
    ...variants[variant],
    ...sizes[size],
  };

  return (
    <span 
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </span>
  );
};

// ============ ICON COMPONENTS ============
export const Icons = {
  Search: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8"/>
      <path d="M21 21l-4.35-4.35"/>
    </svg>
  ),
  Heart: ({ filled = false }) => (
    <img 
      src={wishlistIcon} 
      alt="Wishlist" 
      width="20" 
      height="20" 
      style={{ 
        display: 'block',
        opacity: filled ? 1 : 0.6,
        filter: filled ? 'none' : 'brightness(0.8)'
      }} 
    />
  ),
  Cart: () => (
    <img src={cartIcon} alt="Cart" width="20" height="20" style={{ display: 'block' }} />
  ),
  Grid: () => (
    <img src={catalogIcon} alt="Catalog" width="20" height="20" style={{ display: 'block' }} />
  ),
  Menu: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  ),
  Close: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  ChevronDown: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6,9 12,15 18,9"/>
    </svg>
  ),
  ChevronRight: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="9,18 15,12 9,6"/>
    </svg>
  ),
  Plus: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Minus: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Trash: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3,6 5,6 21,6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
  ),
  Home: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9,22 9,12 15,12 15,22"/>
    </svg>
  ),
  News: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1m2 13a2 2 0 0 1-2-2V7m2 13a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2"/>
    </svg>
  ),
  Bolt: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/>
    </svg>
  ),
  Article: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14,2 14,8 20,8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  Steam: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 5.5 3.7 10.1 8.8 11.5l3.1-4.4c-1.3-.1-2.5-.5-3.5-1.2l-2.2 3.1C2.6 19.4 0 15.9 0 12 0 5.4 5.4 0 12 0zm0 2c5.5 0 10 4.5 10 10s-4.5 10-10 10c-1.8 0-3.5-.5-5-1.3l2.2-3.1c.9.5 1.8.8 2.8.8 3.3 0 6-2.7 6-6s-2.7-6-6-6-6 2.7-6 6c0 1.1.3 2.1.8 3l-2.2 3.1C2.5 17.4 2 14.8 2 12 2 6.5 6.5 2 12 2z"/>
    </svg>
  ),
  Key: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
    </svg>
  ),
  Telegram: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  ),
  Instagram: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  ),
  User: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  CreditCard: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
      <line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  ),
  Media: () => (
    <img src={mediaIcon} alt="Media" width="20" height="20" style={{ display: 'block' }} />
  ),
};

// ============ CONTAINER COMPONENT ============
export const Container = ({ children, maxWidth = '1280px', padding = true }) => {
  const style = {
    width: '100%',
    maxWidth,
    margin: '0 auto',
    padding: padding ? `0 ${theme.spacing.lg}` : '0',
  };

  return <div style={style}>{children}</div>;
};

// ============ GRID COMPONENT ============
export const Grid = ({ children, columns = 4, gap = 'md', style = {} }) => {
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: theme.spacing[gap],
    ...style,
  };

  return <div style={gridStyle}>{children}</div>;
};

// ============ TOOLTIP COMPONENT ============
export const Tooltip = ({ children, content, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef(null);

  const positions = {
    top: { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '8px' },
    bottom: { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '8px' },
    left: { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: '8px' },
    right: { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: '8px' },
  };

  const tooltipStyle = {
    position: 'absolute',
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
    borderRadius: theme.borderRadius.sm,
    fontSize: '12px',
    whiteSpace: 'nowrap',
    zIndex: 1000,
    opacity: isVisible ? 1 : 0,
    pointerEvents: 'none',
    transition: theme.animations.transitions.opacity,
    boxShadow: theme.shadows.md,
    border: `1px solid ${theme.colors.border}`,
    ...positions[position],
  };

  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      ref={tooltipRef}
    >
      {children}
      {content && (
        <div style={tooltipStyle}>
          {content}
        </div>
      )}
    </div>
  );
};

// ============ SECTION COMPONENT ============
export const Section = ({ title, action, children }) => {
  const sectionStyle = {
    marginBottom: theme.spacing.xxl,
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  };

  const titleStyle = {
    fontSize: '24px',
    fontWeight: '600',
    color: theme.colors.text,
  };

  const actionStyle = {
    color: theme.colors.primary,
    fontSize: '14px',
    cursor: 'pointer',
    transition: theme.animations.transitions.colors,
    textDecoration: 'none',
    ':hover': {
      color: theme.colors.accent,
    },
  };

  return (
    <section style={sectionStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>{title}</h2>
        {action && (
          <a 
            href="#" 
            style={actionStyle}
            onMouseEnter={(e) => e.target.style.color = theme.colors.accent}
            onMouseLeave={(e) => e.target.style.color = theme.colors.primary}
          >
            {action}
          </a>
        )}
      </div>
      {children}
    </section>
  );
};

export default {
  theme,
  Button,
  Input,
  Card,
  GameCard,
  Badge,
  Icons,
  Container,
  Grid,
  Section,
  Tooltip,
};

