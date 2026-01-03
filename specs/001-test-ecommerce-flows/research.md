# Research: Test E-commerce Core Flows

**Feature**: 001-test-ecommerce-flows  
**Date**: 2024-12-30  
**Status**: Complete

## Overview

This research document consolidates understanding of existing e-commerce functionality (cart, wishlist, order creation) and identifies testing requirements, gaps, and strategies. All findings are based on codebase analysis and existing test patterns.

## Existing Implementation Analysis

### 1. Cart Service (`backend/src/services/cart.service.ts`)

**Current Implementation**:
- ✅ `getCart()`: Supports both authenticated users and guest sessions
- ✅ `addToCart()`: Validates game availability, handles quantity updates
- ✅ `updateCartItem()`: Updates quantity with validation
- ✅ `removeFromCart()`: Removes individual items
- ✅ `clearCart()`: Clears entire cart
- ✅ `migrateSessionCartToUser()`: Atomic migration from session to user
- ✅ Redis caching with graceful degradation
- ✅ Cache invalidation after mutations

**Testing Gaps Identified**:
- ❌ No unit tests for cart service functions
- ❌ No integration tests for cart API endpoints
- ❌ No tests for concurrent cart updates
- ❌ No tests for cart migration edge cases
- ❌ No performance tests for cart operations

**Key Functions to Test**:
- `getCart(userId?, sessionId?)`: Test authenticated vs guest access
- `addToCart(gameId, quantity, userId?, sessionId?)`: Test validation, quantity updates
- `updateCartItem(gameId, quantity, userId?, sessionId?)`: Test quantity validation
- `removeFromCart(gameId, userId?, sessionId?)`: Test item removal
- `clearCart(userId?, sessionId?)`: Test cart clearing
- `migrateSessionCartToUser(sessionId, userId)`: Test migration logic

### 2. Wishlist Service (`backend/src/services/wishlist.service.ts`)

**Current Implementation**:
- ✅ `getWishlist()`: Supports both authenticated users and guest sessions
- ✅ `addToWishlist()`: Prevents duplicates, validates game existence
- ✅ `removeFromWishlist()`: Removes items
- ✅ `checkWishlist()`: Checks if game is in wishlist
- ✅ `migrateSessionWishlistToUser()`: Atomic migration from session to user
- ✅ Redis caching with graceful degradation
- ✅ Cache invalidation after mutations

**Testing Gaps Identified**:
- ❌ No unit tests for wishlist service functions
- ❌ No integration tests for wishlist API endpoints
- ❌ No tests for wishlist migration edge cases
- ❌ No tests for duplicate prevention

**Key Functions to Test**:
- `getWishlist(userId?, sessionId?)`: Test authenticated vs guest access
- `addToWishlist(gameId, userId?, sessionId?)`: Test duplicate prevention
- `removeFromWishlist(gameId, userId?, sessionId?)`: Test item removal
- `checkWishlist(gameId, userId?, sessionId?)`: Test check functionality
- `migrateSessionWishlistToUser(sessionId, userId)`: Test migration logic

### 3. Order Service (`backend/src/services/order.service.ts`)

**Current Implementation**:
- ✅ `createOrder()`: Creates order with stock validation, balance deduction
- ✅ `getUserOrders()`: Retrieves user's order history
- ✅ `getOrderById()`: Retrieves individual order details
- ✅ Stock validation (local + G2A)
- ✅ Balance validation
- ✅ Promo code application
- ✅ Transaction record creation
- ✅ Idempotency check
- ✅ G2A key retrieval for G2A-sourced games
- ✅ Email delivery of game keys

**Testing Gaps Identified**:
- ❌ No unit tests for order service functions
- ❌ No integration tests for order API endpoints
- ❌ No tests for G2A integration failures
- ❌ No tests for idempotency
- ❌ No tests for promo code validation
- ❌ No tests for stock validation edge cases

**Key Functions to Test**:
- `createOrder(userId, data)`: Test full order creation flow
- `getUserOrders(userId, filters?)`: Test order history retrieval
- `getOrderById(userId, orderId)`: Test order detail retrieval

### 4. API Controllers

**Cart Controller** (`backend/src/controllers/cart.controller.ts`):
- ✅ Handles authentication and session middleware
- ✅ Validates request data
- ✅ Calls service functions
- ❌ No integration tests

**Wishlist Controller** (`backend/src/controllers/wishlist.controller.ts`):
- ✅ Handles authentication and session middleware
- ✅ Validates request data
- ✅ Calls service functions
- ❌ No integration tests

**Order Controller** (`backend/src/controllers/order.controller.ts`):
- ✅ Requires authentication
- ✅ Validates request data
- ✅ Calls service functions
- ❌ No integration tests

### 5. Frontend Integration

**Cart Context** (`src/context/CartContext.tsx`):
- ✅ Manages cart state
- ✅ Handles cart operations
- ✅ Auto-refreshes on user login
- ❌ No E2E tests

**Wishlist Context** (`src/context/WishlistContext.tsx`):
- ✅ Manages wishlist state
- ✅ Handles wishlist operations
- ✅ Auto-refreshes on user login
- ❌ No E2E tests

**Checkout Page** (`src/pages/CheckoutPage.tsx`):
- ✅ Displays cart items
- ✅ Handles order creation
- ✅ Promo code application
- ❌ No E2E tests

