# Tasks: Admin Panel Function Synchronization

**Input**: Design documents from `/specs/013-admin-sync/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Project Verification)

**Purpose**: Verify project structure and dependencies are ready for implementation

- [x] T001 Verify backend service files exist: `backend/src/services/payment.service.ts`, `cart.service.ts`, `wishlist.service.ts`, `faq.service.ts`, `g2a-offer.service.ts`, `g2a-reservation.service.ts`, `cache.service.ts`, `user.service.ts`
- [x] T002 Verify admin infrastructure exists: `backend/src/controllers/admin.controller.ts`, `backend/src/routes/admin.routes.ts`, `backend/src/types/admin.ts`
- [x] T003 Verify frontend admin structure exists: `src/admin/pages/`, `src/admin/services/adminApi.ts`, `src/admin/components/AdminSidebar.tsx`, `src/admin/AdminApp.tsx`
- [x] T004 [P] Verify payment gateway services exist: `backend/src/services/stripe.service.ts`, `paypal.service.ts`, `mollie.service.ts`, `terminal.service.ts`
- [x] T001a [P] Verify LoginHistory model exists in `backend/prisma/schema.prisma` and run migration if needed

---

## Phase 2: Foundational (Shared Infrastructure)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Verify admin authentication middleware works: `backend/src/middleware/auth.ts` (authenticate, requireAdmin)
- [x] T006 Verify admin API client structure: `src/admin/services/adminApi.ts` exports adminApi object
- [x] T007 Verify admin routing structure: `src/admin/AdminApp.tsx` has route definitions
- [x] T008 [P] Verify TypeScript types exist: `backend/src/types/admin.ts` has base admin types

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 – Complete Payment Management (Priority: P1) 🎯 MVP

**Goal**: Enable administrators to view and manage all payment methods (Stripe, PayPal, Mollie, Terminal) and payment transactions, including refund operations.

**Independent Test**: Access payment management section in admin panel, view payment methods, filter transactions by payment method, and process refunds. All operations should work independently without other user stories.

### Implementation for User Story 1

#### Backend Service Extensions

- [x] T009 [US1] Extend `payment.service.ts` with `refundTransaction(transactionId: string, amount?: number, reason?: string): Promise<RefundResult>` function in `backend/src/services/payment.service.ts`
- [x] T010 [P] [US1] Add `refundStripeTransaction()` helper function in `backend/src/services/payment.service.ts` (calls stripe.service.ts)
- [x] T011 [P] [US1] Add `refundPayPalTransaction()` helper function in `backend/src/services/payment.service.ts` (calls paypal.service.ts)
- [x] T012 [P] [US1] Add `refundMollieTransaction()` helper function in `backend/src/services/payment.service.ts` (calls mollie.service.ts)
- [x] T013 [P] [US1] Add `refundTerminalTransaction()` helper function in `backend/src/services/payment.service.ts` (calls terminal.service.ts) - **Note**: Terminal payments may be non-refundable; verify with business requirements or implement as no-op with appropriate error message
- [x] T014 [US1] Extend `admin.service.ts` with `getPaymentMethods(): Promise<PaymentMethod[]>` function in `backend/src/services/admin.service.ts`
- [x] T015 [US1] Extend `admin.service.ts` with `getPaymentTransactions(filters: PaymentTransactionFilters): Promise<TransactionResult>` function in `backend/src/services/admin.service.ts`
- [x] T016 [US1] Extend `admin.service.ts` with `processRefund(transactionId: string, amount?: number, reason?: string): Promise<RefundResult>` function in `backend/src/services/admin.service.ts`

#### Backend Controllers and Routes

- [x] T017 [US1] Add `getPaymentMethodsController` to `backend/src/controllers/admin.controller.ts`
- [x] T018 [US1] Add `getPaymentTransactionsController` to `backend/src/controllers/admin.controller.ts`
- [x] T019 [US1] Add `refundTransactionController` to `backend/src/controllers/admin.controller.ts`
- [x] T020 [US1] Add routes `GET /api/admin/payments/methods`, `GET /api/admin/payments/transactions`, `POST /api/admin/payments/transactions/:id/refund` to `backend/src/routes/admin.routes.ts`

#### Backend Types

- [x] T021 [P] [US1] Add `PaymentMethod`, `PaymentTransactionFilters`, `RefundResult` types to `backend/src/types/admin.ts`

#### Frontend Admin API Client

- [x] T022 [US1] Add `getPaymentMethods(): Promise<PaymentMethod[]>` to `src/admin/services/adminApi.ts`
- [x] T023 [US1] Add `getPaymentTransactions(filters): Promise<TransactionResult>` to `src/admin/services/adminApi.ts`
- [x] T024 [US1] Add `refundTransaction(transactionId: string, amount?: number, reason?: string): Promise<RefundResult>` to `src/admin/services/adminApi.ts`

#### Frontend Admin Page

- [x] T025 [US1] Create `PaymentManagementPage.tsx` component in `src/admin/pages/PaymentManagementPage.tsx` with payment methods table
- [x] T026 [US1] Add payment transactions table with filtering by payment method to `src/admin/pages/PaymentManagementPage.tsx`
- [x] T027 [US1] Add refund action button and modal to `src/admin/pages/PaymentManagementPage.tsx`
- [x] T028 [US1] Add error handling and loading states to `src/admin/pages/PaymentManagementPage.tsx`

#### Navigation Integration

- [x] T029 [US1] Add "Payment Management" menu item to `src/admin/components/AdminSidebar.tsx`
- [x] T030 [US1] Add route `/admin/payments` to `src/admin/AdminApp.tsx` pointing to `PaymentManagementPage`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Administrators can view payment methods, filter transactions, and process refunds.

---

## Phase 4: User Story 2 – Cart and Wishlist Management (Priority: P2)

**Goal**: Enable administrators to view and manage user carts and wishlists, analyze shopping behavior, and assist users with cart issues.

**Independent Test**: Access cart/wishlist management in admin panel, search for users, view their carts/wishlists, modify carts, and view wishlist statistics. All operations should work independently.

### Implementation for User Story 2

#### Backend Service Extensions

- [x] T031 [US2] Extend `cart.service.ts` with `getUserCartForAdmin(userId: string): Promise<CartResponse>` function in `backend/src/services/cart.service.ts`
- [x] T032 [US2] Extend `cart.service.ts` with `updateUserCartForAdmin(userId: string, items: CartItemInput[]): Promise<void>` function in `backend/src/services/cart.service.ts`
- [x] T033 [US2] Extend `cart.service.ts` with `clearUserCartForAdmin(userId: string): Promise<void>` function in `backend/src/services/cart.service.ts`
- [x] T034 [US2] Extend `admin.service.ts` with `searchUserCarts(filters: CartSearchFilters): Promise<CartSearchResult>` function in `backend/src/services/admin.service.ts`
- [x] T035 [US2] Extend `wishlist.service.ts` with `getUserWishlistForAdmin(userId: string): Promise<WishlistResponse>` function in `backend/src/services/wishlist.service.ts`
- [x] T036 [US2] Extend `admin.service.ts` with `searchUserWishlists(filters: WishlistSearchFilters): Promise<WishlistSearchResult>` function in `backend/src/services/admin.service.ts`
- [x] T037 [US2] Extend `admin.service.ts` with `getWishlistStatistics(): Promise<WishlistStatistics>` function in `backend/src/services/admin.service.ts`

#### Backend Controllers and Routes

- [x] T038 [US2] Add `getUserCartsController` to `backend/src/controllers/admin.controller.ts`
- [x] T039 [US2] Add `getUserCartController` to `backend/src/controllers/admin.controller.ts`
- [x] T040 [US2] Add `updateUserCartController` to `backend/src/controllers/admin.controller.ts`
- [x] T041 [US2] Add `clearUserCartController` to `backend/src/controllers/admin.controller.ts`
- [x] T042 [US2] Add `getUserWishlistsController` to `backend/src/controllers/admin.controller.ts`
- [x] T043 [US2] Add `getUserWishlistController` to `backend/src/controllers/admin.controller.ts`
- [x] T044 [US2] Add `getWishlistStatisticsController` to `backend/src/controllers/admin.controller.ts`
- [x] T045 [US2] Add routes `GET /api/admin/carts`, `GET /api/admin/carts/user/:userId`, `PUT /api/admin/carts/user/:userId`, `DELETE /api/admin/carts/user/:userId` to `backend/src/routes/admin.routes.ts`
- [x] T046 [US2] Add routes `GET /api/admin/wishlists`, `GET /api/admin/wishlists/user/:userId`, `GET /api/admin/wishlists/statistics` to `backend/src/routes/admin.routes.ts`

#### Backend Types

- [x] T047 [P] [US2] Add `CartSearchFilters`, `CartSearchResult`, `WishlistSearchFilters`, `WishlistSearchResult`, `WishlistStatistics` types to `backend/src/types/admin.ts`

#### Frontend Admin API Client

- [x] T048 [US2] Add `getUserCarts(filters): Promise<CartSearchResult>` to `src/admin/services/adminApi.ts`
- [x] T049 [US2] Add `getUserCart(userId: string): Promise<CartResponse>` to `src/admin/services/adminApi.ts`
- [x] T050 [US2] Add `updateUserCart(userId: string, items): Promise<void>` to `src/admin/services/adminApi.ts`
- [x] T051 [US2] Add `clearUserCart(userId: string): Promise<void>` to `src/admin/services/adminApi.ts`
- [x] T052 [US2] Add `getUserWishlists(filters): Promise<WishlistSearchResult>` to `src/admin/services/adminApi.ts`
- [x] T053 [US2] Add `getUserWishlist(userId: string): Promise<WishlistResponse>` to `src/admin/services/adminApi.ts`
- [x] T054 [US2] Add `getWishlistStatistics(): Promise<WishlistStatistics>` to `src/admin/services/adminApi.ts`

#### Frontend Admin Pages

- [x] T055 [US2] Create `CartManagementPage.tsx` component in `src/admin/pages/CartManagementPage.tsx` with user search and cart list
- [x] T056 [US2] Add cart detail view with item management to `src/admin/pages/CartManagementPage.tsx`
- [x] T057 [US2] Add cart modification (add/remove/update quantities) functionality to `src/admin/pages/CartManagementPage.tsx`
- [x] T058 [US2] Create `WishlistManagementPage.tsx` component in `src/admin/pages/WishlistManagementPage.tsx` with user search and wishlist list
- [x] T059 [US2] Add wishlist detail view to `src/admin/pages/WishlistManagementPage.tsx`
- [x] T060 [US2] Add wishlist statistics dashboard to `src/admin/pages/WishlistManagementPage.tsx`

#### Navigation Integration

- [x] T061 [US2] Add "Cart Management" menu item to `src/admin/components/AdminSidebar.tsx`
- [x] T062 [US2] Add "Wishlist Management" menu item to `src/admin/components/AdminSidebar.tsx`
- [x] T063 [US2] Add routes `/admin/carts` and `/admin/wishlists` to `src/admin/AdminApp.tsx`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Administrators can manage payments and carts/wishlists.

---

## Phase 5: User Story 3 – FAQ Content Management (Priority: P2)

**Goal**: Enable administrators to create, update, and manage FAQ content with category organization and publication control.

**Independent Test**: Access FAQ management in admin panel, create new FAQ items, update existing FAQs, organize by categories, and publish/unpublish FAQs. All operations should work independently.

### Implementation for User Story 3

#### Backend Service Extensions

- [x] T064 [US3] Extend `faq.service.ts` with `createFAQ(data: FAQCreateInput): Promise<FAQItem>` function in `backend/src/services/faq.service.ts` - **Note**: Verify faq.service.ts exists; create if missing
- [x] T065 [US3] Extend `faq.service.ts` with `updateFAQ(id: string, data: FAQUpdateInput): Promise<FAQItem>` function in `backend/src/services/faq.service.ts` - **Note**: Verify faq.service.ts exists; create if missing
- [x] T066 [US3] Extend `faq.service.ts` with `deleteFAQ(id: string): Promise<void>` function in `backend/src/services/faq.service.ts` - **Note**: Verify faq.service.ts exists; create if missing
- [x] T067 [US3] Extend `admin.service.ts` with `getAllFAQsForAdmin(filters: FAQAdminFilters): Promise<FAQAdminResult>` function in `backend/src/services/admin.service.ts`

#### Backend Controllers and Routes

- [x] T068 [US3] Add `getAllFAQsController` to `backend/src/controllers/admin.controller.ts`
- [x] T069 [US3] Add `createFAQController` to `backend/src/controllers/admin.controller.ts`
- [x] T070 [US3] Add `updateFAQController` to `backend/src/controllers/admin.controller.ts`
- [x] T071 [US3] Add `deleteFAQController` to `backend/src/controllers/admin.controller.ts`
- [x] T072 [US3] Add `getFAQCategoriesController` to `backend/src/controllers/admin.controller.ts`
- [x] T073 [US3] Add routes `GET /api/admin/faqs`, `POST /api/admin/faqs`, `PUT /api/admin/faqs/:id`, `DELETE /api/admin/faqs/:id`, `GET /api/admin/faqs/categories` to `backend/src/routes/admin.routes.ts`

#### Backend Types

- [x] T074 [P] [US3] Add `FAQCreateInput`, `FAQUpdateInput`, `FAQAdminFilters`, `FAQAdminResult` types to `backend/src/types/admin.ts`

#### Frontend Admin API Client

- [x] T075 [US3] Add `getFAQs(filters): Promise<FAQAdminResult>` to `src/admin/services/adminApi.ts`
- [x] T076 [US3] Add `createFAQ(data): Promise<FAQItem>` to `src/admin/services/adminApi.ts`
- [x] T077 [US3] Add `updateFAQ(id: string, data): Promise<FAQItem>` to `src/admin/services/adminApi.ts`
- [x] T078 [US3] Add `deleteFAQ(id: string): Promise<void>` to `src/admin/services/adminApi.ts`
- [x] T079 [US3] Add `getFAQCategories(): Promise<FAQCategory[]>` to `src/admin/services/adminApi.ts`

#### Frontend Admin Page

- [x] T080 [US3] Create `FAQManagementPage.tsx` component in `src/admin/pages/FAQManagementPage.tsx` with FAQ list table
- [x] T081 [US3] Add FAQ creation form with category selection to `src/admin/pages/FAQManagementPage.tsx`
- [x] T082 [US3] Add FAQ edit form with category and order management to `src/admin/pages/FAQManagementPage.tsx`
- [x] T083 [US3] Add publish/unpublish toggle functionality to `src/admin/pages/FAQManagementPage.tsx`
- [x] T084 [US3] Add category filtering and organization to `src/admin/pages/FAQManagementPage.tsx`

#### Navigation Integration

- [x] T085 [US3] Add "FAQ Management" menu item to `src/admin/components/AdminSidebar.tsx`
- [x] T086 [US3] Add route `/admin/faqs` to `src/admin/AdminApp.tsx` pointing to `FAQManagementPage`

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently. Administrators can manage payments, carts/wishlists, and FAQs.

---

## Phase 6: User Story 4 – G2A Advanced Management (Priority: P2)

**Goal**: Enable administrators to view G2A offers, reservations, and detailed metrics to optimize G2A integration and monitor performance.

**Independent Test**: Access G2A management section, view offers and reservations, view detailed metrics, and cancel reservations. All operations should work independently.

### Implementation for User Story 4

#### Backend Service Extensions

- [x] T087 [US4] Extend `g2a-offer.service.ts` with `getAllOffersForAdmin(filters: G2AOfferFilters): Promise<G2AOfferResult>` function in `backend/src/services/g2a-offer.service.ts` - **Note**: Verify g2a-offer.service.ts exists; may need to create or extend g2a.service.ts
- [x] T088 [US4] Extend `g2a-offer.service.ts` with `getOfferByIdForAdmin(offerId: string): Promise<G2AOffer>` function in `backend/src/services/g2a-offer.service.ts` - **Note**: Verify g2a-offer.service.ts exists; may need to create or extend g2a.service.ts
- [x] T089 [US4] Extend `g2a-reservation.service.ts` with `getAllReservationsForAdmin(filters: G2AReservationFilters): Promise<G2AReservationResult>` function in `backend/src/services/g2a-reservation.service.ts` - **Note**: Verify g2a-reservation.service.ts exists; may need to create or extend g2a.service.ts
- [x] T090 [US4] Extend `g2a-reservation.service.ts` with `cancelReservationForAdmin(reservationId: string): Promise<void>` function in `backend/src/services/g2a-reservation.service.ts` - **Note**: Verify g2a-reservation.service.ts exists; may need to create or extend g2a.service.ts
- [x] T091 [US4] Verify `g2a-metrics.service.ts` has `getG2AMetrics()` function exposed (already exists) in `backend/src/services/g2a-metrics.service.ts`

#### Backend Controllers and Routes

- [x] T092 [US4] Add `getG2AOffersController` to `backend/src/controllers/admin.controller.ts`
- [x] T093 [US4] Add `getG2AOfferByIdController` to `backend/src/controllers/admin.controller.ts`
- [x] T094 [US4] Add `getG2AReservationsController` to `backend/src/controllers/admin.controller.ts`
- [x] T095 [US4] Add `cancelG2AReservationController` to `backend/src/controllers/admin.controller.ts`
- [x] T096 [US4] Verify `getG2AMetricsController` exists in `backend/src/controllers/admin.controller.ts` (already exists)
- [x] T097 [US4] Add routes `GET /api/admin/g2a/offers`, `GET /api/admin/g2a/offers/:offerId` to `backend/src/routes/admin.routes.ts`
- [x] T098 [US4] Add routes `GET /api/admin/g2a/reservations`, `POST /api/admin/g2a/reservations/:id/cancel` to `backend/src/routes/admin.routes.ts`

#### Backend Types

- [x] T099 [P] [US4] Add `G2AOfferFilters`, `G2AOfferResult`, `G2AReservationFilters`, `G2AReservationResult` types to `backend/src/types/admin.ts`

#### Frontend Admin API Client

- [x] T100 [US4] Add `getG2AOffers(filters): Promise<G2AOfferResult>` to `src/admin/services/adminApi.ts`
- [x] T101 [US4] Add `getG2AOfferById(offerId: string): Promise<G2AOffer>` to `src/admin/services/adminApi.ts`
- [x] T102 [US4] Add `getG2AReservations(filters): Promise<G2AReservationResult>` to `src/admin/services/adminApi.ts`
- [x] T103 [US4] Add `cancelG2AReservation(reservationId: string): Promise<void>` to `src/admin/services/adminApi.ts`
- [x] T104 [US4] Verify `getG2AMetrics()` exists in `src/admin/services/adminApi.ts` (may need to add if missing)

#### Frontend Admin Pages

- [x] T105 [US4] Create `G2AOffersPage.tsx` component in `src/admin/pages/G2AOffersPage.tsx` with offers table
- [x] T106 [US4] Add offer detail view with status, inventory, and pricing to `src/admin/pages/G2AOffersPage.tsx`
- [x] T107 [US4] Create `G2AReservationsPage.tsx` component in `src/admin/pages/G2AReservationsPage.tsx` with reservations table
- [x] T108 [US4] Add reservation cancellation functionality to `src/admin/pages/G2AReservationsPage.tsx`
- [x] T109 [US4] Enhance existing `G2ASyncPage.tsx` to display detailed metrics from `getG2AMetrics()` in `src/admin/pages/G2ASyncPage.tsx`

#### Navigation Integration

- [x] T110 [US4] Add "G2A Offers" menu item to `src/admin/components/AdminSidebar.tsx`
- [x] T111 [US4] Add "G2A Reservations" menu item to `src/admin/components/AdminSidebar.tsx`
- [x] T112 [US4] Add routes `/admin/g2a/offers` and `/admin/g2a/reservations` to `src/admin/AdminApp.tsx`

**Checkpoint**: At this point, User Stories 1, 2, 3, AND 4 should all work independently. Administrators can manage payments, carts/wishlists, FAQs, and G2A operations.

---

## Phase 7: User Story 5 – Cache Management (Priority: P3)

**Goal**: Enable administrators to view cache status and invalidate cache when needed to ensure users see up-to-date content and troubleshoot caching issues.

**Independent Test**: Access cache management section, view cache statistics, invalidate cache by pattern, and clear all cache. All operations should work independently.

### Implementation for User Story 5

#### Backend Service Extensions

- [x] T113 [US5] Extend `cache.service.ts` with `getCacheStatistics(): Promise<CacheStatistics>` function in `backend/src/services/cache.service.ts` - **Note**: Verify cache.service.ts exists and has Redis client access
- [x] T114 [US5] Extend `cache.service.ts` with `getCacheKeys(pattern: string): Promise<string[]>` function in `backend/src/services/cache.service.ts` - **Note**: Verify cache.service.ts exists and has Redis client access
- [x] T115 [US5] Verify `invalidateCache(pattern: string): Promise<void>` exists in `backend/src/services/cache.service.ts` (already exists)

#### Backend Controllers and Routes

- [x] T116 [US5] Add `getCacheStatisticsController` to `backend/src/controllers/admin.controller.ts`
- [x] T117 [US5] Add `invalidateCacheController` to `backend/src/controllers/admin.controller.ts`
- [x] T118 [US5] Add `clearAllCacheController` to `backend/src/controllers/admin.controller.ts`
- [x] T119 [US5] Add routes `GET /api/admin/cache/statistics`, `POST /api/admin/cache/invalidate`, `POST /api/admin/cache/clear` to `backend/src/routes/admin.routes.ts`

#### Backend Types

- [x] T120 [P] [US5] Add `CacheStatistics`, `CacheInvalidationRequest` types to `backend/src/types/admin.ts`

#### Frontend Admin API Client

- [x] T121 [US5] Add `getCacheStatistics(): Promise<CacheStatistics>` to `src/admin/services/adminApi.ts`
- [x] T122 [US5] Add `invalidateCache(pattern: string): Promise<CacheInvalidationResult>` to `src/admin/services/adminApi.ts`
- [x] T123 [US5] Add `clearAllCache(): Promise<CacheInvalidationResult>` to `src/admin/services/adminApi.ts`

#### Frontend Admin Page

- [x] T124 [US5] Create `CacheManagementPage.tsx` component in `src/admin/pages/CacheManagementPage.tsx` with cache statistics display
- [x] T125 [US5] Add cache key pattern input and invalidation button to `src/admin/pages/CacheManagementPage.tsx`
- [x] T126 [US5] Add "Clear All Cache" button with confirmation to `src/admin/pages/CacheManagementPage.tsx`
- [x] T127 [US5] Add Redis connection status indicator to `src/admin/pages/CacheManagementPage.tsx`

#### Navigation Integration

- [x] T128 [US5] Add "Cache Management" menu item to `src/admin/components/AdminSidebar.tsx`
- [x] T129 [US5] Add route `/admin/cache` to `src/admin/AdminApp.tsx` pointing to `CacheManagementPage`

**Checkpoint**: At this point, User Stories 1-5 should all work independently. Administrators can manage payments, carts/wishlists, FAQs, G2A operations, and cache.

---

## Phase 8: User Story 6 – Enhanced User Management (Priority: P3)

**Goal**: Enable administrators to manage user balance, assign roles, and monitor user activity to support users effectively and manage user accounts.

**Independent Test**: Access enhanced user management, view user details with balance and activity, update user balance, assign roles, and view user activity logs. All operations should work independently.

### Implementation for User Story 6

#### Backend Service Extensions

- [x] T130 [US6] Extend `user.service.ts` with `updateUserBalance(userId: string, amount: number, reason: string): Promise<BalanceUpdateResult>` function in `backend/src/services/user.service.ts` - **Note**: Verify user.service.ts exists; may need to create or use admin.service.ts
- [x] T131 [US6] Extend `user.service.ts` with `updateUserRole(userId: string, role: Role): Promise<void>` function in `backend/src/services/user.service.ts` - **Note**: Verify user.service.ts exists; may need to create or use admin.service.ts
- [x] T132 [US6] Extend `admin.service.ts` with `getUserActivity(userId: string, filters?: ActivityFilters): Promise<UserActivity>` function in `backend/src/services/admin.service.ts` - **Note**: Login history is tracked via LoginHistory model; query orders and transactions from existing models

#### Backend Controllers and Routes

- [x] T133 [US6] Add `updateUserBalanceController` to `backend/src/controllers/admin.controller.ts`
- [x] T134 [US6] Add `updateUserRoleController` to `backend/src/controllers/admin.controller.ts`
- [x] T135 [US6] Add `getUserActivityController` to `backend/src/controllers/admin.controller.ts`
- [x] T136 [US6] Add routes `PUT /api/admin/users/:id/balance`, `PUT /api/admin/users/:id/role`, `GET /api/admin/users/:id/activity` to `backend/src/routes/admin.routes.ts`

#### Backend Types

- [x] T137 [P] [US6] Add `BalanceUpdateRequest`, `BalanceUpdateResult`, `RoleUpdateRequest`, `ActivityFilters`, `UserActivity` types to `backend/src/types/admin.ts`

#### Frontend Admin API Client

- [x] T138 [US6] Add `updateUserBalance(userId: string, amount: number, reason: string): Promise<BalanceUpdateResult>` to `src/admin/services/adminApi.ts`
- [x] T139 [US6] Add `updateUserRole(userId: string, role: string): Promise<void>` to `src/admin/services/adminApi.ts`
- [x] T140 [US6] Add `getUserActivity(userId: string, filters?): Promise<UserActivity>` to `src/admin/services/adminApi.ts`

#### Frontend Admin Page

- [x] T141 [US6] Create `EnhancedUsersPage.tsx` component in `src/admin/pages/EnhancedUsersPage.tsx` (or extend existing `UsersPage.tsx`)
- [x] T142 [US6] Add user balance update form with amount and reason to `src/admin/pages/EnhancedUsersPage.tsx`
- [x] T143 [US6] Add user role assignment dropdown to `src/admin/pages/EnhancedUsersPage.tsx`
- [x] T144 [US6] Add user activity log display (login history, orders, transactions) to `src/admin/pages/EnhancedUsersPage.tsx`
- [x] T145 [US6] Integrate balance and role management into existing user detail view in `src/admin/pages/UsersPage.tsx` (if separate page not created)

#### Navigation Integration

- [x] T146 [US6] Update existing "Users" menu item in `src/admin/components/AdminSidebar.tsx` to include enhanced features
- [x] T147 [US6] Verify route `/admin/users` exists in `src/admin/AdminApp.tsx` (already exists, may need enhancement)

**Checkpoint**: At this point, all User Stories 1-6 should work independently. Administrators have full access to all new management functions.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final polish

- [x] T148 [P] Add error handling and loading states consistently across all new admin pages
- [x] T149 [P] Add audit logging for all admin operations (balance updates, role changes, refunds, cart modifications) in `backend/src/services/admin.service.ts`
- [x] T149a [P] Add login history tracking: Create LoginHistory record on successful login in `backend/src/services/auth.service.ts`
- [x] T150 [P] Add cache invalidation after admin operations that modify data (cart updates, FAQ CRUD, user balance/role updates) in respective services
- [x] T151 [P] Verify all new admin pages follow existing admin design patterns and component reuse
- [x] T152 [P] Add input validation and error messages for all admin forms
- [x] T153 [P] Add confirmation dialogs for destructive operations (refunds, cart clearing, cache clearing, FAQ deletion)
- [x] T154 [P] Optimize API responses with pagination where needed (transactions, carts, wishlists, offers, reservations)
- [x] T155 [P] Add TypeScript type exports for all new admin API functions in `src/admin/services/adminApi.ts`
- [x] T156 [P] Verify all routes are properly protected with admin authentication middleware
- [x] T157 [P] Run quickstart.md validation checklist from `specs/013-admin-sync/quickstart.md`
- [x] T158 [P] Update documentation with new admin functions in `DOCUMENTATION.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 5 (P3)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 6 (P3)**: Can start after Foundational (Phase 2) - No dependencies on other stories

