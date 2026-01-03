# Tasks: Test E-commerce Core Flows

**Input**: Design documents from `/specs/001-test-ecommerce-flows/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: This is a testing feature - all tasks are focused on creating comprehensive tests for existing e-commerce functionality.

**Organization**: Tasks are grouped by user story to enable independent testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/src/`, `backend/tests/`
- **Frontend**: `src/`
- All paths shown below use backend/frontend structure

---

## Phase 1: Setup (Project Verification)

**Purpose**: Verify project structure and dependencies are ready for testing

- [x] T001 Verify backend service files exist: `backend/src/services/cart.service.ts`, `wishlist.service.ts`, `order.service.ts`
- [x] T002 Verify backend controllers exist: `backend/src/controllers/cart.controller.ts`, `wishlist.controller.ts`, `order.controller.ts`
- [x] T003 Verify backend routes exist: `backend/src/routes/cart.routes.ts`, `wishlist.routes.ts`, `order.routes.ts`
- [x] T004 [P] Verify test infrastructure exists: `backend/vitest.config.ts`, `backend/src/__tests__/setup.ts`
- [x] T005 [P] Verify Prisma schema includes required models: `backend/prisma/schema.prisma` (User, Game, CartItem, Wishlist, Order, Transaction, PromoCode)
- [x] T006 [P] Verify test database can be configured via `DATABASE_URL` environment variable
- [x] T007 [P] Verify Redis configuration exists: `backend/src/config/redis.ts` (for cache tests)

**Checkpoint**: Project structure verified - foundational test infrastructure can begin

---

## Phase 2: Foundational - Test Infrastructure (Blocking Prerequisites)

**Purpose**: Create test helpers and utilities that ALL tests depend on. This is CRITICAL as all test tasks depend on these utilities.

**⚠️ CRITICAL**: No test implementation can begin until this phase is complete

### Test Database Helpers

- [x] T008 [P] Create `backend/tests/helpers/test-db.ts` with `createTestUser(options?)` function that creates a test user with configurable balance, role, emailVerified
- [x] T009 [P] Create `backend/tests/helpers/test-db.ts` with `createTestGame(options?)` function that creates a test game with configurable price, inStock, g2aProductId, g2aStock
- [x] T010 [P] Create `backend/tests/helpers/test-db.ts` with `createTestCart(userId, items)` function that creates cart with items
- [x] T011 [P] Create `backend/tests/helpers/test-db.ts` with `createTestWishlist(userId, gameIds)` function that creates wishlist with items
- [x] T012 [P] Create `backend/tests/helpers/test-db.ts` with `createTestOrder(userId, items, options?)` function that creates order with items and optional promo code
- [x] T013 [P] Create `backend/tests/helpers/test-db.ts` with `createTestPromoCode(options?)` function that creates promo code with configurable discount, maxUses, validFrom, validUntil, active
- [x] T014 [P] Create `backend/tests/helpers/test-db.ts` with `cleanupTestUser(userId)` function that removes all test data for a user (cart, wishlist, orders, transactions)
- [x] T015 [P] Create `backend/tests/helpers/test-db.ts` with `cleanupTestGame(gameId)` function that removes game test data
- [x] T016 [P] Create `backend/tests/helpers/test-db.ts` with `cleanupAllTestData()` function that truncates test tables (for afterAll hooks)

### Authentication Test Helpers

- [x] T017 [P] Create `backend/tests/helpers/test-auth.ts` with `authenticateUser(user)` function that generates JWT token for test user
- [x] T018 [P] Create `backend/tests/helpers/test-auth.ts` with `createTestSession(sessionId)` function that creates test session
- [x] T019 [P] Create `backend/tests/helpers/test-auth.ts` with `getAuthHeaders(token)` function that returns authorization headers for API requests

### Cart Test Helpers

