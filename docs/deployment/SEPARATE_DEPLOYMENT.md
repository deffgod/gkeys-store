# Separate Frontend/Backend Deployment Guide

This guide provides step-by-step instructions for deploying the GKEYS Store application to Vercel using separate deployment (two independent Vercel projects - one for frontend, one for backend).

## Overview

Separate deployment deploys frontend and backend as independent Vercel projects:
- **Frontend Project**: Static files from `dist/` directory
- **Backend Project**: Serverless function at `api/index.ts` wrapping Express application
- **Communication**: Frontend makes API calls to backend project URL

## Prerequisites

- ✅ Vercel account (may require Pro plan for two projects)
- ✅ PostgreSQL database (provisioned and accessible)
- ✅ Git repository connected to Vercel
- ✅ All code changes committed to Git
- ✅ Pre-deployment verification passed (`npm run verify:deployment`)

## Step 1: Pre-Deployment Verification

Before deploying, verify that your application is ready:

```bash
# Run pre-deployment verification
npm run verify:deployment -- --deployment-type=separate-backend
```

**Expected Result**: All critical checks pass. Fix any issues before proceeding.

## Step 2: Create Backend Project

### Option A: Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Select your `gkeys2` repository
4. Click **"Import"**

### Project Configuration

**Framework Preset**: `Other`

**Build Settings**:
- **Root Directory**: `backend`
- **Build Command**: `npm run build:deploy`
- **Output Directory**: (leave empty - not used for serverless)
- **Install Command**: `npm install`

**Important**: 
- Root directory must be `backend` (not `.`)
- Build command runs Prisma migrations automatically

### Environment Variables

Add all backend environment variables:

**Database**:
```
DATABASE_URL=postgresql://user:password@host:5432/database
DIRECT_URL=postgresql://user:password@host:5432/database
```

**JWT Authentication**:
```
JWT_SECRET=your-32-character-minimum-secret-key-here
JWT_REFRESH_SECRET=different-32-character-minimum-secret-key-here
```

**Backend Configuration**:
```
NODE_ENV=production
```

**G2A Integration** (if using):
```
G2A_API_URL=https://api.g2a.com/integration-api/v1
G2A_API_KEY=your-api-key
G2A_API_HASH=your-api-hash
G2A_ENV=sandbox
```

**Redis** (optional):
```
REDIS_URL=redis://host:port
```

**Note**: Do NOT set `VITE_API_BASE_URL` or `FRONTEND_URL` yet - we'll set these after frontend deployment.

### Deploy Backend

1. Click **"Deploy"** in Vercel Dashboard
2. Wait for deployment to complete
3. **Note the deployment URL** (e.g., `https://gkeys2-api.vercel.app`)

## Step 3: Configure Backend CORS

After backend deployment, configure CORS to allow frontend origin:

### Update Environment Variables

