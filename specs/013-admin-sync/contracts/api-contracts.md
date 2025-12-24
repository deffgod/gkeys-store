# API Contracts: Admin Panel Function Synchronization

**Feature**: 013-admin-sync  
**Date**: 2024-12-23  
**Status**: Complete

## Overview

This document describes the API contracts for new admin panel functions. All endpoints require admin authentication (JWT token with admin role).

## Payment Management Contracts

### GET /api/admin/payments/methods

**Purpose**: Get all payment methods with status and configuration.

**Request**: None (query parameters optional for filtering)

**Response**:
```typescript
{
  success: boolean;
  data: {
    methods: Array<{
      id: string;
      name: string;
      type: 'stripe' | 'paypal' | 'mollie' | 'terminal';
      icon?: string;
      available: boolean;
      order: number;
      config?: Record<string, unknown>;
      createdAt: string;
      updatedAt: string;
    }>;
  };
}
```

**Errors**:
- `401 Unauthorized`: Not authenticated or not admin
- `500 Internal Server Error`: Failed to fetch payment methods

---

### GET /api/admin/payments/transactions

**Purpose**: Get payment transactions filtered by payment method and other criteria.

**Request Query Parameters**:
- `method?`: Payment method filter (stripe, paypal, mollie, terminal)
- `status?`: Transaction status filter
- `startDate?`: Start date (ISO string)
- `endDate?`: End date (ISO string)
- `page?`: Page number (default: 1)
- `pageSize?`: Page size (default: 20)

**Response**:
```typescript
{
  success: boolean;
  data: {
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
  };
}
```

**Errors**:
- `401 Unauthorized`: Not authenticated or not admin
- `400 Bad Request`: Invalid query parameters
- `500 Internal Server Error`: Failed to fetch transactions

---

### POST /api/admin/payments/transactions/:id/refund

**Purpose**: Process refund for a transaction through the appropriate payment gateway.

**Request Body**:
```typescript
{
  amount?: number; // Optional: partial refund, if omitted, full refund
  reason?: string; // Refund reason
}
```

**Response**:
```typescript
{
  success: boolean;
  data: {
    refundId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    amount: number;
    transactionId: string;
    message: string;
  };
}
```

**Errors**:
- `401 Unauthorized`: Not authenticated or not admin
- `404 Not Found`: Transaction not found
- `400 Bad Request`: Invalid refund amount or transaction not refundable
- `500 Internal Server Error`: Refund processing failed

**Behavior**:
1. Validate transaction exists and is refundable
2. Identify payment gateway from transaction method
3. Call appropriate gateway refund service
4. Create refund transaction record atomically
5. Update original transaction status
6. Return refund result

---

## Cart Management Contracts

### GET /api/admin/carts

**Purpose**: Search and list user carts.

**Request Query Parameters**:
- `userId?`: Filter by user ID
- `query?`: Search by user email or nickname
- `page?`: Page number (default: 1)
- `pageSize?`: Page size (default: 20)

**Response**:
```typescript
{
  success: boolean;
  data: {
    carts: Array<{
      userId: string;
      user: {
        id: string;
        email: string;
        nickname: string;
      };
      items: Array<{
        gameId: string;
        game: {
          id: string;
          title: string;
          price: number;
          inStock: boolean;
        };
        quantity: number;
        addedAt: string;
      }>;
      total: number;
      itemCount: number;
    }>;
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}
```

**Errors**:
- `401 Unauthorized`: Not authenticated or not admin
- `400 Bad Request`: Invalid query parameters
- `500 Internal Server Error`: Failed to fetch carts

---

### GET /api/admin/carts/user/:userId

**Purpose**: Get specific user's cart.

**Request**: Path parameter `userId`

**Response**:
```typescript
{
  success: boolean;
  data: {
    userId: string;
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
      quantity: number;
      addedAt: string;
    }>;
    total: number;
    itemCount: number;
  };
}
```

**Errors**:
- `401 Unauthorized`: Not authenticated or not admin
- `404 Not Found`: User not found
- `500 Internal Server Error`: Failed to fetch cart

---

### PUT /api/admin/carts/user/:userId

**Purpose**: Update user's cart (add, remove, update quantities).

**Request Body**:
```typescript
{
  items: Array<{
    gameId: string;
    quantity: number; // 0 to remove item
  }>;
}
```

**Response**:
```typescript
{
  success: boolean;
  data: {
    userId: string;
    items: Array<{
      gameId: string;
      quantity: number;
    }>;
    message: string;
  };
}
```

