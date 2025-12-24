# Research: Admin Panel Function Synchronization

**Feature**: 013-admin-sync  
**Date**: 2024-12-23  
**Status**: Complete

## Research Questions

### Q1: How to integrate payment gateway refund operations into admin panel?

**Context**: FR-003 requires refund operations for transactions processed through Stripe, PayPal, Mollie, and Terminal payment gateways. Each gateway has different refund APIs and error handling.

**Decision**: Create a unified refund service that abstracts payment gateway differences. Each payment gateway service (stripe.service.ts, paypal.service.ts, mollie.service.ts, terminal.service.ts) will expose a `refundTransaction()` method with consistent interface. Admin service will call the appropriate gateway service based on transaction method. Error handling will be consistent across all gateways with proper error messages.

**Rationale**: 
- Abstraction layer simplifies admin panel integration
- Consistent error handling improves user experience
- Gateway-specific logic remains encapsulated in respective services
- Easy to add new payment gateways in future

**Alternatives Considered**:
- Direct gateway API calls from admin service: Too much coupling, violates separation of concerns
- Single payment service with all gateways: Too monolithic, harder to maintain
- Gateway-specific admin endpoints: Too complex, harder to maintain consistency

**Implementation Notes**:
- Each gateway service must implement `refundTransaction(transactionId: string, amount?: number): Promise<RefundResult>`
- Admin service will identify payment method from transaction record
- Refund operations must be logged and transaction status updated atomically
- Failed refunds should be retryable with proper error messages

---

### Q2: How to expose cache statistics and management operations to admin panel?

**Context**: FR-013 and FR-014 require cache statistics display and cache invalidation by pattern. Cache service already has `invalidateCache()` but needs statistics and management APIs.

**Decision**: Extend cache.service.ts with `getCacheStatistics()` function that returns hit rates, key counts, memory usage, and Redis connection status. Use Redis INFO command for statistics. Cache invalidation already exists but needs to be exposed via admin API. Add `getCacheKeys(pattern: string)` for key inspection.

**Rationale**:
- Redis INFO provides comprehensive statistics
- Pattern-based invalidation already implemented
- Statistics can be cached briefly (30 seconds) to avoid performance impact
- Graceful degradation if Redis unavailable (return default statistics)

**Alternatives Considered**:
- Custom statistics tracking: Unnecessary complexity, Redis provides this
- Real-time statistics: Performance impact, brief caching acceptable
- Full cache dump: Security risk, pattern-based access sufficient

**Implementation Notes**:
- Cache statistics should be cached for 30 seconds to avoid performance impact
- Use Redis INFO command for memory and key statistics
- Track cache hits/misses in application if needed (optional enhancement)
- Cache invalidation must remain non-blocking (already implemented)

---

### Q3: How to structure admin API endpoints for cart and wishlist management?