- [x] T020 [P] Create `backend/tests/helpers/test-cart.ts` with `addItemToCart(userId, gameId, quantity)` helper function
- [x] T021 [P] Create `backend/tests/helpers/test-cart.ts` with `getCartItems(userId)` helper function
- [x] T022 [P] Create `backend/tests/helpers/test-cart.ts` with `clearCartItems(userId)` helper function
- [x] T023 [P] Create `backend/tests/helpers/test-cart.ts` with `verifyCartTotal(userId, expectedTotal)` helper function that asserts cart total matches expected value

### Order Test Helpers

- [x] T024 [P] Create `backend/tests/helpers/test-order.ts` with `createOrderFromCart(userId, promoCode?)` helper function
- [x] T025 [P] Create `backend/tests/helpers/test-order.ts` with `verifyOrderCreated(userId, orderId)` helper function
- [x] T026 [P] Create `backend/tests/helpers/test-order.ts` with `verifyBalanceDeducted(userId, amount)` helper function
- [x] T027 [P] Create `backend/tests/helpers/test-order.ts` with `verifyTransactionCreated(userId, orderId)` helper function

### G2A Service Mocking

- [x] T028 [P] Create G2A service mock setup in `backend/tests/helpers/test-g2a.ts` with `setupG2AMocks()` function that mocks `validateGameStock` and `purchaseGameKey` functions
- [x] T029 [P] Create `backend/tests/helpers/test-g2a.ts` with `mockG2AStockAvailable()` helper that mocks successful stock validation
- [x] T030 [P] Create `backend/tests/helpers/test-g2a.ts` with `mockG2AStockUnavailable()` helper that mocks out-of-stock response
- [x] T031 [P] Create `backend/tests/helpers/test-g2a.ts` with `mockG2AKeyPurchase()` helper that mocks successful key purchase
- [x] T032 [P] Create `backend/tests/helpers/test-g2a.ts` with `mockG2AAPIError()` helper that mocks G2A API failure

### Redis Test Utilities

- [x] T033 [P] Create `backend/tests/helpers/test-redis.ts` with `disableRedis()` helper that temporarily disables Redis for graceful degradation tests
- [x] T034 [P] Create `backend/tests/helpers/test-redis.ts` with `enableRedis()` helper that re-enables Redis
- [x] T035 [P] Create `backend/tests/helpers/test-redis.ts` with `clearRedisCache()` helper that clears all test cache keys

**Checkpoint**: Test infrastructure ready - test implementation can now begin in parallel

---

## Phase 3: User Story 1 - Add Items to Cart (Priority: P1) 🎯 MVP

**Goal**: Verify users can add games to cart (authenticated and guest), cart persists items, quantities update correctly, totals calculate accurately

**Independent Test**: Add a game to cart, verify it appears with correct price and quantity, confirm total updates correctly

### Unit Tests for User Story 1

- [x] T036 [P] [US1] Create `backend/src/__tests__/unit/cart.service.test.ts` with test suite for `getCart()` function - test authenticated user cart retrieval
- [x] T037 [P] [US1] Add test to `cart.service.test.ts` for `getCart()` - test guest session cart retrieval
- [x] T038 [P] [US1] Add test to `cart.service.test.ts` for `getCart()` - test empty cart returns empty items array and zero total
- [x] T039 [P] [US1] Add test to `cart.service.test.ts` for `addToCart()` - test adding game to authenticated user cart
- [x] T040 [P] [US1] Add test to `cart.service.test.ts` for `addToCart()` - test adding game to guest session cart
- [x] T041 [P] [US1] Add test to `cart.service.test.ts` for `addToCart()` - test adding same game again increases quantity (no duplicate)
- [x] T042 [P] [US1] Add test to `cart.service.test.ts` for `addToCart()` - test adding out-of-stock game throws error
- [x] T043 [P] [US1] Add test to `cart.service.test.ts` for `addToCart()` - test adding non-existent game throws error
- [x] T044 [P] [US1] Add test to `cart.service.test.ts` for `getCart()` - test cart total calculation accuracy (SC-002)
- [x] T045 [P] [US1] Add test to `cart.service.test.ts` for `migrateSessionCartToUser()` - test guest cart migrates to user cart atomically
- [x] T046 [P] [US1] Add test to `cart.service.test.ts` for `migrateSessionCartToUser()` - test migration merges quantities when user already has item
- [x] T047 [P] [US1] Add test to `cart.service.test.ts` for `migrateSessionCartToUser()` - test migration skips out-of-stock items
- [x] T048 [P] [US1] Add test to `cart.service.test.ts` for `getCart()` - test Redis cache behavior (with and without Redis)

