import apiClient from '../../services/api';
// Re-export types from backend for frontend use
export type {
  PaymentMethod,
  PaymentTransactionFilters,
  RefundResult,
  TransactionResult,
  CartSearchFilters,
  CartSearchResult,
  WishlistSearchFilters,
  WishlistSearchResult,
  WishlistStatistics,
  FAQCreateInput,
  FAQUpdateInput,
  FAQAdminFilters,
  FAQAdminResult,
  FAQCategory,
  G2AOfferFilters,
  G2AOfferResult,
  G2AReservationFilters,
  G2AReservationResult,
  CacheStatistics,
  CacheInvalidationRequest,
  CacheInvalidationResult,
  BalanceUpdateRequest,
  BalanceUpdateResult,
  RoleUpdateRequest,
  ActivityFilters,
  UserActivity,
} from '../../../backend/src/types/admin';

export interface DashboardStats {
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

export interface UserSearchResult {
  users: {
    id: string;
    email: string;
    nickname: string;
    firstName?: string;
    lastName?: string;
    balance: number;
    role: string;
    createdAt: string;
    ordersCount: number;
  }[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface UserDetails {
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

export interface TransactionResult {
  transactions: {
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
    type: string;
    amount: number;
    currency: string;
    method?: string;
    status: string;
    description?: string;
    transactionHash?: string;
    createdAt: string;
  }[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface GameItem {
  id: string;
  title: string;
  slug: string;
  price: number;
  originalPrice: number | null;
  platform: string;
  genre: string;
  inStock: boolean;
  isPreorder: boolean;
  imageUrl: string;
  salesCount: number;
  createdAt: string;
}

export interface GamesResult {
  games: GameItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface BlogPostItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  published: boolean;
  author: string;
  createdAt: string;
}

export interface BlogPostsResult {
  posts: BlogPostItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface OrderItem {
  id: string;
  userEmail: string;
  userNickname: string;
  total: number;
  status: string;
  itemsCount: number;
  items: {
    gameTitle: string;
    price: number;
    key?: string;
  }[];
  createdAt: string;
}

export interface OrdersResult {
  orders: OrderItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
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

export const adminApi = {
  // Dashboard
  getDashboard: async (): Promise<DashboardStats> => {
    const response = await apiClient.get<{ success: boolean; data: DashboardStats }>(
      '/api/admin/dashboard'
    );
    return response.data;
  },

  // Users
  searchUsers: async (filters?: {
    query?: string;
    email?: string;
    name?: string;
    page?: number;
    pageSize?: number;
  }): Promise<UserSearchResult> => {
    const params: Record<string, string> = {};
    if (filters?.query) params.query = filters.query;
    if (filters?.email) params.email = filters.email;
    if (filters?.name) params.name = filters.name;
    if (filters?.page) params.page = filters.page.toString();
    if (filters?.pageSize) params.pageSize = filters.pageSize.toString();

    const response = await apiClient.get<{ success: boolean; data: UserSearchResult }>(
      '/api/admin/users',
      { params }
    );
    return response.data;
  },

  getUserDetails: async (id: string): Promise<UserDetails> => {
    const response = await apiClient.get<{ success: boolean; data: UserDetails }>(
      `/api/admin/users/${id}`
    );
    return response.data;
  },

  exportUserReport: async (id: string): Promise<Blob> => {
    const response = await apiClient.get<Blob>(`/api/admin/users/${id}/export`, {
      responseType: 'blob',
    });
    return response;
  },

  // Transactions
  getTransactions: async (filters?: {
    method?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    transactionHash?: string;
    page?: number;
    pageSize?: number;
  }): Promise<TransactionResult> => {
    const params: Record<string, string> = {};
    if (filters?.method) params.method = filters.method;
    if (filters?.status) params.status = filters.status;
    if (filters?.startDate) params.startDate = filters.startDate;
    if (filters?.endDate) params.endDate = filters.endDate;
    if (filters?.transactionHash) params.transactionHash = filters.transactionHash;
    if (filters?.page) params.page = filters.page.toString();
    if (filters?.pageSize) params.pageSize = filters.pageSize.toString();

    const response = await apiClient.get<{ success: boolean; data: TransactionResult }>(
      '/api/admin/transactions',
      { params }
    );
    return response.data;
  },

  // Games CRUD
  getGames: async (page = 1, pageSize = 20): Promise<GamesResult> => {
    const response = await apiClient.get<{ success: boolean; data: GamesResult }>(
      '/api/admin/games',
      { params: { page: page.toString(), pageSize: pageSize.toString() } }
    );
    return response.data;
  },

  createGame: async (data: GameCreateInput): Promise<{ id: string; title: string }> => {
    const response = await apiClient.post<{ success: boolean; data: { id: string; title: string } }>(
      '/api/admin/games',
      data
    );
    return response.data;
  },

  updateGame: async (id: string, data: Partial<GameCreateInput>): Promise<{ id: string; title: string }> => {
    const response = await apiClient.put<{ success: boolean; data: { id: string; title: string } }>(
      `/api/admin/games/${id}`,
      data
    );
    return response.data;
  },

  deleteGame: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/admin/games/${id}`);
  },

  // Blog Posts CRUD
  getBlogPosts: async (page = 1, pageSize = 20): Promise<BlogPostsResult> => {
    const response = await apiClient.get<{ success: boolean; data: BlogPostsResult }>(
      '/api/admin/blog',
      { params: { page: page.toString(), pageSize: pageSize.toString() } }
    );
    return response.data;
  },

  createBlogPost: async (data: BlogPostCreateInput): Promise<{ id: string; title: string }> => {
    const response = await apiClient.post<{ success: boolean; data: { id: string; title: string } }>(
      '/api/admin/blog',
      data
    );
    return response.data;
  },

  updateBlogPost: async (id: string, data: Partial<BlogPostCreateInput>): Promise<{ id: string; title: string }> => {
    const response = await apiClient.put<{ success: boolean; data: { id: string; title: string } }>(
      `/api/admin/blog/${id}`,
      data
    );
    return response.data;
  },

  deleteBlogPost: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/admin/blog/${id}`);
  },

  // Orders
  getOrders: async (page = 1, pageSize = 20, status?: string): Promise<OrdersResult> => {
    const params: Record<string, string> = {
      page: page.toString(),
      pageSize: pageSize.toString(),
    };
    if (status) params.status = status;

    const response = await apiClient.get<{ success: boolean; data: OrdersResult }>(
      '/api/admin/orders',
      { params }
    );
    return response.data;
  },

  updateOrderStatus: async (id: string, status: string): Promise<{ id: string; status: string }> => {
    const response = await apiClient.put<{ success: boolean; data: { id: string; status: string } }>(
      `/api/admin/orders/${id}/status`,
      { status }
    );
    return response.data;
  },

  // G2A Sync
  syncG2A: async (): Promise<{ message: string }> => {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      '/api/admin/g2a/sync'
    );
    return { message: response.message || 'Sync started' };
  },

  // Payment Management
  getPaymentMethods: async (): Promise<Array<{
    id: string;
    name: string;
    type: 'stripe' | 'paypal' | 'mollie' | 'terminal';
    icon?: string;
    available: boolean;
    order: number;
    config?: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
  }>> => {
    const response = await apiClient.get<{ success: boolean; data: { methods: Array<{
      id: string;
      name: string;
      type: 'stripe' | 'paypal' | 'mollie' | 'terminal';
      icon?: string;
      available: boolean;
      order: number;
      config?: Record<string, unknown>;
      createdAt: string;
      updatedAt: string;
    }> } }>('/api/admin/payments/methods');
    return response.data.methods;
  },

  getPaymentTransactions: async (filters?: {
    method?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }): Promise<TransactionResult> => {
    const params = new URLSearchParams();
    if (filters?.method) params.append('method', filters.method);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString());

    const response = await apiClient.get<{ success: boolean; data: TransactionResult }>(
      `/api/admin/payments/transactions?${params.toString()}`
    );
    return response.data;
  },

  refundTransaction: async (
    transactionId: string,
    amount?: number,
    reason?: string
  ): Promise<{
    refundId: string;
    status: string;
    amount?: number;
    currency?: string;
    message?: string;
  }> => {
    const response = await apiClient.post<{ success: boolean; data: {
      refundId: string;
      status: string;
      amount?: number;
      currency?: string;
      message?: string;
    } }>(`/api/admin/payments/transactions/${transactionId}/refund`, {
      amount,
      reason,
    });
    return response.data;
  },

  // Cart Management
  getUserCarts: async (filters?: {
    userId?: string;
    email?: string;
    hasItems?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<{
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
  }> => {
    const params = new URLSearchParams();
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.email) params.append('email', filters.email);
    if (filters?.hasItems !== undefined) params.append('hasItems', filters.hasItems.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString());

    const response = await apiClient.get<{ success: boolean; data: {
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
    } }>(`/api/admin/carts?${params.toString()}`);
    return response.data;
  },

  getUserCart: async (userId: string): Promise<{
    items: Array<{
      gameId: string;
      quantity: number;
      game: {
        id: string;
        title: string;
        slug: string;
        image: string;
        price: number;
        inStock: boolean;
      };
    }>;
    total: number;
  }> => {
    const response = await apiClient.get<{ success: boolean; data: {
      items: Array<{
        gameId: string;
        quantity: number;
        game: {
          id: string;
          title: string;
          slug: string;
          image: string;
          price: number;
          inStock: boolean;
        };
      }>;
      total: number;
    } }>(`/api/admin/carts/user/${userId}`);
    return response.data;
  },

  updateUserCart: async (
    userId: string,
    items: Array<{ gameId: string; quantity: number }>
  ): Promise<void> => {
    await apiClient.put(`/api/admin/carts/user/${userId}`, { items });
  },

  clearUserCart: async (userId: string): Promise<void> => {
    await apiClient.delete(`/api/admin/carts/user/${userId}`);
  },

  // Wishlist Management
  getUserWishlists: async (filters?: {
    userId?: string;
    email?: string;
    hasItems?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<{
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
  }> => {
    const params = new URLSearchParams();
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.email) params.append('email', filters.email);
    if (filters?.hasItems !== undefined) params.append('hasItems', filters.hasItems.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString());

    const response = await apiClient.get<{ success: boolean; data: {
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
    } }>(`/api/admin/wishlists?${params.toString()}`);
    return response.data;
  },

  getUserWishlist: async (userId: string): Promise<{
    items: Array<{
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
    }>;
  }> => {
    const response = await apiClient.get<{ success: boolean; data: {
      items: Array<{
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
      }>;
    } }>(`/api/admin/wishlists/user/${userId}`);
    return response.data;
  },

  getWishlistStatistics: async (): Promise<{
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
  }> => {
    const response = await apiClient.get<{ success: boolean; data: {
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
    } }>('/api/admin/wishlists/statistics');
    return response.data;
  },

  // FAQ Management
  getFAQs: async (filters?: {
    category?: string;
    search?: string;
    active?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<{
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
  }> => {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.active !== undefined) params.append('active', filters.active.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString());

    const response = await apiClient.get<{ success: boolean; data: {
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
    } }>(`/api/admin/faqs?${params.toString()}`);
    return response.data;
  },

  createFAQ: async (data: {
    category: string;
    question: string;
    answer: string;
    order?: number;
    active?: boolean;
  }): Promise<{
    id: string;
    category: string;
    question: string;
    answer: string;
    order: number;
    active: boolean;
    createdAt: Date;
  }> => {
    const response = await apiClient.post<{ success: boolean; data: {
      id: string;
      category: string;
      question: string;
      answer: string;
      order: number;
      active: boolean;
      createdAt: Date;
    } }>('/api/admin/faqs', data);
    return response.data;
  },

  updateFAQ: async (
    id: string,
    data: {
      category?: string;
      question?: string;
      answer?: string;
      order?: number;
      active?: boolean;
    }
  ): Promise<{
    id: string;
    category: string;
    question: string;
    answer: string;
    order: number;
    active: boolean;
    createdAt: Date;
  }> => {
    const response = await apiClient.put<{ success: boolean; data: {
      id: string;
      category: string;
      question: string;
      answer: string;
      order: number;
      active: boolean;
      createdAt: Date;
    } }>(`/api/admin/faqs/${id}`, data);
    return response.data;
  },

  deleteFAQ: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/admin/faqs/${id}`);
  },

  getFAQCategories: async (): Promise<Array<{
    name: string;
    slug: string;
    count: number;
  }>> => {
    const response = await apiClient.get<{ success: boolean; data: Array<{
      name: string;
      slug: string;
      count: number;
    }> }>('/api/admin/faqs/categories');
    return response.data;
  },

  // G2A Advanced Management
  getG2AOffers: async (filters?: {
    productId?: string;
    status?: string;
    offerType?: string;
    active?: boolean;
    page?: number;
    perPage?: number;
  }): Promise<{
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
  }> => {
    const params = new URLSearchParams();
    if (filters?.productId) params.append('productId', filters.productId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.offerType) params.append('offerType', filters.offerType);
    if (filters?.active !== undefined) params.append('active', filters.active.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.perPage) params.append('perPage', filters.perPage.toString());

    const response = await apiClient.get<{ success: boolean; data: {
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
    } }>(`/api/admin/g2a/offers?${params.toString()}`);
    return response.data;
  },

  getG2AOfferById: async (offerId: string): Promise<{
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
  }> => {
    const response = await apiClient.get<{ success: boolean; data: {
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
    } }>(`/api/admin/g2a/offers/${offerId}`);
    return response.data;
  },

  getG2AReservations: async (filters?: {
    orderId?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{
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
  }> => {
    const params = new URLSearchParams();
    if (filters?.orderId) params.append('orderId', filters.orderId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString());

    const response = await apiClient.get<{ success: boolean; data: {
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
    } }>(`/api/admin/g2a/reservations?${params.toString()}`);
    return response.data;
  },

  cancelG2AReservation: async (reservationId: string): Promise<void> => {
    await apiClient.post(`/api/admin/g2a/reservations/${reservationId}/cancel`);
  },

  getG2AMetrics: async (): Promise<{
    requests_total: number;
    requests_success: number;
    requests_error: number;
    requests_retry: number;
    webhook_total: number;
    webhook_valid: number;
    webhook_invalid: number;
    latency_ms: number[];
    latency_stats?: {
      avg: number;
      min: number;
      max: number;
      p50: number;
      p95: number;
      p99: number;
    };
  }> => {
    const response = await apiClient.get<{ success: boolean; data: {
      requests_total: number;
      requests_success: number;
      requests_error: number;
      requests_retry: number;
      webhook_total: number;
      webhook_valid: number;
      webhook_invalid: number;
      latency_ms: number[];
      latency_stats?: {
        avg: number;
        min: number;
        max: number;
        p50: number;
        p95: number;
        p99: number;
      };
    } }>('/api/admin/g2a/metrics');
    return response.data;
  },

  // Cache Management
  getCacheStatistics: async (): Promise<{
    totalKeys: number;
    memoryUsage: number;
    redisStatus: 'connected' | 'disconnected' | 'error';
    keysByPattern: Record<string, number>;
  }> => {
    const response = await apiClient.get<{ success: boolean; data: {
      totalKeys: number;
      memoryUsage: number;
      redisStatus: 'connected' | 'disconnected' | 'error';
      keysByPattern: Record<string, number>;
    } }>('/api/admin/cache/statistics');
    return response.data;
  },

  invalidateCache: async (pattern: string): Promise<{
    keysInvalidated: number;
    pattern: string;
    message: string;
  }> => {
    const response = await apiClient.post<{ success: boolean; data: {
      keysInvalidated: number;
      pattern: string;
      message: string;
    } }>('/api/admin/cache/invalidate', { pattern });
    return response.data;
  },

  clearAllCache: async (): Promise<{
    keysInvalidated: number;
    pattern: string;
    message: string;
  }> => {
    const response = await apiClient.post<{ success: boolean; data: {
      keysInvalidated: number;
      pattern: string;
      message: string;
    } }>('/api/admin/cache/clear');
    return response.data;
  },

  // Enhanced User Management
  updateUserBalance: async (userId: string, amount: number, reason: string): Promise<{
    userId: string;
    previousBalance: number;
    newBalance: number;
    amount: number;
    reason: string;
  }> => {
    const response = await apiClient.put<{ success: boolean; data: {
      userId: string;
      previousBalance: number;
      newBalance: number;
      amount: number;
      reason: string;
    } }>(`/api/admin/users/${userId}/balance`, { amount, reason });
    return response.data;
  },

  updateUserRole: async (userId: string, role: 'USER' | 'ADMIN'): Promise<void> => {
    await apiClient.put(`/api/admin/users/${userId}/role`, { role });
  },

  getUserActivity: async (userId: string, filters?: {
    startDate?: string;
    endDate?: string;
    activityType?: 'login' | 'order' | 'transaction' | 'all';
  }): Promise<{
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
  }> => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.activityType) params.append('activityType', filters.activityType);

    const response = await apiClient.get<{ success: boolean; data: {
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
    } }>(`/api/admin/users/${userId}/activity?${params.toString()}`);
    return response.data;
  },
};

