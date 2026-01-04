/**
 * Admin Panel Mobile-Optimized Styles
 * Shared styles for admin components optimized for mobile devices
 */

export const adminTheme = {
  colors: {
    primary: '#00C8C2',
    primaryDark: '#059669',
    background: '#0D0D0D',
    surface: '#1A1A1A',
    surfaceLight: '#2A2A2A',
    text: '#FFFFFF',
    textSecondary: '#999999',
    textMuted: '#666666',
    border: '#333333',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
  breakpoints: {
    mobile: 768,
    tablet: 1024,
  },
};

/**
 * Mobile-optimized button style
 * Minimum 44x44px touch target for mobile
 */
export const adminButtonStyle: React.CSSProperties = {
  padding: '14px 24px', // Increased padding for better touch targets
  borderRadius: '8px',
  border: 'none',
  cursor: 'pointer',
  fontWeight: '500',
  fontSize: '14px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  transition: 'all 0.2s',
  minHeight: '44px', // Minimum touch target size (iOS/Android guidelines)
  minWidth: '44px',
  WebkitTapHighlightColor: 'transparent',
  userSelect: 'none' as const,
};

/**
 * Mobile-optimized input style
 */
export const adminInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px 16px', // Increased padding for better touch targets
  backgroundColor: adminTheme.colors.surfaceLight,
  border: `1px solid ${adminTheme.colors.border}`,
  borderRadius: '8px',
  color: adminTheme.colors.text,
  fontSize: '16px', // Prevent zoom on iOS
  outline: 'none',
  minHeight: '44px', // Minimum touch target size
  boxSizing: 'border-box' as const,
  WebkitAppearance: 'none' as const,
};

/**
 * Mobile-optimized container style
 */
export const adminContainerStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '100%',
  padding: '16px',
  boxSizing: 'border-box' as const,
};

/**
 * Responsive grid style
 */
export const getResponsiveGridStyle = (columns: { mobile: number; tablet: number; desktop: number }) => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${columns.desktop}, 1fr)`,
  gap: '20px',
  '@media (max-width: 1024px)': {
    gridTemplateColumns: `repeat(${columns.tablet}, 1fr)`,
    gap: '16px',
  },
  '@media (max-width: 768px)': {
    gridTemplateColumns: `repeat(${columns.mobile}, 1fr)`,
    gap: '12px',
  },
});

/**
 * Mobile-optimized card style
 */
export const adminCardStyle: React.CSSProperties = {
  backgroundColor: adminTheme.colors.surface,
  borderRadius: '12px',
  padding: '20px',
  border: `1px solid ${adminTheme.colors.border}`,
  '@media (max-width: 768px)': {
    padding: '16px',
  },
};