### Integration Tests for User Story 1

- [x] T049 [P] [US1] Create `backend/tests/integration/cart.test.ts` with test suite for `GET /api/cart` endpoint - test authenticated user
- [x] T050 [P] [US1] Add test to `cart.test.ts` for `GET /api/cart` - test guest session
- [x] T051 [P] [US1] Add test to `cart.test.ts` for `GET /api/cart` - test empty cart
- [x] T052 [P] [US1] Add test to `cart.test.ts` for `POST /api/cart` - test adding item (authenticated user)
- [x] T053 [P] [US1] Add test to `cart.test.ts` for `POST /api/cart` - test adding item (guest session)
- [x] T054 [P] [US1] Add test to `cart.test.ts` for `POST /api/cart` - test adding same item increases quantity
- [x] T055 [P] [US1] Add test to `cart.test.ts` for `POST /api/cart` - test adding out-of-stock game returns 400 error
- [x] T056 [P] [US1] Add test to `cart.test.ts` for `POST /api/cart` - test missing gameId returns 400 error
- [x] T057 [P] [US1] Add test to `cart.test.ts` for `POST /api/cart/migrate` - test cart migration endpoint (requires auth)
- [x] T058 [P] [US1] Add performance test to `cart.test.ts` - verify cart operations complete in < 2 seconds (SC-001)
- [x] T059 [P] [US1] Add test to `cart.test.ts` - verify 95% success rate for cart operations (SC-003)

### E2E Tests for User Story 1

- [x] T060 [P] [US1] Create `src/__tests__/e2e/cart.e2e.test.tsx` with test for adding game to cart from game card component
- [x] T061 [P] [US1] Add test to `cart.e2e.test.tsx` - verify cart icon updates with item count
- [x] T062 [P] [US1] Add test to `cart.e2e.test.tsx` - verify cart page displays items correctly
- [x] T063 [P] [US1] Add test to `cart.e2e.test.tsx` - verify cart total displays correctly

**Checkpoint**: At this point, User Story 1 should be fully tested and verifiable independently

---

## Phase 4: User Story 2 - Manage Wishlist (Priority: P1)

**Goal**: Verify users can add games to wishlist, remove items, check if games are in wishlist (authenticated and guest), wishlist persists and migrates correctly

**Independent Test**: Add game to wishlist, verify it appears, check if game is in wishlist, remove item, verify removed

### Unit Tests for User Story 2

- [x] T064 [P] [US2] Create `backend/src/__tests__/unit/wishlist.service.test.ts` with test suite for `getWishlist()` function - test authenticated user wishlist retrieval
- [x] T065 [P] [US2] Add test to `wishlist.service.test.ts` for `getWishlist()` - test guest session wishlist retrieval
- [x] T066 [P] [US2] Add test to `wishlist.service.test.ts` for `getWishlist()` - test empty wishlist returns empty items array
- [x] T067 [P] [US2] Add test to `wishlist.service.test.ts` for `addToWishlist()` - test adding game to authenticated user wishlist
- [x] T068 [P] [US2] Add test to `wishlist.service.test.ts` for `addToWishlist()` - test adding game to guest session wishlist
- [x] T069 [P] [US2] Add test to `wishlist.service.test.ts` for `addToWishlist()` - test adding same game again prevents duplicate (graceful handling)
- [x] T070 [P] [US2] Add test to `wishlist.service.test.ts` for `addToWishlist()` - test adding non-existent game throws error
- [x] T071 [P] [US2] Add test to `wishlist.service.test.ts` for `removeFromWishlist()` - test removing game from wishlist
- [x] T072 [P] [US2] Add test to `wishlist.service.test.ts` for `isInWishlist()` - test checking if game is in wishlist (returns true)
- [x] T073 [P] [US2] Add test to `wishlist.service.test.ts` for `isInWishlist()` - test checking if game is not in wishlist (returns false)
- [x] T074 [P] [US2] Add test to `wishlist.service.test.ts` for `migrateSessionWishlistToUser()` - test guest wishlist migrates to user wishlist atomically
- [x] T075 [P] [US2] Add test to `wishlist.service.test.ts` for `migrateSessionWishlistToUser()` - test migration prevents duplicates when user already has item
- [x] T076 [P] [US2] Add test to `wishlist.service.test.ts` for `migrateSessionWishlistToUser()` - test migration skips non-existent games
- [x] T077 [P] [US2] Add test to `wishlist.service.test.ts` for `getWishlist()` - test Redis cache behavior (with and without Redis)

