# Tasks: Data Synchronization & System Integration Fix

**Input**: Design documents from `/specs/012-data-sync-fix/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Integration tests are included to verify fixes work correctly.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/src/`, `backend/tests/`
- All paths shown below use backend structure

---

## Phase 1: Setup (Project Verification)

**Purpose**: Verify project structure and dependencies are ready for fixes

- [x] T001 Verify backend project structure exists at `backend/src/services/`
- [x] T002 [P] Verify Prisma schema is up to date at `backend/prisma/schema.prisma`
- [x] T003 [P] Verify Redis client configuration exists at `backend/src/config/redis.ts`
- [x] T004 [P] Verify environment variables are documented in `DOCUMENTATION.md`

**Checkpoint**: Project structure verified - foundational work can begin

---

## Phase 2: Foundational - Cache Service Enhancement (Blocking Prerequisites)

**Purpose**: Enhance cache service to handle Redis unavailability gracefully. This is CRITICAL as all other fixes depend on proper cache invalidation.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 [P] Enhance `invalidateCache()` function in `backend/src/services/cache.service.ts` to handle Redis unavailability gracefully with try/catch
- [x] T006 [P] Ensure cache invalidation is non-blocking (fire-and-forget) in `backend/src/services/cache.service.ts` - log errors but don't throw
- [x] T007 [P] Add consistent cache key pattern documentation in `backend/src/services/cache.service.ts` (patterns: `game:{id}`, `user:{id}:cart`, `home:*`, `catalog:*`)
- [ ] T008 [P] Add integration test for cache invalidation with Redis unavailable in `backend/tests/integration/cache.test.ts`

**Checkpoint**: Cache service ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Reliable User Authentication (Priority: P1) 🎯 MVP

**Goal**: Ensure user registration and login work correctly with atomic operations and proper error handling. Registration must be atomic, login must trigger cart/wishlist migration.

**Independent Test**: Create a new account, log in, verify tokens are generated, verify cart/wishlist migration is triggered (if guest session exists). Can be fully tested independently.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T009 [P] [US1] Integration test for atomic registration in `backend/tests/integration/auth.test.ts` - test transaction rollback on errors
- [ ] T010 [P] [US1] Integration test for login triggering cart/wishlist migration in `backend/tests/integration/auth.test.ts` - test migration is called after successful login
- [ ] T011 [P] [US1] Integration test for registration error handling in `backend/tests/integration/auth.test.ts` - test database unavailability handling

### Implementation for User Story 1

- [x] T012 [US1] Wrap `register()` user creation in Prisma transaction in `backend/src/services/auth.service.ts` - use `prisma.$transaction()` for atomicity
- [x] T013 [US1] Ensure email sending is non-blocking (fire-and-forget) in `backend/src/services/auth.service.ts` - wrap in try/catch, don't throw
- [x] T014 [US1] Add cart/wishlist migration trigger in `login()` function in `backend/src/services/auth.service.ts` - call migration functions after successful authentication
- [x] T015 [US1] Improve error handling for database unavailability in `backend/src/services/auth.service.ts` - check `prisma` availability before operations

**Checkpoint**: At this point, User Story 1 should be fully functional - registration and login work atomically, migration is triggered on login

---

## Phase 4: User Story 2 - Consistent Product Data Across Systems (Priority: P1)

**Goal**: Ensure G2A product sync properly updates database and invalidates cache. Product data must be consistent between Prisma database, Redis cache, and G2A API.

**Independent Test**: Run G2A product sync, verify database is updated, verify cache is invalidated, verify frontend shows updated data. Can be fully tested independently.

### Tests for User Story 2

- [ ] T016 [P] [US2] Integration test for G2A sync cache invalidation in `backend/tests/integration/g2a-sync.test.ts` - test cache is invalidated after sync completes
- [ ] T017 [P] [US2] Integration test for G2A sync lock prevents concurrent syncs in `backend/tests/integration/g2a-sync.test.ts` - test distributed locking works
- [ ] T018 [P] [US2] Integration test for stock check cache invalidation in `backend/tests/integration/g2a-sync.test.ts` - test cache is invalidated after stock updates

### Implementation for User Story 2

- [x] T019 [US2] Add cache invalidation after `syncG2ACatalog()` completes in `backend/src/services/g2a.service.ts` - invalidate `game:*`, `home:*`, `catalog:*` patterns
- [x] T020 [US2] Ensure cache invalidation is non-blocking in `syncG2ACatalog()` in `backend/src/services/g2a.service.ts` - wrap in try/catch, don't throw errors
- [x] T021 [US2] Verify sync lock prevents concurrent syncs in `backend/src/services/g2a.service.ts` - ensure `acquireSyncLock()` and `releaseSyncLock()` work correctly
- [x] T022 [US2] Add cache invalidation after stock checks in `startStockCheckJob()` in `backend/src/jobs/g2a-sync.job.ts` - invalidate affected product caches
- [x] T023 [US2] Improve error handling for cache operations in G2A sync jobs in `backend/src/jobs/g2a-sync.job.ts` - log errors but don't fail sync

