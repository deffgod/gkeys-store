# Research: System Integration Enhancement

**Feature**: 001-system-integration-enhancement  
**Date**: 2024-12-23  
**Status**: Complete

## Overview

This research document consolidates technical decisions and patterns for enhancing system integration between G2A API, Prisma database, Redis caching, and admin panel functionality. All technical decisions are based on existing codebase patterns and best practices.

## Key Technical Decisions

### 1. Cart and Wishlist Migration

**Decision**: Use Prisma transactions for atomic cart/wishlist migration from guest session to authenticated user.

**Rationale**: 
- Ensures data consistency during migration
- Prevents partial migrations if errors occur
- Already implemented in `cart.service.ts` and `wishlist.service.ts`
- Validates game availability before migration

**Alternatives Considered**:
- Non-transactional approach: Rejected due to risk of data inconsistency
- Separate migration endpoint: Rejected - migration should be automatic on login

**Implementation Pattern**:
```typescript
await prisma.$transaction(async (tx) => {
  // Read session items
  // Validate and merge with user items
  // Delete session items
});
```

### 2. Cache Invalidation Strategy

**Decision**: Use pattern-based cache invalidation with graceful degradation when Redis is unavailable.

**Rationale**:
- Pattern matching allows bulk invalidation (e.g., `home:*`, `game:*`)
- Graceful degradation ensures system works without Redis
- Non-blocking invalidation prevents performance impact
- Already implemented in `cache.service.ts`

**Alternatives Considered**:
- Tag-based invalidation: More complex, requires additional Redis structures
- Manual key invalidation: Too granular, error-prone

**Cache Key Patterns**:
- `home:*` - All home page caches
- `game:{slug}` - Individual game cache
- `catalog:*` - All catalog caches
- `user:{id}:cart` - User cart cache
- `user:{id}:wishlist` - User wishlist cache
- `session:{id}:cart` - Guest cart cache
- `blog:{slug}` - Blog post cache

### 3. G2A Synchronization Cache Invalidation

**Decision**: Automatically invalidate related caches after G2A synchronization completes.

**Rationale**:
- Ensures users see updated product data immediately
- Prevents stale cache data after sync
- Matches user expectation of fresh data

**Implementation**:
- After `syncG2ACatalog()` completes, call `invalidateCache('home:*')`, `invalidateCache('game:*')`, `invalidateCache('catalog:*')`
- Non-blocking - log errors but don't fail sync

### 4. Redis Caching with Graceful Degradation

**Decision**: All cache operations must handle Redis unavailability gracefully.

**Rationale**:
- System must work without Redis (development, fallback scenarios)
- Prevents single point of failure
- Already implemented pattern in `cache.service.ts`

**Pattern**:
```typescript
try {
  if (await isRedisAvailable()) {
    // Use cache
  }
} catch (error) {
  // Fallback to database
  console.warn('Cache unavailable, using database');
}
```

### 5. Admin Access Control

**Decision**: Use role-based access control (RBAC) with middleware and frontend checks.

**Rationale**:
- Security requires both backend and frontend checks
- Middleware prevents unauthorized API access
- Frontend check improves UX (immediate redirect)

**Implementation**:
- Backend: `requireAdmin` middleware checks JWT token role
- Frontend: `AdminLayout` component checks user role before rendering

### 6. OAuth2 Token Caching

**Decision**: Cache G2A OAuth2 tokens in Redis with TTL matching token expiry.

**Rationale**:
- Reduces API calls to G2A
- Improves performance
- Already implemented in `g2a.service.ts`

**TTL Strategy**:
- Cache token with TTL = `expires_in` from G2A response
- Refresh token if expires within 5 minutes
- Fallback to direct API call if Redis unavailable

### 7. Blog Post Reading Time Calculation

**Decision**: Calculate reading time automatically based on word count (200 words per minute).

**Rationale**:
- Standard industry practice
- Improves user experience
- Can be calculated server-side during save

**Formula**: `readTime = Math.ceil(wordCount / 200)`

### 8. Cache TTL Strategy

**Decision**: Use different TTLs based on data volatility.

**Rationale**:
- Frequently changing data needs shorter TTL
- Stable data can have longer TTL
- Balances freshness with performance

**TTL Values**:
- Home page data: 7 days (best sellers), 24 hours (new items)
- Game details: 1 hour
- Catalog filters: 1 hour
- User cart/wishlist: 15-30 minutes
- Blog posts: 24 hours
- OAuth2 tokens: As per G2A expiry (1 hour)

## Integration Patterns

### Authentication Flow
1. User registers/logs in
2. JWT tokens generated (access + refresh)
3. If guest session exists, trigger cart/wishlist migration
4. Migration runs in transaction
5. Cache invalidated after migration

### Product Update Flow
1. Admin updates product
2. Prisma updates database
3. Cache invalidated: `game:{slug}`, `home:*`, `catalog:*`
4. Changes visible in public catalog within 10 seconds

### G2A Sync Flow
1. Admin triggers sync
2. G2A API called with OAuth2 token (cached if available)
3. Products synced to database
4. Cache invalidated: `home:*`, `game:*`, `catalog:*`
5. Sync progress tracked in Redis

## Error Handling Patterns

### Redis Unavailability
- All cache operations wrapped in try/catch
- Log warning but continue with database
- Never throw errors that break functionality

### G2A API Failures
- Retry with exponential backoff
- Log errors for monitoring
- Continue with existing data if sync fails

### Migration Failures
- Transaction rollback on error
- Log error details
- User can retry migration manually

## Performance Considerations

### Database Queries
- Use Prisma `include` and `select` to limit data
- Batch operations where possible
- Use transactions for atomic operations

### Cache Strategy
- Cache frequently accessed data
- Invalidate on mutations
- Use appropriate TTLs

### API Calls
- Cache OAuth2 tokens
- Respect G2A rate limits (600 req/min)
- Use retry logic for transient failures

## Security Considerations

### Authentication
- JWT tokens with strong secrets (32+ chars)
- Different secrets for access/refresh tokens
- Token validation in middleware

### Authorization
- Role-based access control
- Admin-only endpoints protected
- Frontend and backend checks

### Data Validation
- Input validation on client and server
- Prisma schema enforces data types
- Express-validator for request validation

## Testing Strategy

### Unit Tests
- Service functions
- Cache operations
- Migration logic

### Integration Tests
- API endpoints
- Database operations
- Redis interactions
- G2A API integration (mocked)

### E2E Tests
- User registration/login flow
- Cart/wishlist migration
- Admin panel access
- Product management

## Dependencies

### Existing Services
- `auth.service.ts` - Authentication logic
- `cart.service.ts` - Cart operations and migration
- `wishlist.service.ts` - Wishlist operations and migration
- `g2a.service.ts` - G2A API integration
- `cache.service.ts` - Cache operations
- `admin.service.ts` - Admin operations

### External APIs
- G2A Integration API (Import and Export)
- OAuth2 authentication for Import API
- Hash-based authentication for Export API

### Infrastructure
- PostgreSQL 15+ database
- Redis (optional but recommended)
- Vercel serverless functions

## Conclusion

All technical decisions are based on existing codebase patterns and industry best practices. The implementation leverages existing services and follows established patterns for consistency and maintainability.

