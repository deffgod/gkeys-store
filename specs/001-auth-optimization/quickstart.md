# Quick Start: Authentication System Optimization

**Feature**: Authentication System Optimization  
**Date**: 2025-01-03  
**Phase**: 1 - Design

## Overview

This feature optimizes the authentication system by fixing critical bugs, removing code duplication, improving security, standardizing types, and optimizing token refresh logic.

## Critical Issues to Fix

### 1. Token Storage Bug (P1 - Critical)

**Location**: `src/services/api.ts`

**Issue**: The `setToken` method incorrectly constructs a URL instead of storing the token.

**Current Code** (BROKEN):
```typescript
public setToken(token: string | null) {
  this.token = `${API_BASE_URL}/auth/login` + '?email=' + email + '&token= ' + token;
}
```

**Fix**:
```typescript
public setToken(token: string | null) {
  this.token = token;
}
```

**Impact**: This bug prevents all authenticated API requests from working.

### 2. Missing Password Validation on Login (P2 - Security)

**Location**: `backend/src/validators/auth.ts`

**Issue**: Login validator doesn't validate password complexity.

**Current Code**:
```typescript
export const loginValidator: ValidationChain[] = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  // Missing password validation!
];
```

**Fix**: Add password validation matching registration requirements.

### 3. JWT Secret Validation (P2 - Security)

**Location**: `backend/src/utils/jwt.ts`

**Issue**: Default secrets in code, no validation on startup.

**Fix**: Validate secrets at module initialization, fail fast if invalid.

### 4. Code Duplication (P2 - Maintainability)

**Locations**: 
- `src/pages/LoginPage.jsx`
- `src/components/auth/LoginSideMenu.tsx`
- `src/components/auth/RegisterSideMenu.tsx`

**Issue**: Duplicate validation, error handling, and form logic.

**Fix**: Extract shared logic to custom hooks and utilities.

### 5. Type Inconsistencies (P3 - Type Safety)

**Locations**: Multiple files with different User type definitions.

**Issue**: `name` vs `nickname`, different optional fields.

**Fix**: Standardize types with clear transformation logic.

### 6. Token Refresh Optimization (P3 - Performance)

**Location**: `src/context/AuthContext.tsx`

**Issue**: No deduplication of concurrent refresh requests.

**Fix**: Implement singleton refresh promise pattern.

## Implementation Checklist

### Phase 1: Critical Bug Fixes (P1)

- [ ] Fix `setToken` method in `src/services/api.ts`
- [ ] Test token storage and retrieval
- [ ] Verify authenticated requests work

### Phase 2: Security Improvements (P2)

- [ ] Add password validation to login validator
- [ ] Add JWT secret validation on startup
- [ ] Update authentication middleware to use `requireAuth` for protected routes
- [ ] Test security improvements

### Phase 3: Code Refactoring (P2)

- [ ] Extract shared validation logic to utilities
- [ ] Extract shared error handling to utilities
- [ ] Refactor LoginPage to use shared components
- [ ] Refactor LoginSideMenu to use shared logic
- [ ] Refactor RegisterSideMenu to use shared logic
- [ ] Test all authentication forms

### Phase 4: Type Standardization (P3)

- [ ] Document type transformation logic
- [ ] Update AuthContext to use consistent types
- [ ] Update authApi to use consistent types
- [ ] Fix type mismatches across codebase
- [ ] Test type consistency

### Phase 5: Token Refresh Optimization (P3)

- [ ] Implement refresh promise deduplication
- [ ] Add refresh queue for concurrent requests
- [ ] Test token refresh under load
- [ ] Verify no duplicate refresh requests

## Testing Strategy

### Unit Tests

- Token storage and retrieval
- Password validation
- JWT secret validation
- Type transformations
- Token refresh deduplication

### Integration Tests

- Login flow with token storage
- Registration flow
- Token refresh flow
- Protected route access
- Concurrent refresh requests

### Manual Testing

- Login from LoginPage
- Login from LoginSideMenu
- Registration flow
- Token persistence across page refresh
- Token refresh before expiration
- Error handling for invalid credentials

## Environment Variables

Ensure these are set:

```bash
# Backend
JWT_SECRET=<32+ character secret>
JWT_REFRESH_SECRET=<32+ character different secret>
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Frontend
VITE_API_BASE_URL=https://gkeys2.vercel.app/api
```

## Rollback Plan

If issues occur:

1. Revert `setToken` fix (but keep the bug fix - it's critical)
2. Revert password validation (but keep security improvements)
3. Revert type changes (but keep standardization)
4. Revert refresh optimization (but keep deduplication)

All changes are backward compatible except the token storage fix, which is required for functionality.

## Success Metrics

- [ ] All authenticated API requests succeed (100% success rate)
- [ ] Token refresh works without duplicate requests (100% deduplication)
- [ ] Code duplication reduced by 50%+
- [ ] Zero type mismatches between frontend and backend
- [ ] All security validations pass
- [ ] Application fails to start if JWT secrets invalid

## Next Steps

1. Review this quickstart guide
2. Review API contracts in `contracts/api-contracts.md`
3. Review data model in `data-model.md`
4. Proceed to task breakdown with `/speckit.tasks`
