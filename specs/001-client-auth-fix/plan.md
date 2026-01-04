# Implementation Plan: Fix Client Authentication

**Branch**: `001-client-auth-fix` | **Date**: 2024-12-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-client-auth-fix/spec.md`

## Summary

This feature fixes broken client authentication through Prisma using login, password, and token-based authentication. The implementation will ensure that users can successfully log in with email and password, receive valid JWT tokens, use those tokens to access protected routes, and refresh expired tokens. The fix addresses authentication flow issues, token validation, database connection handling, and error responses.

## Technical Context

**Language/Version**: TypeScript 5.9, Node.js 20+  
**Primary Dependencies**: React 19, Express.js 4.21, Prisma 5.17, jsonwebtoken 9.0, bcrypt 5.1  
**Storage**: PostgreSQL 15+ (via Prisma), localStorage (frontend token storage)  
**Testing**: Vitest 4.0 (backend), React Testing Library (frontend)  
**Target Platform**: Web application (Vercel serverless functions + React SPA)  
**Project Type**: Web application (monorepo with frontend and backend)  
**Performance Goals**: Login response time < 2 seconds, token validation < 100ms, protected route access < 200ms  
**Constraints**: Must maintain backward compatibility with existing authentication, no breaking changes to API contracts, must work in Vercel serverless environment  
**Scale/Scope**: Existing user base, ~8 authentication-related files to fix, 4 user stories to implement

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Type Safety First
- [x] All code will be fully typed with TypeScript (no `any` without justification)
- [x] Type definitions will be comprehensive and accurate
- [x] Strict TypeScript configuration will be maintained

### Component-Driven Architecture (Frontend features)
- [x] Components will be modular, reusable, and self-contained
- [x] Single responsibility principle will be followed
- [x] Components will be independently testable
- [x] Composition over inheritance will be preferred
- [x] Functional components with hooks will be used

### Performance Optimization
- [x] Code splitting strategy defined for vendor libraries (existing)
- [x] Lazy loading planned for routes and heavy components (existing)
- [x] Image optimization strategy defined (existing)
- [x] Bundle size target: < 1MB gzipped (maintained)
- [x] Console/debugger removal in production builds (maintained)
- [x] React.memo, useMemo, useCallback usage identified where needed (token refresh deduplication)

### User Experience Consistency (Frontend features)
- [x] Design system consistency maintained (colors, spacing, typography)
- [x] Interactive elements have hover/focus states defined (existing)
- [x] Animation approach defined (Framer Motion - existing)
- [x] Responsive design: Mobile-first approach (maintained)
- [x] Accessibility: ARIA labels, keyboard navigation, semantic HTML (maintained)

### Code Quality Standards
- [x] ESLint configuration will be followed
- [x] Prettier for code formatting
- [x] Meaningful naming conventions defined
- [x] Comment strategy for complex logic defined
- [x] No commented-out code in production

### Technology Stack Compliance
- [x] Frontend: React 19 + TypeScript 5.9, Vite 7, Tailwind CSS 3, shadcn/ui, Framer Motion/GSAP
- [x] Backend: Node.js 20+ + Express, PostgreSQL 15+ + Prisma, Full TypeScript
- [x] Redis caching strategy defined (optional, graceful degradation)
- [x] No unauthorized technology additions

### External API Integration Standards (if applicable)
- [x] External API error handling strategy defined (existing)
- [x] API credentials stored in environment variables (existing)
- [x] Retry logic with exponential backoff for transient failures (existing)
- [x] Appropriate authentication method identified (JWT - existing)
- [x] API response caching strategy defined (existing)
- [x] Rate limiting and throttling considered (existing)
- [x] API contracts and error codes documented (existing)
- [x] Sandbox and production environment support (existing)

### Caching and Performance Strategy (if applicable)
- [x] Redis caching strategy defined (with graceful degradation)
- [x] Cache invalidation strategy for data mutations (existing)
- [x] Cache key naming patterns defined (existing)
- [x] OAuth2 token caching with appropriate TTL (N/A - using JWT)
- [x] Database query result caching strategy (existing)
- [x] Session data management for guest users (existing)

### Security Requirements
- [x] API authentication strategy defined (JWT with access/refresh tokens)
- [x] JWT secrets meet minimum requirements (32+ characters, different for access/refresh) - **ENFORCED**
- [x] Sensitive data handling plan defined (tokens in localStorage, secrets in env vars)
- [x] Environment variables usage identified and documented
- [x] Input validation strategy (client + server) - **ENFORCED**
- [x] XSS/CSRF protection considered (existing)
- [x] External API credentials never committed to version control (existing)

## Project Structure

### Documentation (this feature)

```text
specs/001-client-auth-fix/
├── plan.md              # This file (/speckit.plan command output)
├── spec.md              # Feature specification
├── checklists/
│   └── requirements.md  # Specification quality checklist
└── tasks.md             # Implementation task breakdown (to be created)
```

### Code Changes

**Backend Files**:
- `backend/src/services/auth.service.ts` - Fix login, register, refreshToken functions
- `backend/src/middleware/auth.ts` - Fix token validation and error handling
- `backend/src/controllers/auth.controller.ts` - Ensure proper error responses
- `backend/src/utils/jwt.ts` - Verify JWT secret validation
- `backend/src/config/database.ts` - Ensure Prisma connection error handling
- `backend/src/validators/auth.ts` - Verify password validation

**Frontend Files**:
- `src/services/api.ts` - Verify token storage and retrieval
- `src/context/AuthContext.tsx` - Fix token persistence and refresh logic
- `src/services/authApi.ts` - Ensure proper error handling

## Phase 0: Research & Analysis

### Task 0.1: Identify Authentication Issues

**Objective**: Diagnose current authentication failures

**Steps**:
1. Review current authentication flow end-to-end
2. Check Prisma database connection status
3. Verify JWT secret configuration
4. Test login endpoint with valid credentials
5. Test token validation on protected routes
6. Check token refresh flow
7. Verify error handling and messages

**Deliverables**:
- List of identified issues
- Error logs and stack traces
- Database connection status
- JWT configuration status

**Files to Review**:
- `backend/src/services/auth.service.ts`
- `backend/src/middleware/auth.ts`
- `backend/src/utils/jwt.ts`
- `backend/src/config/database.ts`
- `src/services/api.ts`
- `src/context/AuthContext.tsx`

### Task 0.2: Verify Prisma Schema

**Objective**: Ensure User model has required fields

**Steps**:
1. Check `backend/prisma/schema.prisma` for User model
2. Verify `email` field exists and is unique
3. Verify `passwordHash` field exists
4. Verify `LoginHistory` model exists
5. Check for any missing indexes

**Deliverables**:
- Confirmation of schema correctness
- List of any required migrations

**Files to Review**:
- `backend/prisma/schema.prisma`

### Task 0.3: Check Environment Variables

**Objective**: Verify required environment variables are configured

**Steps**:
1. Check for `JWT_SECRET` and `JWT_REFRESH_SECRET`
2. Verify secrets are at least 32 characters
3. Verify secrets are different
4. Check `DATABASE_URL` or `DIRECT_URL` configuration
5. Verify environment variable loading

**Deliverables**:
- List of missing or invalid environment variables
- Configuration recommendations

**Files to Review**:
- `.env.example` (if exists)
- `backend/src/utils/jwt.ts`
- `backend/src/config/database.ts`

## Phase 1: Design

### Task 1.1: Design Authentication Flow Fixes

**Objective**: Design fixes for identified authentication issues

**Key Design Decisions**:

1. **Token Storage Consistency**
   - Ensure `api.ts` and `AuthContext.tsx` use same localStorage keys
   - Verify token is stored correctly after login
   - Ensure token is loaded on app initialization

2. **Database Connection Error Handling**
   - Add proper error handling in auth service
   - Return user-friendly error messages
   - Log detailed errors for debugging

3. **Token Validation Improvements**
   - Ensure `requireAuth` middleware properly validates tokens
   - Add user existence check in token refresh
   - Improve error messages for expired/invalid tokens

4. **Password Verification**
   - Verify bcrypt comparison works correctly
   - Ensure email normalization (lowercase) is consistent
   - Add proper error messages for invalid credentials

5. **Login History Recording**
   - Ensure failed login attempts are recorded
   - Handle database errors gracefully (non-blocking)

**Deliverables**:
- Design document with fix strategies
- Error handling flow diagrams
- Token validation flow

### Task 1.2: Design Error Response Format

**Objective**: Standardize error responses for authentication failures

**Design**:
- Consistent error format: `{ success: false, error: { message: string } }`
- User-friendly messages without exposing system details
- Proper HTTP status codes (401 for auth failures, 400 for validation)
- No information leakage about whether email exists

**Deliverables**:
- Error response format specification
- Error message catalog

## Phase 2: Implementation

### Task 2.1: Fix Backend Authentication Service

**File**: `backend/src/services/auth.service.ts`

**Changes**:

1. **Fix `login` function**:
   - Ensure email is normalized to lowercase before query
   - Add try-catch around database operations
   - Ensure password comparison works correctly
   - Record failed login attempts in login history
   - Return consistent error messages

2. **Fix `register` function**:
   - Ensure email is normalized to lowercase
   - Verify password hashing works
   - Handle duplicate email errors properly
   - Return proper error messages

3. **Fix `refreshToken` function**:
   - Verify user exists in database before generating new tokens
   - Handle invalid refresh token errors
   - Return proper error messages

**Test Cases**:
- Login with valid credentials
- Login with invalid email
- Login with invalid password
- Register with new email
- Register with existing email
- Refresh token with valid token
- Refresh token with invalid token
- Refresh token when user deleted

### Task 2.2: Fix Authentication Middleware

**File**: `backend/src/middleware/auth.ts`

**Changes**:

1. **Fix `requireAuth` middleware**:
   - Improve error handling for missing tokens
   - Add better error messages for expired tokens
   - Ensure user information is properly attached to request
   - Handle JWT verification errors gracefully

2. **Fix `authenticate` middleware** (optional auth):
   - Ensure it doesn't fail on missing tokens
   - Properly handle invalid tokens without breaking flow

**Test Cases**:
- Request with valid token
- Request with expired token
- Request with invalid token
- Request with missing token
- Request with malformed Authorization header

### Task 2.3: Verify JWT Configuration

**File**: `backend/src/utils/jwt.ts`

**Changes**:

1. **Verify JWT secret validation**:
   - Ensure secrets are validated on module load
   - Verify minimum length requirement (32 characters)
   - Ensure access and refresh secrets are different
   - Add clear error messages if validation fails

2. **Verify token generation**:
   - Ensure tokens include required payload (userId, email, role)
   - Verify expiration times are set correctly
   - Test token generation with valid payload

**Test Cases**:
- Token generation with valid payload
- Token verification with valid token
- Token verification with expired token
- Token verification with invalid signature
- Module initialization with missing secrets
- Module initialization with short secrets
- Module initialization with identical secrets

### Task 2.4: Fix Database Connection Handling

**File**: `backend/src/config/database.ts`

**Changes**:

1. **Improve error handling**:
   - Ensure Prisma client is properly initialized
   - Add connection retry logic if needed
   - Provide clear error messages for connection failures
   - Handle Vercel/serverless environment properly

2. **Verify connection status**:
   - Ensure `initializeDatabase` is called
   - Add health check endpoint if needed
   - Log connection status appropriately

**Test Cases**:
- Database connection with valid URL
- Database connection with invalid URL
- Database connection timeout
- Prisma client initialization
- Connection in Vercel environment

### Task 2.5: Fix Frontend Token Management

**File**: `src/services/api.ts`

**Changes**:

1. **Verify token storage**:
   - Ensure `setToken` stores token correctly (already fixed)
   - Verify `loadToken` loads from localStorage correctly
   - Ensure token is included in Authorization header
   - Verify token key matches AuthContext

2. **Fix token persistence**:
   - Ensure token is saved to localStorage after login
   - Verify token is loaded on app initialization
   - Handle missing token gracefully

**Test Cases**:
- Token storage after login
- Token retrieval on app load
- Token in API requests
- Token removal on logout

### Task 2.6: Fix Frontend Auth Context

**File**: `src/context/AuthContext.tsx`

**Changes**:

1. **Fix token refresh logic**:
   - Ensure refresh token is used correctly
   - Handle refresh failures properly
   - Update tokens in localStorage after refresh
   - Prevent duplicate refresh requests

2. **Fix authentication check**:
   - Verify token on app initialization
   - Handle expired tokens correctly
   - Clear auth state on token failure
   - Ensure user data is loaded correctly

3. **Fix login flow**:
   - Ensure tokens are stored correctly
   - Update API client with new token
   - Handle login errors properly
   - Clear previous auth state on new login

**Test Cases**:
- Login with valid credentials
- Login with invalid credentials
- Token refresh on expiration
- Token refresh failure
- App initialization with valid token
- App initialization with expired token
- App initialization with no token
- Logout clears all auth data

### Task 2.7: Verify Password Validation

**File**: `backend/src/validators/auth.ts`

**Changes**:

1. **Verify login validator**:
   - Ensure password validation is present (already exists)
   - Verify email normalization
   - Test validation rules match registration

2. **Verify register validator**:
   - Ensure all required validations are present
   - Test password complexity rules
   - Verify email validation

**Test Cases**:
- Login with valid email and password format
- Login with invalid email format
- Login with short password
- Login with weak password
- Register with valid data
- Register with invalid email
- Register with weak password

## Phase 3: Testing

### Task 3.1: Backend Unit Tests

**Files**: `backend/src/__tests__/services/auth.service.test.ts`

**Test Cases**:
- Login with valid credentials returns tokens
- Login with invalid email returns error
- Login with invalid password returns error
- Register creates user and returns tokens
- Register with existing email returns error
- Refresh token with valid token returns new tokens
- Refresh token with invalid token returns error
- Refresh token when user deleted returns error
- Login records success in login history
- Failed login records failure in login history

### Task 3.2: Backend Integration Tests

**Files**: `backend/src/__tests__/integration/auth.test.ts`

**Test Cases**:
- POST /auth/login with valid credentials
- POST /auth/login with invalid credentials
- POST /auth/register with new user
- POST /auth/register with existing email
- POST /auth/refresh with valid refresh token
- GET /auth/me with valid access token
- GET /auth/me with expired token
- GET /auth/me with invalid token
- GET /auth/me without token

### Task 3.3: Frontend Unit Tests

**Files**: `src/__tests__/context/AuthContext.test.tsx`

**Test Cases**:
- Login function stores tokens correctly
- Login function updates API client
- Token refresh updates tokens
- Token refresh handles errors
- Logout clears all auth data
- CheckAuth loads token from localStorage
- CheckAuth validates token with backend

### Task 3.4: End-to-End Testing

**Manual Test Scenarios**:

1. **Successful Login Flow**:
   - Enter valid email and password
   - Submit login form
   - Verify tokens are received
   - Verify user can access protected pages
   - Verify tokens persist on page refresh

2. **Failed Login Flow**:
   - Enter invalid credentials
   - Submit login form
   - Verify error message is shown
   - Verify no tokens are stored
   - Verify user cannot access protected pages

3. **Token Refresh Flow**:
   - Login successfully
   - Wait for token expiration (or manually expire)
   - Make request to protected endpoint
   - Verify token is automatically refreshed
   - Verify new tokens are stored

4. **Registration Flow**:
   - Enter new user details
   - Submit registration form
   - Verify user is created
   - Verify tokens are received
   - Verify user can immediately access protected pages

## Phase 4: Documentation

### Task 4.1: Update API Documentation

**Files**: `docs/api/paths/auth/`

**Updates**:
- Document login endpoint with examples
- Document registration endpoint
- Document token refresh endpoint
- Document error responses
- Document authentication requirements

### Task 4.2: Update Environment Variables Documentation

**Files**: `DOCUMENTATION.md` or `.env.example`

**Updates**:
- Document required JWT secrets
- Document minimum secret length
- Document database URL requirements
- Provide setup instructions

## Implementation Checklist

### Phase 0: Research
- [ ] Task 0.1: Identify authentication issues
- [ ] Task 0.2: Verify Prisma schema
- [ ] Task 0.3: Check environment variables

### Phase 1: Design
- [ ] Task 1.1: Design authentication flow fixes
- [ ] Task 1.2: Design error response format

### Phase 2: Implementation
- [ ] Task 2.1: Fix backend authentication service
- [ ] Task 2.2: Fix authentication middleware
- [ ] Task 2.3: Verify JWT configuration
- [ ] Task 2.4: Fix database connection handling
- [ ] Task 2.5: Fix frontend token management
- [ ] Task 2.6: Fix frontend auth context
- [ ] Task 2.7: Verify password validation

### Phase 3: Testing
- [ ] Task 3.1: Backend unit tests
- [ ] Task 3.2: Backend integration tests
- [ ] Task 3.3: Frontend unit tests
- [ ] Task 3.4: End-to-end testing

### Phase 4: Documentation
- [ ] Task 4.1: Update API documentation
- [ ] Task 4.2: Update environment variables documentation

## Risk Assessment

### High Risk
- **Database connection failures**: Could break all authentication. Mitigation: Add proper error handling and retry logic.
- **JWT secret misconfiguration**: Could break token validation. Mitigation: Validate secrets on startup, fail fast with clear errors.

### Medium Risk
- **Token storage inconsistencies**: Could cause auth state issues. Mitigation: Ensure consistent localStorage keys across files.
- **Token refresh failures**: Could force users to re-login. Mitigation: Add proper error handling and user feedback.

### Low Risk
- **Password validation edge cases**: Minor UX impact. Mitigation: Test various password formats.
- **Error message clarity**: Minor UX impact. Mitigation: Use user-friendly error messages.

## Success Metrics

- [ ] 100% of valid login attempts succeed
- [ ] 100% of invalid login attempts are rejected with appropriate errors
- [ ] Login response time < 2 seconds (p95)
- [ ] Token validation < 100ms (p95)
- [ ] Protected route access < 200ms (p95)
- [ ] Token refresh success rate > 99%
- [ ] All authentication errors provide clear, user-friendly messages
- [ ] Zero authentication-related security vulnerabilities

## Notes

- Focus on fixing broken functionality, not adding new features
- Maintain backward compatibility with existing API contracts
- Ensure all error messages are user-friendly and don't expose system details
- Test thoroughly in both development and production-like environments
- Verify Prisma connection works in Vercel serverless environment
