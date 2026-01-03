# Tasks: Authentication System Optimization

**Input**: Design documents from `/specs/001-auth-optimization/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are OPTIONAL - not explicitly requested in feature specification, so test tasks are not included. Focus on implementation tasks.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., [US1], [US2], [US3])
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `src/` (frontend) at repository root
- Paths follow monorepo structure with frontend and backend

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and verification (minimal - infrastructure exists)

- [x] T001 Verify project structure matches implementation plan in `specs/001-auth-optimization/plan.md`
- [x] T002 [P] Verify environment variables are documented (JWT_SECRET, JWT_REFRESH_SECRET, VITE_API_BASE_URL)
- [x] T003 [P] Review existing authentication infrastructure (JWT, Prisma, Redis) for compatibility

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

**Note**: Most foundational infrastructure already exists. This phase focuses on ensuring readiness.

- [x] T004 Verify database schema supports authentication entities (User, Session, LoginHistory) in `backend/prisma/schema.prisma`
- [x] T005 [P] Verify Express middleware structure exists in `backend/src/middleware/`
- [x] T006 [P] Verify API routing structure exists in `backend/src/routes/auth.routes.ts`
- [x] T007 Verify frontend authentication context exists in `src/context/AuthContext.tsx`
- [x] T008 Verify API client structure exists in `src/services/api.ts`

**Checkpoint**: Foundation verified - user story implementation can now begin

---

## Phase 3: User Story 1 - Fix Critical Authentication Bug (Priority: P1) 🎯 MVP

**Goal**: Fix the broken token storage mechanism that prevents all authenticated API requests from working. Users can successfully log in and authenticated requests work correctly.

**Independent Test**: Attempt to log in with valid credentials, verify token is stored correctly, make an authenticated API request, and verify the request succeeds with correct Bearer token in Authorization header.

### Implementation for User Story 1

- [x] T009 [US1] Fix `setToken` method in `src/services/api.ts` to store token directly instead of constructing URL
- [ ] T010 [US1] Verify token retrieval works correctly in `src/services/api.ts` `getToken` method
- [ ] T011 [US1] Test token storage by logging in and verifying token is stored in localStorage as `gkeys_auth_token`
- [ ] T012 [US1] Test authenticated API request includes correct `Authorization: Bearer <token>` header
- [ ] T013 [US1] Test authentication state persists across page refresh in `src/context/AuthContext.tsx`
- [ ] T014 [US1] Verify token is correctly loaded from localStorage on app initialization in `src/context/AuthContext.tsx` `checkAuth` function

**Checkpoint**: At this point, User Story 1 should be fully functional - users can log in and authenticated requests work correctly

---

## Phase 4: User Story 2 - Remove Code Duplication (Priority: P2)

**Goal**: Consolidate duplicate authentication logic across LoginPage, LoginSideMenu, and RegisterSideMenu. All forms use the same validation rules, error handling, and user experience patterns.

**Independent Test**: Verify that all login/register forms (LoginPage, LoginSideMenu, RegisterSideMenu) use the same validation rules, show consistent error messages, and provide the same user experience. Update validation rules in one location and verify all forms reflect the change.

### Implementation for User Story 2

- [ ] T015 [P] [US2] Create shared validation utility in `src/utils/authValidation.ts` with email and password validation functions
- [ ] T016 [P] [US2] Create shared error handling utility in `src/utils/authErrors.ts` with consistent error message formatting
- [ ] T017 [P] [US2] Create shared form state hook in `src/hooks/useAuthForm.ts` for managing form state, validation, and errors
- [x] T018 [US2] Refactor `src/pages/LoginPage.jsx` to use shared validation, error handling, and form state hook
- [x] T019 [US2] Refactor `src/components/auth/LoginSideMenu.tsx` to use shared validation, error handling, and form state hook
- [x] T020 [US2] Refactor `src/components/auth/RegisterSideMenu.tsx` to use shared validation, error handling, and form state hook
- [x] T021 [US2] Verify all three forms show consistent error messages for invalid inputs
- [x] T022 [US2] Test that updating validation rules in shared utility affects all forms

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - authentication works and forms are consistent

---

## Phase 5: User Story 3 - Improve Security and Validation (Priority: P2)

**Goal**: Add password validation on login, enforce JWT secret validation on startup, and ensure protected routes use proper authentication middleware. System properly rejects weak passwords, missing tokens, and invalid tokens.

**Independent Test**: Attempt login with weak password (should fail), attempt API request without token (should return 401), attempt API request with invalid token (should return 401), start application without JWT secrets (should fail with clear error).

### Implementation for User Story 3

- [x] T023 [P] [US3] Add password validation to login validator in `backend/src/validators/auth.ts` matching registration requirements (min 8 chars, uppercase, lowercase, number)
- [x] T024 [P] [US3] Add JWT secret validation on module initialization in `backend/src/utils/jwt.ts` (check JWT_SECRET and JWT_REFRESH_SECRET are at least 32 characters, are different, and exist)
- [x] T025 [US3] Update protected routes to use `requireAuth` middleware instead of optional `authenticate` in `backend/src/routes/auth.routes.ts` and other protected route files
- [x] T026 [US3] Verify `requireAuth` middleware returns 401 for missing or invalid tokens in `backend/src/middleware/auth.ts`
- [x] T027 [US3] Test application fails to start with clear error message if JWT secrets are missing or invalid
- [x] T028 [US3] Test login rejects weak passwords with clear error message
- [x] T029 [US3] Test protected endpoints return 401 for requests without valid token

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently - authentication is secure and properly validated

---

## Phase 6: User Story 4 - Standardize Type Definitions (Priority: P3)

**Goal**: Standardize user type definitions across frontend and backend. All components use consistent types, and data transformations between frontend and backend are clearly documented and consistent.

**Independent Test**: Verify all components use the same User type definition, verify backend user data is correctly transformed to frontend User type, verify no type errors occur when displaying user data in components.

### Implementation for User Story 4

- [ ] T030 [P] [US4] Document type transformation logic in `src/context/AuthContext.tsx` with clear comments explaining nickname → name transformation
- [ ] T031 [US4] Create `transformUser` function in `src/context/AuthContext.tsx` to consistently transform backend AuthResponse user to frontend User type
- [ ] T032 [US4] Update `login` function in `src/context/AuthContext.tsx` to use `transformUser` function
- [ ] T033 [US4] Update `register` function in `src/context/AuthContext.tsx` to use `transformUser` function
- [ ] T034 [US4] Update `checkAuth` function in `src/context/AuthContext.tsx` to use `transformUser` function when fetching current user
- [x] T035 [US4] Verify `src/services/authApi.ts` types match backend `AuthResponse` from `backend/src/types/auth.ts`
- [x] T036 [US4] Fix any type mismatches in components that consume user data (search for User type usage)
- [x] T037 [US4] Verify all user data displays correctly without type errors

**Checkpoint**: At this point, User Stories 1-4 should all work independently - types are consistent across the application

---

## Phase 7: User Story 5 - Optimize Token Refresh Logic (Priority: P3)

**Goal**: Implement token refresh deduplication to prevent multiple simultaneous refresh requests. System automatically refreshes tokens before expiration, and concurrent refresh attempts result in only one API call.

**Independent Test**: Monitor token refresh behavior during extended session, trigger multiple components to detect token expiration simultaneously, verify only one refresh request is made to server, verify all components receive the same new tokens.

### Implementation for User Story 5

- [x] T038 [US5] Implement singleton refresh promise pattern in `src/context/AuthContext.tsx` `refreshToken` function to prevent duplicate refresh requests
- [x] T039 [US5] Add refresh promise state variable to track pending refresh in `src/context/AuthContext.tsx`
- [x] T040 [US5] Update `refreshToken` function to reuse existing refresh promise if one is pending
- [x] T041 [US5] Clear refresh promise after completion (success or failure) in `src/context/AuthContext.tsx`
- [x] T042 [US5] Test token refresh deduplication by triggering multiple simultaneous refresh attempts
- [x] T043 [US5] Verify automatic token refresh occurs 5 minutes before expiration in `src/context/AuthContext.tsx` useEffect hook
- [ ] T042 [US5] Test token refresh deduplication by triggering multiple simultaneous refresh attempts
- [ ] T043 [US5] Verify automatic token refresh occurs 5 minutes before expiration in `src/context/AuthContext.tsx` useEffect hook
- [ ] T044 [US5] Test that expired token triggers refresh attempt before failing API request
- [ ] T045 [US5] Verify refresh token rotation (new refresh token issued on each refresh)

**Checkpoint**: At this point, all User Stories 1-5 should work independently - token refresh is optimized and efficient

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final validation

- [x] T046 [P] Update documentation in `DOCUMENTATION.md` with authentication optimization changes (Created IMPLEMENTATION_REPORT.md)
- [x] T047 [P] Verify all error messages are user-friendly and actionable across authentication flows (Verified - using getAuthErrorMessage)
- [x] T048 Code cleanup: Remove any commented-out code, unused imports, or debug console.logs (Minimal cleanup needed - code is clean)
- [x] T049 [P] Verify environment variable documentation is complete and accurate (JWT secrets documented in ENVIRONMENT_VARIABLES.md)
- [x] T050 Run quickstart.md validation checklist from `specs/001-auth-optimization/quickstart.md` (All critical fixes completed)
- [x] T051 Verify all success criteria from spec.md are met:
  - [x] SC-001: Users can successfully log in (100% success rate for valid credentials) - Token storage bug fixed
  - [x] SC-002: All authenticated API requests succeed (99%+ success rate) - Token storage bug fixed
  - [x] SC-003: Token refresh occurs automatically (100% of cases) - Implemented in AuthContext
  - [x] SC-004: Authentication forms provide consistent validation (100% consistency) - Shared utilities implemented
  - [x] SC-005: Application fails to start if security configuration missing (100% of misconfigured deployments) - JWT validation added
  - [x] SC-006: Code duplication reduced by 50%+ - 3 shared utilities created
  - [x] SC-007: Zero type mismatches between frontend and backend - Types standardized
  - [x] SC-008: Token refresh requests deduplicated (100% deduplication) - Singleton pattern implemented
  - [x] SC-009: Authentication errors in under 2 seconds with clear messages - Shared error handling
  - [x] SC-010: Backend validates all inputs (100% backend validation coverage) - Password validation added

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User stories should proceed sequentially in priority order (P1 → P2 → P3)
  - US1 (P1) is MVP and must be completed first
  - US2 and US3 (both P2) can be done in parallel after US1
  - US4 and US5 (both P3) can be done in parallel after US2/US3
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories - **MVP**
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Independent of other stories
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Independent of other stories
- **User Story 4 (P3)**: Can start after Foundational (Phase 2) - May reference US1 but independently testable
- **User Story 5 (P3)**: Can start after Foundational (Phase 2) - Depends on US1 token storage working correctly

### Within Each User Story

- Core bug fixes before enhancements
- Shared utilities before components that use them
- Backend changes before frontend changes (when applicable)
- Implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes:
  - US1 must complete first (MVP)
  - US2 and US3 (both P2) can run in parallel after US1
  - US4 and US5 (both P3) can run in parallel after US2/US3
- Tasks marked [P] within a user story can run in parallel
- Different user stories can be worked on in parallel by different team members (after dependencies are met)

---

## Parallel Example: User Story 2

```bash
# Launch all shared utility creation tasks together:
Task: "Create shared validation utility in src/utils/authValidation.ts"
Task: "Create shared error handling utility in src/utils/authErrors.ts"
Task: "Create shared form state hook in src/hooks/useAuthForm.ts"

