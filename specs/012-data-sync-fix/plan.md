# Implementation Plan: Data Synchronization & System Integration Fix

**Branch**: `012-data-sync-fix` | **Date**: 2024-12-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/012-data-sync-fix/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This feature fixes data synchronization issues between Prisma database, Redis cache, and G2A API to ensure consistent product, order, transaction, cart, and wishlist data across all systems. It also ensures user authentication (registration and login) works correctly and handles cart/wishlist migration from guest sessions to authenticated user accounts.

**Primary Technical Approach**: 
- Fix authentication service to ensure atomic registration and login operations
- Enhance cache invalidation to occur atomically with database mutations
- Improve G2A sync jobs to properly update database and invalidate cache
- Implement atomic cart/wishlist migration during user login
- Add proper error handling and graceful degradation when Redis is unavailable
- Ensure all data mutations use database transactions for consistency

## Technical Context

**Language/Version**: TypeScript 5.9, Node.js 20+  
**Primary Dependencies**: Express.js, Prisma ORM, PostgreSQL 15+, Redis (optional), G2A Integration API  
**Storage**: PostgreSQL 15+ (Prisma), Redis (caching, optional)  
**Testing**: Jest, Supertest (integration tests for API, Redis, database, G2A service)  
**Target Platform**: Node.js server (Vercel serverless functions)  
**Project Type**: Web application (backend-focused feature)  
**Performance Goals**: 
- API response time < 200ms (p95)
- Product sync completes within 30 minutes for full catalog
- Stock checks complete within 5 minutes for all products
- Cache invalidation occurs within 1 second of database mutation (95% of cases)
**Constraints**: 
- Must gracefully degrade when Redis is unavailable
- Must respect G2A API rate limits (600 requests per minute)
- All data mutations must be atomic (database transactions)
- Cache operations must not block critical user flows
**Scale/Scope**: 
- Handle 10,000+ products in G2A catalog
- Support concurrent sync jobs with proper locking
- Process cart/wishlist migration for all users during login
- Maintain cache consistency across multiple serverless instances

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Type Safety First
- [x] All code will be fully typed with TypeScript (no `any` without justification)
- [x] Type definitions will be comprehensive and accurate
- [x] Strict TypeScript configuration will be maintained

### Component-Driven Architecture (Frontend features)
- [ ] Components will be modular, reusable, and self-contained
- [ ] Single responsibility principle will be followed
- [ ] Components will be independently testable
- [ ] Composition over inheritance will be preferred
- [ ] Functional components with hooks will be used

**Note**: This is a backend-focused feature. Frontend components are out of scope.

### Performance Optimization
- [x] Code splitting strategy defined for vendor libraries (N/A - backend only)
- [x] Lazy loading planned for routes and heavy components (N/A - backend only)
- [x] Image optimization strategy defined (N/A - backend only)
- [x] Bundle size target: < 1MB gzipped (N/A - backend only)
- [x] Console/debugger removal in production builds (will use proper logging)
- [x] React.memo, useMemo, useCallback usage identified where needed (N/A - backend only)

### User Experience Consistency (Frontend features)
- [ ] Design system consistency maintained (colors, spacing, typography)
- [ ] Interactive elements have hover/focus states defined
- [ ] Animation approach defined (Framer Motion or GSAP)
- [ ] Responsive design: Mobile-first approach
- [ ] Accessibility: ARIA labels, keyboard navigation, semantic HTML

**Note**: This is a backend-focused feature. Frontend UI changes are out of scope.

### Code Quality Standards
- [x] ESLint configuration will be followed
- [x] Prettier for code formatting
- [x] Meaningful naming conventions defined
- [x] Comment strategy for complex logic defined
- [x] No commented-out code in production

### Technology Stack Compliance
- [x] Frontend: React 19 + TypeScript 5.9, Vite 7, Tailwind CSS 3, shadcn/ui, Framer Motion/GSAP (N/A - backend only)
- [x] Backend: Node.js 20+ + Express, PostgreSQL 15+ + Prisma, Full TypeScript
- [x] Redis caching strategy defined (with graceful degradation)
- [x] No unauthorized technology additions