**Errors**:
- `401 Unauthorized`: Not authenticated or not admin
- `404 Not Found`: User not found
- `400 Bad Request`: Invalid items, game not found, or game out of stock
- `500 Internal Server Error`: Failed to update cart

**Behavior**:
1. Validate user exists
2. Validate all games exist and are in stock
3. Update cart items atomically
4. Invalidate user cart cache
5. Log admin operation

---

### DELETE /api/admin/carts/user/:userId

**Purpose**: Clear user's cart.

**Request**: Path parameter `userId`

**Response**:
```typescript
{
  success: boolean;
  message: string;
}
```

**Errors**:
- `401 Unauthorized`: Not authenticated or not admin
- `404 Not Found`: User not found
- `500 Internal Server Error`: Failed to clear cart

---

## Wishlist Management Contracts

### GET /api/admin/wishlists

**Purpose**: Search and list user wishlists.

**Request Query Parameters**:
- `userId?`: Filter by user ID
- `query?`: Search by user email or nickname
- `page?`: Page number (default: 1)
- `pageSize?`: Page size (default: 20)

**Response**:
```typescript
{
  success: boolean;
  data: {
    wishlists: Array<{
      userId: string;
      user: {
        id: string;
        email: string;
        nickname: string;
      };
      items: Array<{
        gameId: string;
        game: {
          id: string;
          title: string;
          price: number;
          inStock: boolean;
        };
        addedAt: string;
      }>;
      itemCount: number;
    }>;
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}
```

**Errors**:
- `401 Unauthorized`: Not authenticated or not admin
- `400 Bad Request`: Invalid query parameters
- `500 Internal Server Error`: Failed to fetch wishlists

---

### GET /api/admin/wishlists/user/:userId

**Purpose**: Get specific user's wishlist.

**Request**: Path parameter `userId`

**Response**:
```typescript
{
  success: boolean;
  data: {
    userId: string;
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
    itemCount: number;
  };
}
```

**Errors**:
- `401 Unauthorized`: Not authenticated or not admin
- `404 Not Found`: User not found
- `500 Internal Server Error`: Failed to fetch wishlist

---

### GET /api/admin/wishlists/statistics

**Purpose**: Get wishlist statistics (most wishlisted games, conversion rates, etc.).

**Request**: None

**Response**:
```typescript
{
  success: boolean;
  data: {
    totalWishlists: number;
    totalItems: number;
    mostWishlistedGames: Array<{
      gameId: string;
      game: {
        id: string;
        title: string;
      };
      wishlistCount: number;
    }>;
    conversionRate: number; // Percentage of wishlist items that became orders
    averageItemsPerUser: number;
  };
}
```

**Errors**:
- `401 Unauthorized`: Not authenticated or not admin
- `500 Internal Server Error`: Failed to fetch statistics

---

## FAQ Management Contracts

### GET /api/admin/faqs

**Purpose**: Get all FAQ items with pagination and filtering.

**Request Query Parameters**:
- `category?`: Filter by category
- `active?`: Filter by active status (true/false)
- `search?`: Search in question and answer
- `page?`: Page number (default: 1)
- `pageSize?`: Page size (default: 20)

**Response**:
```typescript
{
  success: boolean;
  data: {
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
  };
}
```

**Errors**:
- `401 Unauthorized`: Not authenticated or not admin
- `400 Bad Request`: Invalid query parameters
- `500 Internal Server Error`: Failed to fetch FAQs

---

### POST /api/admin/faqs

**Purpose**: Create a new FAQ item.

**Request Body**:
```typescript
{
  category: string;
  question: string;
  answer: string;
  order?: number; // Default: 0
  active?: boolean; // Default: true
}
```

**Response**:
```typescript
{
  success: boolean;
  data: {
    id: string;
    category: string;
    question: string;
    answer: string;
    order: number;
    active: boolean;
    createdAt: string;
  };
}
```

**Errors**:
- `401 Unauthorized`: Not authenticated or not admin
- `400 Bad Request`: Invalid input (empty question/answer, invalid category)
- `500 Internal Server Error`: Failed to create FAQ

---

### PUT /api/admin/faqs/:id

**Purpose**: Update an existing FAQ item.

**Request Body**:
```typescript
{
  category?: string;
  question?: string;
  answer?: string;
  order?: number;
  active?: boolean;
}
```

**Response**:
```typescript
{
  success: boolean;
  data: {
    id: string;
    category: string;
    question: string;
    answer: string;
    order: number;
    active: boolean;
    createdAt: string;
  };
}
```

**Errors**:
- `401 Unauthorized`: Not authenticated or not admin
- `404 Not Found`: FAQ not found
- `400 Bad Request`: Invalid input
- `500 Internal Server Error`: Failed to update FAQ