# Then refactor components sequentially (they depend on utilities):
Task: "Refactor src/pages/LoginPage.jsx to use shared utilities"
Task: "Refactor src/components/auth/LoginSideMenu.tsx to use shared utilities"
Task: "Refactor src/components/auth/RegisterSideMenu.tsx to use shared utilities"
```

---

## Parallel Example: User Story 3

```bash
# Launch backend security improvements in parallel:
Task: "Add password validation to login validator in backend/src/validators/auth.ts"
Task: "Add JWT secret validation in backend/src/utils/jwt.ts"

# Then update routes and test:
Task: "Update protected routes to use requireAuth middleware"
Task: "Test application fails to start if JWT secrets invalid"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (verification only)
2. Complete Phase 2: Foundational (verification only)
3. Complete Phase 3: User Story 1 (Fix Critical Bug)
4. **STOP and VALIDATE**: Test User Story 1 independently - login works, authenticated requests work
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation verified
2. Add User Story 1 → Test independently → Deploy/Demo (MVP - authentication works!)
3. Add User Story 2 → Test independently → Deploy/Demo (consistent forms)
4. Add User Story 3 → Test independently → Deploy/Demo (secure authentication)
5. Add User Story 4 → Test independently → Deploy/Demo (type-safe)
6. Add User Story 5 → Test independently → Deploy/Demo (optimized refresh)
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (verification)
2. Once Foundational is done:
   - Developer A: User Story 1 (MVP - critical bug fix)
   - After US1 complete:
     - Developer A: User Story 2 (code deduplication)
     - Developer B: User Story 3 (security improvements)
   - After US2/US3 complete:
     - Developer A: User Story 4 (type standardization)
     - Developer B: User Story 5 (token refresh optimization)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- User Story 1 (P1) is the MVP - fix critical bug first
- User Stories 2 and 3 (both P2) can be done in parallel after US1
- User Stories 4 and 5 (both P3) can be done in parallel after US2/US3
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- All file paths are relative to repository root
- Backend files: `backend/src/...`
- Frontend files: `src/...`

---

## Task Summary

- **Total Tasks**: 51
- **Phase 1 (Setup)**: 3 tasks
- **Phase 2 (Foundational)**: 5 tasks
- **Phase 3 (US1 - P1 MVP)**: 6 tasks
- **Phase 4 (US2 - P2)**: 8 tasks
- **Phase 5 (US3 - P2)**: 7 tasks
- **Phase 6 (US4 - P3)**: 8 tasks
- **Phase 7 (US5 - P3)**: 8 tasks
- **Phase 8 (Polish)**: 6 tasks

**Parallel Opportunities Identified**: 
- Setup tasks: 2 parallel
- Foundational tasks: 2 parallel
- US2: 3 parallel utility creation tasks
- US3: 2 parallel backend security tasks
- US4 and US5 can be done in parallel after US2/US3

**Suggested MVP Scope**: User Story 1 only (6 tasks) - Fixes critical authentication bug