### External API Integration Standards (if applicable)
- [x] External API error handling strategy defined (G2A API with retry logic)
- [x] API credentials stored in environment variables (G2A_API_KEY, G2A_API_HASH)
- [x] Retry logic with exponential backoff for transient failures (implemented in g2a.service.ts)
- [x] Appropriate authentication method identified (OAuth2 for Import API, hash-based for Export API)
- [x] API response caching strategy defined (OAuth2 tokens cached in Redis)
- [x] Rate limiting and throttling considered (600 req/min, batch processing)
- [x] API contracts and error codes documented (in contracts/g2a-api-contracts.md)
- [x] Sandbox and production environment support (G2A_ENV variable)

### Caching and Performance Strategy (if applicable)
- [x] Redis caching strategy defined (with graceful degradation)
- [x] Cache invalidation strategy for data mutations (explicit invalidation on create/update/delete)
- [x] Cache key naming patterns defined (consistent patterns: `game:{id}`, `user:{id}:cart`, `g2a:sync:progress`)
- [x] OAuth2 token caching with appropriate TTL (cached in Redis with 1 hour TTL)
- [x] Database query result caching strategy (frequently accessed data cached)
- [x] Session data management for guest users (cart/wishlist stored in database with sessionId)

### Security Requirements
- [x] API authentication strategy defined (JWT with access/refresh tokens)
- [x] JWT secrets meet minimum requirements (32+ characters, different for access/refresh)
- [x] Sensitive data handling plan defined (passwords hashed with bcrypt, credentials in env vars)
- [x] Environment variables usage identified and documented (all secrets in env vars)
- [x] Input validation strategy (client + server, Zod schemas)
- [x] XSS/CSRF protection considered (sanitization, CSRF tokens)
- [x] External API credentials never committed to version control (G2A credentials in env vars)

## Project Structure

### Documentation (this feature)

```text
specs/012-data-sync-fix/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── services/
│   │   ├── auth.service.ts              # Fix registration/login atomicity
│   │   ├── cache.service.ts             # Enhance cache invalidation
│   │   ├── g2a.service.ts               # Fix product sync cache invalidation
│   │   ├── cart.service.ts              # Fix cart migration atomicity
│   │   ├── wishlist.service.ts          # Fix wishlist migration atomicity
│   │   ├── order.service.ts             # Ensure transaction recording
│   │   └── g2a-webhook.service.ts       # Fix order status sync
│   ├── jobs/
│   │   └── g2a-sync.job.ts              # Fix sync job cache invalidation
│   ├── controllers/
│   │   └── auth.controller.ts          # Verify auth endpoints work
│   └── middleware/
│       └── auth.ts                      # Verify JWT validation
└── tests/
    ├── integration/
    │   ├── auth.test.ts                 # Test registration/login
    │   ├── cache.test.ts                # Test cache invalidation
    │   ├── g2a-sync.test.ts             # Test G2A sync
    │   └── cart-migration.test.ts       # Test cart/wishlist migration
    └── unit/
        └── [service unit tests]
```

**Structure Decision**: Backend-focused feature. All changes are in `backend/src/services/` and `backend/src/jobs/`. Tests are in `backend/tests/integration/` and `backend/tests/unit/`. No frontend changes required.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations detected. All requirements align with constitution principles.

## Phase 0: Research Complete

**Status**: ✅ Complete  
**Output**: `research.md`

All research questions resolved:
- Q1: Atomic operations for registration/login → Use Prisma transactions
- Q2: Cache invalidation atomicity → Invalidate after database commit
- Q3: Redis unavailability → Graceful degradation with try/catch
- Q4: Cart/wishlist migration → Atomic transaction with validation
- Q5: G2A sync cache invalidation → Invalidate after sync completes
- Q6: Concurrent sync jobs → Distributed locking with Redis

## Phase 1: Design Complete

**Status**: ✅ Complete  
**Outputs**: 
- `data-model.md`: Entity definitions, relationships, validation rules, cache keys
- `contracts/api-contracts.md`: Service contracts for all synchronization operations
- `quickstart.md`: Implementation guide with examples and checklist

**Key Design Decisions**:
- Use Prisma transactions for all multi-step operations
- Cache invalidation after database commits (not before)
- Graceful degradation when Redis unavailable
- Atomic cart/wishlist migration during login
- Pattern-based cache invalidation for related data

## Next Steps

1. **Phase 2**: Generate tasks using `/speckit.tasks`
2. **Phase 3**: Implement changes following tasks
3. **Phase 4**: Write integration tests
4. **Phase 5**: Deploy and monitor
