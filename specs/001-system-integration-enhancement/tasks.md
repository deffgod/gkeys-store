# Tasks: System Integration Enhancement & Admin Panel Expansion

**Input**: Design documents from `/specs/001-system-integration-enhancement/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Project Verification)

**Purpose**: Verify project structure and dependencies are ready for implementation

- [x] T001 Verify backend service files exist: `backend/src/services/auth.service.ts`, `cart.service.ts`, `wishlist.service.ts`, `g2a.service.ts`, `cache.service.ts`, `admin.service.ts`
- [x] T002 Verify backend controllers exist: `backend/src/controllers/auth.controller.ts`, `cart.controller.ts`, `wishlist.controller.ts`, `admin.controller.ts`
- [x] T003 Verify backend routes exist: `backend/src/routes/auth.routes.ts`, `cart.routes.ts`, `wishlist.routes.ts`, `admin.routes.ts`
- [x] T004 [P] Verify middleware exists: `backend/src/middleware/auth.ts`, `backend/src/middleware/session.middleware.ts`
- [x] T005 [P] Verify frontend admin structure exists: `src/admin/AdminApp.tsx`, `src/admin/components/AdminLayout.tsx`, `src/admin/pages/`
- [x] T006 [P] Verify frontend API services exist: `src/services/api.ts`, `authApi.ts`, `cartApi.ts`, `wishlistApi.ts`, `adminApi.ts`
- [x] T007 Verify Prisma schema includes all required models: `backend/prisma/schema.prisma` (User, Game, CartItem, Wishlist, Order, Article, Category, Genre, Platform, Tag)
- [x] T008 Verify Redis configuration exists: `backend/src/config/redis.ts`
- [x] T009 Verify G2A configuration exists: `backend/src/config/g2a.ts`

---

## Phase 2: Foundational (Core Infrastructure Verification)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T010 Verify authentication middleware works: `backend/src/middleware/auth.ts` (authenticate, requireAdmin functions)
- [x] T011 Verify session middleware works: `backend/src/middleware/session.middleware.ts` (handles guest sessions)
- [x] T012 Verify cache service handles Redis unavailability gracefully: `backend/src/services/cache.service.ts` (invalidateCache function)
- [x] T013 Verify database connection and Prisma client: `backend/src/config/database.ts`
- [x] T014 Verify error handling middleware: `backend/src/middleware/errorHandler.ts`
- [x] T015 Verify JWT token generation and validation: `backend/src/utils/jwt.ts` (or equivalent)

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Seamless User Registration and Authentication (Priority: P1) 🎯 MVP

**Goal**: Ensure user registration and login work correctly with atomic operations, proper error handling, and cart/wishlist migration triggers.

**Independent Test**: Create a new account, log in, verify tokens are generated, verify cart/wishlist migration is triggered (if guest session exists). Can be fully tested independently.

### Implementation for User Story 1

- [x] T016 [US1] Verify registration creates user atomically in `backend/src/services/auth.service.ts` (check transaction usage)
- [x] T017 [US1] Verify registration validates email format and password strength in `backend/src/validators/auth.ts`
- [x] T018 [US1] Verify registration handles duplicate email errors in `backend/src/services/auth.service.ts`
- [x] T019 [US1] Verify login finds user and validates password in `backend/src/services/auth.service.ts`
- [x] T020 [US1] Verify login generates JWT tokens (access + refresh) in `backend/src/services/auth.service.ts`
- [x] T021 [US1] Verify login triggers cart/wishlist migration if sessionId exists in `backend/src/services/auth.service.ts`
- [x] T022 [US1] Verify refresh token endpoint works in `backend/src/services/auth.service.ts` (refreshToken function)
- [x] T023 [US1] Verify refresh token endpoint validates token and generates new tokens in `backend/src/controllers/auth.controller.ts`
- [x] T024 [US1] Verify error handling for database unavailability in `backend/src/services/auth.service.ts`
- [x] T025 [US1] Verify authentication middleware extracts token from Authorization header in `backend/src/middleware/auth.ts`
- [x] T026 [US1] Verify authentication middleware validates token and adds req.user in `backend/src/middleware/auth.ts`
- [x] T027 [US1] Verify authentication routes are properly configured in `backend/src/routes/auth.routes.ts`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Shopping Cart Works for All Users (Priority: P1) 🎯 MVP

**Goal**: Ensure shopping cart works for both authenticated and guest users, with proper migration on login.

**Independent Test**: Add items to cart as a guest, then log in and verify items migrate to the user account. Can be fully tested independently.

### Implementation for User Story 2

- [x] T028 [US2] Verify getCart works for authenticated users in `backend/src/services/cart.service.ts`
- [x] T029 [US2] Verify getCart works for guest users (sessionId) in `backend/src/services/cart.service.ts`
- [x] T030 [US2] Verify addToCart validates game availability before adding in `backend/src/services/cart.service.ts`
- [x] T031 [US2] Verify addToCart works for authenticated users in `backend/src/services/cart.service.ts`
- [x] T032 [US2] Verify addToCart works for guest users in `backend/src/services/cart.service.ts`
- [x] T033 [US2] Verify updateCartItem updates quantity correctly in `backend/src/services/cart.service.ts`
- [x] T034 [US2] Verify removeFromCart removes items correctly in `backend/src/services/cart.service.ts`
- [x] T035 [US2] Verify clearCart clears all items in `backend/src/services/cart.service.ts`
- [x] T036 [US2] Verify migrateSessionCartToUser runs atomically (transaction) in `backend/src/services/cart.service.ts`
- [x] T037 [US2] Verify migrateSessionCartToUser validates game existence and stock in `backend/src/services/cart.service.ts`
- [x] T038 [US2] Verify migrateSessionCartToUser merges quantities for duplicate items in `backend/src/services/cart.service.ts`
- [x] T039 [US2] Verify migrateSessionCartToUser invalidates cache after migration in `backend/src/services/cart.service.ts`
- [x] T040 [US2] Verify cart routes support both authenticated and guest access in `backend/src/routes/cart.routes.ts`
- [x] T041 [US2] Verify cart controllers handle both userId and sessionId in `backend/src/controllers/cart.controller.ts`
- [x] T042 [US2] Verify cart calculates accurate totals including discounts in `backend/src/services/cart.service.ts`

**Checkpoint**: At this point, User Story 2 should be fully functional and testable independently

---

## Phase 5: User Story 3 - Wishlist Functionality (Priority: P1) 🎯 MVP

**Goal**: Ensure wishlist works for both authenticated and guest users, with proper migration on login.

**Independent Test**: Add items to wishlist, check if items are saved, verify migration on login. Can be fully tested independently.

### Implementation for User Story 3

- [x] T043 [US3] Verify getWishlist works for authenticated users in `backend/src/services/wishlist.service.ts`
- [x] T044 [US3] Verify getWishlist works for guest users (sessionId) in `backend/src/services/wishlist.service.ts`
- [x] T045 [US3] Verify addToWishlist prevents duplicates in `backend/src/services/wishlist.service.ts`
- [x] T046 [US3] Verify addToWishlist works for authenticated users in `backend/src/services/wishlist.service.ts`
- [x] T047 [US3] Verify addToWishlist works for guest users in `backend/src/services/wishlist.service.ts`
- [x] T048 [US3] Verify removeFromWishlist removes items correctly in `backend/src/services/wishlist.service.ts`
- [x] T049 [US3] Verify isInWishlist checks correctly in `backend/src/services/wishlist.service.ts`
- [x] T050 [US3] Verify migrateSessionWishlistToUser runs atomically (transaction) in `backend/src/services/wishlist.service.ts`
- [x] T051 [US3] Verify migrateSessionWishlistToUser validates game existence in `backend/src/services/wishlist.service.ts`
- [x] T052 [US3] Verify migrateSessionWishlistToUser skips duplicates in `backend/src/services/wishlist.service.ts`
- [x] T053 [US3] Verify migrateSessionWishlistToUser invalidates cache after migration in `backend/src/services/wishlist.service.ts`
- [x] T054 [US3] Verify wishlist routes support both authenticated and guest access in `backend/src/routes/wishlist.routes.ts`
- [x] T055 [US3] Verify wishlist controllers handle both userId and sessionId in `backend/src/controllers/wishlist.controller.ts`

**Checkpoint**: At this point, User Story 3 should be fully functional and testable independently

---

## Phase 6: User Story 4 - Admin Access Control (Priority: P1) 🎯 MVP

**Goal**: Ensure only administrators can access admin panel and admin endpoints.

**Independent Test**: Attempt to access admin panel with different user roles and verify access is properly restricted. Can be fully tested independently.

### Implementation for User Story 4

- [x] T056 [US4] Verify requireAdmin middleware checks for ADMIN role in `backend/src/middleware/auth.ts`
- [x] T057 [US4] Verify requireAdmin middleware returns 403 for non-admin users in `backend/src/middleware/auth.ts`
- [x] T058 [US4] Verify all admin routes use requireAdmin middleware in `backend/src/routes/admin.routes.ts`
- [x] T059 [US4] Add role check in AdminLayout component in `src/admin/components/AdminLayout.tsx` (check user.role === 'ADMIN')
- [x] T060 [US4] Add redirect for non-admin users in AdminLayout in `src/admin/components/AdminLayout.tsx`
- [x] T061 [US4] Verify useAuth hook returns user with role field in `src/context/AuthContext.tsx` (or equivalent)
- [x] T062 [US4] Add role check on all admin pages in `src/admin/pages/` (defensive check - AdminLayout already handles this)
- [x] T063 [US4] Verify admin actions are logged for audit in `backend/src/services/admin.service.ts`

**Checkpoint**: At this point, User Story 4 should be fully functional and testable independently

---

## Phase 7: User Story 5 - Complete Product Management (Priority: P2)

**Goal**: Enable administrators to edit all product fields including relationships (categories, genres, platforms, tags).

**Independent Test**: Create/edit a product with all fields and verify changes appear correctly in the catalog. Can be fully tested independently.

### Implementation for User Story 5

- [x] T064 [US5] Enhance updateGame to update all fields in `backend/src/services/admin.service.ts` (description, images, metadata)
- [x] T065 [US5] Enhance updateGame to update relationships (categories) in `backend/src/services/admin.service.ts`
- [x] T066 [US5] Enhance updateGame to update relationships (genres) in `backend/src/services/admin.service.ts`
- [x] T067 [US5] Enhance updateGame to update relationships (platforms) in `backend/src/services/admin.service.ts`
- [x] T068 [US5] Enhance updateGame to update relationships (tags) in `backend/src/services/admin.service.ts`
- [x] T069 [US5] Add cache invalidation after game update in `backend/src/services/admin.service.ts` (game:{slug}, home:*, catalog:*)
- [x] T070 [US5] Expand game edit form in `src/admin/pages/GamesPage.tsx` (add all fields: description, images, categories, genres, platforms, tags, metadata)
- [x] T071 [US5] Add relationship selectors in game edit form in `src/admin/pages/GamesPage.tsx` (multi-select for categories, genres, platforms, tags)
- [x] T072 [US5] Update adminApi.updateGame to send all fields in `src/services/adminApi.ts`
- [x] T073 [US5] Verify game update controller validates all fields in `backend/src/controllers/admin.controller.ts`
- [x] T074 [US5] Verify game updates appear in public catalog within 10 seconds (test cache invalidation)

**Checkpoint**: At this point, User Story 5 should be fully functional and testable independently

---

## Phase 8: User Story 6 - User Management (Priority: P2)

**Goal**: Enable administrators to search, view, edit, and manage user accounts.

**Independent Test**: Search for users, view details, edit information, and verify changes. Can be fully tested independently.

### Implementation for User Story 6

- [x] T075 [US6] Verify searchUsers function works in `backend/src/services/admin.service.ts`
- [x] T076 [US6] Verify getUserDetails returns complete user information in `backend/src/services/admin.service.ts`
- [x] T077 [US6] Implement updateUser function in `backend/src/services/admin.service.ts` (update nickname, firstName, lastName, role, balance)
- [x] T078 [US6] Add validation for user updates in `backend/src/services/admin.service.ts` (validate role, balance)
- [x] T079 [US6] Implement deleteUser function in `backend/src/services/admin.service.ts` (with dependency checks - orders, transactions)
- [x] T080 [US6] Add updateUser controller in `backend/src/controllers/admin.controller.ts`
- [x] T081 [US6] Add deleteUser controller in `backend/src/controllers/admin.controller.ts`
- [x] T082 [US6] Add updateUser route in `backend/src/routes/admin.routes.ts` (PUT /api/admin/users/:id)
- [x] T083 [US6] Add deleteUser route in `backend/src/routes/admin.routes.ts` (DELETE /api/admin/users/:id)
- [x] T084 [US6] Add user edit form in `src/admin/pages/UsersPage.tsx` (modal or separate page)
- [x] T085 [US6] Add user delete functionality in `src/admin/pages/UsersPage.tsx` (with confirmation)
- [x] T086 [US6] Update adminApi with updateUser and deleteUser functions in `src/services/adminApi.ts`
- [x] T087 [US6] Verify user updates are reflected immediately (test)

**Checkpoint**: At this point, User Story 6 should be fully functional and testable independently

---

## Phase 9: User Story 7 - Order Management (Priority: P2)

**Goal**: Enable administrators to view, update, and cancel orders.

**Independent Test**: View order details, update order status, and cancel orders. Can be fully tested independently.

### Implementation for User Story 7

- [x] T088 [US7] Verify getOrders function works in `backend/src/services/admin.service.ts`
- [x] T089 [US7] Verify getOrderDetails returns complete order information in `backend/src/services/admin.service.ts` (items, keys, transaction)
- [x] T090 [US7] Implement updateOrder function in `backend/src/services/admin.service.ts` (update status, paymentStatus, paymentMethod, promoCode)
- [x] T091 [US7] Implement cancelOrder function in `backend/src/services/admin.service.ts` (refund payment, restore inventory)
- [x] T092 [US7] Add validation for order updates in `backend/src/services/admin.service.ts` (validate status transitions)
- [x] T093 [US7] Add updateOrder controller in `backend/src/controllers/admin.controller.ts`
- [x] T094 [US7] Add cancelOrder controller in `backend/src/controllers/admin.controller.ts`
- [x] T095 [US7] Add getOrderDetails route in `backend/src/routes/admin.routes.ts` (GET /api/admin/orders/:id)
- [x] T096 [US7] Add updateOrder route in `backend/src/routes/admin.routes.ts` (PUT /api/admin/orders/:id)
- [x] T097 [US7] Add cancelOrder route in `backend/src/routes/admin.routes.ts` (POST /api/admin/orders/:id/cancel)
- [x] T098 [US7] Add order edit form in `src/admin/pages/OrdersPage.tsx` (status, paymentStatus, paymentMethod)
- [x] T099 [US7] Add order cancel functionality in `src/admin/pages/OrdersPage.tsx` (with confirmation)
- [x] T100 [US7] Add order details view in `src/admin/pages/OrdersPage.tsx` (items, keys, transaction)
- [x] T101 [US7] Update adminApi with getOrderDetails, updateOrder, cancelOrder functions in `src/services/adminApi.ts`
- [x] T102 [US7] Verify order cancellation refunds payment and restores inventory (test)

**Checkpoint**: At this point, User Story 7 should be fully functional and testable independently

---

## Phase 10: User Story 8 - Catalog Metadata Management (Priority: P3)

**Goal**: Enable administrators to manage categories, genres, and platforms.

**Independent Test**: Create/edit categories, genres, and platforms, and verify they appear in filters and product listings. Can be fully tested independently.

### Implementation for User Story 8

- [x] T103 [US8] Implement createCategory function in `backend/src/services/admin.service.ts`
- [x] T104 [US8] Implement updateCategory function in `backend/src/services/admin.service.ts`
- [x] T105 [US8] Implement deleteCategory function in `backend/src/services/admin.service.ts` (handle existing product relationships)
- [x] T106 [US8] Implement createGenre function in `backend/src/services/admin.service.ts`
- [x] T107 [US8] Implement updateGenre function in `backend/src/services/admin.service.ts`
- [x] T108 [US8] Implement deleteGenre function in `backend/src/services/admin.service.ts` (handle existing product relationships)
- [x] T109 [US8] Implement createPlatform function in `backend/src/services/admin.service.ts`
- [x] T110 [US8] Implement updatePlatform function in `backend/src/services/admin.service.ts`
- [x] T111 [US8] Implement deletePlatform function in `backend/src/services/admin.service.ts` (handle existing product relationships)
- [x] T112 [US8] Add category/genre/platform controllers in `backend/src/controllers/admin.controller.ts`
- [x] T113 [US8] Add category/genre/platform routes in `backend/src/routes/admin.routes.ts` (CRUD endpoints)
- [x] T114 [US8] Add cache invalidation after metadata changes in `backend/src/services/admin.service.ts` (catalog:*, home:*)
- [x] T115 [US8] Create CategoriesPage component in `src/admin/pages/CategoriesPage.tsx` (list, create, edit, delete)
- [x] T116 [US8] Create GenresPage component in `src/admin/pages/GenresPage.tsx` (list, create, edit, delete)
- [x] T117 [US8] Create PlatformsPage component in `src/admin/pages/PlatformsPage.tsx` (list, create, edit, delete)
- [x] T118 [US8] Add routes for metadata pages in `src/admin/AdminApp.tsx`
- [x] T119 [US8] Update adminApi with category/genre/platform CRUD functions in `src/services/adminApi.ts`
- [x] T120 [US8] Verify metadata changes are reflected in product filters (test)

**Checkpoint**: At this point, User Story 8 should be fully functional and testable independently

---

## Phase 11: User Story 9 - Blog Content Management (Priority: P3)

**Goal**: Enable administrators to create and manage blog posts with complete information, including automatic readTime calculation.

**Independent Test**: Create/edit a blog post with all fields and verify it displays correctly. Can be fully tested independently.

### Implementation for User Story 9

- [x] T121 [US9] Add GET /api/admin/blog/:id endpoint for full blog post data in `backend/src/routes/admin.routes.ts`
- [x] T122 [US9] Implement getBlogPostById function in `backend/src/services/admin.service.ts` (returns full content, coverImage, tags)
- [x] T123 [US9] Fix blog post data loading in `src/admin/pages/BlogPostsPage.tsx` (load full content, coverImage, tags on edit)
- [x] T124 [US9] Implement automatic readTime calculation in `backend/src/services/admin.service.ts` (Math.ceil(wordCount / 200))
- [x] T125 [US9] Add readTime calculation to createBlogPost in `backend/src/services/admin.service.ts`
- [x] T126 [US9] Add readTime calculation to updateBlogPost in `backend/src/services/admin.service.ts`
- [x] T127 [US9] Verify publishedAt is set when publishing in `backend/src/services/admin.service.ts`
- [x] T128 [US9] Verify publishedAt is cleared when unpublishing in `backend/src/services/admin.service.ts`
- [x] T129 [US9] Add cache invalidation after blog post changes in `backend/src/services/admin.service.ts` (blog:{slug}, blog:category:{category}, blog:recent)
- [x] T130 [US9] Add blog post slug validation (uniqueness check) in `backend/src/services/admin.service.ts`
- [x] T131 [US9] Add automatic slug generation from title in `backend/src/services/admin.service.ts` (if not provided)
- [x] T132 [US9] Update adminApi.getBlogPost to fetch full data in `src/services/adminApi.ts`
- [x] T133 [US9] Verify blog post editing loads all previously saved data correctly (test)

**Checkpoint**: At this point, User Story 9 should be fully functional and testable independently

---

## Phase 12: User Story 10 - External Catalog Synchronization (Priority: P2)

**Goal**: Ensure G2A synchronization works correctly with automatic cache invalidation.

**Independent Test**: Trigger synchronization and verify products are updated correctly. Can be fully tested independently.

### Implementation for User Story 10

- [x] T134 [US10] Add cache invalidation after syncG2ACatalog completes in `backend/src/services/g2a.service.ts` (invalidate home:*, game:*, catalog:*)
- [x] T135 [US10] Verify cache invalidation is non-blocking in `backend/src/services/g2a.service.ts` (try/catch, don't fail sync)
- [x] T136 [US10] Verify OAuth2 token caching works correctly in `backend/src/services/g2a.service.ts` (getOAuth2Token function)
- [x] T137 [US10] Verify OAuth2 token caching handles Redis unavailability gracefully in `backend/src/services/g2a.service.ts`
- [x] T138 [US10] Verify sync progress is tracked in Redis in `backend/src/services/g2a.service.ts` (g2a:sync:progress)
- [x] T139 [US10] Verify sync metadata is cached in Redis in `backend/src/services/g2a.service.ts` (g2a:sync:metadata)
- [x] T140 [US10] Enhance G2ASyncPage to display sync progress in `src/admin/pages/G2ASyncPage.tsx` (currentPage, totalPages, productsProcessed)
- [x] T141 [US10] Enhance G2ASyncPage to display sync status in `src/admin/pages/G2ASyncPage.tsx` (in progress/completed/failed)
- [x] T142 [US10] Enhance G2ASyncPage to display last sync date in `src/admin/pages/G2ASyncPage.tsx`
- [x] T143 [US10] Enhance G2ASyncPage to display sync statistics in `src/admin/pages/G2ASyncPage.tsx` (added/updated/deleted products)
- [ ] T144 [US10] Verify sync maintains acceptable performance (response time under 2 seconds) during sync (test)

**Checkpoint**: At this point, User Story 10 should be fully functional and testable independently

---

## Phase 13: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T145 [P] Add Redis caching for user cart in `backend/src/services/cart.service.ts` (TTL: 15 minutes)
- [x] T146 [P] Add Redis caching for user wishlist in `backend/src/services/wishlist.service.ts` (TTL: 30 minutes)
- [x] T147 [P] Verify all cache operations handle Redis unavailability gracefully across all services
- [x] T148 [P] Add comprehensive error logging for all admin operations in `backend/src/services/admin.service.ts`
- [x] T149 [P] Add audit logging for all admin actions in `backend/src/services/admin.service.ts`
- [x] T150 [P] Verify all API endpoints return consistent error format (check all controllers)
- [x] T151 [P] Run quickstart.md validation checklist in `specs/001-system-integration-enhancement/quickstart.md`
- [x] T152 [P] Update API documentation with new endpoints in `docs/api/openapi.yaml`
- [x] T153 [P] Add integration tests for cart/wishlist migration in `backend/tests/integration/`
- [x] T154 [P] Add integration tests for admin operations in `backend/tests/integration/`
- [x] T155 [P] Verify all success criteria from spec.md are met (SC-001 through SC-012)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-12)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 13)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Uses auth from US1 but independently testable
- **User Story 3 (P1)**: Can start after Foundational (Phase 2) - Uses auth from US1 but independently testable
- **User Story 4 (P1)**: Can start after Foundational (Phase 2) - Uses auth from US1 but independently testable
- **User Story 5 (P2)**: Can start after Foundational (Phase 2) - Uses admin access from US4 but independently testable
- **User Story 6 (P2)**: Can start after Foundational (Phase 2) - Uses admin access from US4 but independently testable
- **User Story 7 (P2)**: Can start after Foundational (Phase 2) - Uses admin access from US4 but independently testable
- **User Story 8 (P3)**: Can start after Foundational (Phase 2) - Uses admin access from US4 but independently testable
- **User Story 9 (P3)**: Can start after Foundational (Phase 2) - Uses admin access from US4 but independently testable
- **User Story 10 (P2)**: Can start after Foundational (Phase 2) - Uses admin access from US4 but independently testable

### Within Each User Story

- Verification tasks can run in parallel (different files)
- Service enhancements before controller updates
- Controller updates before route updates
- Backend before frontend
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- Tasks within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 2

```bash
# Launch verification tasks in parallel:
Task: "Verify getCart works for authenticated users in backend/src/services/cart.service.ts"
Task: "Verify getCart works for guest users (sessionId) in backend/src/services/cart.service.ts"
Task: "Verify addToCart validates game availability before adding in backend/src/services/cart.service.ts"

