# Quickstart: System Integration Enhancement

**Feature**: 001-system-integration-enhancement  
**Date**: 2024-12-23  
**Status**: Ready for Implementation

## Overview

This quickstart guide helps developers understand and implement the system integration enhancements for authentication, cart/wishlist functionality, admin panel expansion, and G2A synchronization with proper caching.

## Prerequisites

- Node.js 20+ installed
- PostgreSQL 15+ database running
- Redis (optional but recommended)
- G2A API credentials configured
- Environment variables set (see [ENVIRONMENT_VARIABLES.md](../../../ENVIRONMENT_VARIABLES.md))

## Key Changes Summary

### 1. Authentication Service (`backend/src/services/auth.service.ts`)

**Current State**: Registration and login already implemented with cart/wishlist migration triggers.

**Verification Checklist**:
- [ ] Registration creates user atomically (transaction)
- [ ] Login triggers cart/wishlist migration if session exists
- [ ] Refresh token endpoint works correctly
- [ ] Error handling for database unavailability

**Key Functions**:
- `register()`: Creates user, generates tokens
- `login()`: Authenticates user, triggers migration
- `refreshToken()`: Refreshes access token

---

### 2. Cart Service (`backend/src/services/cart.service.ts`)

**Current State**: Cart operations and migration already implemented.

**Verification Checklist**:
- [ ] `getCart()` works for both authenticated and guest users
- [ ] `addToCart()` validates game availability
- [ ] `updateCartItem()` updates quantity correctly
- [ ] `removeFromCart()` removes items correctly
- [ ] `clearCart()` clears all items
- [ ] `migrateSessionCartToUser()` runs atomically
- [ ] Cache invalidation after mutations

**Key Functions**:
- `getCart(userId?, sessionId?)`: Get cart for user or guest
- `addToCart(gameId, quantity, userId?, sessionId?)`: Add item
- `updateCartItem(gameId, quantity, userId?, sessionId?)`: Update quantity
- `removeFromCart(gameId, userId?, sessionId?)`: Remove item
- `clearCart(userId?, sessionId?)`: Clear cart
- `migrateSessionCartToUser(sessionId, userId)`: Migrate guest cart

**Migration Flow**:
1. Read guest cart items (where `userId = sessionId`)
2. Validate games exist and are in stock
3. Merge quantities if user already has item
4. Create/update user cart items
5. Delete guest cart items
6. Invalidate cache

---

### 3. Wishlist Service (`backend/src/services/wishlist.service.ts`)

**Current State**: Wishlist operations and migration already implemented.

**Verification Checklist**:
- [ ] `getWishlist()` works for both authenticated and guest users
- [ ] `addToWishlist()` prevents duplicates
- [ ] `removeFromWishlist()` removes items correctly
- [ ] `isInWishlist()` checks correctly
- [ ] `migrateSessionWishlistToUser()` runs atomically
- [ ] Cache invalidation after mutations

**Key Functions**:
- `getWishlist(userId?, sessionId?)`: Get wishlist for user or guest
- `addToWishlist(gameId, userId?, sessionId?)`: Add item
- `removeFromWishlist(gameId, userId?, sessionId?)`: Remove item
- `isInWishlist(gameId, userId?, sessionId?)`: Check if in wishlist
- `migrateSessionWishlistToUser(sessionId, userId)`: Migrate guest wishlist

**Migration Flow**:
1. Read guest wishlist items (where `userId = sessionId`)
2. Validate games exist
3. Skip duplicates (user already has item)
4. Create user wishlist items
5. Delete guest wishlist items
6. Invalidate cache

---

### 4. Cache Service (`backend/src/services/cache.service.ts`)

**Current State**: Cache operations with graceful degradation already implemented.

**Key Functions**:
- `invalidateCache(pattern)`: Invalidate cache keys matching pattern
- `getCachedOrFetch(key, ttl, fetchFn)`: Get from cache or fetch

**Cache Key Patterns**:
- `home:*` - All home page caches
- `game:{slug}` - Individual game cache
- `catalog:*` - All catalog caches
- `user:{id}:cart` - User cart (TTL: 15 minutes)
- `user:{id}:wishlist` - User wishlist (TTL: 30 minutes)
- `session:{id}:cart` - Guest cart (TTL: 24 hours)
- `session:{id}:wishlist` - Guest wishlist (TTL: 24 hours)
- `blog:{slug}` - Blog post (TTL: 24 hours)
- `g2a:oauth2:token` - OAuth2 token (TTL: 1 hour)

**Important**: All cache operations must handle Redis unavailability gracefully.

---

### 5. G2A Service (`backend/src/services/g2a.service.ts`)

**Current State**: G2A integration with OAuth2 token caching already implemented.

**Enhancement Needed**: Add automatic cache invalidation after sync.

