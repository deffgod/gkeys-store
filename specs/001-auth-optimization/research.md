# Research: Authentication System Optimization

**Feature**: Authentication System Optimization  
**Date**: 2025-01-03  
**Phase**: 0 - Research

## Research Tasks

### 1. Token Refresh Deduplication Pattern

**Task**: Research best practices for preventing duplicate token refresh requests when multiple components attempt refresh simultaneously.

**Findings**:
- **Decision**: Implement a singleton refresh promise pattern with request queuing
- **Rationale**: 
  - When multiple components detect token expiration simultaneously, they should share a single refresh request
  - A pending refresh promise can be reused by all concurrent requests
  - Failed refresh attempts should clear the promise to allow retry
  - This prevents race conditions and reduces server load
- **Alternatives Considered**:
  - Debouncing: Too complex for this use case, may delay legitimate refreshes
  - Mutex/lock: Overkill for JavaScript single-threaded execution
  - Request cancellation: Not needed since we want to share the result

**Implementation Pattern**:
```typescript
// Pseudo-code pattern
let refreshPromise: Promise<TokenResponse> | null = null;

async function refreshToken() {
  if (refreshPromise) {
    return refreshPromise; // Reuse existing request
  }
  
  refreshPromise = authApi.refreshToken(...);
  try {
    const result = await refreshPromise;
    return result;
  } finally {
    refreshPromise = null; // Clear after completion
  }
}
```

### 2. Type Standardization Approach

**Task**: Research approaches for sharing type definitions between frontend and backend in a monorepo.

**Findings**:
- **Decision**: Create shared type definitions in a common location with clear ownership
- **Rationale**:
  - Backend types should be the source of truth for API contracts
  - Frontend should transform backend types to match UI needs
  - Use TypeScript's type utilities (Pick, Omit, Partial) for transformations
  - Document transformation logic clearly
- **Alternatives Considered**:
  - Shared package: Overkill for current project size, adds build complexity
  - Code generation: Too complex for this optimization task
  - Duplicate types with sync: Current approach, causes inconsistencies

**Implementation Pattern**:
- Backend defines `AuthResponse` in `backend/src/types/auth.ts`
- Frontend defines `User` interface that transforms backend response
- Use transformation functions with clear type mappings
- Document field mappings (e.g., `nickname` → `name`)

### 3. Authentication Middleware Pattern

**Task**: Research best practices for Express authentication middleware that properly enforces authorization.

**Findings**:
- **Decision**: Use separate middleware functions for optional vs required authentication
- **Rationale**:
  - `authenticate` middleware should be optional (allows guest access)
  - `requireAuth` middleware should be required (returns 401 if no token)
  - Clear separation prevents security vulnerabilities
  - Current implementation has `authenticate` that's too permissive
- **Alternatives Considered**:
  - Single middleware with flags: Less clear, harder to maintain
  - Decorator pattern: Not idiomatic for Express
  - Route-level configuration: More complex, current approach is fine

**Implementation Pattern**:
- Keep `authenticate` for optional auth (sets `req.user` if token valid, continues if not)
- Use `requireAuth` for protected routes (returns 401 if no valid token)
- Document which routes use which middleware
- Ensure all protected routes use `requireAuth`

### 4. JWT Secret Validation on Startup

**Task**: Research best practices for validating JWT secrets at application startup.

**Findings**:
- **Decision**: Validate secrets in JWT utility module initialization, fail fast if invalid
- **Rationale**:
  - Secrets must be at least 32 characters (security best practice)
  - Access and refresh tokens must use different secrets
  - Application should not start with invalid configuration
  - Clear error messages help deployment debugging
- **Alternatives Considered**:
  - Runtime validation: Too late, may cause issues in production
  - Warning only: Security risk, secrets must be valid
  - Environment variable defaults: Security risk, should fail if missing

**Implementation Pattern**:
- Validate in `backend/src/utils/jwt.ts` module initialization
- Check `JWT_SECRET` and `JWT_REFRESH_SECRET` environment variables
- Verify minimum length (32 characters)
- Verify secrets are different
- Throw descriptive error if validation fails
- Document required environment variables

### 5. Password Validation Consistency

**Task**: Research password validation requirements for login vs registration.

**Findings**:
- **Decision**: Backend must validate password on login, even if frontend validates
- **Rationale**:
  - Frontend validation can be bypassed
  - Backend is the security boundary
  - Login validator currently missing password validation
  - Should match registration requirements for consistency
- **Alternatives Considered**:
  - Different rules for login: Confusing for users, security risk
  - No backend validation: Security vulnerability
  - Complex rules: Current registration rules are appropriate

**Implementation Pattern**:
- Add password validation to `loginValidator` in `backend/src/validators/auth.ts`
- Use same validation rules as registration (minimum length, complexity)
- Return clear error messages
- Frontend validation remains for UX but backend is authoritative

### 6. Token Storage Bug Analysis

**Task**: Analyze the critical bug in `api.ts` `setToken` method.

**Findings**:
- **Decision**: Fix `setToken` to store token string directly, not construct URL
- **Rationale**:
  - Current implementation: `this.token = \`${API_BASE_URL}/auth/login?email=${email}&token=${token}\``
  - This is clearly wrong - constructs URL instead of storing token
  - Token should be stored as-is for use in Authorization header
  - Bug prevents all authenticated requests from working
- **Root Cause**: Likely copy-paste error or incomplete refactoring
- **Fix**: Simply store `this.token = token` (or `null` if clearing)

**Implementation Pattern**:
```typescript
public setToken(token: string | null) {
  this.token = token; // Simple fix - store token directly
}
```

## Summary

All research tasks completed. No NEEDS CLARIFICATION items remain. All technical decisions have clear rationale and implementation patterns identified. Ready to proceed to Phase 1 (Design & Contracts).
