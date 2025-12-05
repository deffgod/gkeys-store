<!--
  ============================================================================
  SYNC IMPACT REPORT
  ============================================================================
  Version: 1.0.0 → 1.0.0 (no change - validation only)
  Date: 2024-12-05
  Action: Validation against GKEYS_README.md
  
  Modified Principles: None
  Added Sections: None
  Removed Sections: None
  
  Templates Status:
  ✅ .specify/templates/plan-template.md - References constitution appropriately
  ✅ .specify/templates/spec-template.md - No direct constitution references
  ✅ .specify/templates/tasks-template.md - No direct constitution references
  ✅ .specify/templates/checklist-template.md - No direct constitution references
  
  Follow-up TODOs: None
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

## Technology Stack Constraints

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 3 + inline styles for complex components
- **UI Library**: shadcn/ui components (40+ available)
- **Animation**: Framer Motion 12, GSAP 3
- **Routing**: React Router 7
- **State Management**: React hooks (useState, useContext, useReducer)

### Backend
- **Runtime**: Node.js with Express
- **Database**: PostgreSQL with Prisma ORM
- **Type Safety**: Full TypeScript coverage

### Design System
- **Primary Color**: `#00FF66` (Bright Green)
- **Accent Color**: `#b4ff00` (Neon Green for effects)
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
- E2E tests for critical user flows (optional but recommended)

### Code Review Checklist
- [ ] TypeScript types are correct
- [ ] No console.log or debugger in production code
- [ ] Components are properly memoized if needed
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] Accessibility requirements met
- [ ] Performance impact considered
- [ ] Code follows project conventions

## Performance Standards

### Bundle Size Targets
- Main bundle: < 600KB (gzipped < 150KB)
- Total initial load: < 1MB (gzipped < 250KB)
- Vendor chunks: Optimized and split appropriately

### Runtime Performance
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Lighthouse Performance Score: > 90

## Security Requirements

- All API calls must include proper authentication
- Sensitive data must not be exposed in client-side code
- Environment variables for API keys and secrets
- Input validation on both client and server
- XSS protection: Sanitize user inputs
- CSRF protection for state-changing operations

## Deployment

### Production Build
- Optimized bundle with code splitting
- Minified and compressed assets
- Source maps disabled in production
- Environment variables properly configured
- Database migrations applied

### Vercel Configuration
- Automatic deployments from main branch
- Preview deployments for PRs
- Environment variables configured in Vercel dashboard

## Governance

This constitution supersedes all other development practices. All code must comply with these principles. When exceptions are needed, they must be:
1. Documented with clear justification
2. Approved through code review
3. Added as amendments to this constitution if permanent

**Version**: 1.0.0 | **Ratified**: 2024-12-05 | **Last Amended**: 2024-12-05