---

### DELETE /api/admin/faqs/:id

**Purpose**: Delete an FAQ item.

**Request**: Path parameter `id`

**Response**:
```typescript
{
  success: boolean;
  message: string;
}
```

**Errors**:
- `401 Unauthorized`: Not authenticated or not admin
- `404 Not Found`: FAQ not found
- `500 Internal Server Error`: Failed to delete FAQ

---

### GET /api/admin/faqs/categories

**Purpose**: Get all FAQ categories with item counts.

**Request**: None

**Response**:
```typescript
{
  success: boolean;
  data: {
    categories: Array<{
      name: string;
      slug: string;
      count: number;
    }>;
  };
}
```

**Errors**:
- `401 Unauthorized`: Not authenticated or not admin
- `500 Internal Server Error`: Failed to fetch categories

---

## G2A Advanced Management Contracts

### GET /api/admin/g2a/offers

**Purpose**: Get all G2A offers with filtering.

**Request Query Parameters**:
- `productId?`: Filter by G2A product ID
- `status?`: Filter by offer status
- `page?`: Page number (default: 1)
- `pageSize?`: Page size (default: 20)

**Response**:
```typescript
{
  success: boolean;
  data: {
    offers: Array<{
      offerId: string;
      productId: string;
      status: string;
      inventory: number;
      sold: number;
      price: number;
      visibility: string;
      offerType: string;
      createdAt: string;
      updatedAt: string;
    }>;
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}
```

**Errors**:
- `401 Unauthorized`: Not authenticated or not admin
- `400 Bad Request`: Invalid query parameters
- `503 Service Unavailable`: G2A API unavailable
- `500 Internal Server Error`: Failed to fetch offers

---

### GET /api/admin/g2a/offers/:offerId

**Purpose**: Get specific G2A offer details.

**Request**: Path parameter `offerId`

**Response**:
```typescript
{
  success: boolean;
  data: {
    offerId: string;
    productId: string;
    status: string;
    inventory: number;
    sold: number;
    price: number;
    visibility: string;
    offerType: string;
    createdAt: string;
    updatedAt: string;
  };
}
```

**Errors**:
- `401 Unauthorized`: Not authenticated or not admin
- `404 Not Found`: Offer not found
- `503 Service Unavailable`: G2A API unavailable
- `500 Internal Server Error`: Failed to fetch offer

---

### GET /api/admin/g2a/reservations

**Purpose**: Get all active G2A reservations.

**Request Query Parameters**:
- `orderId?`: Filter by order ID
- `status?`: Filter by reservation status
- `page?`: Page number (default: 1)
- `pageSize?`: Page size (default: 20)

**Response**:
```typescript
{
  success: boolean;
  data: {
    reservations: Array<{
      reservationId: string;
      orderId: string;
      productId: string;
      quantity: number;
      status: string;
      expiresAt: string;
      createdAt: string;
    }>;
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}
```

**Errors**:
- `401 Unauthorized`: Not authenticated or not admin
- `400 Bad Request`: Invalid query parameters
- `503 Service Unavailable`: G2A API unavailable
- `500 Internal Server Error`: Failed to fetch reservations

---

### POST /api/admin/g2a/reservations/:reservationId/cancel

**Purpose**: Cancel a G2A reservation.

**Request**: Path parameter `reservationId`

**Response**:
```typescript
{
  success: boolean;
  data: {
    reservationId: string;
    status: 'cancelled';
    message: string;
  };
}
```

**Errors**:
- `401 Unauthorized`: Not authenticated or not admin
- `404 Not Found`: Reservation not found
- `400 Bad Request`: Reservation cannot be cancelled
- `503 Service Unavailable`: G2A API unavailable
- `500 Internal Server Error`: Failed to cancel reservation

---

## Cache Management Contracts

### GET /api/admin/cache/statistics

**Purpose**: Get cache statistics (hit rates, keys, memory usage, Redis status).

**Request**: None

**Response**:
```typescript
{
  success: boolean;
  data: {
    totalKeys: number;
    memoryUsage: number; // bytes
    hitRate: number; // percentage
    missRate: number; // percentage
    redisStatus: 'connected' | 'disconnected' | 'error';
    keysByPattern: Record<string, number>; // { pattern: count }
  };
}
```

**Errors**:
- `401 Unauthorized`: Not authenticated or not admin
- `500 Internal Server Error`: Failed to fetch statistics

---

### POST /api/admin/cache/invalidate

**Purpose**: Invalidate cache keys matching a pattern.