**Checkpoint**: At this point, User Story 2 should be fully functional - G2A sync updates database and invalidates cache correctly

---

## Phase 5: User Story 3 - Synchronized Order and Transaction Data (Priority: P2)

**Goal**: Ensure orders and transactions are accurately recorded and synchronized between database, cache, and G2A. Order creation must be atomic, webhook updates must invalidate cache.

**Independent Test**: Create an order, verify database record, verify transaction is created, verify cache is invalidated, verify G2A webhook updates order status. Can be fully tested independently.

### Tests for User Story 3

- [ ] T024 [P] [US3] Integration test for atomic order creation with transaction in `backend/tests/integration/order.test.ts` - test order + items + transaction + balance update in single transaction
- [ ] T025 [P] [US3] Integration test for order cache invalidation in `backend/tests/integration/order.test.ts` - test `user:{id}:orders` and `user:{id}:cart` are invalidated
- [ ] T026 [P] [US3] Integration test for G2A webhook cache invalidation in `backend/tests/integration/g2a-webhook.test.ts` - test `order:{id}` and `user:{id}:orders` are invalidated on status update

### Implementation for User Story 3

- [x] T027 [US3] Ensure transaction creation is atomic with order creation in `createOrder()` in `backend/src/services/order.service.ts` - wrap order + items + transaction + balance update in `prisma.$transaction()`
- [x] T028 [US3] Add cache invalidation after order creation in `createOrder()` in `backend/src/services/order.service.ts` - invalidate `user:{id}:orders` and `user:{id}:cart` patterns
- [x] T029 [US3] Ensure cache invalidation is non-blocking in `createOrder()` in `backend/src/services/order.service.ts` - wrap in try/catch, don't throw
- [x] T030 [US3] Add cache invalidation after order status update in `processG2AWebhook()` in `backend/src/services/g2a-webhook.service.ts` - invalidate `order:{id}` and `user:{id}:orders` patterns
- [x] T031 [US3] Improve idempotency handling in `processG2AWebhook()` in `backend/src/services/g2a-webhook.service.ts` - ensure duplicate webhooks don't process twice

**Checkpoint**: At this point, User Story 3 should be fully functional - orders and transactions are synchronized correctly with cache invalidation

---

## Phase 6: User Story 4 - Synchronized Cart and Wishlist Data (Priority: P2)

**Goal**: Ensure cart and wishlist items are properly synchronized between session storage, database, and cache. Migration from guest session to authenticated user must be atomic.

**Independent Test**: Add items as guest, log in, verify items migrate to user account, verify cache is updated. Can be fully tested independently.

### Tests for User Story 4

- [ ] T032 [P] [US4] Integration test for atomic cart migration in `backend/tests/integration/cart-migration.test.ts` - test migration is atomic, quantities are merged, cache is invalidated
- [ ] T033 [P] [US4] Integration test for atomic wishlist migration in `backend/tests/integration/cart-migration.test.ts` - test migration is atomic, duplicates are skipped, cache is invalidated
- [ ] T034 [P] [US4] Integration test for cart migration with out-of-stock games in `backend/tests/integration/cart-migration.test.ts` - test out-of-stock items are skipped during migration

### Implementation for User Story 4

- [x] T035 [US4] Implement `migrateSessionCartToUser()` function with Prisma transaction in `backend/src/services/cart.service.ts` - wrap read + validate + create/update + delete in `prisma.$transaction()`
- [x] T036 [US4] Validate game availability before cart migration in `migrateSessionCartToUser()` in `backend/src/services/cart.service.ts` - check game exists and is in stock
- [x] T037 [US4] Merge quantities for duplicate cart items in `migrateSessionCartToUser()` in `backend/src/services/cart.service.ts` - add guest quantity to user quantity if item exists
- [x] T038 [US4] Add cache invalidation after cart migration in `migrateSessionCartToUser()` in `backend/src/services/cart.service.ts` - invalidate `session:{sessionId}:cart` and `user:{userId}:cart`
- [x] T039 [US4] Implement `migrateSessionWishlistToUser()` function with Prisma transaction in `backend/src/services/wishlist.service.ts` - wrap read + validate + create + delete in `prisma.$transaction()`
- [x] T040 [US4] Skip duplicate items in wishlist migration in `migrateSessionWishlistToUser()` in `backend/src/services/wishlist.service.ts` - check if item exists before creating
- [x] T041 [US4] Add cache invalidation after wishlist migration in `migrateSessionWishlistToUser()` in `backend/src/services/wishlist.service.ts` - invalidate `session:{sessionId}:wishlist` and `user:{userId}:wishlist`

