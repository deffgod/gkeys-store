# Monolithic Deployment Guide

This guide provides step-by-step instructions for deploying the GKEYS Store application to Vercel using monolithic deployment (single project containing both frontend and backend).

## Overview

Monolithic deployment deploys both frontend and backend in a single Vercel project:
- **Frontend**: Static files served from `dist/` directory
- **Backend**: Serverless function at `api/index.ts` wrapping Express application
- **Routing**: All `/api/*` requests routed to serverless function, all other routes to `index.html`

## Prerequisites

- ✅ Vercel account (free tier available)
- ✅ PostgreSQL database (provisioned and accessible)
- ✅ Git repository connected to Vercel
- ✅ All code changes committed to Git
- ✅ Pre-deployment verification passed (`npm run verify:deployment`)

## Step 1: Pre-Deployment Verification

Before deploying, verify that your application is ready:

```bash
# Run pre-deployment verification
npm run verify:deployment

# Or with specific deployment type
npm run verify:deployment -- --deployment-type=monolithic
```

**Expected Result**: All critical checks pass. Fix any issues before proceeding.

## Step 2: Configure Vercel Project

### Option A: Vercel Dashboard (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Select your `gkeys2` repository
4. Click **"Import"**

### Option B: Vercel CLI

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Link project to Vercel
vercel link
```

## Step 3: Project Configuration

In Vercel project settings, configure:

### Framework Preset
- **Framework**: `Vite`

### Build Settings
- **Build Command**: `npm run vercel-build`
- **Output Directory**: `dist`
- **Install Command**: `npm install && cd backend && npm install`
- **Root Directory**: `.` (leave empty or use `.`)

### Important Notes
- The `vercel-build` command automatically:
  - Builds frontend (`npm run build`)
  - Builds backend (`npm run build:backend:deploy`)
  - Applies Prisma migrations (`prisma migrate deploy`)
  - Generates Prisma Client

## Step 4: Environment Variables

Configure all required environment variables in Vercel Dashboard → Settings → Environment Variables:

### Required Variables

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

**Frontend**:
```
VITE_API_BASE_URL=https://your-project.vercel.app/api
```

**Backend**:
```
FRONTEND_URL=https://your-project.vercel.app
NODE_ENV=production
```

### Optional Variables

**G2A Integration** (if using):
```
G2A_API_URL=https://api.g2a.com/integration-api/v1
G2A_API_KEY=your-api-key
G2A_API_HASH=your-api-hash
G2A_ENV=sandbox
```

**Redis** (optional, for caching):
```
REDIS_URL=redis://host:port
# or
REDIS_GKEYS_REDIS_URL=redis://host:port
```

**CORS** (for local development with deployed backend):
```
ALLOWED_ORIGINS=http://localhost:5173
```

### Environment Variable Setup

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add each variable:
   - **Key**: Variable name (e.g., `DATABASE_URL`)
   - **Value**: Variable value
   - **Environments**: Select `Production`, `Preview`, and `Development` as needed
3. Click **"Save"**

**Important**: 
- Set `VITE_API_BASE_URL` to your actual deployment URL after first deployment
- For first deployment, you can use a placeholder, then update after deployment completes
- All secrets must meet minimum requirements (JWT secrets: 32+ characters)

## Step 5: Deploy

### Option A: Automatic Deployment (Recommended)

1. Push to your main branch:
   ```bash
   git push origin main
   ```
2. Vercel automatically deploys on push to main branch

### Option B: Manual Deployment via Dashboard

1. Go to Vercel Dashboard → Your Project
2. Click **"Deployments"** tab
3. Click **"Redeploy"** on latest deployment
4. Or click **"Deploy"** button

### Option C: Manual Deployment via CLI

```bash
# Deploy to production
vercel --prod

