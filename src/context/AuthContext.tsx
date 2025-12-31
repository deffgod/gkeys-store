import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authApi } from '../services/authApi';
import apiClient from '../services/api';

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
const REFRESH_TOKEN_KEY = 'gkeys_refresh_token';



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
          // Set token in API client
          apiClient.setToken(storedToken);
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          
          // Verify token is still valid by checking current user
          try {
            const currentUser = await authApi.getCurrentUser();
            // Update user data if changed
            const updatedUser: User = {
              id: currentUser.id,
              email: currentUser.email,
              name: currentUser.name || currentUser.nickname || currentUser.email,
              avatar: currentUser.avatar,
              role: currentUser.role,
            };
            setUser(updatedUser);
            localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
          } catch (error) {
            console.error('Token verification failed:', error);
            // Token invalid, try to refresh
            await refreshToken();
          }
        } else {
          // Token expired, try to refresh
          console.log('Token expired, refreshing...');
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

      // Token is already set in apiClient by authApi.login
      // But we ensure it's set
      apiClient.setToken(response.token);

      // Store in localStorage
      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toISOString());
      
      console.log('✅ Login successful', { userId: user.id, email: user.email });
    } catch (error) {
      console.error('❌ Login failed:', error);
      clearAuth();
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  async function register(email: string, password: string, name: string) {
    setIsLoading(true);
    try {
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

      // Token is already set in apiClient by authApi.register
      // But we ensure it's set
      apiClient.setToken(response.token);

      // Store in localStorage
      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toISOString());
      
      console.log('✅ Registration successful', { userId: user.id, email: user.email });
    } catch (error) {
      console.error('❌ Registration failed:', error);
      clearAuth();
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  async function logout() {
    try {
      // Call logout API
      await authApi.logout();
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('⚠️ Logout API call failed:', error);
      // Continue with logout even if API call fails
    } finally {
      clearAuth();
    }
  }

  async function refreshToken() {
    try {
      const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!storedRefreshToken) {
        console.warn('⚠️ No refresh token available, clearing auth');
        clearAuth();
        return;
      }

      console.log('🔄 Refreshing token...');
      const response = await authApi.refreshToken(storedRefreshToken);

      const expiryTime = new Date();
      expiryTime.setSeconds(expiryTime.getSeconds() + response.expiresIn);

      setToken(response.token);
      
      // Token is already set in apiClient by authApi.refreshToken
      // But we ensure it's set
      apiClient.setToken(response.token);
      
      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toISOString());
      
      console.log('✅ Token refreshed successfully');
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      clearAuth();
      throw error;
    }
  }

  function clearAuth() {
    console.log('🧹 Clearing auth state');
    setUser(null);
    setToken(null);
    apiClient.setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
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