**Key Functions**:
- `getOAuth2Token()`: Get/cache OAuth2 token
- `syncG2ACatalog()`: Synchronize products from G2A

**Enhancement**:
After `syncG2ACatalog()` completes successfully:
```typescript
// Invalidate related caches
await invalidateCache('home:*');
await invalidateCache('game:*');
await invalidateCache('catalog:*');
```

---

### 6. Admin Service (`backend/src/services/admin.service.ts`)

**Enhancements Needed**:
- Complete game update with all fields and relationships
- User management (update, delete)
- Order management (update status, cancel)
- Blog post improvements (load full data, calculate readTime)
- Category/Genre/Platform CRUD

**Key Functions to Implement/Enhance**:
- `updateGame(id, data)`: Update all game fields including relationships
- `updateUser(id, data)`: Update user information
- `deleteUser(id)`: Delete user (with dependency checks)
- `updateOrder(id, data)`: Update order status
- `cancelOrder(id)`: Cancel order with refund
- `updateBlogPost(id, data)`: Update blog post with readTime calculation
- `createCategory(data)`, `updateCategory(id, data)`, `deleteCategory(id)`
- `createGenre(data)`, `updateGenre(id, data)`, `deleteGenre(id)`
- `createPlatform(data)`, `updatePlatform(id, data)`, `deletePlatform(id)`

---

### 7. Admin Middleware (`backend/src/middleware/auth.ts`)

**Current State**: Authentication and admin middleware already implemented.

**Verification Checklist**:
- [ ] `authenticate` middleware extracts and validates JWT token
- [ ] `requireAdmin` middleware checks for ADMIN role
- [ ] Error handling for expired/invalid tokens

**Key Functions**:
- `authenticate`: Validates JWT token, adds `req.user`
- `requireAdmin`: Checks `req.user.role === 'ADMIN'`

---

### 8. Admin Panel Frontend (`src/admin/`)

**Enhancements Needed**:
- Admin access control check in `AdminLayout.tsx`
- Complete game edit form with all fields
- User management page (edit, delete)
- Order management page (view, update, cancel)
- Category/Genre/Platform management pages
- Blog post edit improvements (load full data)
- G2A sync page improvements (progress, status)

**Key Files**:
- `src/admin/components/AdminLayout.tsx`: Add role check
- `src/admin/pages/GamesPage.tsx`: Expand edit form
- `src/admin/pages/UsersPage.tsx`: Add edit/delete functionality
- `src/admin/pages/OrdersPage.tsx`: Add update/cancel functionality
- `src/admin/pages/BlogPostsPage.tsx`: Fix data loading, add readTime
- `src/admin/pages/G2ASyncPage.tsx`: Add progress/status display

---

## Implementation Checklist

### Phase 1: Authentication & Migration Verification

- [x] **AUTH-001**: Verify registration creates user atomically
- [x] **AUTH-002**: Verify login triggers cart/wishlist migration
- [x] **AUTH-003**: Verify refresh token endpoint works
- [x] **AUTH-004**: Test error handling for database unavailability

### Phase 2: Cart & Wishlist Verification

- [x] **CART-001**: Test cart operations for authenticated users
- [x] **CART-002**: Test cart operations for guest users
- [x] **CART-003**: Test cart migration on login
- [x] **CART-004**: Verify cache invalidation after cart mutations
- [x] **WISH-001**: Test wishlist operations for authenticated users
- [x] **WISH-002**: Test wishlist operations for guest users
- [x] **WISH-003**: Test wishlist migration on login
- [x] **WISH-004**: Verify cache invalidation after wishlist mutations

### Phase 3: Admin Access Control

- [x] **ADMIN-001**: Verify `requireAdmin` middleware works
- [x] **ADMIN-002**: Add role check in `AdminLayout.tsx`
- [x] **ADMIN-003**: Test unauthorized access is blocked
- [x] **ADMIN-004**: Test admin access works correctly

### Phase 4: G2A Cache Invalidation

- [x] **G2A-001**: Add cache invalidation after `syncG2ACatalog()`
- [x] **G2A-002**: Test cache invalidation works correctly
- [x] **G2A-003**: Verify graceful degradation if Redis unavailable

### Phase 5: Admin CRUD Enhancements

- [x] **GAMES-001**: Expand game update to include all fields
- [x] **GAMES-002**: Add relationship updates (categories, genres, platforms, tags)
- [x] **GAMES-003**: Add cache invalidation after game update
- [x] **USERS-001**: Add user update functionality
- [x] **USERS-002**: Add user delete functionality (with checks)
- [x] **ORDERS-001**: Add order status update
- [x] **ORDERS-002**: Add order cancel with refund
- [x] **BLOG-001**: Fix blog post data loading on edit
- [x] **BLOG-002**: Add automatic readTime calculation
- [x] **BLOG-003**: Add cache invalidation after blog post update
- [x] **META-001**: Create category management page
- [x] **META-002**: Create genre management page
- [x] **META-003**: Create platform management page

