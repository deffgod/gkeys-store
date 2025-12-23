# Frontend-Backend Integration Guide

## Quick Setup

### 1. Backend Setup

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

Backend runs on: `http://localhost:3001`

### 2. Frontend Setup

```bash
# In project root
npm install

# Create .env file
echo "VITE_API_BASE_URL=http://localhost:3001/api" > .env

# Start dev server
npm run dev
```

Frontend runs on: `http://localhost:5173`

## API Configuration

### Frontend API Client

The frontend uses `src/services/api.ts` which automatically:
- Reads `VITE_API_BASE_URL` from environment
- Adds `/api` prefix to all requests
- Handles JWT tokens from localStorage
- Sets `Authorization: Bearer <token>` header

**Example**:
```typescript
import apiClient from './services/api';

// GET request
const games = await apiClient.get('/games', { params: { page: 1 } });

// POST request with auth
const profile = await apiClient.get('/user/profile'); // Auto-adds token
```

### Backend API Structure

All API routes are prefixed with `/api`:
- `/api/auth/*` - Authentication
- `/api/games/*` - Games catalog
- `/api/user/*` - User profile (protected)
- `/api/orders/*` - Orders (protected)
- `/api/cart/*` - Shopping cart (protected)
- `/api/wishlist/*` - Wishlist (protected)
- `/api/admin/*` - Admin panel (admin only)
- `/api/g2a/*` - G2A webhooks (public)

## Authentication Flow

1. **Registration/Login**:
   ```typescript
   import { authApi } from './services/authApi';
   
   const response = await authApi.register({
     email: 'user@example.com',
     password: 'Password123',
     nickname: 'User'
   });
   
   // Token automatically stored in localStorage
   // apiClient.setToken() called automatically
   ```

2. **Protected Routes**:
   - Token stored in `localStorage` as `gkeys_auth_token`
   - Automatically added to all requests via `apiClient`
   - Backend validates token via `authenticate` middleware

3. **Token Refresh**:
   ```typescript
   await authApi.refreshToken(refreshToken);
   ```

## Testing Integration

### Backend Tests

```bash
cd backend
npm run test:endpoints  # Test all basic endpoints
npm run test:g2a       # Test G2A endpoints (needs admin token)
npm run db:check       # Verify database connection
```

### Manual Testing

1. **Health Check**:
   ```bash
   curl http://localhost:3001/health
   ```

2. **Registration**:
   ```bash
   curl -X POST http://localhost:3001/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"Test1234","nickname":"Test"}'
   ```

3. **Login**:
   ```bash
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"Test1234"}'
   ```

4. **Protected Route** (with token):
   ```bash
   curl http://localhost:3001/api/user/profile \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

## Environment Variables

### Frontend (.env)

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

For production:
```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

### Backend (backend/.env)

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/database
DIRECT_URL=postgresql://user:password@localhost:5432/database

# Server
PORT=3001
FRONTEND_URL=http://localhost:5173

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# G2A Integration
G2A_API_URL=https://api.g2a.com/integration-api/v1
G2A_API_KEY=your_key
G2A_API_HASH=your_hash
G2A_ENV=sandbox

# Redis (optional)
REDIS_URL=redis://localhost:6379
```

## Common Issues

### CORS Errors

**Problem**: Frontend can't access backend API

**Solution**: 
- Check `FRONTEND_URL` in backend `.env` matches frontend URL
- Verify CORS middleware in `backend/src/index.ts`

### 401 Unauthorized

**Problem**: Protected routes return 401

**Solution**:
- Check token in localStorage: `localStorage.getItem('gkeys_auth_token')`
- Verify token format (should start with `eyJ`)
- Check token expiration
- Re-login if token expired

### API Base URL Not Found

**Problem**: `VITE_API_BASE_URL` not working

**Solution**:
- Restart dev server after changing `.env`
- Check `.env` file is in project root (not `backend/`)
- Verify variable name: `VITE_API_BASE_URL` (not `VITE_API_URL`)

### Database Connection Failed

**Problem**: Backend can't connect to database

**Solution**:
- Run `npm run db:check` in backend
- Verify `DATABASE_URL` in `backend/.env`
- Check PostgreSQL is running
- See `backend/DATABASE_SETUP.md` for details

## Development Workflow

1. **Start Backend**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend** (in another terminal):
   ```bash
   npm run dev
   ```

3. **Test Changes**:
   - Backend changes: Check logs in backend terminal
   - Frontend changes: Check browser console
   - API calls: Check Network tab in DevTools

4. **Verify Integration**:
   - Open frontend: `http://localhost:5173`
   - Try registration/login
   - Check backend logs for API calls
   - Verify data in database via Prisma Studio: `npm run prisma:studio`

## Production Deployment

### Frontend (Vercel)

1. Set environment variable in Vercel:
   ```
   VITE_API_BASE_URL=https://your-backend-api.com/api
   ```

2. Deploy:
   ```bash
   vercel --prod
   ```

### Backend (Vercel/Server)

1. Set all environment variables
2. Run migrations: `npm run prisma:migrate:deploy`
3. Start server: `npm start`

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for details.