**Request Body**:
```typescript
{
  pattern: string; // e.g., "game:*", "home:*", "user:{id}:cart"
}
```

**Response**:
```typescript
{
  success: boolean;
  data: {
    pattern: string;
    keysInvalidated: number;
    message: string;
  };
}
```

**Errors**:
- `401 Unauthorized`: Not authenticated or not admin
- `400 Bad Request`: Invalid pattern
- `500 Internal Server Error`: Failed to invalidate cache (non-blocking, logs error)

---

### POST /api/admin/cache/clear

**Purpose**: Clear all cache (use with caution).

**Request**: None

**Response**:
```typescript
{
  success: boolean;
  data: {
    keysInvalidated: number;
    message: string;
  };
}
```

**Errors**:
- `401 Unauthorized`: Not authenticated or not admin
- `500 Internal Server Error`: Failed to clear cache (non-blocking, logs error)

---

## Enhanced User Management Contracts

### PUT /api/admin/users/:id/balance

**Purpose**: Update user balance (add or deduct).

**Request Body**:
```typescript
{
  amount: number; // Positive to add, negative to deduct
  reason: string; // Reason for balance change
}
```

**Response**:
```typescript
{
  success: boolean;
  data: {
    userId: string;
    oldBalance: number;
    newBalance: number;
    transactionId: string;
    message: string;
  };
}
```

**Errors**:
- `401 Unauthorized`: Not authenticated or not admin
- `404 Not Found`: User not found
- `400 Bad Request`: Invalid amount or insufficient balance for deduction
- `500 Internal Server Error`: Failed to update balance

**Behavior**:
1. Validate user exists
2. Validate amount (check balance if deducting)
3. Update balance and create transaction atomically
4. Invalidate user cache
5. Log admin operation

---

### PUT /api/admin/users/:id/role

**Purpose**: Update user role.

**Request Body**:
```typescript
{
  role: 'USER' | 'ADMIN';
}
```

**Response**:
```typescript
{
  success: boolean;
  data: {
    userId: string;
    oldRole: string;
    newRole: string;
    message: string;
  };
}
```

**Errors**:
- `401 Unauthorized`: Not authenticated or not admin
- `404 Not Found`: User not found
- `400 Bad Request`: Invalid role
- `500 Internal Server Error`: Failed to update role

**Behavior**:
1. Validate user exists
2. Validate role is valid enum value
3. Update user role
4. Invalidate user cache
5. Log admin operation

---

### GET /api/admin/users/:id/activity

**Purpose**: Get user activity logs (login history, orders, transactions).

**Request**: Path parameter `id`

**Request Query Parameters**:
- `startDate?`: Start date for activity (ISO string)
- `endDate?`: End date for activity (ISO string)

**Response**:
```typescript
{
  success: boolean;
  data: {
    userId: string;
    loginHistory: Array<{
      timestamp: string;
      ipAddress?: string;
    }>;
    orderHistory: Array<{
      id: string;
      status: string;
      total: number;
      createdAt: string;
    }>;
    transactionHistory: Array<{
      id: string;
      type: string;
      amount: number;
      status: string;
      createdAt: string;
    }>;
    cartActivity: Array<{
      action: 'add' | 'remove' | 'update';
      gameId: string;
      timestamp: string;
    }>;
    wishlistActivity: Array<{
      action: 'add' | 'remove';
      gameId: string;
      timestamp: string;
    }>;
  };
}
```

**Errors**:
- `401 Unauthorized`: Not authenticated or not admin
- `404 Not Found`: User not found
- `500 Internal Server Error`: Failed to fetch activity

---

## Error Handling

All endpoints follow consistent error response format:

```typescript
{
  success: false;
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
}
```

**Common Error Codes**:
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Admin role required
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Invalid input
- `SERVICE_UNAVAILABLE`: External service unavailable
- `INTERNAL_ERROR`: Server error

---

## Authentication

All endpoints require:
- Valid JWT access token in `Authorization: Bearer <token>` header
- User must have `ADMIN` role
- Token validated by `authenticate` middleware
- Admin role checked by `requireAdmin` middleware

---

## Idempotency

- Refund operations: Use transaction ID as idempotency key
- Cache invalidation: Idempotent (multiple calls have same effect)
- Balance updates: Use transaction ID to prevent duplicate updates
- Role updates: Idempotent (setting same role has no effect)

---

## Rate Limiting

- Admin endpoints: Higher rate limits than user endpoints
- G2A API calls: Respect G2A rate limits (600 req/min)
- Cache operations: No rate limiting (internal operations)
- Payment gateway calls: Respect gateway-specific rate limits

