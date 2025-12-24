# Quickstart: Data Synchronization & System Integration Fix

**Feature**: 012-data-sync-fix  
**Date**: 2024-12-23  
**Status**: Complete

## Overview

This quickstart guide helps developers understand and implement the data synchronization fixes for Prisma database, Redis cache, and G2A API integration.

## Key Changes Summary

### 1. Authentication Service (`backend/src/services/auth.service.ts`)

**Changes**:
- Ensure registration is atomic (user creation + token generation in transaction)
- Ensure login triggers cart/wishlist migration
- Improve error handling for database unavailability

**Key Functions**:
- `register()`: Wrap user creation in transaction, ensure atomicity
- `login()`: After successful login, trigger cart/wishlist migration

---

### 2. Cache Service (`backend/src/services/cache.service.ts`)

**Changes**:
- Enhance `invalidateCache()` to handle Redis unavailability gracefully
- Ensure cache invalidation is non-blocking (fire-and-forget)
- Add consistent cache key patterns

**Key Functions**:
- `invalidateCache(pattern)`: Invalidate cache keys matching pattern (graceful degradation)

**Cache Key Patterns**:
- `game:{id}`: Single game
- `home:*`: All home page caches
- `catalog:*`: All catalog caches
- `user:{id}:cart`: User cart
- `user:{id}:wishlist`: User wishlist
- `user:{id}:orders`: User orders

---

### 3. Cart Service (`backend/src/services/cart.service.ts`)

**Changes**:
- Implement atomic cart migration from guest session to authenticated user
- Validate game availability before migration
- Merge quantities for duplicate items

**Key Functions**:
- `migrateSessionCartToUser(sessionId, userId)`: Atomically migrate cart items

**Migration Flow**:
1. Read guest cart items (where `userId = sessionId`)
2. Validate games exist and are in stock
3. Create/update user cart items (merge quantities if exists)
4. Delete guest cart items
5. Invalidate cache

---

### 4. Wishlist Service (`backend/src/services/wishlist.service.ts`)