## Testing Infrastructure Analysis

### Existing Test Setup

**Vitest Configuration** (`backend/vitest.config.ts`):
- ✅ Configured for unit and integration tests
- ✅ Coverage reporting enabled
- ✅ Test timeout: 10 seconds
- ✅ Setup file: `src/__tests__/setup.ts`

**Test Setup** (`backend/src/__tests__/setup.ts`):
- ✅ Environment variables mocked
- ✅ Global test hooks configured
- ❌ No database test utilities
- ❌ No authentication test helpers
- ❌ No test data factories

### Existing Test Patterns

**Integration Test Example** (`backend/src/__tests__/integration/auth.test.ts`):
- Uses Supertest for API testing
- Creates mock Express app
- Tests request/response flow
- Pattern can be reused for cart/wishlist/order tests

**Integration Test Template** (`backend/tests/integration/cart-wishlist-migration.test.ts`):
- Template structure exists
- Needs actual implementation
- Uses Jest syntax (should migrate to Vitest)

## Testing Strategy Decisions

### 1. Test Types

**Decision**: Implement three layers of testing:
1. **Unit Tests**: Test service functions in isolation
2. **Integration Tests**: Test API endpoints with real database
3. **E2E Tests**: Test complete user flows in browser

**Rationale**:
- Unit tests provide fast feedback on business logic
- Integration tests verify API contracts and database interactions
- E2E tests validate complete user experience

**Alternatives Considered**:
- Unit tests only: Insufficient - doesn't test API contracts
- Integration tests only: Too slow for rapid development feedback

### 2. Test Database Strategy

**Decision**: Use separate test database with Prisma migrations.

**Rationale**:
- Isolates tests from development data
- Allows parallel test execution
- Can be reset between test runs
- Matches production database schema

**Implementation**:
- Use `DATABASE_URL` environment variable for test database
- Run migrations before test suite
- Clean up test data after each test
- Use transactions for test isolation where possible

### 3. Test Data Management

**Decision**: Create test data factories and helpers.

**Rationale**:
- Reduces test code duplication
- Ensures consistent test data
- Makes tests more maintainable
- Allows easy test data customization

**Test Helpers Needed**:
- `createTestUser()`: Create user with specified attributes
- `createTestGame()`: Create game with specified attributes
- `createTestCart()`: Create cart with items
- `createTestWishlist()`: Create wishlist with items
- `createTestOrder()`: Create order with items
- `authenticateUser()`: Generate JWT token for user

### 4. G2A API Mocking

**Decision**: Mock G2A API calls in tests.

**Rationale**:
- Tests should not depend on external services
- Faster test execution
- Predictable test results
- Can simulate error scenarios

**Mocking Strategy**:
- Use Vitest `vi.mock()` for G2A service
- Mock successful responses
- Mock error responses (network failures, API errors)
- Mock stock validation responses

### 5. Redis Caching Tests

**Decision**: Test with and without Redis availability.

**Rationale**:
- System must work without Redis (graceful degradation)
- Need to verify cache invalidation works
- Need to verify cache reads work correctly

**Test Scenarios**:
- Tests with Redis available (normal operation)
- Tests with Redis unavailable (graceful degradation)
- Tests for cache invalidation after mutations
- Tests for cache key patterns

### 6. Performance Testing

**Decision**: Add performance assertions to integration tests.

**Rationale**:
- Success criteria include performance metrics (SC-001, SC-004, SC-006)
- Need to verify operations complete within time limits
- Can identify performance regressions

**Performance Metrics to Test**:
- Cart operations: < 2 seconds (SC-001)
- Wishlist operations: < 2 seconds (SC-004)
- Order creation: < 30 seconds (SC-006)

## Key Research Questions Resolved

### Q1: How to test guest vs authenticated user flows?
**Answer**: Use session middleware for guest tests, authentication middleware for user tests. Test both paths separately.

### Q2: How to test cart/wishlist migration?
**Answer**: Create guest session with items, authenticate user, verify items migrated atomically. Test merge scenarios when user already has items.

### Q3: How to test G2A integration failures?
**Answer**: Mock G2A service to return errors, verify system handles gracefully without blocking non-G2A orders.

### Q4: How to test idempotency for orders?
**Answer**: Create order twice with same items, verify second call returns existing order instead of creating duplicate.

### Q5: How to test concurrent operations?
**Answer**: Use Promise.all() to simulate concurrent requests, verify system handles correctly (no data corruption, correct final state).

### Q6: How to test edge cases (out of stock, insufficient balance)?
**Answer**: Set up test data with specific conditions (out of stock game, low balance), attempt operation, verify appropriate error returned.

## Testing Tools and Libraries

**Current Stack**:
- Vitest: Test runner and assertion library
- Supertest: HTTP assertion library for API testing
- Prisma: Database access (test database)
- Redis: Caching (optional for tests)

**Additional Tools Needed**:
- Test data factories: Custom helpers
- Database cleanup utilities: Custom helpers
- Authentication helpers: Custom helpers for JWT generation

## Next Steps

1. Create test helpers and utilities
2. Implement unit tests for services
3. Implement integration tests for API endpoints
4. Implement E2E tests for user flows
5. Add performance assertions
6. Document test execution and coverage