### Integration Tests for User Story 2

- [x] T078 [P] [US2] Create `backend/tests/integration/wishlist.test.ts` with test suite for `GET /api/wishlist` endpoint - test authenticated user
- [x] T079 [P] [US2] Add test to `wishlist.test.ts` for `GET /api/wishlist` - test guest session
- [x] T080 [P] [US2] Add test to `wishlist.test.ts` for `GET /api/wishlist` - test empty wishlist
- [x] T081 [P] [US2] Add test to `wishlist.test.ts` for `POST /api/wishlist` - test adding game (authenticated user)
- [x] T082 [P] [US2] Add test to `wishlist.test.ts` for `POST /api/wishlist` - test adding game (guest session)
- [x] T083 [P] [US2] Add test to `wishlist.test.ts` for `POST /api/wishlist` - test adding same game again (graceful handling, no error)
- [x] T084 [P] [US2] Add test to `wishlist.test.ts` for `POST /api/wishlist` - test missing gameId returns 400 error
- [x] T085 [P] [US2] Add test to `wishlist.test.ts` for `DELETE /api/wishlist/:gameId` - test removing game
- [x] T086 [P] [US2] Add test to `wishlist.test.ts` for `GET /api/wishlist/:gameId/check` - test checking if game in wishlist (returns true)
- [x] T087 [P] [US2] Add test to `wishlist.test.ts` for `GET /api/wishlist/:gameId/check` - test checking if game not in wishlist (returns false)
- [x] T088 [P] [US2] Add test to `wishlist.test.ts` for `POST /api/wishlist/migrate` - test wishlist migration endpoint (requires auth)
- [x] T089 [P] [US2] Add performance test to `wishlist.test.ts` - verify wishlist operations complete in < 2 seconds (SC-004)
- [x] T090 [P] [US2] Add test to `wishlist.test.ts` - verify 99% success rate for wishlist operations (SC-005)

### E2E Tests for User Story 2

- [x] T091 [P] [US2] Create `src/__tests__/e2e/wishlist.e2e.test.tsx` with test for adding game to wishlist from game card component
- [x] T092 [P] [US2] Add test to `wishlist.e2e.test.tsx` - verify wishlist button state updates when game added
- [x] T093 [P] [US2] Add test to `wishlist.e2e.test.tsx` - verify wishlist page displays items correctly
- [x] T094 [P] [US2] Add test to `wishlist.e2e.test.tsx` - verify removing game from wishlist works

**Checkpoint**: At this point, User Stories 1 AND 2 should both be fully tested independently

---

## Phase 5: User Story 3 - Create Order from Cart (Priority: P1)

**Goal**: Verify authenticated users can create orders from cart items, with stock validation, balance validation, promo code application, balance deduction, transaction creation, G2A key retrieval

**Independent Test**: Add items to cart, proceed to checkout, create order, verify order created with correct items, totals, status, balance deducted, transaction created

### Unit Tests for User Story 3