# Launch route/controller tasks in parallel:
Task: "Verify cart routes support both authenticated and guest access in backend/src/routes/cart.routes.ts"
Task: "Verify cart controllers handle both userId and sessionId in backend/src/controllers/cart.controller.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1-4 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Authentication)
4. Complete Phase 4: User Story 2 (Cart)
5. Complete Phase 5: User Story 3 (Wishlist)
6. Complete Phase 6: User Story 4 (Admin Access)
7. **STOP and VALIDATE**: Test all P1 stories independently
8. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Stories 1-4 (P1) → Test independently → Deploy/Demo (MVP!)
3. Add User Stories 5-7, 10 (P2) → Test independently → Deploy/Demo
4. Add User Stories 8-9 (P3) → Test independently → Deploy/Demo
5. Add Polish phase → Final validation → Deploy

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Auth)
   - Developer B: User Story 2 (Cart)
   - Developer C: User Story 3 (Wishlist)
   - Developer D: User Story 4 (Admin Access)
3. After P1 stories complete:
   - Developer A: User Story 5 (Product Management)
   - Developer B: User Story 6 (User Management)
   - Developer C: User Story 7 (Order Management)
   - Developer D: User Story 10 (G2A Sync)
4. After P2 stories complete:
   - Developer A: User Story 8 (Metadata)
   - Developer B: User Story 9 (Blog)
   - Developer C: Polish phase

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Most services already exist - tasks focus on verification and enhancement
- Verify tests fail before implementing (if tests are added)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

