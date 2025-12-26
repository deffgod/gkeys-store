import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const TOKEN_KEY = 'gkeys_auth_token';
const USER_KEY = 'gkeys_user';
const TOKEN_EXPIRY_KEY = 'gkeys_token_expiry';



export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing auth on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!token) return;

    const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!expiryTime) return;

    const expiryDate = new Date(expiryTime);
    const now = new Date();
    const timeUntilExpiry = expiryDate.getTime() - now.getTime();

    // Refresh 5 minutes before expiry
    const refreshTime = timeUntilExpiry - 5 * 60 * 1000;

    if (refreshTime > 0) {
      const refreshTimer = setTimeout(() => {
        refreshToken();
      }, refreshTime);

      return () => clearTimeout(refreshTimer);
    } else {
      // Token expired, refresh immediately
      refreshToken();
    }
  }, [token]);

  async function checkAuth() {
    setIsLoading(true);
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);
      const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY);

      if (storedToken && storedUser && expiryTime) {
        const expiryDate = new Date(expiryTime);
        const now = new Date();

        if (expiryDate > now) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          
          // Verify token is still valid by checking current user
          try {
            const { authApi } = await import('../services/authApi');
            await authApi.getCurrentUser();
          } catch (error) {
            // Token invalid, try to refresh
            await refreshToken();
          }
        } else {
          // Token expired, try to refresh
          await refreshToken();
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      clearAuth();
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    setIsLoading(true);
    try {
      // Use actual API call
      const { authApi } = await import('../services/authApi');
      const response = await authApi.login({ email, password });

      // Transform response to User format
      const user: User = {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name || response.user.nickname || response.user.email,
        avatar: response.user.avatar,
        role: response.user.role,
      };

      const expiryTime = new Date();
      expiryTime.setSeconds(expiryTime.getSeconds() + response.expiresIn);

      // Store in state
      setUser(user);
      setToken(response.token);

      // Store in localStorage
      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem('gkeys_refresh_token', response.refreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toISOString());
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  async function register(email: string, password: string, name: string) {
    setIsLoading(true);
    try {
      // Use actual API call
      const { authApi } = await import('../services/authApi');
      const response = await authApi.register({ email, password, name });

      // Transform response to User format
      const user: User = {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name || response.user.nickname || response.user.email,
        avatar: response.user.avatar,
        role: response.user.role,
      };

      const expiryTime = new Date();
      expiryTime.setSeconds(expiryTime.getSeconds() + response.expiresIn);

      // Store in state
      setUser(user);
      setToken(response.token);

      // Store in localStorage
      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem('gkeys_refresh_token', response.refreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toISOString());
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  async function logout() {
    try {
      // Call logout API
      const { authApi } = await import('../services/authApi');
      await authApi.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with logout even if API call fails
    } finally {
      clearAuth();
    }
  }

  async function refreshToken() {
    try {
      const storedRefreshToken = localStorage.getItem('gkeys_refresh_token');
      if (!storedRefreshToken) {
        throw new Error('No refresh token available');
      }

      // Use actual API call
      const { authApi } = await import('../services/authApi');
      const response = await authApi.refreshToken(storedRefreshToken);

      const expiryTime = new Date();
      expiryTime.setSeconds(expiryTime.getSeconds() + response.expiresIn);

      setToken(response.token);
      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toISOString());
    } catch (error) {
      console.error('Token refresh failed:', error);
      clearAuth();
    }
  }

  function clearAuth() {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    localStorage.removeItem('gkeys_refresh_token');
  }

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    register,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