- [x] T095 [P] [US3] Create `backend/src/__tests__/unit/order.service.test.ts` with test suite for `createOrder()` function - test creating order with single item
- [x] T096 [P] [US3] Add test to `order.service.test.ts` for `createOrder()` - test creating order with multiple items
- [x] T097 [P] [US3] Add test to `order.service.test.ts` for `createOrder()` - test order creation validates stock before creating
- [x] T098 [P] [US3] Add test to `order.service.test.ts` for `createOrder()` - test order creation with out-of-stock game throws error
- [x] T099 [P] [US3] Add test to `order.service.test.ts` for `createOrder()` - test order creation validates balance before creating
- [x] T100 [P] [US3] Add test to `order.service.test.ts` for `createOrder()` - test order creation with insufficient balance throws error
- [x] T101 [P] [US3] Add test to `order.service.test.ts` for `createOrder()` - test order creation with exact balance succeeds
- [x] T102 [P] [US3] Add test to `order.service.test.ts` for `createOrder()` - test order creation applies promo code discount correctly
- [x] T103 [P] [US3] Add test to `order.service.test.ts` for `createOrder()` - test order creation with invalid promo code throws error
- [x] T104 [P] [US3] Add test to `order.service.test.ts` for `createOrder()` - test order creation deducts balance correctly
- [x] T105 [P] [US3] Add test to `order.service.test.ts` for `createOrder()` - test order creation creates transaction record
- [x] T106 [P] [US3] Add test to `order.service.test.ts` for `createOrder()` - test order creation prevents duplicates (idempotency)
- [x] T107 [P] [US3] Add test to `order.service.test.ts` for `createOrder()` - test order creation retrieves G2A keys for G2A-sourced games
- [x] T108 [P] [US3] Add test to `order.service.test.ts` for `createOrder()` - test order creation handles G2A API failures gracefully (non-G2A games still work)
- [x] T109 [P] [US3] Add test to `order.service.test.ts` for `getUserOrders()` - test retrieving user's order history
- [x] T110 [P] [US3] Add test to `order.service.test.ts` for `getUserOrders()` - test filtering orders by status
- [x] T111 [P] [US3] Add test to `order.service.test.ts` for `getOrderById()` - test retrieving individual order details
- [x] T112 [P] [US3] Add test to `order.service.test.ts` for `getOrderById()` - test retrieving another user's order throws error (authorization)

### Integration Tests for User Story 3

- [x] T113 [P] [US3] Create `backend/tests/integration/order.test.ts` with test suite for `POST /api/orders` endpoint - test creating order with single item
- [x] T114 [P] [US3] Add test to `order.test.ts` for `POST /api/orders` - test creating order with multiple items
- [x] T115 [P] [US3] Add test to `order.test.ts` for `POST /api/orders` - test creating order with promo code
- [x] T116 [P] [US3] Add test to `order.test.ts` for `POST /api/orders` - test creating order with out-of-stock game returns 400 error
- [x] T117 [P] [US3] Add test to `order.test.ts` for `POST /api/orders` - test creating order with insufficient balance returns 400 error
- [x] T118 [P] [US3] Add test to `order.test.ts` for `POST /api/orders` - test creating order with invalid promo code returns 400 error
- [x] T119 [P] [US3] Add test to `order.test.ts` for `POST /api/orders` - test unauthenticated request returns 401 error
- [x] T120 [P] [US3] Add test to `order.test.ts` for `GET /api/orders` - test retrieving user's order history
- [x] T121 [P] [US3] Add test to `order.test.ts` for `GET /api/orders` - test filtering orders by status query parameter
- [x] T122 [P] [US3] Add test to `order.test.ts` for `GET /api/orders/:id` - test retrieving individual order details
- [x] T123 [P] [US3] Add test to `order.test.ts` for `GET /api/orders/:id` - test retrieving another user's order returns 403 error
- [x] T124 [P] [US3] Add performance test to `order.test.ts` - verify order creation completes in < 30 seconds (SC-006)
- [x] T125 [P] [US3] Add test to `order.test.ts` - verify 98% success rate for order creation when conditions met (SC-007)
- [x] T126 [P] [US3] Add test to `order.test.ts` - verify stock validation prevents out-of-stock purchases 100% (SC-008)
- [x] T127 [P] [US3] Add test to `order.test.ts` - verify balance validation prevents insufficient fund purchases 100% (SC-009)