**Changes**:
- Implement atomic wishlist migration from guest session to authenticated user
- Skip duplicate items (wishlist doesn't have quantities)

**Key Functions**:
- `migrateSessionWishlistToUser(sessionId, userId)`: Atomically migrate wishlist items

**Migration Flow**:
1. Read guest wishlist items (where `userId = sessionId`)
2. Validate games exist
3. Create user wishlist items (skip if already exists)
4. Delete guest wishlist items
5. Invalidate cache

---

### 5. G2A Service (`backend/src/services/g2a.service.ts`)

**Changes**:
- Ensure cache invalidation after product sync
- Improve error handling for cache operations
- Ensure sync lock prevents concurrent syncs

**Key Functions**:
- `syncG2ACatalog()`: After sync completes, invalidate cache (`game:*`, `home:*`, `catalog:*`)
- `acquireSyncLock()`: Prevent concurrent syncs using Redis lock
- `releaseSyncLock()`: Release lock after sync completes

**Sync Flow**:
1. Acquire sync lock
2. Fetch products from G2A API
3. Update database in batches (within transactions)
4. After all batches: Invalidate cache (non-blocking)
5. Release sync lock

---

### 6. G2A Sync Job (`backend/src/jobs/g2a-sync.job.ts`)

**Changes**:
- Ensure cache invalidation after stock checks
- Improve error handling for cache operations

**Key Functions**:
- `startStockCheckJob()`: After stock updates, invalidate affected product caches

---

### 7. Order Service (`backend/src/services/order.service.ts`)

**Changes**:
- Ensure transaction creation is atomic with order creation
- Ensure cache invalidation after order creation

**Key Functions**:
- `createOrder()`: Create order + items + transaction + balance update in single transaction
- After order creation: Invalidate `user:{id}:orders` and `user:{id}:cart`

---

### 8. G2A Webhook Service (`backend/src/services/g2a-webhook.service.ts`)

**Changes**:
- Ensure order status updates invalidate cache
- Improve idempotency handling

**Key Functions**:
- `processG2AWebhook()`: After order status update, invalidate `order:{id}` and `user:{id}:orders`

---

## Implementation Checklist

### Phase 1: Authentication Fixes

- [ ] **AUTH-001**: Wrap `register()` user creation in Prisma transaction
- [ ] **AUTH-002**: Ensure email sending is non-blocking (fire-and-forget)
- [ ] **AUTH-003**: Add cart/wishlist migration trigger in `login()` after successful authentication
- [ ] **AUTH-004**: Improve error handling for database unavailability

### Phase 2: Cache Invalidation Fixes

- [ ] **CACHE-001**: Enhance `invalidateCache()` to handle Redis unavailability gracefully
- [ ] **CACHE-002**: Ensure cache invalidation is non-blocking (try/catch, don't throw)
- [ ] **CACHE-003**: Add consistent cache key patterns documentation
- [ ] **CACHE-004**: Log cache operation failures for debugging

### Phase 3: Cart/Wishlist Migration

- [ ] **CART-001**: Implement `migrateSessionCartToUser()` with Prisma transaction
- [ ] **CART-002**: Validate game availability before migration
- [ ] **CART-003**: Merge quantities for duplicate items
- [ ] **CART-004**: Invalidate cache after migration
- [ ] **WISH-001**: Implement `migrateSessionWishlistToUser()` with Prisma transaction
- [ ] **WISH-002**: Skip duplicate items (wishlist doesn't have quantities)
- [ ] **WISH-003**: Invalidate cache after migration

### Phase 4: G2A Sync Fixes

- [ ] **G2A-001**: Add cache invalidation after `syncG2ACatalog()` completes
- [ ] **G2A-002**: Ensure sync lock prevents concurrent syncs
- [ ] **G2A-003**: Add cache invalidation after stock checks
- [ ] **G2A-004**: Improve error handling for cache operations in sync jobs

### Phase 5: Order/Transaction Fixes

- [ ] **ORDER-001**: Ensure transaction creation is atomic with order creation
- [ ] **ORDER-002**: Add cache invalidation after order creation
- [ ] **ORDER-003**: Ensure G2A webhook updates invalidate cache

### Phase 6: Testing

- [ ] **TEST-001**: Integration tests for authentication (registration, login)
- [ ] **TEST-002**: Integration tests for cache invalidation
- [ ] **TEST-003**: Integration tests for cart/wishlist migration
- [ ] **TEST-004**: Integration tests for G2A sync with cache invalidation
- [ ] **TEST-005**: Integration tests for Redis unavailability (graceful degradation)

---

## Code Examples

### Example 1: Atomic Registration

```typescript
export const register = async (data: RegisterRequest): Promise<AuthResponse> => {
  if (!prisma) {
    throw new AppError('Database not available', 503);
  }

  const { email, password, nickname, firstName, lastName } = data;

  // Use transaction for atomicity
  const user = await prisma.$transaction(async (tx) => {
    // Check if user exists
    const existingUser = await tx.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    return await tx.user.create({
      data: { email, passwordHash, nickname: nickname || 'Newbie Guy', firstName, lastName },
      select: { id: true, email: true, nickname: true, firstName: true, lastName: true, avatar: true, role: true },
    });
  });

  // Generate tokens (outside transaction, fast operation)
  const tokenPayload: TokenPayload = { userId: user.id, email: user.email, role: user.role };
  const token = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Send email (fire-and-forget, non-blocking)
  try {
    const { sendRegistrationEmail } = await import('./email.service.js');
    await sendRegistrationEmail(user.email, { username: user.nickname || 'User' });
  } catch (error) {
    console.error('Failed to send registration email:', error);
    // Don't fail registration if email fails
  }

  return { user, token, refreshToken, expiresIn: 7 * 24 * 60 * 60 };
};
```

### Example 2: Cache Invalidation with Graceful Degradation

```typescript
export const invalidateCache = async (pattern: string): Promise<void> => {
  try {
    if (!redisClient.isOpen) {
      console.warn(`[Cache] Redis not available, skipping invalidation for pattern: ${pattern}`);
      return; // Graceful degradation
    }

    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log(`[Cache] Invalidated ${keys.length} keys matching pattern: ${pattern}`);
    }
  } catch (err) {
    console.error(`[Cache] Error invalidating cache for pattern ${pattern}:`, err);
    // Don't throw - cache invalidation is non-critical
  }
};
```

### Example 3: Atomic Cart Migration

```typescript
export const migrateSessionCartToUser = async (sessionId: string, userId: string): Promise<void> => {
  await prisma.$transaction(async (tx) => {
    // Read guest cart items
    const guestItems = await tx.cartItem.findMany({
      where: { userId: sessionId },
      include: { game: { select: { id: true, inStock: true, g2aStock: true } } },
    });

    if (guestItems.length === 0) {
      return; // Nothing to migrate
    }

    // Migrate each item
    for (const item of guestItems) {
      // Validate game availability
      const isAvailable = item.game.inStock && (item.game.g2aStock !== false);
      if (!isAvailable) {
        console.warn(`[Cart Migration] Skipping out-of-stock game: ${item.gameId}`);
        continue;
      }

      // Check if user already has this item
      const existingItem = await tx.cartItem.findUnique({
        where: { userId_gameId: { userId, gameId: item.gameId } },
      });

      if (existingItem) {
        // Merge quantities
        await tx.cartItem.update({
          where: { userId_gameId: { userId, gameId: item.gameId } },
          data: { quantity: existingItem.quantity + item.quantity },
        });
      } else {
        // Create new item
        await tx.cartItem.create({
          data: { userId, gameId: item.gameId, quantity: item.quantity },
        });
      }

      // Delete guest item
      await tx.cartItem.delete({
        where: { userId_gameId: { userId: sessionId, gameId: item.gameId } },
      });
    }
  });

  // Invalidate cache (non-blocking)
  try {
    await invalidateCache(`session:${sessionId}:cart`);
    await invalidateCache(`user:${userId}:cart`);
  } catch (err) {
    console.error('[Cart Migration] Cache invalidation failed:', err);
    // Don't throw - migration succeeded, cache will refresh on next read
  }
};
```

---

## Testing Strategy

### Unit Tests

Test individual service functions:
- `register()`: Test transaction rollback on errors
- `login()`: Test cart/wishlist migration trigger
- `migrateSessionCartToUser()`: Test atomic migration, duplicate handling
- `invalidateCache()`: Test graceful degradation when Redis unavailable

### Integration Tests

Test end-to-end flows:
- Registration → Login → Cart migration → Order creation
- G2A sync → Cache invalidation → Frontend shows updated data
- Redis unavailable → Operations continue → Cache recovers when Redis available

### Test Scenarios

1. **Registration Success**: User created, tokens generated, email sent
2. **Registration Duplicate**: Error returned, no user created
3. **Login Success**: Tokens generated, cart/wishlist migrated
4. **Login Invalid**: Error returned, no tokens generated
5. **Cart Migration**: Guest items migrated, quantities merged, cache invalidated
6. **G2A Sync**: Products updated, cache invalidated, frontend shows new data
7. **Redis Unavailable**: Operations continue, cache misses logged

---

## Monitoring and Debugging

### Logs to Monitor

- `[Cache]` prefix: Cache operations (hits, misses, invalidations)
- `[Cart Migration]` prefix: Cart migration operations
- `[G2A Sync]` prefix: G2A synchronization operations
- `[Auth]` prefix: Authentication operations

### Key Metrics

- Cache hit rate: Should be > 80% when Redis available
- Cache invalidation latency: Should be < 1 second (95th percentile)
- G2A sync duration: Should complete within 30 minutes
- Cart migration success rate: Should be 100%

### Debugging Tips

1. **Cache Issues**: Check Redis connection, TTL values, key patterns
2. **Migration Issues**: Check transaction logs, game availability, duplicate handling
3. **Sync Issues**: Check G2A API rate limits, sync lock, cache invalidation
4. **Auth Issues**: Check database connection, transaction rollbacks, email service

---

## Rollback Plan

If issues occur after deployment:

1. **Cache Issues**: Disable Redis (set `REDIS_URL` to empty), system will degrade gracefully
2. **Migration Issues**: Disable cart/wishlist migration temporarily (comment out migration calls)
3. **Sync Issues**: Disable G2A sync jobs temporarily (comment out cron schedules)
4. **Auth Issues**: Revert authentication service changes (use git rollback)

All changes are backward compatible - system will continue operating even if new features fail.

---

## Next Steps

1. Review this quickstart guide
2. Implement changes following the checklist
3. Write integration tests
4. Test in development environment
5. Deploy to staging
6. Monitor logs and metrics
7. Deploy to production

For detailed implementation details, see:
- [data-model.md](./data-model.md): Data entity definitions
- [contracts/api-contracts.md](./contracts/api-contracts.md): Service contracts
- [research.md](./research.md): Technical decisions and rationale

