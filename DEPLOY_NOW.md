# 🚀 Deploy to Vercel - Quick Guide

> **📖 Для подробной инструкции см. [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)**  
> **📋 Полный справочник переменных окружения: [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md)**

## Step 1: Prepare Git

```bash
# Check what will be committed
git status

# Add all changes
git add .

# Commit
git commit -m "feat: Complete G2A integration, database setup, and CI/CD configuration

- Added G2A webhook handler with signature validation
- Implemented idempotency store for webhooks
- Added G2A metrics and health checks
- Created comprehensive test scripts
- Updated database schema with externalOrderId
- Added CI/CD workflow
- Complete documentation for handoff"

# Push to repository
git push origin 003-design-ui-kit
# or
git push origin main
```

## Step 2: Deploy to Vercel (Monolith - Frontend + Backend)

### Option A: Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/new
   - Or: https://vercel.com/dashboard

2. **Import Project**
   - Click "Add New..." → "Project"
   - Import your GitHub repository
   - Select the repository: `gkeys2`

3. **Configure Project**
   ```
   Framework Preset: Vite
   Root Directory: . (leave empty or put .)
   Build Command: npm run vercel-build
   Output Directory: dist
   Install Command: npm install && cd backend && npm install
   ```

   **Important**: Use `npm run vercel-build` which builds both frontend and backend.

4. **Set Environment Variables**
   - Click "Environment Variables"
   - Add for **Production**, **Preview**, and **Development**:
     
     **Frontend:**
     ```
     Name: VITE_API_BASE_URL
     Value: https://your-vercel-url.vercel.app/api
     ```
     (Use the same Vercel deployment URL for frontend and backend in monolith setup)
     
     **Backend (all required):**
     ```
     DATABASE_URL=postgresql://user:password@host:5432/database
     DIRECT_URL=postgresql://user:password@host:5432/database
     JWT_SECRET=your-strong-secret-key
     JWT_REFRESH_SECRET=your-strong-refresh-secret
     G2A_API_URL=https://api.g2a.com/integration-api/v1
     G2A_API_KEY=your-g2a-key
     G2A_API_HASH=your-g2a-hash
     G2A_ENV=sandbox
     FRONTEND_URL=https://your-vercel-url.vercel.app
     NODE_ENV=production
     ```
     
     Optional:
     ```
     REDIS_URL=redis://...
     PORT=3001
     ```
   - Click "Save"

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)
   - Check build logs for any errors

### Option B: Vercel CLI

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (from project root)
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No (or Yes if re-deploying)
# - Project name: gkeys2
# - Directory: ./
# - Override settings? No

# Deploy to production
vercel --prod
```

## Step 3: Verify Deployment

1. **Check Frontend**
   - Open the Vercel deployment URL
   - Verify homepage loads
   - Check browser console for errors

2. **Test API Connection**
   - Open browser DevTools → Network tab
   - Try to register/login
   - Verify API calls go to correct backend URL

3. **Check Environment Variables**
   - Go to Vercel Dashboard → Project Settings → Environment Variables
   - Verify `VITE_API_BASE_URL` is set correctly

## Step 4: Backend Deployment (Monolith - Already Included)

**Note**: In monolith deployment, backend is already included via `api/index.ts` serverless function.
All `/api/*` requests are automatically handled by the serverless function.

### If You Need Separate Backend Deployment

If you prefer to deploy backend separately:

### Option 1: Vercel Serverless Functions

Create `api/` directory structure (see Vercel docs)

### Option 2: Separate Vercel Project

1. Create new Vercel project for backend
2. Set root directory to `backend/`
3. Configure:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
4. Set all backend environment variables
5. Deploy

### Option 3: Traditional Server

Deploy to any Node.js hosting:
- Railway
- Render
- DigitalOcean App Platform
- AWS/Google Cloud/Azure

## Environment Variables Checklist

### Frontend (Vercel)
- [ ] `VITE_API_BASE_URL` - Must include `/api` suffix
  - For monolith: Use same Vercel URL: `https://your-project.vercel.app/api`

### Backend (Monolith - Same Vercel Project)
- [ ] `DATABASE_URL` - Production PostgreSQL connection string
- [ ] `DIRECT_URL` - Same as DATABASE_URL
- [ ] `JWT_SECRET` - Strong random string (32+ characters)
- [ ] `JWT_REFRESH_SECRET` - Different strong random string
- [ ] `G2A_API_URL` - G2A API URL with `/integration-api/v1`
- [ ] `G2A_API_KEY` - G2A API key
- [ ] `G2A_API_HASH` - G2A API hash
- [ ] `G2A_ENV` - `sandbox` or `live`
- [ ] `FRONTEND_URL` - Frontend Vercel URL for CORS
- [ ] `NODE_ENV` - `production`
- [ ] `REDIS_URL` - Optional, for idempotency store

### Backend (if separate deployment)
- [ ] `DATABASE_URL` - Production PostgreSQL
- [ ] `DIRECT_URL` - Same as DATABASE_URL
- [ ] `JWT_SECRET` - Strong random string
- [ ] `JWT_REFRESH_SECRET` - Different strong random string
- [ ] `G2A_API_URL` - G2A API URL
- [ ] `G2A_API_KEY` - G2A API key
- [ ] `G2A_API_HASH` - G2A API hash
- [ ] `G2A_ENV` - `sandbox` or `live`
- [ ] `FRONTEND_URL` - Frontend URL for CORS
- [ ] `PORT` - Server port
- [ ] `NODE_ENV` - `production`

## Troubleshooting

### Build Fails
- Check Vercel build logs
- Verify Node.js version (should be >=20)
- Check `package.json` has all dependencies
- Verify build command works locally

### 404 Errors
- Check `vercel.json` rewrites configuration
- Verify SPA routing is configured

### API Calls Fail
- Verify `VITE_API_BASE_URL` is set
- Check CORS settings in backend
- Verify backend is accessible
- Check Network tab in browser DevTools

## Post-Deployment

1. **Update Backend CORS** (if backend deployed separately)
   - Set `FRONTEND_URL` in backend to Vercel frontend URL
   - Restart backend

2. **Run Database Migrations** (if backend deployed)
   ```bash
   cd backend
   DATABASE_URL="production-url" npm run prisma:migrate:deploy
   ```

3. **Test Full Flow**
   - Registration
   - Login
   - Browse games
   - Add to cart
   - Create order

## Quick Commands Summary

```bash
# 1. Git
git add .
git commit -m "Deploy: Complete setup"
git push

# 2. Deploy (CLI)
vercel --prod

# 3. Or use Dashboard
# - Import repo → Configure → Deploy
```

## Success Indicators

✅ Frontend loads without errors  
✅ API calls succeed (check Network tab)  
✅ Registration/login works  
✅ No CORS errors  
✅ Health check returns OK  
✅ Build completes successfully in Vercel  

## Need Help?

- See `DEPLOY_CHECKLIST.md` for detailed checklist
- See `FRONTEND_BACKEND_INTEGRATION.md` for integration details
- Check Vercel logs in Dashboard for errors
- Review `backend/QUICK_START.md` for backend setup