### E2E Tests for User Story 3

- [x] T128 [P] [US3] Create `src/__tests__/e2e/checkout.e2e.test.tsx` with test for complete checkout flow: cart → checkout page → create order
- [x] T129 [P] [US3] Add test to `checkout.e2e.test.tsx` - verify order confirmation page displays correctly
- [x] T130 [P] [US3] Add test to `checkout.e2e.test.tsx` - verify order history page displays orders correctly
- [x] T131 [P] [US3] Add test to `checkout.e2e.test.tsx` - verify order details page displays correctly

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all be fully tested independently

---

## Phase 6: User Story 4 - Update and Remove Cart Items (Priority: P2)

**Goal**: Verify users can update cart item quantities, remove items, clear entire cart, totals recalculate correctly

**Independent Test**: Update item quantity, verify total recalculates, remove item, verify other items remain, clear cart, verify empty

### Unit Tests for User Story 4

- [x] T132 [P] [US4] Add test to `backend/src/__tests__/unit/cart.service.test.ts` for `updateCartItem()` - test updating quantity to valid value
- [x] T133 [P] [US4] Add test to `cart.service.test.ts` for `updateCartItem()` - test updating quantity to 0 removes item
- [x] T134 [P] [US4] Add test to `cart.service.test.ts` for `updateCartItem()` - test updating non-existent item throws error
- [x] T135 [P] [US4] Add test to `cart.service.test.ts` for `updateCartItem()` - test total recalculates after quantity update
- [x] T136 [P] [US4] Add test to `cart.service.test.ts` for `removeFromCart()` - test removing existing item
- [x] T137 [P] [US4] Add test to `cart.service.test.ts` for `removeFromCart()` - test removing non-existent item throws error
- [x] T138 [P] [US4] Add test to `cart.service.test.ts` for `removeFromCart()` - test other items remain after removal
- [x] T139 [P] [US4] Add test to `cart.service.test.ts` for `clearCart()` - test clearing cart with items
- [x] T140 [P] [US4] Add test to `cart.service.test.ts` for `clearCart()` - test clearing empty cart (no error)

### Integration Tests for User Story 4

- [x] T141 [P] [US4] Add test to `backend/tests/integration/cart.test.ts` for `PUT /api/cart/:gameId` - test updating quantity
- [x] T142 [P] [US4] Add test to `cart.test.ts` for `PUT /api/cart/:gameId` - test updating quantity to 0 removes item
- [x] T143 [P] [US4] Add test to `cart.test.ts` for `PUT /api/cart/:gameId` - test missing quantity returns 400 error
- [x] T144 [P] [US4] Add test to `cart.test.ts` for `DELETE /api/cart/:gameId` - test removing item
- [x] T145 [P] [US4] Add test to `cart.test.ts` for `DELETE /api/cart/:gameId` - test removing non-existent item returns 404 error
- [x] T146 [P] [US4] Add test to `cart.test.ts` for `DELETE /api/cart` - test clearing entire cart
- [x] T147 [P] [US4] Add test to `cart.test.ts` - verify total recalculates correctly after all operations (SC-002)

### E2E Tests for User Story 4

- [x] T148 [P] [US4] Add test to `src/__tests__/e2e/cart.e2e.test.tsx` - verify quantity update in cart page
- [x] T149 [P] [US4] Add test to `cart.e2e.test.tsx` - verify remove item button works
- [x] T150 [P] [US4] Add test to `cart.e2e.test.tsx` - verify clear cart button works
- [x] T151 [P] [US4] Add test to `cart.e2e.test.tsx` - verify empty cart state displays correctly

**Checkpoint**: At this point, all user stories should be fully tested independently

---

## Phase 7: Edge Cases and Migration Tests

**Purpose**: Test edge cases and migration scenarios that span multiple user stories

### Cart/Wishlist Migration Integration Tests

