# Deployment Checklist

This checklist summarizes all pre-deployment, deployment, and post-deployment steps for deploying the GKEYS Store application to Vercel.

## Pre-Deployment Checklist

### Code Preparation
- [ ] All code changes committed to Git
- [ ] Code reviewed and approved
- [ ] No console.log or debugger statements in production code
- [ ] Environment variables documented

### Verification
- [ ] Run pre-deployment verification: `npm run verify:deployment`
- [ ] All critical checks pass (build, environment, database, tests, configuration)
- [ ] Review verification report for warnings
- [ ] Fix any critical issues before proceeding

### Environment Variables
- [ ] All required environment variables identified
- [ ] Variable values prepared (not placeholders)
- [ ] Secrets meet minimum requirements (JWT: 32+ characters)
- [ ] Database connection string verified
- [ ] Frontend API URL determined (or placeholder ready)

## Deployment Checklist

### Vercel Project Setup
- [ ] Vercel account created/accessed
- [ ] Git repository connected to Vercel
- [ ] Project created in Vercel Dashboard

### Project Configuration
- [ ] Framework preset selected (Vite for monolithic, Other for backend)
- [ ] Build command configured (`npm run vercel-build` for monolithic)
- [ ] Output directory configured (`dist` for frontend)
- [ ] Root directory configured (`.` for monolithic, `backend` for separate backend)

### Environment Variables Setup
- [ ] Database variables set (`DATABASE_URL`, `DIRECT_URL`)
- [ ] JWT secrets set (`JWT_SECRET`, `JWT_REFRESH_SECRET`)
- [ ] Frontend variables set (`VITE_API_BASE_URL`)
- [ ] Backend variables set (`FRONTEND_URL`, `NODE_ENV`)
- [ ] Optional variables set (G2A, Redis if needed)
- [ ] Variables set for correct environments (Production/Preview/Development)

### Deployment Execution
- [ ] Initial deployment triggered
- [ ] Build process completed successfully
- [ ] Deployment URL obtained
- [ ] Environment variables updated with actual URLs (if needed)
- [ ] Redeployed after URL updates (if needed)

## Post-Deployment Checklist

### Validation
- [ ] Run post-deployment validation: `npm run validate:deployment -- --url=https://your-project.vercel.app`
- [ ] All critical checks pass
- [ ] Review validation report for warnings
- [ ] Fix any critical issues

### Functional Testing
- [ ] Frontend loads: `https://your-project.vercel.app`
- [ ] Health check works: `https://your-project.vercel.app/api/health`
- [ ] API endpoints respond: `https://your-project.vercel.app/api/games`
- [ ] Authentication works: Register new user
- [ ] Login works: Login with test user
- [ ] No CORS errors in browser console
- [ ] Database connection successful (check health endpoint)

### Service Verification
- [ ] Database: Health check shows `database: ok`
- [ ] Redis: Health check shows status (optional)
- [ ] G2A API: Health check shows status (optional)
- [ ] All services accessible and functional

### Documentation
- [ ] Deployment URL documented
- [ ] Environment variables documented
- [ ] Deployment architecture documented (monolithic or separate)
- [ ] Team notified of deployment

## Separate Deployment Additional Checklist

### Backend Project
- [ ] Backend project created in Vercel
- [ ] Root directory set to `backend`
- [ ] Build command: `npm run build:deploy`
- [ ] Backend environment variables set
- [ ] Backend deployed successfully
- [ ] Backend URL obtained

### Frontend Project
- [ ] Frontend project created in Vercel
- [ ] Root directory set to `.`
- [ ] Build command: `npm run build`
- [ ] `VITE_API_BASE_URL` set to backend URL
- [ ] Frontend deployed successfully
- [ ] Frontend URL obtained

### CORS Configuration
- [ ] `FRONTEND_URL` set in backend project
- [ ] `ALLOWED_ORIGINS` set (if needed for preview URLs)
- [ ] Backend redeployed after CORS configuration
- [ ] CORS validation passes in post-deployment check

## Troubleshooting Checklist

If deployment fails:

- [ ] Check build logs in Vercel Dashboard
- [ ] Verify environment variables are set correctly
- [ ] Check database connectivity
- [ ] Review serverless function logs
- [ ] Verify `vercel.json` configuration
- [ ] Check `api/index.ts` exists and exports handler
- [ ] Review troubleshooting guide: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

## Quick Reference

### Essential Commands

```bash
# Pre-deployment verification
npm run verify:deployment

# Post-deployment validation
npm run validate:deployment -- --url=https://your-project.vercel.app

# Check environment variables
npm run check:env

# Local build test
npm run vercel-build
```

### Essential Documentation

- [DEPLOYMENT_OPTIONS.md](./DEPLOYMENT_OPTIONS.md) - Choose deployment architecture
- [MONOLITHIC_DEPLOYMENT.md](./MONOLITHIC_DEPLOYMENT.md) - Monolithic deployment guide
- [SEPARATE_DEPLOYMENT.md](./SEPARATE_DEPLOYMENT.md) - Separate deployment guide
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues and solutions

## Success Criteria

Deployment is successful when:

- ✅ Pre-deployment verification passes
- ✅ Deployment completes without errors
- ✅ Post-deployment validation passes
- ✅ Frontend is accessible
- ✅ API endpoints respond correctly
- ✅ Health check shows all services healthy
- ✅ Authentication works
- ✅ No critical errors in logs
