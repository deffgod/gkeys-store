# Vercel Monolith Deployment Guide

> **📖 Для подробной инструкции см. [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)**  
> **📋 Полный справочник переменных окружения: [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md)**

## Overview

This project is configured for **monolith deployment** on Vercel:
- **Frontend**: Static files from `dist/` (Vite build)
- **Backend**: Serverless function via `api/index.ts`

All `/api/*` requests are automatically routed to the serverless function, which uses the Express backend.

## Architecture

```
Vercel Deployment
├── Frontend (dist/)
│   └── All routes except /api/* → index.html (SPA)
│
└── Backend (api/index.ts)
    └── All /api/* routes → Express app (serverless function)
```

## Pre-Deployment Checklist

### 1. Code Preparation
- [x] Serverless wrapper created: `api/index.ts`
- [x] Backend exports Express app conditionally
- [x] `vercel.json` configured for serverless functions
- [x] `package.json` has `vercel-build` script
- [x] All backend dependencies in `backend/package.json`

### 2. Build Configuration

**Root `package.json`**:
```json
{
  "scripts": {
    "vercel-build": "npm run build:all"
  }
}
```

**Backend `package.json`**:
- Must have `build` script: `tsc --noEmitOnError false`
- All dependencies listed

### 3. Environment Variables (Vercel Dashboard)

**Required for Backend**:
```
DATABASE_URL=postgresql://user:password@host:5432/database
DIRECT_URL=postgresql://user:password@host:5432/database
JWT_SECRET=strong-random-secret-32-chars-minimum
JWT_REFRESH_SECRET=different-strong-random-secret
G2A_API_URL=https://api.g2a.com/integration-api/v1
G2A_API_KEY=your-g2a-api-key
G2A_API_HASH=your-g2a-api-hash
G2A_ENV=sandbox
FRONTEND_URL=https://your-project.vercel.app
NODE_ENV=production
```

**Required for Frontend**:
```
VITE_API_BASE_URL=https://your-project.vercel.app/api
```

**Optional**:
```
REDIS_URL=redis://host:6379
PORT=3001
```

## Deployment Steps

### Step 1: Git Commit & Push

```bash
git add .
git commit -m "feat: Configure monolith deployment for Vercel

- Added serverless wrapper (api/index.ts)
- Updated backend for serverless compatibility
- Configured vercel.json for serverless functions
- Updated build scripts for monolith deployment"

git push origin main
```

### Step 2: Deploy to Vercel

#### Via Dashboard:

1. Go to https://vercel.com/new
2. Import GitHub repository: `gkeys2`
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `.`
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install && cd backend && npm install`
4. Add all environment variables (see checklist above)
5. Click "Deploy"

#### Via CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Step 3: Post-Deployment

1. **Run Database Migrations**:
   ```bash
   # Connect to production database
   cd backend
   DATABASE_URL="production-url" npm run prisma:migrate:deploy
   ```

2. **Verify Deployment**:
   - Frontend: `https://your-project.vercel.app`
   - Health: `https://your-project.vercel.app/api/health`
   - API: `https://your-project.vercel.app/api/auth/register`

## How It Works

### Request Flow

1. **Frontend Request** (`/games`):
   - Vercel serves `dist/index.html` (SPA routing)
   - React Router handles client-side routing

2. **API Request** (`/api/games`):
   - Vercel routes to `api/index.ts` serverless function
   - Serverless function imports Express app from `backend/src/index.ts`
   - Express app handles the request
   - Response returned to client

### Path Handling

- Vercel strips `/api` prefix before calling serverless function
- Serverless wrapper adds `/api` back to the path
- Express app receives paths with `/api` prefix (as expected)
- Routes work correctly: `/api/auth`, `/api/games`, etc.

## Troubleshooting

### Build Fails

**Error**: "Cannot find module '../backend/src/index.js'"

**Solution**: 
- Ensure backend is built: `cd backend && npm run build`
- Check `backend/dist/index.js` exists
- Verify `vercel-build` script runs `build:all`

### API Returns 404

**Error**: API endpoints return 404

**Solution**:
- Check `vercel.json` rewrites configuration
- Verify `api/index.ts` exists
- Check serverless function logs in Vercel Dashboard
- Verify Express routes are registered correctly

### Database Connection Fails

**Error**: Database connection errors in logs

**Solution**:
- Verify `DATABASE_URL` is set in Vercel environment variables
- Check database is accessible from Vercel (IP whitelist if needed)
- Verify connection string format is correct
- Check `DIRECT_URL` matches `DATABASE_URL`

### CORS Errors

**Error**: CORS errors in browser console

**Solution**:
- Set `FRONTEND_URL` in Vercel to your frontend URL
- Verify CORS middleware in `backend/src/index.ts`
- Check `origin` in CORS config matches frontend URL

## File Structure

```
gkeys2/
├── api/
│   └── index.ts          # Serverless function wrapper
├── backend/
│   ├── src/
│   │   └── index.ts      # Express app (exports app, conditional listen)
│   └── package.json
├── dist/                 # Frontend build output
├── vercel.json           # Vercel configuration
└── package.json          # Root package.json with vercel-build
```

## Environment Variables Reference

See `DEPLOY_NOW.md` for complete environment variables checklist.

## Next Steps After Deployment

1. Test all endpoints: `/api/health`, `/api/auth/register`, etc.
2. Verify frontend can connect to backend
3. Test full user flow: registration → login → browse → cart → order
4. Monitor Vercel function logs for errors
5. Set up database backups
6. Configure custom domain (optional)

## Support

- See `DEPLOY_CHECKLIST.md` for detailed checklist
- See `FRONTEND_BACKEND_INTEGRATION.md` for integration details
- Check Vercel Dashboard → Functions → Logs for errors
- Review `backend/QUICK_START.md` for backend setup
