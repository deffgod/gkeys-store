# Feature Specification: Data Synchronization & System Integration Fix

**Feature Branch**: `012-data-sync-fix`  
**Created**: 2024-12-23  
**Status**: Draft  
**Input**: User description: "Давай обновим данные в базе данных Prisma DB, синхронизацию с REdis, синхронизацию G2A (products, orders, wishlist, transactions) чтобы работала авторизация и регистрация и тд."

## User Scenarios & Testing

### User Story 1 – Reliable User Authentication (Priority: P1)

As a user, I must be able to register a new account and log in successfully so that I can access personalized features and make purchases.

**Why this priority**: Authentication is the foundation for all user interactions. Without working registration and login, users cannot access the platform.

**Independent Test**: Can be fully tested by creating a new account, logging in, and verifying access to protected resources. Delivers core user access functionality.

**Acceptance Scenarios**:

1. **Given** a new user wants to register, **When** they provide valid email and password, **Then** account is created in database, user receives confirmation, and can immediately log in.
2. **Given** a registered user, **When** they provide correct credentials, **Then** they receive authentication tokens and can access their account.
3. **Given** a user with invalid credentials, **When** they attempt to log in, **Then** they receive clear error message without exposing system details.

---

### User Story 2 – Consistent Product Data Across Systems (Priority: P1)

As a system administrator, I need product data to be synchronized correctly between Prisma database, Redis cache, and G2A API so that users always see accurate product information, prices, and stock availability.

**Why this priority**: Product data inconsistency leads to incorrect prices, stock mismatches, and failed purchases. This directly impacts user trust and business operations.

**Independent Test**: Can be fully tested by syncing products from G2A, verifying database updates, checking Redis cache invalidation, and confirming frontend displays correct data. Delivers data consistency across all systems.

**Acceptance Scenarios**:

1. **Given** G2A product sync runs, **When** products are fetched and updated, **Then** Prisma database reflects latest product data, Redis cache is invalidated for affected products, and frontend shows updated information.
2. **Given** a product price changes in G2A, **When** sync job executes, **Then** database price is updated, cache is cleared, and users see new price within 15 minutes.
3. **Given** a product goes out of stock in G2A, **When** stock check runs, **Then** database stock status is updated, cache reflects unavailability, and users cannot add out-of-stock items to cart.

---

### User Story 3 – Synchronized Order and Transaction Data (Priority: P2)

As a user, I need my orders and transactions to be accurately recorded and synchronized between database, cache, and G2A so that I can track purchases, receive game keys, and view transaction history correctly.

**Why this priority**: Order and transaction synchronization ensures users receive purchased items and can track their purchase history. This is critical for user satisfaction and business operations.

**Independent Test**: Can be fully tested by creating an order, verifying database record, checking G2A order creation, confirming transaction recording, and validating cache updates. Delivers complete order lifecycle tracking.

**Acceptance Scenarios**:

1. **Given** a user completes a purchase, **When** order is created, **Then** order is saved in Prisma database, G2A order is created, transaction is recorded, cache is updated, and user receives confirmation.
2. **Given** G2A webhook receives order status update, **When** webhook is processed, **Then** local order status is updated in database, cache is invalidated, and user sees updated order status.
3. **Given** a user views transaction history, **When** they request transactions, **Then** system returns accurate transaction data from database with proper cache handling.

---

### User Story 4 – Synchronized Cart and Wishlist Data (Priority: P2)

As a user, I need my cart and wishlist items to be properly synchronized between session storage, database, and cache so that items persist across sessions and devices when I log in.

**Why this priority**: Cart and wishlist synchronization ensures users don't lose their selections and can seamlessly transition between guest and authenticated states.

**Independent Test**: Can be fully tested by adding items as guest, logging in, verifying items migrate to user account, and confirming cache consistency. Delivers seamless user experience across authentication states.

**Acceptance Scenarios**:

1. **Given** a guest user adds items to cart, **When** they register and log in, **Then** cart items are migrated to their user account, database is updated, and cache reflects new user's cart.
2. **Given** an authenticated user adds items to wishlist, **When** items are saved, **Then** wishlist is stored in database, cache is updated, and items persist across sessions.
3. **Given** a user removes item from cart, **When** removal is processed, **Then** database is updated, cache is invalidated, and frontend reflects empty cart state.

---

### Edge Cases

- What happens when Redis is unavailable during data mutation? System should gracefully degrade to database-only operations and log the cache miss.
- How does system handle G2A API failures during product sync? System should retry with exponential backoff, log errors, and continue with available products.
- What happens when database transaction fails but cache is already updated? System should rollback cache changes or mark cache as stale.
- How does system handle concurrent updates to same product from multiple sync jobs? System should use database transactions and cache locking to prevent race conditions.
- What happens when user registration succeeds but email service fails? Registration should complete successfully, email failure should be logged but not block user access.
- How does system handle G2A webhook received before local order is created? System should queue webhook for processing after order creation or create order from webhook data.
- What happens when cart migration fails during user login? System should preserve guest cart, log error, and allow user to manually migrate items later.

## Requirements

### Functional Requirements

