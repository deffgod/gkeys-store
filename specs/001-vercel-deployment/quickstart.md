# Quick Start: Vercel Deployment Preparation

**Feature**: Vercel Deployment Preparation  
**Date**: 2025-01-03

## Overview

This guide provides a quick start for preparing and deploying the GKEYS Store application to Vercel. It covers both monolithic and separate deployment options.

## Prerequisites

- ✅ Vercel account (free tier available)
- ✅ PostgreSQL database (provisioned and accessible)
- ✅ Git repository connected to Vercel
- ✅ Node.js 20+ installed locally
- ✅ All code changes committed to Git

## Quick Start: Monolithic Deployment (Recommended for Most Cases)

### Step 1: Pre-Deployment Verification

Run the verification script to check deployment readiness:

```bash
# From project root
npm run check:env
cd backend
npm run build
cd ..
npm run build
```

**Expected Result**: All checks pass, builds succeed

### Step 2: Configure Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/new)
2. Import your Git repository
3. Configure project settings:
   - **Framework**: Vite
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install && cd backend && npm install`

### Step 3: Set Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

**Required Variables**:
```
DATABASE_URL=postgresql://user:pass@host:5432/db
DIRECT_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your-32-char-minimum-secret-key
JWT_REFRESH_SECRET=different-32-char-minimum-secret-key
FRONTEND_URL=https://your-project.vercel.app
NODE_ENV=production
VITE_API_BASE_URL=https://your-project.vercel.app/api
```

**G2A Variables** (if using G2A):
```
G2A_API_URL=https://api.g2a.com/integration-api/v1
G2A_API_KEY=your-api-key
G2A_API_HASH=your-api-hash
G2A_ENV=sandbox
```

### Step 4: Deploy

Click "Deploy" in Vercel Dashboard or push to main branch for automatic deployment.

### Step 5: Post-Deployment Validation

After deployment completes:

1. Check frontend: `https://your-project.vercel.app`
2. Check health endpoint: `https://your-project.vercel.app/api/health`
3. Test authentication: Try registering a new user

**Expected Result**: All checks pass, application is functional

## Quick Start: Separate Frontend/Backend Deployment

### Step 1: Create Backend Project

1. Create new Vercel project for backend
2. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm run build:deploy`
   - **Output Directory**: (leave empty, not used for serverless)
   - **Framework**: Other

3. Set backend environment variables (same as monolithic, except no `VITE_API_BASE_URL`)

4. Deploy backend project → Note the URL (e.g., `https://gkeys2-api.vercel.app`)

### Step 2: Create Frontend Project

1. Create new Vercel project for frontend
2. Configure:
   - **Framework**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Root Directory**: `.` (root)

3. Set frontend environment variables:
```
VITE_API_BASE_URL=https://gkeys2-api.vercel.app/api
```

4. Update backend CORS configuration:
   - In backend project, set `FRONTEND_URL=https://gkeys2-frontend.vercel.app`
   - Optionally set `ALLOWED_ORIGINS` for preview URLs

5. Deploy frontend project

### Step 3: Validation

1. Check frontend: `https://gkeys2-frontend.vercel.app`
2. Check backend API: `https://gkeys2-api.vercel.app/api/health`
3. Verify CORS: Frontend should successfully call backend API

## Deployment Option Comparison

| Aspect | Monolithic | Separate |
|--------|-----------|----------|
| **Setup Complexity** | Low | Medium |
| **Operational Overhead** | Low | Medium |
| **Scaling** | Together | Independent |
| **Cost** | Lower | Higher (2 projects) |
| **CORS Configuration** | Automatic | Manual |
| **Best For** | MVP, Small-Medium scale | Large scale, Team separation |

## Troubleshooting

### Build Fails
- Check Node.js version (must be 20+)
- Verify all dependencies are in `package.json`
- Check build logs in Vercel Dashboard

### API Returns 404
- Verify `vercel.json` rewrites configuration
- Check `api/index.ts` exists and exports handler
- Review serverless function logs in Vercel Dashboard

### CORS Errors
- Verify `FRONTEND_URL` is set correctly
- Check `ALLOWED_ORIGINS` for additional origins
- Ensure CORS middleware is configured in backend

### Database Connection Fails
- Verify `DATABASE_URL` format is correct
- Check database is accessible from Vercel network
- Ensure `DIRECT_URL` is set (same as `DATABASE_URL` if not using Prisma Accelerate)

## Next Steps

- Review [DEPLOYMENT_GUIDE.md](../../../DEPLOYMENT_GUIDE.md) for detailed instructions
- Check [ENVIRONMENT_VARIABLES.md](../../../ENVIRONMENT_VARIABLES.md) for complete variable list
- See [spec.md](./spec.md) for full feature requirements
