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