- **FR-001**: System MUST ensure user registration creates account in Prisma database with hashed password, generates authentication tokens, and sends confirmation email. Registration must be atomic - either fully succeeds or fully fails.
- **FR-002**: System MUST ensure user login validates credentials against Prisma database, generates fresh authentication tokens, and returns user profile data. Login must handle invalid credentials gracefully without exposing system internals.
- **FR-003**: System MUST synchronize G2A products to Prisma database, updating existing products and creating new ones. Sync must apply 2% markup to prices, update stock status, and preserve product relationships (categories, genres, platforms).
- **FR-004**: System MUST invalidate Redis cache when product data changes (create, update, delete). Cache invalidation must use consistent key patterns and occur atomically with database updates.
- **FR-005**: System MUST synchronize G2A order status updates to local Prisma database orders. Order synchronization must be idempotent, handle webhook events correctly, and update transaction records.
- **FR-006**: System MUST synchronize cart items from guest session to authenticated user account during login. Migration must be atomic, preserve item quantities, validate game availability, and update cache.
- **FR-007**: System MUST synchronize wishlist items from guest session to authenticated user account during login. Migration must be atomic, prevent duplicates, and update cache.
- **FR-008**: System MUST ensure transaction records are created for all financial operations (purchases, top-ups, refunds). Transactions must be linked to orders, users, and payment methods correctly.
- **FR-009**: System MUST handle Redis unavailability gracefully - operations should continue using database only, cache misses should be logged, and system should retry cache operations when Redis becomes available.
- **FR-010**: System MUST ensure G2A product sync runs on schedule (2 times daily) and stock checks run every 15 minutes. Sync jobs must handle rate limiting, retry failed operations, and log progress.
- **FR-011**: System MUST ensure cache keys follow consistent naming patterns (e.g., `game:{id}`, `user:{id}:cart`, `g2a:sync:progress`). Cache TTL must be appropriate for data type (short for dynamic data, longer for static data).
- **FR-012**: System MUST ensure database transactions are used for multi-step operations (order creation, cart migration, wishlist migration) to maintain data consistency. Failed transactions must rollback all changes.

### Non-Functional Requirements

- **NFR-001 (Reliability)**: System MUST maintain data consistency between Prisma database and Redis cache. Cache invalidation must occur within 1 second of database mutation.
- **NFR-002 (Performance)**: Product sync operations MUST complete within 30 minutes for full catalog sync. Stock checks MUST complete within 5 minutes for all products.
- **NFR-003 (Resilience)**: System MUST continue operating when Redis is unavailable. Cache operations must not block critical user flows (registration, login, purchases).
- **NFR-004 (Data Integrity)**: All data mutations MUST be atomic. Partial updates that leave system in inconsistent state are not acceptable.
- **NFR-005 (Observability)**: System MUST log all synchronization operations, cache invalidations, and data migration events. Logs must include timestamps, operation type, and success/failure status.

### Key Entities

- **User**: Represents authenticated user account with email, password hash, profile data, balance, and role. Must be synchronized between database and session storage.
- **Game/Product**: Represents game product with G2A product ID, price, stock status, and metadata. Must be synchronized between G2A API, Prisma database, and Redis cache.
- **Order**: Represents purchase order with items, total amount, status, and G2A order reference. Must be synchronized between Prisma database, G2A API, and cache.
- **Transaction**: Represents financial transaction (purchase, top-up, refund) linked to user and order. Must be accurately recorded in Prisma database.
- **CartItem**: Represents item in shopping cart with game reference and quantity. Must be synchronized between session storage, Prisma database (for authenticated users), and cache.
- **WishlistItem**: Represents item in user wishlist with game reference. Must be synchronized between session storage, Prisma database (for authenticated users), and cache.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can successfully register new accounts - 100% of valid registration attempts result in account creation and immediate login capability.
- **SC-002**: Users can successfully log in - 100% of valid login attempts result in authentication token generation and access to user account.
- **SC-003**: Product data consistency - 100% of product updates from G2A sync are reflected in database within 30 minutes, and cache is invalidated for all affected products.
- **SC-004**: Order synchronization accuracy - 100% of completed orders are recorded in database, linked to G2A orders, and transactions are created correctly.
- **SC-005**: Cart and wishlist migration - 100% of guest cart/wishlist items are successfully migrated to user account during login, with no data loss.
- **SC-006**: System resilience - System continues operating normally (user registration, login, purchases) when Redis is unavailable, with graceful degradation and automatic recovery when Redis becomes available.
- **SC-007**: Cache invalidation timeliness - 95% of cache invalidations occur within 1 second of database mutation, ensuring users see updated data quickly.

## Assumptions

- Prisma database is the source of truth for all persistent data.
- Redis cache is optional enhancement - system must function without it.
- G2A API credentials are properly configured in environment variables.
- Database connection is stable and available for all operations.
- Email service for registration confirmations is configured (failures don't block registration).
- G2A API rate limits are respected (600 requests per minute).
- System clock is synchronized (NTP) for timestamp validation in webhooks.

## Dependencies

- Prisma database connection and schema are up to date.
- Redis connection is configured (optional but recommended).
- G2A API credentials are valid and have appropriate permissions.
- Environment variables for database, Redis, and G2A are properly set.
- Background job scheduler (cron) is running for G2A sync jobs.

## Out of Scope

- Frontend UI changes for displaying synchronized data (covered in other features).
- Payment gateway integration beyond G2A (covered in payment features).
- Email template design or content changes.
- G2A API authentication method changes (OAuth2 and hash-based auth are already implemented).
- Database schema migrations (assumes schema is already correct).