### Phase 6: Testing

- [ ] **TEST-001**: Integration tests for authentication
- [ ] **TEST-002**: Integration tests for cart/wishlist migration
- [ ] **TEST-003**: Integration tests for admin operations
- [ ] **TEST-004**: Integration tests for cache invalidation
- [ ] **TEST-005**: E2E tests for critical user flows

---

## Common Patterns

### Cache Invalidation Pattern

```typescript
// After data mutation
try {
  await invalidateCache('pattern:*');
  console.log('[Cache] Invalidated pattern');
} catch (error) {
  // Non-blocking - log but don't fail
  console.warn('[Cache] Failed to invalidate:', error);
}
```

### Migration Pattern

```typescript
// Atomic migration
await prisma.$transaction(async (tx) => {
  // Read session items
  const sessionItems = await tx.cartItem.findMany({
    where: { userId: sessionId },
  });

  // Process each item
  for (const item of sessionItems) {
    // Validate
    // Merge or create
    // Delete session item
  }
});

// Invalidate cache (non-blocking)
try {
  await invalidateCache(`session:${sessionId}:cart`);
  await invalidateCache(`user:${userId}:cart`);
} catch (error) {
  console.warn('[Migration] Cache invalidation failed:', error);
}
```

### Error Handling Pattern

```typescript
try {
  // Operation
} catch (error) {
  if (error instanceof AppError) {
    throw error; // Re-throw known errors
  }
  // Log and throw generic error
  console.error('[Service] Unexpected error:', error);
  throw new AppError('Operation failed', 500);
}
```

### Redis Graceful Degradation

```typescript
const isAvailable = await isRedisAvailable();
if (isAvailable) {
  try {
    // Use cache
  } catch (error) {
    console.warn('[Cache] Redis error, using database:', error);
    // Fallback to database
  }
} else {
  // Use database directly
}
```

---

## Testing Guide

### Unit Tests

Test individual service functions:
```typescript
// Example: cart.service.test.ts
describe('Cart Service', () => {
  it('should add item to cart', async () => {
    // Test implementation
  });

  it('should migrate cart atomically', async () => {
    // Test transaction rollback on error
  });
});
```

### Integration Tests

Test API endpoints:
```typescript
// Example: cart.integration.test.ts
describe('Cart API', () => {
  it('POST /api/cart should add item', async () => {
    // Test with authenticated user
  });

  it('POST /api/cart should work for guest', async () => {
    // Test with session
  });
});
```

### E2E Tests

Test complete user flows:
```typescript
// Example: auth.e2e.test.ts
describe('Authentication Flow', () => {
  it('should register, login, and migrate cart', async () => {
    // 1. Register user
    // 2. Add items to cart as guest
    // 3. Login
    // 4. Verify cart migrated
  });
});
```

---

## Debugging Tips

### Cart/Wishlist Migration Issues

1. Check session ID is passed correctly
2. Verify transaction completes successfully
3. Check cache invalidation logs
4. Verify game availability before migration

### Cache Issues

1. Check Redis connection status
2. Verify cache key patterns
3. Check TTL values
4. Verify graceful degradation works

### Admin Access Issues

1. Check JWT token includes role
2. Verify `requireAdmin` middleware is applied
3. Check frontend role check in `AdminLayout`
4. Verify user role in database

### G2A Sync Issues

1. Check OAuth2 token is cached correctly
2. Verify API credentials
3. Check rate limiting
4. Verify cache invalidation after sync

---

## Performance Considerations

### Database Queries

- Use Prisma `include` and `select` to limit data
- Batch operations where possible
- Use transactions for atomic operations
- Add indexes for frequently queried fields

### Cache Strategy

- Cache frequently accessed data
- Use appropriate TTLs
- Invalidate on mutations
- Handle Redis unavailability gracefully

### API Calls

- Cache OAuth2 tokens
- Respect rate limits
- Use retry logic for transient failures
- Batch operations where possible

---

## Security Considerations

### Authentication

- JWT tokens with strong secrets (32+ chars)
- Different secrets for access/refresh tokens
- Token validation in middleware
- Secure password hashing (bcrypt)

### Authorization

- Role-based access control
- Admin-only endpoints protected
- Frontend and backend checks
- Audit logging for admin actions

### Data Validation

- Input validation on client and server
- Prisma schema enforces data types
- Express-validator for request validation
- SQL injection prevention (Prisma)

---

## Next Steps

1. Review existing code in services
2. Verify current implementation matches requirements
3. Implement missing enhancements
4. Add tests for new functionality
5. Update documentation

For detailed API contracts, see [contracts/api-contracts.md](./contracts/api-contracts.md).  
For data model details, see [data-model.md](./data-model.md).

