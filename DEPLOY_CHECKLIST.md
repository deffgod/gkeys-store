# Deployment Checklist

## Pre-Deployment

### 1. Code Preparation
- [ ] All changes committed to git
- [ ] Tests passing (`npm run test:endpoints` in backend)
- [ ] Lint passing (`npm run lint` in backend)
- [ ] Build successful (`npm run build` in both frontend and backend)
- [ ] No console errors in browser
- [ ] Environment variables documented

### 2. Git Preparation
```bash
# Check status
git status

# Add all changes
git add .

# Review changes
git status

# Commit
git commit -m "feat: G2A integration, database setup, and deployment preparation"

# Push
git push origin 003-design-ui-kit
# or
git push origin main
```

### 3. Environment Variables Setup

#### Frontend (Vercel Dashboard)
- [ ] `VITE_API_BASE_URL` - Backend API URL with `/api` suffix
  - Example: `https://api.yourdomain.com/api`
  - Or: `https://your-backend.vercel.app/api`

#### Backend (if deploying separately)
- [ ] `DATABASE_URL` - Production PostgreSQL connection string
- [ ] `DIRECT_URL` - Direct database connection (same as DATABASE_URL)
- [ ] `JWT_SECRET` - Strong random secret (32+ characters)
- [ ] `JWT_REFRESH_SECRET` - Different strong random secret
- [ ] `G2A_API_URL` - G2A API URL (with `/integration-api/v1`)
- [ ] `G2A_API_KEY` - G2A API key
- [ ] `G2A_API_HASH` - G2A API hash
- [ ] `G2A_ENV` - `sandbox` or `live`
- [ ] `FRONTEND_URL` - Frontend URL for CORS
- [ ] `PORT` - Server port (default: 3001)
- [ ] `NODE_ENV` - `production`

## Vercel Deployment

### Option 1: Vercel Dashboard

1. **Connect Repository**
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Select project root directory

2. **Configure Project**
   - Framework Preset: **Vite**
   - Root Directory: `.` (project root)
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Set Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add `VITE_API_BASE_URL` for all environments
   - Add other variables if needed

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Check deployment logs for errors

### Option 2: Vercel CLI

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login
vercel login

# Deploy (from project root)
vercel

# Deploy to production
vercel --prod
```

## Post-Deployment

### 1. Verify Deployment
- [ ] Frontend loads at Vercel URL
- [ ] No console errors in browser
- [ ] API calls work (check Network tab)
- [ ] Health check works (if backend deployed)

### 2. Backend Deployment (if separate)

If deploying backend separately:

```bash
cd backend

# Set environment variables in Vercel
# Then deploy
vercel --prod
```

Or use Vercel Serverless Functions:
- Create `api/` directory in project root
- Move backend code or create serverless wrappers
- See Vercel docs for serverless function setup

### 3. Database Setup (Production)

```bash
cd backend

# Run migrations on production database
DATABASE_URL="production-url" npm run prisma:migrate:deploy

# Verify connection
DATABASE_URL="production-url" npm run db:check
```

### 4. Final Checks

- [ ] Frontend accessible
- [ ] Registration works
- [ ] Login works
- [ ] Games load from API
- [ ] Protected routes require auth
- [ ] Health endpoint returns OK
- [ ] No errors in Vercel logs

## Troubleshooting

### Build Fails
- Check Vercel build logs
- Verify Node.js version (>=20)
- Check for missing dependencies
- Verify `package.json` scripts

### API Calls Fail
- Check `VITE_API_BASE_URL` is set correctly
- Verify CORS settings in backend
- Check backend is deployed and accessible
- Verify API routes are correct

### Environment Variables Not Working
- Restart deployment after adding variables
- Check variable names (case-sensitive)
- Verify variables are set for correct environment (Production/Preview)

## Quick Deploy Commands

```bash
# 1. Prepare
git add .
git commit -m "Deploy: G2A integration and database setup"
git push

# 2. Deploy Frontend (Vercel CLI)
vercel --prod

# 3. Or use Vercel Dashboard
# - Import repo
# - Configure
# - Deploy
```

## Documentation References

- `FRONTEND_BACKEND_INTEGRATION.md` - Integration guide
- `backend/DATABASE_SETUP.md` - Database setup
- `backend/QUICK_START.md` - Quick start guide
- See [CHANGELOG.md](CHANGELOG.md) for implementation details
