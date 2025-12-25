import apiClient from './api';  
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
  };
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenResponse {
  token: string;
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
      const response = await apiClient.post<{ success: boolean; data: AuthResponse }>('/auth/login', credentials);
      
      // Check if response has success wrapper
      const authData = response.success ? response.data : response as unknown as AuthResponse;
      
      // Set token in API client
      if (authData.token) {
        apiClient.setToken(authData.token);
      }
      
      return authData;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/register', data);
      
      // Set token in API client
      apiClient.setToken(response.token);
      
      return response;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
      
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
      const response = await apiClient.post<RefreshTokenResponse>('/auth/refresh', {
        refreshToken,
      });
      
      // Update token in API client
      apiClient.setToken(response.token);
      
      return response;
    } catch (error) {
      console.error('Refresh token error:', error);
      throw error;
    }
  },

  async forgotPassword(data: ForgotPasswordRequest): Promise<{ message: string }> {
    try {
      return await apiClient.post('/auth/forgot-password', data);
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  },

  async resetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
    try {
      return await apiClient.post('/auth/reset-password', data);
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  },

  async verifyEmail(token: string): Promise<{ message: string }> {
    try {
      return await apiClient.post('/auth/verify-email', { token });
    } catch (error) {
      console.error('Verify email error:', error);
      throw error;
    }
  },

  async getCurrentUser(): Promise<AuthResponse['user']> {
    try {
      return await apiClient.get('/auth/me');
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  },
};

export default authApi;

