# Implementation Plan: Admin Panel Function Synchronization

**Branch**: `013-admin-sync` | **Date**: 2024-12-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/013-admin-sync/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Synchronize admin panel functions with all backend services and capabilities. Add new admin pages and API endpoints for Payment Management (Stripe, PayPal, Mollie, Terminal), Cart/Wishlist Management, FAQ Management, G2A Advanced Management (Offers, Reservations), Cache Management, and Enhanced User Management (balance, roles, activity). All new functions must follow existing admin panel design patterns and integrate seamlessly with current admin infrastructure.

## Technical Context

**Language/Version**: TypeScript 5.9, Node.js 20+  
**Primary Dependencies**: Express.js, Prisma ORM, PostgreSQL 15+, Redis (optional), React 19, Vite 7, Tailwind CSS 3, shadcn/ui, Framer Motion  
**Storage**: PostgreSQL 15+ (Prisma), Redis (caching, optional)  
**Testing**: Jest, Supertest (integration tests for API endpoints, admin operations)  
**Target Platform**: Web application (Vercel serverless functions)  
**Project Type**: Web application (frontend + backend)  
**Performance Goals**: 
- Admin panel page load: < 2-3 seconds (p95)
- API response time: < 200ms (p95)
- Cache operations: < 10 seconds for invalidation
- 95% of admin operations complete successfully on first attempt
**Constraints**: 
- Must follow existing admin panel design patterns and component library
- All operations require admin role authentication
- Must maintain backward compatibility with existing admin functions
- Cache operations must gracefully degrade if Redis unavailable
**Scale/Scope**: 
- 6 new admin pages/sections
- 17+ new API endpoints
- Integration with 8+ existing backend services
- Support for 4 payment gateways

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
- [x] Code splitting strategy defined for vendor libraries (existing Vite setup)
- [x] Lazy loading planned for routes and heavy components (React.lazy for admin pages)
- [x] Image optimization strategy defined (existing setup)
- [x] Bundle size target: < 1MB gzipped (monitor new admin pages)
- [x] Console/debugger removal in production builds (existing build process)
- [x] React.memo, useMemo, useCallback usage identified where needed (for data tables and lists)

### User Experience Consistency (Frontend features)
- [x] Design system consistency maintained (colors, spacing, typography - use existing admin theme)
- [x] Interactive elements have hover/focus states defined (follow existing admin components)
- [x] Animation approach defined (Framer Motion for transitions, consistent with existing admin)
- [x] Responsive design: Mobile-first approach (admin panel responsive layout)
- [x] Accessibility: ARIA labels, keyboard navigation, semantic HTML (follow existing patterns)

### Code Quality Standards
- [x] ESLint configuration will be followed
- [x] Prettier for code formatting
- [x] Meaningful naming conventions defined (follow existing admin naming patterns)
- [x] Comment strategy for complex logic defined
- [x] No commented-out code in production

### Technology Stack Compliance
- [x] Frontend: React 19 + TypeScript 5.9, Vite 7, Tailwind CSS 3, shadcn/ui, Framer Motion/GSAP
- [x] Backend: Node.js 20+ + Express, PostgreSQL 15+ + Prisma, Full TypeScript
- [x] Redis caching strategy defined (graceful degradation for cache management)
- [x] No unauthorized technology additions

### External API Integration Standards (if applicable)
- [x] External API error handling strategy defined (payment gateways: Stripe, PayPal, Mollie, Terminal)
- [x] API credentials stored in environment variables (payment gateway keys)
- [x] Retry logic with exponential backoff for transient failures (payment gateway operations)
- [x] Appropriate authentication method identified (payment gateway-specific: OAuth2 for some, API keys for others)
- [x] API response caching strategy defined (cache payment method status, not transactions)
- [x] Rate limiting and throttling considered (payment gateway rate limits)
- [x] API contracts and error codes documented (payment gateway error handling)
- [x] Sandbox and production environment support (payment gateway test modes)

### Caching and Performance Strategy (if applicable)
- [x] Redis caching strategy defined (with graceful degradation)
- [x] Cache invalidation strategy for data mutations (explicit invalidation on admin operations)
- [x] Cache key naming patterns defined (consistent patterns: `cache:stats`, `cache:keys:*`)
- [x] OAuth2 token caching with appropriate TTL (not applicable for this feature)
- [x] Database query result caching strategy (cache admin dashboard stats, cache statistics)
- [x] Session data management for guest users (not applicable for admin operations)

### Security Requirements
- [x] API authentication strategy defined (JWT with access/refresh tokens, admin role check)
- [x] JWT secrets meet minimum requirements (32+ characters, different for access/refresh)
- [x] Sensitive data handling plan defined (payment gateway credentials in env vars, never exposed)
- [x] Environment variables usage identified and documented (payment gateway API keys)
- [x] Input validation strategy (client + server, Zod schemas for admin inputs)
- [x] XSS/CSRF protection considered (sanitization, CSRF tokens for state-changing operations)
- [x] External API credentials never committed to version control (payment gateway credentials in env vars)

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
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
│   │   ├── admin.service.ts              # Extend with new admin functions
│   │   ├── payment.service.ts           # Add refund operations
│   │   ├── cart.service.ts              # Add admin read/write operations
│   │   ├── wishlist.service.ts          # Add admin read operations
│   │   ├── faq.service.ts               # Add CRUD operations (if missing)
│   │   ├── g2a-offer.service.ts         # Add admin read operations
│   │   ├── g2a-reservation.service.ts   # Add admin read operations
│   │   ├── g2a-metrics.service.ts       # Already exists, expose to admin
│   │   ├── cache.service.ts             # Add cache statistics and management
│   │   └── user.service.ts              # Add balance and role management
│   ├── controllers/
│   │   └── admin.controller.ts          # Add new admin controllers
│   ├── routes/
│   │   └── admin.routes.ts              # Add new admin routes
│   └── types/
│       └── admin.ts                     # Add new admin types
└── tests/
    └── integration/
        └── admin.test.ts                # Add integration tests for new admin functions

frontend/
├── src/
│   ├── admin/
│   │   ├── pages/
│   │   │   ├── PaymentManagementPage.tsx    # NEW: Payment management
│   │   │   ├── CartManagementPage.tsx       # NEW: Cart management
│   │   │   ├── WishlistManagementPage.tsx   # NEW: Wishlist management
│   │   │   ├── FAQManagementPage.tsx        # NEW: FAQ management
│   │   │   ├── G2AOffersPage.tsx            # NEW: G2A offers
│   │   │   ├── G2AReservationsPage.tsx      # NEW: G2A reservations
│   │   │   ├── CacheManagementPage.tsx      # NEW: Cache management
│   │   │   └── EnhancedUsersPage.tsx        # NEW: Enhanced user management
│   │   ├── components/
│   │   │   └── [Reuse existing DataTable, AdminLayout, AdminSidebar]
│   │   └── services/
│   │       └── adminApi.ts                 # Extend with new API calls
│   └── services/
│       └── api.ts                          # Core API client (existing)
```

**Structure Decision**: Web application structure (frontend + backend). All new admin pages go in `frontend/src/admin/pages/`, following existing admin page patterns. Backend admin service and controllers are extended in existing files. New API endpoints added to `backend/src/routes/admin.routes.ts`. All new functions follow existing admin panel design patterns and component reuse.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations detected. All implementation follows existing patterns and constitution principles.