**Context**: FR-004, FR-005, FR-006 require cart and wishlist management. Cart and wishlist services exist but need admin-specific operations (view any user's cart, modify carts, view statistics).

**Decision**: Extend cart.service.ts and wishlist.service.ts with admin-specific functions: `getUserCart(userId: string)`, `updateUserCart(userId: string, items: CartItem[])`, `clearUserCart(userId: string)`, `getWishlistStatistics()`. Admin operations bypass session checks and work directly with userId. Add validation to ensure admin operations are logged.

**Rationale**:
- Reuse existing service logic for consistency
- Admin-specific functions maintain separation of concerns
- Direct userId access simplifies admin operations
- Statistics can be computed from existing data

**Alternatives Considered**:
- Separate admin cart/wishlist services: Unnecessary duplication
- Modify existing functions with admin flag: Breaks encapsulation, harder to secure
- Direct database access from admin: Bypasses business logic, inconsistent

**Implementation Notes**:
- Admin functions must validate userId exists
- Cart modifications should trigger cache invalidation
- Wishlist statistics: most wishlisted games, conversion rates, user counts
- All admin operations must be logged for audit trail

---

### Q4: How to implement FAQ management with category organization?

**Context**: FR-007, FR-008, FR-009 require FAQ CRUD operations and category management. FAQ service exists but may need admin-specific operations.

**Decision**: FAQ service already has `getFAQs()` and `getFAQCategories()`. Add admin functions: `createFAQ()`, `updateFAQ()`, `deleteFAQ()`, `reorderFAQs()`. Categories are string-based (no separate category entity needed). FAQ order field exists in schema for ordering within categories.

**Rationale**:
- FAQ service structure already supports CRUD
- String-based categories are sufficient (no need for category entity)
- Order field in schema supports category ordering
- Publishing/unpublishing via `active` field

**Alternatives Considered**:
- Separate category entity: Unnecessary complexity for current needs
- No ordering: Poor UX, order field already in schema
- External CMS: Overkill for simple FAQ management

**Implementation Notes**:
- FAQ order field used for display order within category
- Active field controls publication status
- Categories are case-insensitive strings
- FAQ deletion should be soft delete (set active=false) or hard delete based on requirements

---

### Q5: How to expose G2A offers and reservations to admin panel?

**Context**: FR-010 and FR-011 require G2A offers and reservations management. G2A offer and reservation services exist but need admin read operations.

**Decision**: G2A offer service and reservation service already have functions for managing offers and reservations. Add admin-specific read functions: `getAllOffers()`, `getOfferById()`, `getAllReservations()`, `getReservationById()`. Admin can view but not create/edit offers (per out of scope). Reservation cancellation can be added if needed.

**Rationale**:
- G2A services already have necessary functions
- Admin read operations are straightforward
- View-only access aligns with out of scope (no offer creation/editing)
- Reservation management may need cancellation capability

**Alternatives Considered**:
- Full CRUD for offers: Out of scope, view-only sufficient
- Real-time reservation updates: Complex, polling acceptable
- Separate admin G2A service: Unnecessary, extend existing services

**Implementation Notes**:
- G2A offers: Read-only access for viewing status, inventory, pricing
- G2A reservations: View active reservations, optional cancellation
- G2A metrics: Already exposed via `getG2AMetricsController`, enhance display
- All G2A operations must handle API failures gracefully

---

### Q6: How to implement enhanced user management (balance, roles, activity)?

**Context**: FR-015, FR-016, FR-017 require balance management, role assignment, and activity logs. User service exists but needs admin-specific operations.

**Decision**: Extend user.service.ts with admin functions: `updateUserBalance(userId: string, amount: number, reason: string)`, `updateUserRole(userId: string, role: Role)`, `getUserActivity(userId: string)`. Balance updates must create transaction records atomically. Role changes must validate role exists. Activity logs compiled from orders, transactions, and login history.

**Rationale**:
- User service already has user data access
- Balance updates require transaction recording (atomicity)
- Role validation ensures data integrity
- Activity logs can be compiled from existing data

**Alternatives Considered**:
- Separate activity log table: Unnecessary, can compile from existing data
- Balance updates without transactions: Breaks audit trail
- Role changes without validation: Data integrity risk

**Implementation Notes**:
- Balance updates: Use Prisma transaction to update balance and create transaction record
- Role assignment: Validate role enum, update user, log change
- Activity logs: Query orders, transactions, and potentially add login history tracking
- All admin user operations must be logged for audit trail

---

## Technical Decisions Summary

1. **Payment Refunds**: Unified refund service abstraction across all payment gateways
2. **Cache Management**: Extend cache service with statistics and expose via admin API
3. **Cart/Wishlist Management**: Admin-specific functions in existing services
4. **FAQ Management**: Extend FAQ service with CRUD operations
5. **G2A Management**: Read-only access to offers and reservations via existing services
6. **User Management**: Extend user service with balance, role, and activity functions

All decisions maintain consistency with existing codebase patterns and follow constitution principles.

