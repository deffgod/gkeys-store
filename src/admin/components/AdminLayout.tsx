import React, { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from './AdminSidebar';
import { typography } from '../../styles/design-tokens';
import '../../admin/styles/adminMobile.css';

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

const AdminLayout: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Check if user has ADMIN role
  if (user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false); // Close sidebar on desktop
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    if (!isMobile || !sidebarOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.admin-sidebar') && !target.closest('.mobile-menu-button')) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, sidebarOpen]);

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: theme.colors.background,
      color: theme.colors.text,
      fontFamily: typography.fontFamily,
      position: 'relative',
    }}>
      {/* Mobile menu button */}
      {isMobile && (
        <button
          className="mobile-menu-button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            position: 'fixed',
            top: '16px',
            left: '16px',
            zIndex: 1001,
            width: '44px',
            height: '44px',
            borderRadius: '8px',
            backgroundColor: theme.colors.surface,
            border: `1px solid ${theme.colors.border}`,
            color: theme.colors.text,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {sidebarOpen ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      )}

      {/* Overlay for mobile */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
          }}
        />
      )}

      <AdminSidebar 
        isMobile={isMobile} 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      <main style={{
        flex: 1,
        marginLeft: isMobile ? 0 : '260px',
        padding: isMobile ? '16px' : '24px',
        paddingTop: isMobile ? '72px' : '24px',
        overflowY: 'auto',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
      }}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;

