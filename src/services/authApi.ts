import apiClient from './api';  
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://gkeys2.vercel.app';
const AUTH_URL = API_BASE_URL + '/auth';


export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  nickname?: string;
  firstName?: string;
  lastName?: string;
}

// AuthResponse matches backend structure from backend/src/types/auth.ts
// Backend provides 'nickname' (required), frontend transforms to 'name' via transformUser
export interface AuthResponse {
  user: {
    id: string;
    email: string;
    nickname: string; // Backend always provides nickname (required)
    firstName?: string;
    lastName?: string;
    avatar?: string;
    role: string;
  };
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

// Auth API methods
export const authApi = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      if (import.meta.env.DEV) {
        console.log('🔐 Attempting login for:', credentials.email);
      }
      
      const response = await apiClient.post<{ success: boolean; data: AuthResponse }>(AUTH_URL + '/login', credentials);
      
      // Check if response has success wrapper
      const authData = response.success ? response.data : response as unknown as AuthResponse;
      
      // Set token in API client
      if (authData.token) {
        apiClient.setToken(authData.token);
      }
      
      if (import.meta.env.DEV) {
        console.log('✅ Login successful');
      }
      
      return authData;
    } catch (error) {
      console.error('❌ Login error:', error);
      // Re-throw with improved message
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Login failed. Please check your credentials and try again.');
    }
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      if (import.meta.env.DEV) {
        console.log('📝 Attempting registration for:', data.email);
      }
      
      // Map data to match backend expectations
      const requestData = {
        email: data.email,
        password: data.password,
        nickname: data.nickname,
        firstName: data.firstName,
        lastName: data.lastName,
      };

      if (import.meta.env.DEV) {
        console.log('📤 Sending registration request:', { email: requestData.email, hasNickname: !!requestData.nickname });
      }

      const response = await apiClient.post<{ success: boolean; data: AuthResponse }>(AUTH_URL + '/register', requestData);
      
      // Check if response has success wrapper
      const authData = response.success ? response.data : response as unknown as AuthResponse;
      
      // Set token in API client
      if (authData.token) {
        apiClient.setToken(authData.token);
      }
      
      if (import.meta.env.DEV) {
        console.log('✅ Registration successful');
      }
      
      return authData;
    } catch (error) {
      console.error('❌ Register error:', error);
      // Improve error message
      if (error instanceof Error) {
        let message = error.message;
        
        // Provide more helpful error messages
        if (message.includes('HTTP 405')) {
          message = 'Registration endpoint is not available. Please check if the server is running correctly.';
        } else if (message.includes('HTTP 409')) {
          message = 'This email is already registered. Please use a different email or try logging in.';
        } else if (message.includes('HTTP 400')) {
          message = 'Invalid registration data. Please check your input and try again.';
        } else if (message.includes('HTTP 500')) {
          message = 'Server error during registration. Please try again later.';
        } else if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
          message = 'Network error. Please check your internet connection and ensure the server is running.';
        } else if (!message.includes('HTTP')) {
          message = `Registration failed: ${message}`;
        }
        
        throw new Error(message);
      }
      throw new Error('Registration failed. Please try again.');
    }
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post(AUTH_URL + '/logout');
      
      // Clear token from API client
      apiClient.setToken(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Clear token even if logout request fails
      apiClient.setToken(null);
      throw error;
    }
  },

  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
      const response = await apiClient.post<{ success: boolean; data: RefreshTokenResponse }>('/auth/refresh', {
        refreshToken,
      });
      
      // Check if response has success wrapper
      const tokenData = response.success ? response.data : response as unknown as RefreshTokenResponse;
      
      // Update token in API client
      apiClient.setToken(tokenData.token);
      
      return tokenData;
    } catch (error) {
      console.error('Refresh token error:', error);
      throw error;
    }
  },

  async forgotPassword(data: ForgotPasswordRequest): Promise<{ message: string }> {
    try {
      return await apiClient.post(AUTH_URL + '/forgot-password', data);
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  },

  async resetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
    try {
      return await apiClient.post(AUTH_URL + '/reset-password', data);
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  },

  async verifyEmail(token: string): Promise<{ message: string }> {
    try {
      return await apiClient.post(AUTH_URL + '/verify-email', { token });
    } catch (error) {
      console.error('Verify email error:', error);
      throw error;
    }
  },

  async getCurrentUser(): Promise<{
    id: string;
    email: string;
    nickname: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    role: string;
  }> {
    try {
      const response = await apiClient.get<{ success: boolean; data: {
        id: string;
        email: string;
        nickname: string;
        firstName?: string;
        lastName?: string;
        avatar?: string;
        role: string;
      } }>(AUTH_URL + '/me');
      
      // Check if response has success wrapper
      const userData = response.success ? response.data : response as unknown as {
        id: string;
        email: string;
        nickname: string;
        firstName?: string;
        lastName?: string;
        avatar?: string;
        role: string;
      };
      
      return userData;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  },
};

export default authApi;

