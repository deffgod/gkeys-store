# Deployment Checklist - Vercel & GitHub

## ✅ Pre-Deployment Checklist

### 1. Code Cleanup
- [x] Removed temporary fix files (*FIX.md)
- [x] Removed temporary reports (*REPORT.md)
- [x] Removed duplicate guides
- [x] Kept essential documentation (README.md, DOCUMENTATION.md, ENVIRONMENT_VARIABLES.md)

### 2. Build Configuration
- [x] `vercel.json` configured for monolithic deployment
- [x] `package.json` has `vercel-build` script
- [x] Backend build script configured
- [x] Frontend build script configured

### 3. Environment Variables
- [ ] Set all required environment variables in Vercel dashboard:
  - `DATABASE_URL` - PostgreSQL connection string
  - `DIRECT_URL` - Direct database connection (if using Prisma Accelerate)
  - `JWT_SECRET` - Minimum 32 characters
  - `JWT_REFRESH_SECRET` - Minimum 32 characters, different from JWT_SECRET
  - `FRONTEND_URL` - Your Vercel frontend URL
  - `NODE_ENV=production`
  - Optional: `REDIS_URL`, `G2A_API_KEY`, `G2A_API_HASH`, etc.

### 4. Database
- [ ] Database migrations applied (handled by `build:deploy` script)
- [ ] Prisma Client generated (handled by build script)
- [ ] Database connection tested

### 5. Git Repository
- [ ] All changes committed
- [ ] `.gitignore` properly configured
- [ ] No sensitive data in repository
- [ ] README.md updated if needed

## 🚀 Deployment Steps

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### Step 2: Deploy to Vercel

#### Option A: Via Vercel Dashboard
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure:
   - Framework Preset: Vite
   - Root Directory: `.` (root)
   - Build Command: `npm run vercel-build`
   - Output Directory: `dist`
5. Add all environment variables
6. Deploy

#### Option B: Via Vercel CLI
```bash
npm i -g vercel
vercel login
vercel --prod
```

### Step 3: Verify Deployment
- [ ] Frontend loads correctly
- [ ] API endpoints respond (`/api/health`)
- [ ] Authentication works (login/register)
- [ ] Database connections work
- [ ] No console errors

## 📝 Post-Deployment

### Verify Environment Variables
Check that all required variables are set in Vercel dashboard:
- Settings → Environment Variables

### Monitor Logs
- Vercel Dashboard → Deployments → View Function Logs
- Check for any errors or warnings

### Test Critical Features
- [ ] User registration
- [ ] User login
- [ ] Protected routes
- [ ] API endpoints
- [ ] Database operations

## 🔧 Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Verify all dependencies are in `package.json`
- Ensure Node.js version is >= 20.0.0

### API Not Working
- Verify `api/index.ts` exists
- Check function logs in Vercel
- Verify environment variables are set

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check database is accessible from Vercel
- Verify Prisma migrations ran successfully

## 📚 Documentation

Essential files kept:
- `README.md` - Main project documentation
- `DOCUMENTATION.md` - Full documentation
- `ENVIRONMENT_VARIABLES.md` - Environment variables reference
- `DEPLOYMENT_GUIDE.md` - Detailed deployment guide
- `CONTRIBUTING.md` - Contribution guidelines
- `CHANGELOG.md` - Version history