# Or deploy to preview
vercel
```

## Step 6: Post-Deployment Validation

After deployment completes, validate the deployment:

```bash
# Validate deployment (replace with your actual URL)
npm run validate:deployment -- --url=https://your-project.vercel.app
```

**Expected Result**: All critical checks pass. Review any warnings.

## Step 7: Update Environment Variables (If Needed)

If you used a placeholder for `VITE_API_BASE_URL`:

1. Go to Vercel Dashboard → Settings → Environment Variables
2. Update `VITE_API_BASE_URL` with actual deployment URL:
   ```
   VITE_API_BASE_URL=https://your-project.vercel.app/api
   ```
3. Redeploy to apply changes

## Verification Checklist

After deployment, verify:

- [ ] Frontend loads: `https://your-project.vercel.app`
- [ ] Health check works: `https://your-project.vercel.app/api/health`
- [ ] API endpoints respond: `https://your-project.vercel.app/api/games`
- [ ] Authentication works: Try registering a new user
- [ ] Database connection successful (check health endpoint)
- [ ] No CORS errors in browser console

## Troubleshooting

### Build Fails

**Problem**: Build process fails during deployment

**Solutions**:
1. Check build logs in Vercel Dashboard → Deployments → [Deployment] → Build Logs
2. Verify Node.js version (must be 20+)
3. Check that all dependencies are in `package.json`
4. Verify `DATABASE_URL` is accessible (migrations run during build)
5. Check for TypeScript errors: `cd backend && npm run build`

### API Returns 404

**Problem**: API endpoints return 404 errors

**Solutions**:
1. Verify `vercel.json` exists and has correct rewrites:
   ```json
   {
     "rewrites": [
       {
         "source": "/api/(.*)",
         "destination": "/api/index"
       }
     ]
   }
   ```
2. Check that `api/index.ts` exists and exports handler
3. Review serverless function logs in Vercel Dashboard → Functions → Logs

### Database Connection Fails

**Problem**: Database connection errors in production

**Solutions**:
1. Verify `DATABASE_URL` format: `postgresql://user:pass@host:5432/db`
2. Check database is accessible from Vercel network (IP whitelist if needed)
3. Ensure `DIRECT_URL` is set (same as `DATABASE_URL` if not using Prisma Accelerate)
4. Check database logs for connection attempts
5. Verify Prisma migrations were applied (check build logs)

### Frontend Can't Reach API

**Problem**: Frontend loads but API calls fail

**Solutions**:
1. Verify `VITE_API_BASE_URL` is set correctly: `https://your-project.vercel.app/api`
2. Check browser console for CORS errors
3. Verify `FRONTEND_URL` matches deployment URL
4. Check network tab for actual API requests and responses

### Environment Variables Not Working

**Problem**: Environment variables not available in application

**Solutions**:
1. Verify variables are set in correct environment (Production/Preview/Development)
2. Redeploy after adding/updating variables
3. Check variable names match exactly (case-sensitive)
4. For frontend variables, ensure `VITE_` prefix is used
5. Verify variables are not in `.env.local` (only local development)

## Quick Reference

### Essential Commands

```bash
# Pre-deployment verification
npm run verify:deployment

# Post-deployment validation
npm run validate:deployment -- --url=https://your-project.vercel.app

# Local build test
npm run vercel-build

# Check environment variables
npm run check:env
```

### Essential URLs

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Project Settings**: Vercel Dashboard → Your Project → Settings
- **Environment Variables**: Settings → Environment Variables
- **Deployment Logs**: Deployments → [Deployment] → Build Logs
- **Function Logs**: Functions → [Function] → Logs

### Essential Files

- `vercel.json` - Vercel configuration
- `api/index.ts` - Serverless function entry point
- `package.json` - Build scripts and dependencies
- `backend/package.json` - Backend dependencies

## Next Steps

After successful deployment:

1. Set up custom domain (optional)
2. Configure monitoring and alerts
3. Set up CI/CD for automatic deployments
4. Review and optimize performance
5. Set up database backups

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [DEPLOYMENT_OPTIONS.md](./DEPLOYMENT_OPTIONS.md) - Compare deployment options
- [SEPARATE_DEPLOYMENT.md](./SEPARATE_DEPLOYMENT.md) - Alternative deployment option
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues and solutions
