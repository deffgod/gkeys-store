<!--
  ============================================================================
  SYNC IMPACT REPORT
  ============================================================================
  Version Change: 1.0.1 → 1.1.0 (MINOR)
  Bump Rationale: Added new principles for G2A integration, Redis caching, and updated deployment strategy. Expanded backend technology stack and security requirements.
  
  Modified Sections:
  - Added Principle VI: External API Integration Standards
  - Added Principle VII: Caching and Performance Strategy
  - Updated Technology Stack Constraints: Added Redis, G2A API integration details
  - Updated Security Requirements: Added JWT authentication specifics
  - Updated Deployment: Added monolith deployment strategy details
  
  Templates Updated:
  ✅ .specify/templates/plan-template.md - Added check gates for External API Integration Standards and Caching Strategy principles
  
  Templates Reviewed (no changes needed):
  ✅ .specify/templates/spec-template.md - No constitution references to update
  ✅ .specify/templates/tasks-template.md - No constitution references to update
  ✅ .specify/templates/checklist-template.md - No constitution references to update
  ✅ .specify/templates/agent-file-template.md - No constitution references to update
  
  Follow-up TODOs:
  - None
  ============================================================================
-->

# GKEYS Store Constitution

## Core Principles

### I. Type Safety First
All code must be fully typed with TypeScript. No `any` types without explicit justification. Type definitions must be comprehensive and accurate. Use strict TypeScript configuration.

### II. Component-Driven Architecture
- React components must be modular, reusable, and self-contained
- Follow single responsibility principle
- Components should be independently testable
- Use composition over inheritance
- Prefer functional components with hooks

### III. Performance Optimization
- Code splitting for vendor libraries (React, UI, Animation)
- Lazy loading for routes and heavy components
- Image optimization and lazy loading
- Minimize bundle size - target < 1MB gzipped
- Remove console/debugger in production builds
- Use React.memo, useMemo, useCallback where appropriate

### IV. User Experience Consistency
- Maintain consistent design system (colors, spacing, typography)
- All interactive elements must have hover/focus states
- Smooth animations using Framer Motion or GSAP
- Responsive design: Mobile-first approach
- Accessibility: ARIA labels, keyboard navigation, semantic HTML

### V. Code Quality Standards
- ESLint configuration must be followed
- Prettier for code formatting
- Meaningful variable and function names
- Comments for complex logic only
- No commented-out code in production

### VI. External API Integration Standards
- All external API integrations must have proper error handling
- API credentials must be stored in environment variables
- Implement retry logic with exponential backoff for transient failures
- Use appropriate authentication methods (OAuth2, hash-based, etc.)
- Cache API responses when appropriate to reduce external calls
- Monitor API rate limits and implement throttling
- Document API contracts and error codes
- Support both sandbox and production environments

### VII. Caching and Performance Strategy
- Use Redis for caching when available (graceful degradation if unavailable)
- Cache invalidation must be explicit and timely
- Cache keys must follow consistent naming patterns
- OAuth2 tokens must be cached with appropriate TTL
- Database query results should be cached for frequently accessed data
- Cache invalidation must occur on data mutations (create, update, delete)
- Session data for guest users must be properly managed

## Technology Stack Constraints

### Frontend
- **Framework**: React 19 with TypeScript 5.9
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 3 + inline styles for complex components
- **UI Library**: shadcn/ui components (40+ available)
- **Animation**: Framer Motion 12, GSAP 3
- **Routing**: React Router 7
- **State Management**: React hooks (useState, useContext, useReducer)

### Backend
- **Runtime**: Node.js 20+ with Express.js
- **Database**: PostgreSQL 15+ with Prisma ORM
- **Caching**: Redis (optional but recommended for production)
- **Type Safety**: Full TypeScript coverage
- **Authentication**: JWT with access and refresh tokens
- **External APIs**: G2A Integration API (Import and Export)

### Design System
- **Primary Color**: `#00FF66` (Bright Green)
- **Accent Color**: `#00C8C2` (Cyan-Turquoise for effects)
- **Background**: `#0D0D0D` (Dark)
- **Surface**: `#1A1A1A` / `#2A2A2A`
- **Text Hierarchy**: `#FFFFFF` / `#999999` / `#666666`

## Development Workflow

### Feature Development
1. Create feature branch from main
2. Write specification using `/speckit.specify`
3. Create implementation plan with `/speckit.plan`
4. Generate tasks with `/speckit.tasks`
5. Implement with `/speckit.implement`
6. Test thoroughly before merge
7. Code review required

### Testing Requirements
- Unit tests for utility functions
- Component tests for complex UI logic
- Integration tests for API endpoints
- Integration tests for Redis, database, and G2A service
- E2E tests for critical user flows (optional but recommended)

### Code Review Checklist
- [ ] TypeScript types are correct
- [ ] No console.log or debugger in production code
- [ ] Components are properly memoized if needed
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] Accessibility requirements met
- [ ] Performance impact considered
- [ ] Code follows project conventions
- [ ] External API error handling is robust
- [ ] Cache invalidation is implemented for data mutations
- [ ] Environment variables are properly documented

## Performance Standards

### Bundle Size Targets
- Main bundle: < 600KB (gzipped < 150KB)
- Total initial load: < 1MB (gzipped < 250KB)
- Vendor chunks: Optimized and split appropriately

### Runtime Performance
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Lighthouse Performance Score: > 90

### Backend Performance
- API response time: < 200ms (p95)
- Database query optimization required
- Redis caching for frequently accessed data
- G2A API calls must respect rate limits (600 req/min)

## Security Requirements

- All API calls must include proper authentication
- JWT tokens must use strong secrets (minimum 32 characters)
- JWT access tokens and refresh tokens must use different secrets
- Sensitive data must not be exposed in client-side code
- Environment variables for API keys and secrets
- Input validation on both client and server
- XSS protection: Sanitize user inputs
- CSRF protection for state-changing operations
- G2A API credentials must never be committed to version control
- Redis connections must use authentication in production
- Database connections must use SSL in production

## Deployment

### Production Build
- Optimized bundle with code splitting
- Minified and compressed assets
- Source maps disabled in production
- Environment variables properly configured
- Database migrations applied

### Vercel Monolith Deployment
- Frontend and backend deployed as single Vercel project
- Frontend: Static files from `dist/`
- Backend: Serverless functions via `api/index.ts`
- All `/api/*` requests automatically routed to serverless function
- Automatic deployments from main branch
- Preview deployments for PRs
- Environment variables configured in Vercel dashboard
- Database migrations must be run manually after first deployment

### Environment Variables Management
- All required variables must be documented in DOCUMENTATION.md
- Variables must be set for Production, Preview, and Development environments
- Frontend variables must be prefixed with `VITE_`
- Backend variables must not be exposed to frontend
- Secrets must be rotated regularly in production

## Governance

This constitution supersedes all other development practices. All code must comply with these principles. When exceptions are needed, they must be:
1. Documented with clear justification
2. Approved through code review
3. Added as amendments to this constitution if permanent

**Version**: 1.1.0 | **Ratified**: 2024-12-05 | **Last Amended**: 2024-12-23