- [x] T152 [P] Create `backend/tests/integration/cart-wishlist-migration.test.ts` with test for complete migration flow: guest adds items → logs in → items migrated
- [x] T153 [P] Add test to `cart-wishlist-migration.test.ts` - test cart migration when user already has items (merge quantities)
- [x] T154 [P] Add test to `cart-wishlist-migration.test.ts` - test wishlist migration when user already has items (prevent duplicates)
- [x] T155 [P] Add test to `cart-wishlist-migration.test.ts` - test migration skips out-of-stock cart items
- [x] T156 [P] Add test to `cart-wishlist-migration.test.ts` - test migration skips non-existent wishlist games
- [x] T157 [P] Add test to `cart-wishlist-migration.test.ts` - test migration works when Redis unavailable (SC-010, SC-011)

### Edge Case Tests

- [x] T158 [P] Create `backend/tests/integration/edge-cases.test.ts` with test for game becoming out-of-stock between cart add and checkout
- [x] T159 [P] Add test to `edge-cases.test.ts` - test concurrent cart updates from multiple requests (Promise.all simulation)
- [x] T160 [P] Add test to `edge-cases.test.ts` - test session expiration with items in cart (session middleware handles)
- [x] T161 [P] Add test to `edge-cases.test.ts` - test G2A API failure during order creation (non-G2A games still work) (SC-014)
- [x] T162 [P] Add test to `edge-cases.test.ts` - test user balance exactly equal to order total (succeeds)
- [x] T163 [P] Add test to `edge-cases.test.ts` - test duplicate order creation attempts (idempotency check)
- [x] T164 [P] Add test to `edge-cases.test.ts` - test promo code expires between cart add and checkout (validated at order creation)
- [x] T165 [P] Add test to `edge-cases.test.ts` - test cart migration when user already has items in user cart (merge logic)

### End-to-End Flow Tests

- [x] T166 [P] Create `backend/tests/integration/ecommerce-flows.test.ts` with test for complete user flow: browse → add to cart → checkout → create order
- [x] T167 [P] Add test to `ecommerce-flows.test.ts` - test complete flow: browse → add to wishlist → add to cart from wishlist → checkout
- [x] T168 [P] Add test to `ecommerce-flows.test.ts` - test guest flow: add to cart → login → cart migrated → checkout
- [x] T169 [P] Add test to `ecommerce-flows.test.ts` - test guest flow: add to wishlist → login → wishlist migrated
- [x] T170 [P] Add test to `ecommerce-flows.test.ts` - test promo code flow: apply code → verify discount → create order
- [x] T171 [P] Add test to `ecommerce-flows.test.ts` - test error flow: out-of-stock game → error message → order not created
- [x] T172 [P] Add test to `ecommerce-flows.test.ts` - test error flow: insufficient balance → error message → order not created

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements, documentation, and validation

### Documentation

- [x] T173 [P] Update `README.md` with test execution instructions
- [x] T174 [P] Update `QUICK_START.md` with test setup instructions
- [x] T175 [P] Document test coverage goals and current coverage in `PROJECT_READINESS_REPORT.md`

### Test Coverage and Quality

- [x] T176 [P] Run test coverage report: `npm test -- --coverage` and verify coverage targets met (configured in vitest.config.ts)
- [x] T177 [P] Verify all 27 functional requirements have corresponding tests (all covered)
- [x] T178 [P] Verify all 23 acceptance scenarios have corresponding tests (all covered)
- [x] T179 [P] Verify all 8 edge cases have corresponding tests (all covered)
- [x] T180 [P] Verify all 14 success criteria have performance/validation tests (all covered)

### Test Execution Validation

- [ ] T181 Run all unit tests: `npm test -- src/__tests__/unit/` and verify all pass
- [ ] T182 Run all integration tests: `npm test -- tests/integration/` and verify all pass
- [ ] T183 Run all E2E tests: `npm test -- src/__tests__/e2e/` and verify all pass
- [ ] T184 Run full test suite: `npm test` and verify all tests pass
- [ ] T185 Verify tests work with Redis available and unavailable (graceful degradation)

### Performance Validation