**Checkpoint**: At this point, User Story 4 should be fully functional - cart and wishlist migration works atomically with cache invalidation

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements, documentation, and validation

- [ ] T042 [P] Update documentation in `DOCUMENTATION.md` - add cache invalidation patterns and graceful degradation notes
- [ ] T043 [P] Add logging for all cache invalidation operations - ensure all cache operations are logged for debugging
- [ ] T044 [P] Verify all error handling follows graceful degradation pattern - ensure no cache failures block operations
- [ ] T045 [P] Run quickstart.md validation checklist - verify all implementation checklist items are complete
- [ ] T046 [P] Code cleanup and refactoring - remove any commented code, ensure consistent error handling
- [ ] T047 [P] Performance validation - verify cache invalidation latency is < 1 second (95th percentile)
- [ ] T048 [P] Integration test for Redis unavailability scenario in `backend/tests/integration/cache.test.ts` - test all operations continue when Redis is unavailable

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories (cache service is used by all)
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User Story 1 (P1): Can start after Foundational - No dependencies on other stories
  - User Story 2 (P1): Can start after Foundational - No dependencies on other stories
  - User Story 3 (P2): Can start after Foundational - No dependencies on other stories
  - User Story 4 (P2): Depends on User Story 1 (migration is triggered in login) - Can start after US1
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 4 (P2)**: Depends on User Story 1 (cart/wishlist migration is triggered in login from US1)

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Service fixes before integration
- Core implementation before cache invalidation
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes:
  - User Story 1 and User Story 2 can start in parallel (both P1, no dependencies)
  - User Story 3 can start in parallel with US1/US2 (P2, no dependencies)
  - User Story 4 must wait for US1 (migration triggered in login)
- All tests for a user story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members (respecting dependencies)

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Integration test for atomic registration in backend/tests/integration/auth.test.ts"
Task: "Integration test for login triggering cart/wishlist migration in backend/tests/integration/auth.test.ts"
Task: "Integration test for registration error handling in backend/tests/integration/auth.test.ts"
```

---

## Parallel Example: User Story 2

```bash
# Launch all tests for User Story 2 together:
Task: "Integration test for G2A sync cache invalidation in backend/tests/integration/g2a-sync.test.ts"
Task: "Integration test for G2A sync lock prevents concurrent syncs in backend/tests/integration/g2a-sync.test.ts"
Task: "Integration test for stock check cache invalidation in backend/tests/integration/g2a-sync.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Authentication fixes)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Authentication)
   - Developer B: User Story 2 (G2A Product Sync)
   - Developer C: User Story 3 (Order/Transaction)
3. After US1 completes:
   - Developer A: User Story 4 (Cart/Wishlist Migration)
4. Stories complete and integrate independently

---

## Task Summary

**Total Tasks**: 48
- Phase 1 (Setup): 4 tasks
- Phase 2 (Foundational): 4 tasks
- Phase 3 (US1 - Authentication): 7 tasks (3 tests + 4 implementation)
- Phase 4 (US2 - Product Sync): 8 tasks (3 tests + 5 implementation)
- Phase 5 (US3 - Order/Transaction): 8 tasks (3 tests + 5 implementation)
- Phase 6 (US4 - Cart/Wishlist): 9 tasks (3 tests + 6 implementation)
- Phase 7 (Polish): 7 tasks

**Parallel Opportunities**: 
- 25 tasks can run in parallel (marked with [P])
- All tests within a story can run in parallel
- User Stories 1, 2, 3 can be worked on in parallel (after Foundational)
- User Story 4 must wait for User Story 1

**Independent Test Criteria**:
- **US1**: Create account, log in, verify tokens, verify migration triggered
- **US2**: Run G2A sync, verify database updated, verify cache invalidated
- **US3**: Create order, verify transaction created, verify cache invalidated, verify webhook updates
- **US4**: Add items as guest, log in, verify items migrated, verify cache updated

**Suggested MVP Scope**: Phase 1 + Phase 2 + Phase 3 (User Story 1) - Authentication fixes with atomic operations

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- All cache invalidation must be non-blocking (try/catch, don't throw)
- All database mutations must use Prisma transactions for atomicity
- Graceful degradation when Redis unavailable (log but continue)

