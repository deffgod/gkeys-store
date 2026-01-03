# Research: Vercel Deployment Options

**Feature**: Vercel Deployment Preparation  
**Date**: 2025-01-03  
**Phase**: 0 - Research

## Research Questions

### 1. Deployment Architecture Options

**Question**: What are the viable deployment architecture options for deploying a React frontend and Express backend on Vercel?

**Findings**:

#### Option A: Monolithic Deployment (Current)
- **Architecture**: Single Vercel project containing both frontend static files and backend serverless function
- **Structure**: 
  - Frontend: `dist/` directory with static files
  - Backend: `api/index.ts` serverless function wrapping Express app
  - Routing: `vercel.json` rewrites `/api/*` to serverless function, all other routes to `index.html`
- **Pros**:
  - Simple setup and configuration
  - Single project to manage
  - Lower operational overhead
  - Cost-effective (single project)
  - Automatic CORS handling (same domain)
  - Easier environment variable management
  - Single deployment pipeline
- **Cons**:
  - Frontend and backend scale together (cannot scale independently)
  - Single point of deployment (changes to one affect both)
  - Limited flexibility for different scaling needs
  - All serverless function invocations count against single project limits
- **Use Cases**:
  - Initial deployment and MVP
  - Small to medium scale applications
  - Projects where simplicity is prioritized
  - Cost-conscious deployments
  - Projects with tightly coupled frontend/backend

**Decision**: Keep as primary/default option with comprehensive documentation

#### Option B: Separate Frontend/Backend Deployment
- **Architecture**: Two independent Vercel projects - one for frontend (static site), one for backend (serverless API)
- **Structure**:
  - Frontend Project: Only `dist/` static files, no `api/` directory
  - Backend Project: Only `api/index.ts` serverless function, no frontend build
  - Communication: Frontend makes API calls to backend project URL
- **Pros**:
  - Independent scaling of frontend and backend
  - Independent deployment pipelines
  - Can update one service without affecting the other
  - Better resource allocation (separate function limits)
  - Clear separation of concerns
  - Different teams can manage different projects
- **Cons**:
  - More complex setup (two projects to manage)
  - CORS configuration required (different domains)
  - Two sets of environment variables to manage
  - Higher operational overhead
  - Potential for configuration drift between projects
  - More complex troubleshooting (two deployment logs)
- **Use Cases**:
  - Large scale applications with different scaling needs
  - Projects with separate frontend/backend teams
  - Applications requiring independent scaling
  - Projects where frontend and backend have different update frequencies
  - Enterprise deployments with strict separation requirements

**Decision**: Document as alternative option with step-by-step setup instructions

### 2. Pre-Deployment Verification Requirements

**Question**: What checks are essential before attempting deployment to ensure success?

**Findings**:

#### Critical Verification Checks:
1. **Build Verification**:
   - Frontend builds successfully (`npm run build`)
   - Backend compiles without TypeScript errors (`npm run build`)
   - Prisma Client generates successfully (`prisma generate`)
   - Build artifacts are created (`dist/`, `backend/dist/`)

2. **Environment Variables Validation**:
   - All required variables are present
   - Variables are correctly formatted (URLs, connection strings)
   - No placeholder values remain
   - Secrets meet minimum requirements (JWT secrets 32+ chars)

3. **Database Connectivity**:
   - Database connection string is valid
   - Database is accessible from Vercel network
   - Prisma migrations can be applied
   - Database schema matches Prisma schema

4. **Test Suite**:
   - Critical unit tests pass
   - Integration tests pass (if applicable)
   - No blocking test failures

5. **Configuration Files**:
   - `vercel.json` is correctly configured
   - Build commands are correct
   - Output directories match configuration

**Decision**: Implement comprehensive verification script that checks all critical requirements

### 3. Post-Deployment Validation Strategy

**Question**: What validation checks confirm successful deployment?

**Findings**:

#### Essential Validation Checks:
1. **Frontend Accessibility**:
   - Main page loads without errors
   - Static assets are accessible
   - No console errors in browser

2. **API Endpoint Availability**:
   - Health check endpoint responds (`/api/health`)
   - Authentication endpoints work (`/api/auth/login`, `/api/auth/register`)
   - Core API endpoints respond correctly

3. **Service Connectivity**:
   - Database connection successful
   - Redis connection (if configured)
   - G2A API connectivity (if configured)

4. **CORS Configuration**:
   - Frontend can make API requests without CORS errors
   - CORS headers are correctly set

