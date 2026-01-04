import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export default function ProtectedRoute({ children, redirectTo = '/' }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, refreshToken } = useAuth();
  const location = useLocation();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Try to refresh token if not authenticated but we have a refresh token
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isRefreshing) {
      const refreshTokenStored = localStorage.getItem('gkeys_refresh_token');
      if (refreshTokenStored) {
        setIsRefreshing(true);
        refreshToken()
          .then(() => {
            // Token refreshed successfully, component will re-render with isAuthenticated=true
          })
          .catch(() => {
            // Refresh failed, will redirect below
          })
          .finally(() => {
            setIsRefreshing(false);
          });
      }
    }
  }, [isLoading, isAuthenticated, isRefreshing, refreshToken]);

  // Show loading state while checking authentication or refreshing token
  if (isLoading || isRefreshing) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#0D0D0D',
          color: '#FFFFFF',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              border: '3px solid #333333',
              borderTopColor: '#00C8C2',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <p style={{ fontSize: '14px', color: '#999999' }}>
            {isRefreshing ? 'Refreshing session...' : 'Loading...'}
          </p>
        </div>
        <style>
          {`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  // Redirect to login if not authenticated (after refresh attempt)
  if (!isAuthenticated) {
    // Save the attempted location for redirecting after login
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Render children if authenticated
  return <>{children}</>;
}

