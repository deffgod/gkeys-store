# API Contracts: Data Synchronization & System Integration Fix

**Feature**: 012-data-sync-fix  
**Date**: 2024-12-23  
**Status**: Complete

## Overview

This document describes the API contracts for data synchronization operations. These are internal service contracts (not public API endpoints) that define how services interact with each other.

## Authentication Service Contracts

### register(data: RegisterRequest): Promise<AuthResponse>

**Purpose**: Create new user account with atomic operation.

**Request**:
```typescript
interface RegisterRequest {
  email: string;
  password: string;
  nickname?: string;
  firstName?: string;
  lastName?: string;
}
```

**Response**:
```typescript
interface AuthResponse {
  user: {
    id: string;
    email: string;
    nickname: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    role: 'USER' | 'ADMIN';
  };
  token: string;
  refreshToken: string;
  expiresIn: number; // seconds
}
```

**Errors**:
- `409 Conflict`: User with email already exists
- `503 Service Unavailable`: Database not available
- `500 Internal Server Error`: Registration failed (transaction rollback)

**Behavior**:
1. Check if user exists (within transaction)
2. Hash password
3. Create user in database (transaction)
4. Generate JWT tokens
5. Send registration email (fire-and-forget, non-blocking)
6. Return user and tokens

**Cache Impact**: None (new user, no cache to invalidate)

---

### login(data: LoginRequest): Promise<AuthResponse>

**Purpose**: Authenticate user and generate tokens.

**Request**:
```typescript
interface LoginRequest {
  email: string;
  password: string;
}
```

**Response**: Same as `register()` response.

**Errors**:
- `401 Unauthorized`: Invalid email or password
- `503 Service Unavailable`: Database not available

**Behavior**:
1. Find user by email
2. Verify password (bcrypt compare)
3. Generate fresh JWT tokens
4. Return user and tokens
5. **Trigger cart/wishlist migration** (if guest session exists)

**Cache Impact**: 
- Invalidate `session:{sessionId}:cart` and `session:{sessionId}:wishlist` after migration
- Create `user:{id}:cart` and `user:{id}:wishlist` cache entries

---

## Cart Service Contracts

### migrateSessionCartToUser(sessionId: string, userId: string): Promise<void>

**Purpose**: Atomically migrate cart items from guest session to authenticated user.

**Request**:
- `sessionId`: Guest session identifier
- `userId`: Authenticated user identifier

**Response**: `void` (success) or throws error

**Errors**:
- `404 Not Found`: Session not found or no cart items
- `400 Bad Request`: Game not found or out of stock
- `500 Internal Server Error`: Migration failed (transaction rollback)

**Behavior** (within Prisma transaction):
1. Read guest cart items (where `userId = sessionId`)
2. For each item:
   - Validate game exists and is in stock
   - Check if user already has item in cart
   - If exists: merge quantities (add guest quantity to user quantity)
   - If not exists: create new cart item for user
3. Delete guest cart items
4. Invalidate cache: `session:{sessionId}:cart`, `user:{userId}:cart`

**Cache Impact**:
- Invalidate `session:{sessionId}:cart`
- Invalidate `user:{userId}:cart`
- Create new `user:{userId}:cart` entry on next read

---

## Wishlist Service Contracts

### migrateSessionWishlistToUser(sessionId: string, userId: string): Promise<void>

**Purpose**: Atomically migrate wishlist items from guest session to authenticated user.

**Request**:
- `sessionId`: Guest session identifier
- `userId`: Authenticated user identifier

**Response**: `void` (success) or throws error

**Errors**:
- `404 Not Found`: Session not found or no wishlist items
- `400 Bad Request`: Game not found
- `500 Internal Server Error`: Migration failed (transaction rollback)

