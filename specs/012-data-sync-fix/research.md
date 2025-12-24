# Research: Data Synchronization & System Integration Fix

**Feature**: 012-data-sync-fix  
**Date**: 2024-12-23  
**Status**: Complete

## Research Questions

### Q1: How to ensure atomic operations for user registration and login?

**Context**: FR-001 and FR-002 require atomic registration and login operations. Current implementation may have race conditions or partial failures.

**Decision**: Use Prisma database transactions for all multi-step operations in registration and login. Wrap user creation, token generation, and email sending in a transaction where possible. Email sending should be non-blocking (fire-and-forget) to prevent transaction rollback on email service failures.

**Rationale**: 
- Prisma transactions ensure all-or-nothing semantics for database operations
- Email failures should not block user registration (already implemented correctly)
- Token generation is synchronous and fast, can be part of transaction
- Database is source of truth, so transaction ensures consistency

**Alternatives Considered**:
- Two-phase commit: Overkill for single database operations
- Event sourcing: Adds unnecessary complexity for this use case
- Saga pattern: Not needed for single-database transactions

**Implementation Notes**:
- Registration: `prisma.$transaction()` wrapping user creation and token generation
- Login: Already atomic (single query + token generation), but ensure error handling is correct
- Email: Keep as fire-and-forget (try/catch, don't throw)

---

### Q2: How to ensure cache invalidation occurs atomically with database mutations?

**Context**: FR-004 requires cache invalidation to occur atomically with database updates. Current implementation may have race conditions where cache is invalidated before database commit, or database fails but cache is already cleared.

**Decision**: Use a two-phase approach:
1. Perform database mutation within transaction
2. After successful commit, invalidate cache (with error handling that doesn't fail the operation)

**Rationale**:
- Database transaction ensures data consistency
- Cache invalidation after commit ensures we only invalidate when data is actually changed
- If cache invalidation fails, database is still correct (cache will be stale but can be refreshed on next read)
- This follows "cache-aside" pattern where cache is secondary to database

**Alternatives Considered**:
- Invalidate before transaction: Risk of invalidating cache for failed operations
- Invalidate within transaction: Not possible (Redis is separate system)
- Write-through cache: Would require Redis transactions, adds complexity

**Implementation Notes**:
- Wrap database operations in `prisma.$transaction()`
- After transaction commits, call `invalidateCache()` with try/catch
- Log cache invalidation failures but don't throw errors
- Use consistent cache key patterns: `game:{id}`, `home:*`, `catalog:*`

---

### Q3: How to handle Redis unavailability gracefully without blocking operations?

**Context**: FR-009 requires graceful degradation when Redis is unavailable. Current implementation may block operations or fail silently.

**Decision**: Implement "cache-aside" pattern with try/catch around all Redis operations. Check Redis availability before operations, fallback to database-only mode when Redis is unavailable.

**Rationale**:
- Cache is performance optimization, not critical path
- Database is source of truth, so operations can continue without cache
- Graceful degradation ensures system remains functional
- Automatic recovery when Redis becomes available (no code changes needed)

**Alternatives Considered**:
- Circuit breaker pattern: Adds complexity, may be overkill
- Queue cache operations: Adds latency, not needed for optional cache
- Fail-fast: Would break user experience unnecessarily

**Implementation Notes**:
- Check `redisClient.isOpen` before operations
- Wrap all Redis operations in try/catch
- Log cache misses/errors but continue with database operations
- Return database results directly when Redis unavailable
- Cache writes should be fire-and-forget (don't await, use try/catch)

---

### Q4: How to ensure cart/wishlist migration is atomic during user login?

**Context**: FR-006 and FR-007 require atomic migration of cart/wishlist items from guest session to authenticated user account.

**Decision**: Use Prisma transaction to:
1. Read guest cart/wishlist items (by sessionId)
2. Validate game availability
3. Create/update user cart/wishlist items
4. Delete guest items
5. Invalidate cache

All within a single transaction.

**Rationale**:
- Transaction ensures all-or-nothing migration
- Prevents duplicate items or lost items
- Validates game availability before migration
- Atomic cache invalidation after migration

**Alternatives Considered**:
- Two separate operations: Risk of partial migration
- Queue-based migration: Adds complexity and latency
- Lazy migration: User might lose items if they don't access cart immediately

**Implementation Notes**:
- Use `prisma.$transaction()` for entire migration
- Check game existence and stock before migration
- Handle duplicate items (merge quantities for cart, skip for wishlist)
- Invalidate cache after successful migration
- Log errors but preserve guest cart if migration fails

---

### Q5: How to ensure G2A sync jobs properly invalidate cache after product updates?

**Context**: FR-003 and FR-004 require G2A product sync to update database and invalidate cache. Current implementation may not invalidate cache consistently.

**Decision**: After each batch of product updates in G2A sync:
1. Complete database transaction
2. Invalidate cache for affected products: `game:{id}`, `home:*`, `catalog:*`
3. Log invalidation results

**Rationale**:
- Batch invalidation is more efficient than per-product
- Invalidate after transaction ensures we only invalidate when data actually changed
- Pattern-based invalidation (`home:*`, `catalog:*`) ensures all related caches are cleared
- Logging helps debug cache issues

**Alternatives Considered**:
- Per-product invalidation: Too many Redis calls, slower
- Invalidate only at end: Users see stale data during sync
- Write-through cache: Would require Redis transactions, adds complexity

**Implementation Notes**:
- After `syncG2ACatalog()` completes, call `invalidateCache('home:*')`, `invalidateCache('game:*')`, `invalidateCache('catalog:*')`
- After stock check updates, invalidate affected product caches
- Use try/catch to prevent cache failures from breaking sync
- Log cache invalidation results for monitoring

---

### Q6: How to handle concurrent G2A sync jobs to prevent race conditions?

**Context**: Edge case requires handling concurrent sync jobs updating same products.

**Decision**: Use Redis-based distributed lock (`g2a:sync:lock`) with TTL. Only one sync job can run at a time. Lock is acquired at start, released at end (or expires after 1 hour).

**Rationale**:
- Prevents duplicate work and race conditions
- Redis lock works across multiple serverless instances
- TTL ensures lock is released even if process crashes
- Simple and effective for this use case

**Alternatives Considered**:
- Database-level locking: Doesn't work across instances
- Queue-based sync: Adds complexity and latency
- Optimistic locking: Doesn't prevent concurrent syncs, just detects conflicts

**Implementation Notes**:
- Check `acquireSyncLock()` before starting sync
- If lock exists, skip sync and log message
- Release lock in finally block to ensure cleanup
- Use 1-hour TTL as safety net

---

## Best Practices Applied

### Database Transactions
- Use Prisma `$transaction()` for all multi-step operations
- Keep transactions short to reduce lock contention
- Handle transaction failures with proper error messages

### Cache Invalidation
- Invalidate after database commit (not before)
- Use pattern-based invalidation for related data
- Don't fail operations if cache invalidation fails
- Log cache operations for debugging

### Error Handling
- Graceful degradation when optional services (Redis) unavailable
- Fire-and-forget for non-critical operations (email, cache writes)
- Proper error messages without exposing system internals
- Log all errors for debugging

### G2A API Integration
- Respect rate limits (600 req/min)
- Batch operations for efficiency
- Retry with exponential backoff for transient failures
- Cache OAuth2 tokens to reduce API calls

## Dependencies Identified

- Prisma ORM: For database transactions
- Redis client: For caching and distributed locking
- G2A API: For product/order synchronization
- bcrypt: For password hashing (already in use)
- JWT: For authentication tokens (already in use)

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Redis unavailable during high load | Performance degradation | Graceful degradation, database-only mode |
| G2A API rate limiting | Sync delays | Batch processing, rate limit monitoring |
| Concurrent sync jobs | Data inconsistency | Distributed locking with Redis |
| Cache invalidation failures | Stale data | Log errors, cache will refresh on next read |
| Transaction failures | Partial updates | Rollback ensures consistency |

## Conclusion

All research questions resolved. Implementation approach is clear:
1. Use Prisma transactions for atomicity
2. Invalidate cache after database commits
3. Graceful degradation when Redis unavailable
4. Distributed locking for concurrent syncs
5. Proper error handling and logging throughout

No additional clarifications needed. Ready for Phase 1 design.

