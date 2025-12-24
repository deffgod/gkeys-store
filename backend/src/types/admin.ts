export interface AdminDashboardStats {
  totalUsers: number;
  newUsersToday: number;
  totalGames: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  transactionsToday: number;
  totalRevenue: number;
  revenueToday: number;
  revenueThisWeek: number;
  revenueThisMonth: number;
  topSellingGames: {
    id: string;
    title: string;
    slug: string;
    salesCount: number;
    revenue: number;
  }[];
  recentOrders: {
    id: string;
    userEmail: string;
    total: number;
    status: string;
    createdAt: string;
  }[];
  recentTransactions: {
    id: string;
    userEmail: string;
    amount: number;
    type: string;
    status: string;
    createdAt: string;
  }[];
  salesByDay: {
    date: string;
    count: number;
    revenue: number;
  }[];
}

export interface UserSearchFilters {
  query?: string;
  email?: string;
  name?: string;
  page?: number;
  pageSize?: number;
}

export interface TransactionFilters {
  method?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  transactionHash?: string;
  page?: number;
  pageSize?: number;
}

export interface UserDetailsResponse {
  id: string;
  email: string;
  nickname: string;
  firstName?: string;
  lastName?: string;
  balance: number;
  role: string;
  createdAt: string;
  orders: {
    id: string;
    status: string;
    total: number;
    createdAt: string;
  }[];
  transactions: {
    id: string;
    type: string;
    amount: number;
    status: string;
    createdAt: string;
  }[];
}

export interface GameCreateInput {
  title: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  platform: string;
  genre: string;
  tags: string[];
  publisher?: string;
  developer?: string;
  releaseDate?: string;
  isPreorder?: boolean;
  inStock?: boolean;
  g2aProductId?: string;
  g2aStock?: boolean;
}

export interface GameUpdateInput extends Partial<GameCreateInput> {
  g2aLastSync?: string; // ISO date string
}

export interface BlogPostCreateInput {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  imageUrl?: string;
  category: string;
  tags: string[];
  published?: boolean;
}

export interface BlogPostUpdateInput extends Partial<BlogPostCreateInput> {}

// Payment Management Types
export interface PaymentMethod {
  id: string;
  name: string;
  type: 'stripe' | 'paypal' | 'mollie' | 'terminal';
  icon?: string;
  available: boolean;
  order: number;
  config?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentTransactionFilters {
  method?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface RefundResult {
  refundId: string;
  status: string;
  amount?: number;
  currency?: string;
  message?: string;
}

export interface TransactionResult {
  transactions: Array<{
    id: string;
    userId: string;
    user: {
      id: string;
      email: string;
      nickname: string;
    };
    orderId?: string;
    order?: {
      id: string;
      status: string;
    };
    type: 'TOP_UP' | 'PURCHASE' | 'REFUND';
    amount: number;
    currency: string;
    method?: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    description?: string;
    transactionHash?: string;
    createdAt: string;
  }>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Cart and Wishlist Management Types
export interface CartSearchFilters {
  userId?: string;
  email?: string;
  hasItems?: boolean;
  page?: number;
  pageSize?: number;
}

export interface CartSearchResult {
  carts: Array<{
    userId: string;
    user: {
      id: string;
      email: string;
      nickname: string;
    };
    itemCount: number;
    total: number;
    lastUpdated: string;
  }>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface WishlistSearchFilters {
  userId?: string;
  email?: string;
  hasItems?: boolean;
  page?: number;
  pageSize?: number;
}

export interface WishlistSearchResult {
  wishlists: Array<{
    userId: string;
    user: {
      id: string;
      email: string;
      nickname: string;
    };
    itemCount: number;
    lastUpdated: string;
  }>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface WishlistStatistics {
  totalWishlists: number;
  totalItems: number;
  averageItemsPerWishlist: number;
  mostWishedGames: Array<{
    gameId: string;
    game: {
      id: string;
      title: string;
      slug: string;
    };
    wishlistCount: number;
  }>;
  wishlistGrowth: Array<{
    date: string;
    count: number;
  }>;
}

// FAQ Management Types
export interface FAQCreateInput {
  category: string;
  question: string;
  answer: string;
  order?: number;
  active?: boolean;
}

export interface FAQUpdateInput {
  category?: string;
  question?: string;
  answer?: string;
  order?: number;
  active?: boolean;
}

export interface FAQAdminFilters {
  category?: string;
  search?: string;
  active?: boolean;
  page?: number;
  pageSize?: number;
}

export interface FAQAdminResult {
  faqs: Array<{
    id: string;
    category: string;
    question: string;
    answer: string;
    order: number;
    active: boolean;
    createdAt: string;
  }>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface FAQCategory {
  name: string;
  slug: string;
  count: number;
}

// G2A Management Types
export interface G2AOfferFilters {
  productId?: string;
  status?: string;
  offerType?: string;
  active?: boolean;
  page?: number;
  perPage?: number;
}

export interface G2AOfferResult {
  data: Array<{
    id: string;
    type: string;
    productId: string;
    productName?: string;
    price: number;
    visibility: string;
    status: string;
    active: boolean;
    inventory?: {
      size: number;
      sold: number;
      type: string;
    };
    createdAt?: string;
    updatedAt?: string;
    promoStatus?: string;
  }>;
  meta?: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
  };
}

export interface G2AReservationFilters {
  orderId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface G2AReservationResult {
  reservations: Array<{
    reservationId: string;
    orderId: string;
    productId: string;
    quantity: number;
    status: string;
    expiresAt: string;
    createdAt: string;
    order?: {
      id: string;
      status: string;
      total: number;
      user: {
        id: string;
        email: string;
        nickname: string;
      };
    };
  }>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Cache Management Types
export interface CacheStatistics {
  totalKeys: number;
  memoryUsage: number;
  redisStatus: 'connected' | 'disconnected' | 'error';
  keysByPattern: Record<string, number>;
}

export interface CacheInvalidationRequest {
  pattern: string;
}

export interface CacheInvalidationResult {
  keysInvalidated: number;
  pattern: string;
  message: string;
}

// Enhanced User Management Types
export interface BalanceUpdateRequest {
  amount: number;
  reason: string;
}

export interface BalanceUpdateResult {
  userId: string;
  previousBalance: number;
  newBalance: number;
  amount: number;
  reason: string;
}

export interface RoleUpdateRequest {
  role: 'USER' | 'ADMIN';
}

export interface ActivityFilters {
  startDate?: string;
  endDate?: string;
  activityType?: 'login' | 'order' | 'transaction' | 'all';
}

export interface UserActivity {
  userId: string;
  loginHistory: Array<{
    id: string;
    ipAddress?: string;
    userAgent?: string;
    success: boolean;
    createdAt: string;
  }>;
  orders: Array<{
    id: string;
    status: string;
    total: number;
    createdAt: string;
  }>;
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    status: string;
    createdAt: string;
  }>;
}
