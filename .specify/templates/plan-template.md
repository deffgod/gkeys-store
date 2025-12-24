# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION]  
**Primary Dependencies**: [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]  
**Storage**: [if applicable, e.g., PostgreSQL, CoreData, files or N/A]  
**Testing**: [e.g., pytest, XCTest, cargo test or NEEDS CLARIFICATION]  
**Target Platform**: [e.g., Linux server, iOS 15+, WASM or NEEDS CLARIFICATION]
**Project Type**: [single/web/mobile - determines source structure]  
**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]  
**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]  
**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Type Safety First
- [ ] All code will be fully typed with TypeScript (no `any` without justification)
- [ ] Type definitions will be comprehensive and accurate
- [ ] Strict TypeScript configuration will be maintained

### Component-Driven Architecture (Frontend features)
- [ ] Components will be modular, reusable, and self-contained
- [ ] Single responsibility principle will be followed
- [ ] Components will be independently testable
- [ ] Composition over inheritance will be preferred
- [ ] Functional components with hooks will be used

### Performance Optimization
- [ ] Code splitting strategy defined for vendor libraries
- [ ] Lazy loading planned for routes and heavy components
- [ ] Image optimization strategy defined
- [ ] Bundle size target: < 1MB gzipped
- [ ] Console/debugger removal in production builds
- [ ] React.memo, useMemo, useCallback usage identified where needed

### User Experience Consistency (Frontend features)
- [ ] Design system consistency maintained (colors, spacing, typography)
- [ ] Interactive elements have hover/focus states defined
- [ ] Animation approach defined (Framer Motion or GSAP)
- [ ] Responsive design: Mobile-first approach
- [ ] Accessibility: ARIA labels, keyboard navigation, semantic HTML

### Code Quality Standards
- [ ] ESLint configuration will be followed
- [ ] Prettier for code formatting
- [ ] Meaningful naming conventions defined
- [ ] Comment strategy for complex logic defined
- [ ] No commented-out code in production

### Technology Stack Compliance
- [ ] Frontend: React 19 + TypeScript 5.9, Vite 7, Tailwind CSS 3, shadcn/ui, Framer Motion/GSAP
- [ ] Backend: Node.js 20+ + Express, PostgreSQL 15+ + Prisma, Full TypeScript
- [ ] Redis caching strategy defined (if applicable)
- [ ] No unauthorized technology additions

### External API Integration Standards (if applicable)
- [ ] External API error handling strategy defined
- [ ] API credentials stored in environment variables
- [ ] Retry logic with exponential backoff for transient failures
- [ ] Appropriate authentication method identified (OAuth2, hash-based, etc.)
- [ ] API response caching strategy defined
- [ ] Rate limiting and throttling considered
- [ ] API contracts and error codes documented
- [ ] Sandbox and production environment support

### Caching and Performance Strategy (if applicable)
- [ ] Redis caching strategy defined (with graceful degradation)
- [ ] Cache invalidation strategy for data mutations
- [ ] Cache key naming patterns defined
- [ ] OAuth2 token caching with appropriate TTL (if applicable)
- [ ] Database query result caching strategy
- [ ] Session data management for guest users

### Security Requirements
- [ ] API authentication strategy defined (JWT with access/refresh tokens)
- [ ] JWT secrets meet minimum requirements (32+ characters, different for access/refresh)
- [ ] Sensitive data handling plan defined
- [ ] Environment variables usage identified and documented
- [ ] Input validation strategy (client + server)
- [ ] XSS/CSRF protection considered
- [ ] External API credentials never committed to version control

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
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