**Decision**: Create validation script that tests all critical endpoints and services

### 4. CORS Configuration for Separate Deployments

**Question**: How should CORS be configured when frontend and backend are on different domains?

**Findings**:

#### CORS Configuration Requirements:
- Backend must explicitly allow frontend origin in CORS middleware
- `FRONTEND_URL` environment variable must point to frontend deployment URL
- `ALLOWED_ORIGINS` can be used for additional origins (preview URLs, localhost for development)
- CORS middleware already supports multiple origins via `getAllowedOrigins()` function
- Credentials must be enabled for authenticated requests (`credentials: true`)

**Decision**: Document CORS configuration steps for separate deployment option, leveraging existing CORS infrastructure

### 5. Environment Variable Management

**Question**: How should environment variables be managed for different deployment options?

**Findings**:

#### Monolithic Deployment:
- Single set of environment variables in one Vercel project
- Frontend variables prefixed with `VITE_`
- Backend variables without prefix
- All variables accessible to both frontend build and backend runtime

#### Separate Deployment:
- Frontend project: Only `VITE_API_BASE_URL` pointing to backend URL
- Backend project: All backend variables (DATABASE_URL, JWT_SECRET, etc.)
- `FRONTEND_URL` in backend project must point to frontend deployment URL
- `ALLOWED_ORIGINS` in backend project for CORS configuration

**Decision**: Document environment variable requirements for each deployment option separately

### 6. Build Process Optimization

**Question**: What optimizations are needed for Vercel build process?

**Findings**:

#### Current Build Process:
- `vercel-build` command runs: `npm run build && npm run build:backend:deploy`
- Frontend build: Vite production build → `dist/`
- Backend build: Prisma generate + migrate deploy + TypeScript compile → `backend/dist/`
- Migrations are applied automatically during build

#### Optimizations:
- Prisma migrations should be applied before TypeScript compilation
- Build should fail fast if critical steps fail (database connection, migrations)
- Build logs should clearly indicate progress and any issues

**Decision**: Current build process is optimal, document it clearly

### 7. Troubleshooting Common Issues

**Question**: What are the most common deployment issues and their solutions?

**Findings**:

#### Common Issues:
1. **Build Failures**:
   - Missing dependencies → Ensure `package.json` dependencies are correct
   - TypeScript errors → Fix or allow with `--noEmitOnError false`
   - Prisma generation failures → Check `DATABASE_URL` is accessible

2. **Runtime Errors**:
   - Database connection failures → Verify `DATABASE_URL` and network accessibility
   - Missing environment variables → Check all required variables are set
   - CORS errors → Verify `FRONTEND_URL` and `ALLOWED_ORIGINS` configuration

3. **API Routing Issues**:
   - 404 errors on API endpoints → Verify `vercel.json` rewrites configuration
   - Serverless function not found → Check `api/index.ts` exists and exports handler

**Decision**: Create comprehensive troubleshooting guide with solutions for each common issue

## Decisions Summary

| Research Area | Decision | Rationale |
|--------------|----------|-----------|
| Deployment Options | Document both monolithic and separate options | Provides flexibility for different use cases and scales |
| Pre-Deployment Verification | Comprehensive script checking builds, env vars, database, tests | Ensures deployment readiness before attempting deployment |
| Post-Deployment Validation | Automated validation script testing endpoints and services | Confirms successful deployment and identifies issues quickly |
| CORS Configuration | Leverage existing `getAllowedOrigins()` infrastructure | Reuses proven CORS handling, minimal changes needed |
| Environment Variables | Separate documentation for each deployment option | Clear guidance prevents configuration errors |
| Build Process | Document current optimized process | Current process is well-designed, needs clear documentation |
| Troubleshooting | Comprehensive guide with common issues and solutions | Reduces time to resolution for deployment problems |

## Alternatives Considered

### Alternative 1: Single Deployment Option Only
- **Rejected**: Limits flexibility for projects with different scaling needs
- **Rationale**: Some projects benefit from separate deployments, should be documented

### Alternative 2: Manual Verification Only
- **Rejected**: Error-prone and time-consuming
- **Rationale**: Automated verification reduces human error and speeds up process

### Alternative 3: No Post-Deployment Validation
- **Rejected**: Deployment success not guaranteed without validation
- **Rationale**: Automated validation confirms deployment success and identifies issues immediately

## Implementation Notes

- All research findings align with existing project infrastructure
- No major architectural changes required
- Focus on documentation and tooling rather than code changes
- Leverage existing CORS, build, and configuration infrastructure
