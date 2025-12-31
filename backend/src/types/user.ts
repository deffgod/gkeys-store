export interface UserProfileResponse {
  id: string;
  email: string;
  nickname: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  balance: number;
  role: string;
  emailVerified: boolean;
  createdAt: string;
  stats?: {
    gamesPurchased: number;
    totalSaved: number;
    daysSinceRegistration: number;
    emptyFieldsCount: number;
  };
}

export interface UpdateProfileRequest {
  nickname?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UserStatsResponse {
  totalGames: number;
  totalSaved: number;
  daysSinceRegistration: number;
  totalOrders: number;
  balance: number;
}

export interface BalanceResponse {
  balance: number;
  currency: string;
}

export interface TransactionResponse {
  id: string;
  type: 'TOP_UP' | 'PURCHASE' | 'REFUND';
  amount: number;
  currency: string;
  method?: string;
  status: string;
  description?: string;
  transactionHash?: string;
  createdAt: string;
  orderId?: string;
}

export interface WishlistResponse {
  gameId: string;
  game: {
    id: string;
    title: string;
    slug: string;
    image: string;
    price: number;
    inStock: boolean;
  };
  addedAt: string;
}