### Within Each User Story

- Backend service extensions before controllers
- Controllers before routes
- Backend types can be created in parallel with services
- Frontend API client after backend routes
- Frontend pages after API client
- Navigation integration after pages

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- Backend types marked [P] can be created in parallel with service implementations
- Different user stories can be worked on in parallel by different team members
- All Polish tasks marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Backend types can be created in parallel:
Task: "Add PaymentMethod, PaymentTransactionFilters, RefundResult types to backend/src/types/admin.ts"

# Payment gateway refund helpers can be created in parallel (different files):
Task: "Add refundStripeTransaction() helper function in backend/src/services/payment.service.ts"
Task: "Add refundPayPalTransaction() helper function in backend/src/services/payment.service.ts"
Task: "Add refundMollieTransaction() helper function in backend/src/services/payment.service.ts"
Task: "Add refundTerminalTransaction() helper function in backend/src/services/payment.service.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Payment Management)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Add User Story 5 → Test independently → Deploy/Demo
7. Add User Story 6 → Test independently → Deploy/Demo
8. Complete Polish phase → Final deployment
9. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Payment Management)
   - Developer B: User Story 2 (Cart/Wishlist Management)
   - Developer C: User Story 3 (FAQ Management)
   - Developer D: User Story 4 (G2A Management)
3. After P2 stories complete:
   - Developer A: User Story 5 (Cache Management)
   - Developer B: User Story 6 (Enhanced User Management)
4. All developers: Polish phase
5. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- All admin operations require authentication and admin role check
- Cache operations must gracefully degrade if Redis unavailable
- Payment refund operations must be atomic (transaction + refund record)
- User balance updates must be atomic (balance + transaction record)

---

## Summary

**Total Tasks**: 158
- Phase 1 (Setup): 4 tasks
- Phase 2 (Foundational): 4 tasks
- Phase 3 (US1 - Payment Management): 22 tasks
- Phase 4 (US2 - Cart/Wishlist Management): 33 tasks
- Phase 5 (US3 - FAQ Management): 23 tasks
- Phase 6 (US4 - G2A Management): 26 tasks
- Phase 7 (US5 - Cache Management): 17 tasks
- Phase 8 (US6 - Enhanced User Management): 18 tasks
- Phase 9 (Polish): 11 tasks

**Parallel Opportunities**: Many tasks marked [P] can run in parallel, especially:
- Backend types creation
- Payment gateway refund helpers
- Different user stories (after foundational phase)
- Polish tasks

**MVP Scope**: User Story 1 (Payment Management) - 22 tasks after foundational phase

