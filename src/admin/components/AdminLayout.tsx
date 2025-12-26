import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from './AdminSidebar';
import { typography } from '../../styles/design-tokens';

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

  // Check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Check if user has ADMIN role
  if (user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: theme.colors.background,
      color: theme.colors.text,
      fontFamily: typography.fontFamily,
    }}>
      <AdminSidebar />
      <main style={{
        flex: 1,
        marginLeft: '260px',
        padding: '24px',
        overflowY: 'auto',
      }}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;

