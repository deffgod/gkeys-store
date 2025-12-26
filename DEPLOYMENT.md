# 🚀 Deployment Guide - Vercel

## Prerequisites

1. Vercel account
2. GitHub repository connected to Vercel
3. PostgreSQL database (Prisma Cloud or self-hosted)
4. Redis instance (optional, for caching)

## Step 1: Environment Variables

Configure the following environment variables in Vercel Dashboard:

### Frontend Variables
- `VITE_API_BASE_URL` - Your API base URL (e.g., `https://your-project.vercel.app/api`)

### Backend Variables
- `DATABASE_URL` - PostgreSQL connection string
- `DIRECT_URL` - Direct database connection (for migrations)
- `JWT_SECRET` - Secret for JWT token generation
- `JWT_REFRESH_SECRET` - Secret for refresh tokens
- `REDIS_URL` - Redis connection string (optional)
- `G2A_API_KEY` - G2A API key
- `G2A_API_HASH` - G2A API hash
- `NODE_ENV` - Set to `production`

## Step 2: Deploy

### Automatic Deployment
1. Push to `main` branch
2. Vercel will automatically build and deploy

### Manual Deploynt
```bash
vercel --prod
```

## Step 3: Database Setup

After first deployment:
1. Run migrations:
```bash
cd backend
npx prisma migrate deploy
```

2. Seed database (optional):
```bash
npx prisma db seed
```

## Step 4: Verify

1. Check health endpoint: `https://your-project.vercel.app/api/health`
2. Test login: Use admin credentials from seed
3. Verify API endpoints are accessible

## Troubleshooting

- **Build fails**: Check environment variables are set
- **Database errors**: Verify DATABASE_URL and DIRECT_URL
- **API not found**: Check VITE_API_BASE_URL matches your deployment URL
