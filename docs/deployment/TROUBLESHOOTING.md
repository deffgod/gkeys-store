# Deployment Troubleshooting Guide

This guide provides solutions for common deployment issues encountered when deploying the GKEYS Store application to Vercel.

## Table of Contents

1. [Build Failures](#build-failures)
2. [Runtime Errors](#runtime-errors)
3. [API Routing Issues](#api-routing-issues)
4. [Database Connection Issues](#database-connection-issues)
5. [CORS Errors](#cors-errors)
6. [Environment Variable Issues](#environment-variable-issues)
7. [Frontend/Backend Communication Issues](#frontendbackend-communication-issues)

## Build Failures

### Problem: Build Process Fails During Deployment

**Symptoms**:
- Build logs show errors in Vercel Dashboard
- Deployment status shows "Build Failed"
- Error messages in build output

**Common Causes & Solutions**:

#### 1. Missing Dependencies

**Error**: `Cannot find module 'xxx'` or `Package 'xxx' not found`

**Solutions**:
1. Verify all dependencies are in `package.json`:
   ```bash
   # Check root package.json
   cat package.json | grep dependencies
   
   # Check backend package.json
   cat backend/package.json | grep dependencies
   ```
2. Ensure `package-lock.json` is committed to Git
3. Check that `node_modules` is not committed (should be in `.gitignore`)
4. Verify install command: `npm install && cd backend && npm install`

#### 2. TypeScript Compilation Errors

**Error**: TypeScript errors during build

**Solutions**:
1. Fix TypeScript errors locally first:
   ```bash
   cd backend
   npm run build
   ```
2. Check `tsconfig.json` configuration
3. Verify all type definitions are correct
4. Check for missing type imports

#### 3. Prisma Generation Failures

**Error**: `Prisma Client generation failed` or `Cannot find @prisma/client`

**Solutions**:
1. Verify `DATABASE_URL` is set in Vercel environment variables
2. Check database is accessible from Vercel network
3. Ensure `prisma generate` runs before TypeScript compilation
4. Verify Prisma schema is valid:
   ```bash
   cd backend
   npx prisma validate
   ```

#### 4. Prisma Migration Failures

**Error**: `Migration failed` or `Database connection error during migration`

**Solutions**:
1. Verify `DATABASE_URL` and `DIRECT_URL` are set correctly
2. Check database is accessible (IP whitelist if needed)
3. Ensure database user has migration permissions
4. Verify connection string format: `postgresql://user:pass@host:5432/db`
5. Check database logs for connection attempts

#### 5. Build Timeout

**Error**: Build exceeds time limit

**Solutions**:
1. Optimize build process (remove unnecessary steps)
2. Check for long-running operations in build script
3. Consider using Vercel Pro plan (longer timeout)
4. Review build logs for slow operations

## Runtime Errors

### Problem: Application Fails to Start or Crashes

**Symptoms**:
- Serverless function returns 500 errors
- Application logs show errors
- Health check endpoint fails

**Common Causes & Solutions**:

#### 1. Database Connection Failures

**Error**: `Can't reach database server` or `P1001: Can't reach database server`

**Solutions**:
1. Verify `DATABASE_URL` format: `postgresql://user:password@host:5432/database`
2. Check database is accessible from Vercel network:
   - If using IP whitelist, add Vercel IP ranges
   - If using connection pooling, verify pooler URL
3. Verify `DIRECT_URL` is set (required for Prisma migrations)
4. Check database server is running and accepting connections
5. Verify database credentials are correct
6. For Prisma Accelerate: Ensure `DIRECT_URL` is set separately

**Debug Steps**:
```bash
# Test database connection locally
cd backend
npm run db:check

# Or test with Prisma
npx prisma db pull
```

#### 2. Missing Environment Variables

**Error**: `Environment variable XXX is not set` or `undefined`

**Solutions**:
1. Verify all required variables are set in Vercel Dashboard
2. Check variable names match exactly (case-sensitive)
3. Ensure variables are set for correct environment (Production/Preview/Development)
4. Redeploy after adding/updating variables
5. For frontend variables, ensure `VITE_` prefix is used
6. Check variable values are not empty

**Required Variables Checklist**:
- [ ] `DATABASE_URL`
- [ ] `DIRECT_URL`
- [ ] `JWT_SECRET` (32+ characters)
- [ ] `JWT_REFRESH_SECRET` (32+ characters)
- [ ] `FRONTEND_URL`
- [ ] `VITE_API_BASE_URL`
- [ ] `NODE_ENV=production`

#### 3. CORS Errors

**Error**: `Access to fetch at '...' from origin '...' has been blocked by CORS policy`

**Solutions**:
1. **For Monolithic Deployment**:
   - CORS should work automatically (same domain)
   - Verify `FRONTEND_URL` matches deployment URL

2. **For Separate Deployment**:
   - Verify `FRONTEND_URL` in backend project matches frontend deployment URL
   - Check `ALLOWED_ORIGINS` includes all needed origins
   - Ensure CORS middleware is configured in `backend/src/index.ts`
   - Redeploy backend after updating CORS variables

**Debug CORS**:
```bash
# Test CORS with curl
curl -H "Origin: https://your-frontend.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://your-backend.vercel.app/api/health \
     -v
```

#### 4. JWT Secret Issues

**Error**: `JWT secret is too short` or authentication fails

**Solutions**:
1. Verify `JWT_SECRET` is at least 32 characters
2. Verify `JWT_REFRESH_SECRET` is at least 32 characters
3. Ensure secrets are different from each other
4. Use strong, random secrets (not predictable values)
5. Regenerate secrets if compromised

## API Routing Issues

### Problem: API Endpoints Return 404

**Symptoms**:
- API calls return 404 Not Found
- Serverless function not found errors
- Routes not working

**Common Causes & Solutions**:

#### 1. Missing vercel.json Configuration

**Error**: API routes not routed to serverless function

**Solutions**:
1. Verify `vercel.json` exists in project root
2. Check rewrites configuration:
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
3. Ensure `api/index.ts` exists and exports handler
4. Verify serverless function is deployed (check Functions tab)

#### 2. Serverless Function Not Found

**Error**: `Function not found` or `404 Function Not Found`

**Solutions**:
1. Verify `api/index.ts` exists in project root
2. Check function exports handler correctly:
   ```typescript
   export default app; // Express app
   ```
3. Review function logs in Vercel Dashboard → Functions → Logs
4. Verify function is included in build (check `vercel.json` functions config)

#### 3. Incorrect API Paths

**Error**: API calls go to wrong endpoint

**Solutions**:
1. Verify `VITE_API_BASE_URL` includes `/api` suffix
2. Check API routes are registered in Express app
3. Verify route paths match frontend expectations
4. Test API endpoints directly: `curl https://your-project.vercel.app/api/health`

## Database Connection Issues

### Problem: Database Connection Fails in Production

**Symptoms**:
- Health check shows database as `error`
- API requests fail with database errors
- Prisma errors in logs

**Common Causes & Solutions**:

#### 1. Connection String Format

**Error**: Invalid connection string format

**Solutions**:
1. Verify format: `postgresql://user:password@host:port/database`
2. Check special characters in password are URL-encoded
3. Verify `DIRECT_URL` matches `DATABASE_URL` (if not using Prisma Accelerate)
4. For Prisma Accelerate: `DATABASE_URL` = Accelerate URL, `DIRECT_URL` = Direct connection

#### 2. Network Accessibility

**Error**: `Can't reach database server` or connection timeout

**Solutions**:
1. Check database allows connections from Vercel IP ranges
2. If using IP whitelist, add Vercel IPs:
   - Vercel IP ranges change frequently
   - Consider using connection pooling service
3. Verify database firewall rules
4. Check database server is running and accessible
5. Test connection from local machine with same credentials

#### 3. Prisma Accelerate Issues

**Error**: Prisma Accelerate connection problems

**Solutions**:
1. Ensure `DIRECT_URL` is set (required for migrations)
2. Use direct connection for serverless (set in `database.ts`)
3. Verify Accelerate URL format
4. Check Accelerate dashboard for connection status
5. Consider using direct connection if Accelerate is unreliable

## CORS Errors

### Problem: CORS Policy Blocks Requests

**Symptoms**:
- Browser console shows CORS errors
- API requests fail with CORS errors
- Preflight OPTIONS requests fail

**Common Causes & Solutions**:

#### 1. Frontend Origin Not Allowed

**Error**: `Origin 'https://frontend.vercel.app' is not allowed by CORS`

**Solutions**:
1. **For Separate Deployment**:
   - Set `FRONTEND_URL` in backend project: `https://frontend.vercel.app`
   - Add `ALLOWED_ORIGINS` for additional origins (preview URLs, etc.)
   - Redeploy backend after updating CORS variables

2. **For Monolithic Deployment**:
   - CORS should work automatically (same domain)
   - Verify `FRONTEND_URL` matches deployment URL

#### 2. Missing CORS Headers

**Error**: CORS headers not present in response

**Solutions**:
1. Verify CORS middleware is configured in `backend/src/index.ts`
2. Check `getAllowedOrigins()` function includes frontend URL
3. Verify `credentials: true` is set for authenticated requests
4. Check CORS middleware is before route handlers

#### 3. Preview URL Issues

**Error**: Preview deployments fail CORS checks

**Solutions**:
1. Add preview URLs to `ALLOWED_ORIGINS`:
   ```
   ALLOWED_ORIGINS=https://frontend.vercel.app,https://frontend-git-*.vercel.app
   ```
2. Or use wildcard pattern in CORS configuration
3. Verify Vercel preview URLs are handled in `getAllowedOrigins()`

## Environment Variable Issues

### Problem: Environment Variables Not Available

**Symptoms**:
- Variables return `undefined`
- Application uses wrong values
- Frontend variables not accessible

**Common Causes & Solutions**:

#### 1. Variables Not Set

**Error**: `process.env.XXX is undefined`

**Solutions**:
1. Verify variables are set in Vercel Dashboard
2. Check variable names match exactly (case-sensitive)
3. Ensure variables are set for correct environment
4. Redeploy after adding variables

#### 2. Frontend Variables Not Accessible

**Error**: `import.meta.env.VITE_XXX is undefined`

**Solutions**:
1. Verify `VITE_` prefix is used for frontend variables
2. Check variables are set in Vercel (not just `.env.local`)
3. Rebuild frontend after adding variables
4. Verify variables are available at build time (not runtime)

#### 3. Variable Values Incorrect

**Error**: Variables have wrong values

**Solutions**:
1. Verify variable values in Vercel Dashboard
2. Check for typos in variable names
3. Ensure no extra spaces or quotes in values
4. Verify URL format (no trailing slashes, correct protocol)

## Frontend/Backend Communication Issues

### Problem: Frontend Can't Communicate with Backend

**Symptoms**:
- API calls fail
- Network errors in browser
- Timeout errors

**Common Causes & Solutions**:

#### 1. Incorrect API URL

**Error**: API calls go to wrong URL

**Solutions**:
1. Verify `VITE_API_BASE_URL` is set correctly:
   - Monolithic: `https://your-project.vercel.app/api`
   - Separate: `https://backend-project.vercel.app/api`
2. Check URL includes `/api` suffix
3. Verify URL uses HTTPS in production
4. Check browser network tab for actual request URLs

#### 2. Backend Not Deployed

**Error**: Backend returns 404 or connection refused

**Solutions**:
1. Verify backend is deployed and accessible
2. Test backend directly: `curl https://backend.vercel.app/api/health`
3. Check backend deployment logs
4. Verify serverless function is working

#### 3. Network Timeouts

**Error**: Requests timeout

**Solutions**:
1. Check serverless function timeout (60s Hobby, 5min Pro)
2. Optimize API response times
3. Check for long-running operations
4. Verify database queries are optimized

## Quick Diagnostic Commands

### Check Deployment Status

```bash
# Pre-deployment verification
npm run verify:deployment

# Post-deployment validation
npm run validate:deployment -- --url=https://your-project.vercel.app

# Check environment variables
npm run check:env
```

### Test API Endpoints

```bash
# Health check
curl https://your-project.vercel.app/api/health

# Test CORS
curl -H "Origin: https://frontend.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://backend.vercel.app/api/health \
     -v
```

### Check Build Locally

```bash
# Test frontend build
npm run build

# Test backend build
cd backend && npm run build:deploy

# Test full build
npm run vercel-build
```

## Getting Help

If issues persist:

1. **Check Vercel Logs**:
   - Vercel Dashboard → Deployments → [Deployment] → Build Logs
   - Vercel Dashboard → Functions → [Function] → Logs

2. **Review Documentation**:
   - [MONOLITHIC_DEPLOYMENT.md](./MONOLITHIC_DEPLOYMENT.md)
   - [SEPARATE_DEPLOYMENT.md](./SEPARATE_DEPLOYMENT.md)
   - [DEPLOYMENT_OPTIONS.md](./DEPLOYMENT_OPTIONS.md)

3. **Run Verification Scripts**:
   - Pre-deployment: `npm run verify:deployment`
   - Post-deployment: `npm run validate:deployment`

4. **Check Environment Variables**:
   - Verify all required variables are set
   - Check variable values are correct
   - Ensure variables are set for correct environment

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Status Page](https://www.vercel-status.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Connection Issues](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)