**Behavior** (within Prisma transaction):
1. Read guest wishlist items (where `userId = sessionId`)
2. For each item:
   - Validate game exists
   - Check if user already has item in wishlist
   - If not exists: create new wishlist item for user
   - If exists: skip (wishlist doesn't have quantities)
3. Delete guest wishlist items
4. Invalidate cache: `session:{sessionId}:wishlist`, `user:{userId}:wishlist`

**Cache Impact**:
- Invalidate `session:{sessionId}:wishlist`
- Invalidate `user:{userId}:wishlist`
- Create new `user:{userId}:wishlist` entry on next read

---

## Cache Service Contracts

### invalidateCache(pattern: string): Promise<void>

**Purpose**: Invalidate cache keys matching pattern.

**Request**:
- `pattern`: Cache key pattern (supports wildcards: `*`, `?`)

**Response**: `void` (success) or throws error (non-blocking)

**Errors**: 
- Logged but not thrown (graceful degradation)

**Behavior**:
1. Check if Redis is available
2. If available: Delete keys matching pattern
3. If unavailable: Log warning, continue (graceful degradation)
4. Never throw errors (fire-and-forget)

**Cache Patterns**:
- `game:{id}`: Single game
- `game:*`: All games
- `home:*`: All home page caches
- `catalog:*`: All catalog caches
- `user:{id}:cart`: User cart
- `user:{id}:wishlist`: User wishlist
- `user:{id}:orders`: User orders

---

## G2A Service Contracts

### syncG2ACatalog(options?: SyncOptions): Promise<SyncResult>

**Purpose**: Synchronize G2A product catalog with local database.

**Request**:
```typescript
interface SyncOptions {
  fullSync?: boolean; // Default: false
  productIds?: string[]; // Optional: specific products to sync
  categories?: string[]; // Optional: categories to sync
  includeRelationships?: boolean; // Default: false
}
```

**Response**:
```typescript
interface SyncResult {
  added: number;
  updated: number;
  removed: number;
  categoriesCreated: number;
  genresCreated: number;
  platformsCreated: number;
  errors: Array<{ productId: string; error: string }>;
}
```

**Errors**:
- `503 Service Unavailable`: G2A API unavailable or database error
- `429 Too Many Requests`: Rate limit exceeded (retry with backoff)

**Behavior**:
1. Acquire sync lock (prevent concurrent syncs)
2. Fetch products from G2A API (with rate limiting)
3. For each product (in batches, within transactions):
   - Transform G2A product to Game model
   - Apply 2% markup to price
   - Update or create game in database
   - Update `g2aLastSync` timestamp
4. After all batches complete: Invalidate cache (`game:*`, `home:*`, `catalog:*`)
5. Release sync lock
6. Return sync results

**Cache Impact**:
- After sync: Invalidate `game:*`, `home:*`, `catalog:*`
- Cache invalidation is non-blocking (try/catch)

---

### validateGameStock(g2aProductId: string): Promise<StockResult>

**Purpose**: Check game stock availability on G2A.

**Request**:
- `g2aProductId`: G2A product identifier

**Response**:
```typescript
interface StockResult {
  available: boolean;
  stock: number; // Available quantity
}
```

**Errors**:
- `404 Not Found`: Product not found on G2A
- `503 Service Unavailable`: G2A API unavailable

**Behavior**:
1. Call G2A API to check stock
2. Return availability and stock count
3. Cache result in Redis (TTL: 5 minutes)

**Cache Impact**: Cache stock result with key `g2a:stock:{g2aProductId}` (TTL: 5 minutes)

---

## Order Service Contracts

### createOrder(userId: string, data: CreateOrderRequest): Promise<OrderResponse>

**Purpose**: Create order with atomic transaction.

**Request**:
```typescript
interface CreateOrderRequest {
  items: Array<{ gameId: string; quantity: number }>;
  promoCode?: string;
}
```

**Response**:
```typescript
interface OrderResponse {
  id: string;
  status: OrderStatus;
  total: number;
  items: Array<{ gameId: string; quantity: number; price: number }>;
}
```

**Errors**:
- `404 Not Found`: Game not found or out of stock
- `400 Bad Request`: Insufficient balance or invalid data
- `500 Internal Server Error`: Order creation failed (transaction rollback)

**Behavior** (within Prisma transaction):
1. Validate games exist and are in stock
2. Calculate totals (subtotal, discount, total)
3. Check user balance
4. Create order with PENDING status
5. Create order items
6. Deduct user balance
7. Create transaction record
8. Update order status to PROCESSING
9. Purchase keys from G2A (async, non-blocking)
10. Invalidate cache: `user:{userId}:orders`, `user:{userId}:cart`

**Cache Impact**:
- Invalidate `user:{userId}:orders`
- Invalidate `user:{userId}:cart` (items removed from cart)
- Create `order:{id}` cache entry on next read

---

## G2A Webhook Service Contracts

### processG2AWebhook(event: G2AWebhookEvent, headers: Record<string, string>): Promise<WebhookResult>

**Purpose**: Process G2A webhook event with validation and idempotency.

**Request**:
```typescript
interface G2AWebhookEvent {
  event_id: string;
  order_id: string;
  type: string;
  payload: Record<string, unknown>;
  signature: string;
  nonce: string;
  timestamp: string;
}
```

**Response**:
```typescript
interface WebhookResult {
  success: boolean;
  message: string;
}
```

**Errors**:
- `400 Bad Request`: Invalid signature, timestamp, or missing fields
- `409 Conflict`: Event already processed (idempotency)

**Behavior**:
1. Validate webhook signature (HMAC-SHA256)
2. Validate timestamp (within ±5 minutes)
3. Check idempotency (prevent duplicate processing)
4. Process webhook based on type:
   - Order status update → update local order → update transaction → invalidate cache
5. Store idempotency record
6. Return result

**Cache Impact**:
- Invalidate `order:{id}` and `user:{userId}:orders` on order status update

---

## Error Handling

All service contracts follow these error handling patterns:

1. **Database Errors**: Wrap in try/catch, use Prisma transactions for rollback
2. **Cache Errors**: Log but don't throw (graceful degradation)
3. **G2A API Errors**: Retry with exponential backoff, log failures
4. **Validation Errors**: Return 400 Bad Request with clear message
5. **Authentication Errors**: Return 401 Unauthorized without exposing system details

## Idempotency

The following operations are idempotent:
- G2A webhook processing (checked via idempotency store)
- Order creation (checked via existing order with same items)
- Cache invalidation (safe to call multiple times)

## Rate Limiting

- G2A API: 600 requests per minute (enforced in g2a.service.ts)
- Cache operations: No rate limiting (local Redis)
- Database operations: Handled by Prisma connection pooling

