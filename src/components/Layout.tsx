import { useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import MobileMenu from './MobileMenu';
import BottomTabBar from './BottomTabBar';
import Header from './layout/Header';
import Footer from './layout/Footer';
// @ts-expect-error - Dynamic import
import AuthModal from './AuthModal';

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

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const { itemCount: cartCount } = useCart();
  const { itemCount: wishlistCount } = useWishlist();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.colors.background, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Header
        onMenuClick={() => setIsMobileMenuOpen(true)}
        onAuthClick={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content */}
      <main style={{ flex: 1, marginTop: 0, paddingTop: 0 }}>{children}</main>

      {/* Footer */}
      <Footer />

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        isAuthenticated={isAuthenticated}
      />

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      {/* Bottom Tab Bar - Mobile Only */}
      <BottomTabBar cartCount={cartCount} wishlistCount={wishlistCount} />

      <style>
        {`
          @media (max-width: 768px) {
            .desktop-nav {
              display: none !important;
            }
            .desktop-search {
              display: none !important;
            }
            .desktop-login {
              display: none !important;
            }
            .mobile-menu-trigger {
              display: flex !important;
            }
          }
        `}
      </style>
    </div>
  );
}