1. Go to Backend Project → Settings → Environment Variables
2. Add/Update `FRONTEND_URL`:
   ```
   FRONTEND_URL=https://gkeys2-frontend.vercel.app
   ```
   (Use your actual frontend URL - we'll deploy frontend next)

3. Optionally add `ALLOWED_ORIGINS` for preview URLs:
   ```
   ALLOWED_ORIGINS=https://gkeys2-frontend.vercel.app,https://gkeys2-frontend-git-*.vercel.app
   ```

4. Redeploy backend to apply CORS changes

## Step 4: Create Frontend Project

### Option A: Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Select your `gkeys2` repository (same repository)
4. Click **"Import"**

### Project Configuration

**Framework Preset**: `Vite`

**Build Settings**:
- **Root Directory**: `.` (root directory)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

**Important**: 
- Root directory is `.` (not `frontend` or `src`)
- Only frontend build, no backend build

### Environment Variables

Add frontend environment variables:

**Frontend Configuration**:
```
VITE_API_BASE_URL=https://gkeys2-api.vercel.app/api
```

**Important**: 
- Use the backend deployment URL from Step 2
- Include `/api` suffix in `VITE_API_BASE_URL`
- No backend variables needed in frontend project

### Deploy Frontend

1. Click **"Deploy"** in Vercel Dashboard
2. Wait for deployment to complete
3. **Note the deployment URL** (e.g., `https://gkeys2-frontend.vercel.app`)

## Step 5: Update Backend CORS (If Needed)

If frontend URL differs from what you set in Step 3:

1. Go to Backend Project → Settings → Environment Variables
2. Update `FRONTEND_URL` with actual frontend URL:
   ```
   FRONTEND_URL=https://gkeys2-frontend.vercel.app
   ```
3. Redeploy backend

## Step 6: Post-Deployment Validation

After both deployments complete, validate:

```bash
# Validate separate deployments
npm run validate:deployment -- \
  --url=https://gkeys2-frontend.vercel.app \
  --backend-url=https://gkeys2-api.vercel.app \
  --frontend-url=https://gkeys2-frontend.vercel.app
```

**Expected Result**: All critical checks pass, including CORS validation.

## CORS Configuration

### Understanding CORS for Separate Deployments

When frontend and backend are on different domains, CORS must be explicitly configured:

1. **Backend** must allow frontend origin in CORS middleware
2. **Frontend** must use correct API URL in `VITE_API_BASE_URL`

### Backend CORS Configuration

The backend uses `getAllowedOrigins()` function that checks:

1. `FRONTEND_URL` environment variable
2. `ALLOWED_ORIGINS` environment variable (comma-separated)
3. Vercel preview URLs (automatically allowed if `VERCEL` env var is set)
4. Localhost (in development mode)

**Example Configuration**:
```
FRONTEND_URL=https://gkeys2-frontend.vercel.app
ALLOWED_ORIGINS=https://gkeys2-frontend-git-feature.vercel.app,https://preview.example.com
```

### Frontend API Configuration

Frontend must point to backend URL:

```
VITE_API_BASE_URL=https://gkeys2-api.vercel.app/api
```

**Important**: 
- Include `/api` suffix
- Use HTTPS in production
- No trailing slash

## Verification Checklist

After deployment, verify:

- [ ] Frontend loads: `https://gkeys2-frontend.vercel.app`
- [ ] Backend health check works: `https://gkeys2-api.vercel.app/api/health`
- [ ] Frontend can call backend API (check browser network tab)
- [ ] No CORS errors in browser console
- [ ] Authentication works: Try registering a new user
- [ ] Database connection successful (check health endpoint)

## Troubleshooting

### CORS Errors

**Problem**: Browser console shows CORS errors when frontend calls backend

**Solutions**:
1. Verify `FRONTEND_URL` in backend project matches frontend deployment URL exactly
2. Check `ALLOWED_ORIGINS` includes all needed origins (preview URLs, etc.)
3. Ensure `VITE_API_BASE_URL` in frontend points to backend URL
4. Redeploy backend after updating CORS environment variables
5. Check backend logs for CORS-related errors
6. Verify CORS middleware is configured correctly in `backend/src/index.ts`

**Debug CORS**:
```bash
# Test CORS with curl
curl -H "Origin: https://gkeys2-frontend.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://gkeys2-api.vercel.app/api/health \
     -v
```

### Frontend Can't Reach Backend

**Problem**: Frontend loads but API calls fail

**Solutions**:
1. Verify `VITE_API_BASE_URL` is set correctly: `https://gkeys2-api.vercel.app/api`
2. Check browser network tab for actual request URLs
3. Verify backend is deployed and accessible
4. Check backend function logs in Vercel Dashboard
5. Test backend directly: `curl https://gkeys2-api.vercel.app/api/health`

### Backend Returns 404

**Problem**: Backend API endpoints return 404

**Solutions**:
1. Verify `api/index.ts` exists in backend project
2. Check `vercel.json` in backend project has correct configuration
3. Review backend build logs for errors
4. Verify serverless function is deployed (check Functions tab in Vercel)

### Environment Variables Not Working

**Problem**: Environment variables not available

**Solutions**:
1. Verify variables are set in correct project (backend vs frontend)
2. Redeploy after adding/updating variables
3. Check variable names match exactly (case-sensitive)
4. For frontend, ensure `VITE_` prefix is used
5. Verify variables are set for correct environment (Production/Preview)

### Different Update Frequencies

**Problem**: Need to update one service without affecting the other

**Solutions**:
1. Update frontend: Push changes, frontend redeploys automatically
2. Update backend: Push changes, backend redeploys automatically
3. Each service has independent deployment pipeline
4. No need to coordinate deployments (unlike monolithic)

## Quick Reference

### Essential Commands

```bash
# Pre-deployment verification (backend)
npm run verify:deployment -- --deployment-type=separate-backend

# Post-deployment validation
npm run validate:deployment -- \
  --url=https://gkeys2-frontend.vercel.app \
  --backend-url=https://gkeys2-api.vercel.app \
  --frontend-url=https://gkeys2-frontend.vercel.app

# Local frontend build test
npm run build

# Local backend build test
cd backend && npm run build:deploy
```

### Essential URLs

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Backend Project**: Vercel Dashboard → Backend Project
- **Frontend Project**: Vercel Dashboard → Frontend Project
- **Backend API**: `https://gkeys2-api.vercel.app/api`
- **Frontend App**: `https://gkeys2-frontend.vercel.app`

### Environment Variables Summary

**Backend Project**:
- `DATABASE_URL`, `DIRECT_URL`
- `JWT_SECRET`, `JWT_REFRESH_SECRET`
- `FRONTEND_URL` (for CORS)
- `ALLOWED_ORIGINS` (optional, for additional origins)
- `NODE_ENV=production`
- G2A variables (if using)
- Redis variables (optional)

**Frontend Project**:
- `VITE_API_BASE_URL` (points to backend)

## Migration from Monolithic

If migrating from monolithic to separate deployment:

1. Create backend project (follow Step 2)
2. Deploy backend and note URL
3. Create frontend project (follow Step 4)
4. Set `VITE_API_BASE_URL` to backend URL
5. Configure CORS in backend
6. Deploy frontend
7. Update DNS/custom domains if needed
8. Archive or delete monolithic project

## Next Steps

After successful deployment:

1. Set up custom domains for both projects
2. Configure monitoring and alerts for both projects
3. Set up CI/CD for automatic deployments
4. Review and optimize performance
5. Set up database backups

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [DEPLOYMENT_OPTIONS.md](./DEPLOYMENT_OPTIONS.md) - Compare deployment options
- [MONOLITHIC_DEPLOYMENT.md](./MONOLITHIC_DEPLOYMENT.md) - Alternative deployment option
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues and solutions
