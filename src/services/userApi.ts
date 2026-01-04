import apiClient from './api';

export interface UserProfile {
  id: string;
  email: string;
  nickname: string;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  createdAt: string;
  stats?: {
    gamesPurchased: number;
    totalSaved: number;
    daysSinceRegistration: number;
    emptyFieldsCount: number;
  };
}

export interface UserStats {
  totalGames: number;
  totalSaved: number;
  daysSinceRegistration: number;
  totalOrders: number;
  balance: number;
}

export interface UpdateProfileData {
  nickname?: string;
  firstName?: string;
  lastName?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export const userApi = {
  getProfile: async (): Promise<UserProfile> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: UserProfile }>(
        '/api/user/profile'
      );
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Failed to get profile:', error);
      throw error;
    }
  },

  updateProfile: async (data: UpdateProfileData): Promise<UserProfile> => {
    try {
      const response = await apiClient.put<{ success: boolean; data: UserProfile }>(
        '/api/user/profile',
        data
      );
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  },

  changePassword: async (data: ChangePasswordData): Promise<void> => {
    try {
      await apiClient.put('/api/user/password', data);
    } catch (error) {
      console.error('Failed to change password:', error);
      throw error;
    }
  },

  getStats: async (): Promise<UserStats> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: UserStats }>(
        '/api/user/stats'
      );
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Failed to get stats:', error);
      throw error;
    }
  },

  getBalance: async (): Promise<{ balance: number }> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: { balance: number } }>(
        '/api/user/balance'
      );
      if (response.success && response.data) {
        return response.data;
      }
      return { balance: 0 };
    } catch (error) {
      console.error('Failed to get balance:', error);
      return { balance: 0 };
    }
  },

  getTransactions: async (): Promise<any[]> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: any[] }>(
        '/api/user/transactions'
      );
      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Failed to get transactions:', error);
      return [];
    }
  },
};