- [ ] T186 Verify cart operations complete in < 2 seconds (SC-001) - run performance tests
- [ ] T187 Verify wishlist operations complete in < 2 seconds (SC-004) - run performance tests
- [ ] T188 Verify order creation completes in < 30 seconds (SC-006) - run performance tests
- [ ] T189 Verify cart total calculation is 100% accurate (SC-002) - run accuracy tests
- [ ] T190 Verify wishlist operations succeed 99% of the time (SC-005) - run reliability tests
- [ ] T191 Verify order creation succeeds 98% of the time when conditions met (SC-007) - run reliability tests

### Quickstart Validation

- [ ] T192 Run `quickstart.md` validation checklist - verify all setup steps work correctly
- [ ] T193 Verify test database setup works as documented
- [ ] T194 Verify test helpers work as documented
- [ ] T195 Verify test execution works as documented

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all test implementation
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (US1 → US2 → US3 → US4)
- **Edge Cases (Phase 7)**: Depends on User Stories 1-4 completion
- **Polish (Phase 8)**: Depends on all test phases being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 3 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories (but tests cart functionality)
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Extends User Story 1 tests

### Within Each User Story

- Unit tests before integration tests (faster feedback)
- Integration tests before E2E tests (more reliable)
- Core functionality tests before edge cases
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, User Stories 1, 2, 3 can start in parallel
- All tests for a user story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all tests)
3. Complete Phase 3: User Story 1 tests
4. **STOP and VALIDATE**: Run User Story 1 tests independently
5. Verify cart functionality works correctly

### Incremental Delivery

1. Complete Setup + Foundational → Test infrastructure ready
2. Add User Story 1 tests → Test independently → Verify cart works (MVP!)
3. Add User Story 2 tests → Test independently → Verify wishlist works
4. Add User Story 3 tests → Test independently → Verify orders work
5. Add User Story 4 tests → Test independently → Verify cart management works
6. Add Edge Cases tests → Verify edge cases handled
7. Complete Polish phase → Final validation

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 tests (Cart)
   - Developer B: User Story 2 tests (Wishlist)
   - Developer C: User Story 3 tests (Orders)
3. After P1 stories complete:
   - Developer A: User Story 4 tests (Cart Management)
   - Developer B: Edge Cases tests
   - Developer C: Polish phase
4. All developers: Final validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently testable
- Write tests first (TDD approach) - ensure they fail before implementation verification
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- All tests must clean up test data (afterEach/afterAll hooks)
- All tests must work with or without Redis (graceful degradation)
- All G2A API calls must be mocked in tests
- Performance tests should use actual timing measurements
- Success criteria tests should verify measurable outcomes

---

## Summary

**Total Tasks**: 195
- Phase 1 (Setup): 7 tasks
- Phase 2 (Foundational): 28 tasks
- Phase 3 (US1 - Cart): 28 tasks (12 unit + 11 integration + 4 E2E)
- Phase 4 (US2 - Wishlist): 31 tasks (14 unit + 13 integration + 4 E2E)
- Phase 5 (US3 - Orders): 37 tasks (18 unit + 15 integration + 4 E2E)
- Phase 6 (US4 - Cart Management): 20 tasks (9 unit + 6 integration + 4 E2E)
- Phase 7 (Edge Cases): 21 tasks
- Phase 8 (Polish): 23 tasks

**Parallel Opportunities**: 
- 150+ tasks can run in parallel (marked with [P])
- All tests within a story can run in parallel
- User Stories 1, 2, 3 can be worked on in parallel (after Foundational)
- User Story 4 can start after Foundational (extends US1)

**Independent Test Criteria**:
- **US1**: Add game to cart, verify appears with correct price/quantity, total updates correctly
- **US2**: Add game to wishlist, verify appears, check if in wishlist, remove item
- **US3**: Add items to cart, create order, verify order created with correct items/totals, balance deducted
- **US4**: Update cart item quantity, verify total recalculates, remove item, clear cart

**Suggested MVP Scope**: Phase 1 + Phase 2 + Phase 3 (User Story 1) - Cart functionality fully tested
