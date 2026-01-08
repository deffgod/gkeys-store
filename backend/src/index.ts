import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { sessionMiddleware } from './middleware/session.middleware.js';
import { startG2ASyncJob, startStockCheckJob } from './jobs/g2a-sync.job.js';
import prisma, { initializeDatabase } from './config/database.js';
import { clearAllCache } from './services/cache.service.js';
import authRoutes from './routes/auth.routes.js';
import gameRoutes from './routes/game.routes.js';
import orderRoutes from './routes/order.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import userRoutes from './routes/user.routes.js';
import blogRoutes from './routes/blog.routes.js';
import adminRoutes from './routes/admin.routes.js';
import cartRoutes from './routes/cart.routes.js';
import wishlistRoutes from './routes/wishlist.routes.js';
import faqRoutes from './routes/faq.routes.js';
import g2aWebhookRoutes from './routes/g2a-webhook.routes.js';

// Load environment variables
dotenv.config();

// Clear cache on startup
clearAllCache()
  .then(() => {
    console.log('🧹 Cache cleared on startup');
  })
  .catch((error) => {
    console.error('❌ Failed to clear cache on startup:', error);
  });

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration for multiple origins
const getAllowedOrigins = (): string[] => {
  const origins: string[] = [];

  // Production frontend URL
  if (process.env.FRONTEND_URL) {
    origins.push(process.env.FRONTEND_URL.trim());
  }

  // Vercel preview URLs pattern
  if (process.env.VERCEL) {
    const vercelUrl = process.env.VERCEL_URL;
    if (vercelUrl) {
      origins.push(`https://${vercelUrl}`);
    }
  }

  // Explicit allowed origins (with normalization)
  if (process.env.ALLOWED_ORIGINS) {
    const allowed = process.env.ALLOWED_ORIGINS.split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0);
    origins.push(...allowed);
  }

  // Development - add localhost by default (always allow in non-production)
  if (process.env.NODE_ENV !== 'production') {
    origins.push('http://localhost:5173', 'http://localhost:4173', 'http://localhost:3001');
  }

  // Log in development for debugging
  if (process.env.NODE_ENV !== 'development') {
    console.log('🔍 Allowed CORS origins:', origins);
  }

  return origins;
};

// Handle OPTIONS requests FIRST, before any other middleware
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  const allowedOrigins = getAllowedOrigins();
  
  // Always allow localhost in non-production
  const isLocalhost = origin && (origin.includes('localhost') || origin.includes('127.0.0.1'));
  const isDev = process.env.NODE_ENV !== 'production';
  
  // Check if origin is allowed
  const isAllowed = !origin || isLocalhost || allowedOrigins.some((allowed) => {
    const normalizedAllowed = allowed.toLowerCase().replace(/\/$/, '');
    const normalizedOrigin = origin.toLowerCase().replace(/\/$/, '');
    return normalizedOrigin === normalizedAllowed || origin.endsWith('.vercel.app');
  });
  
  if (isAllowed && origin) {
    res.header('Access-Control-Allow-Origin', origin);
  } else if (isAllowed || (isDev && isLocalhost)) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(200).end();
});

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration with proper error handling
app.use(
  cors({
    origin: (origin, callback) => {
      try {
        const allowedOrigins = getAllowedOrigins();

        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) {
          return callback(null, true);
        }

        // Normalize origin for comparison (lowercase, remove trailing slash)
        const normalizedOrigin = origin.toLowerCase().replace(/\/$/, '');

        // Always allow localhost in non-production
        const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
        const isDev = process.env.NODE_ENV !== 'production';
        
        // Check if origin is allowed
        const isAllowed = isLocalhost || allowedOrigins.some((allowed) => {
          const normalizedAllowed = allowed.toLowerCase().replace(/\/$/, '');
          return (
            normalizedOrigin === normalizedAllowed ||
            origin.endsWith('.vercel.app') ||
            normalizedAllowed === normalizedOrigin
          );
        });
        
        // In development, always allow localhost
        if (isDev && isLocalhost) {
          return callback(null, true);
        }

        if (isAllowed) {
          callback(null, true);
        } else {
          // Log detailed error in development
          if (process.env.NODE_ENV !== 'production') {
            console.error('❌ CORS Error:', {
              requestedOrigin: origin,
              allowedOrigins: allowedOrigins,
            });
          }
          callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
        }
      } catch (error) {
        // If CORS check fails, log but don't block in development
        console.error('❌ CORS check error:', error);
        if (process.env.NODE_ENV === 'development') {
          callback(null, true); // Allow in dev mode if check fails
        } else {
          callback(error instanceof Error ? error : new Error('CORS check failed'));
        }
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
  })
);

app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Skip session middleware for OPTIONS requests
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next();
  }
  return sessionMiddleware(req, res, next);
});

// Health check with G2A and idempotency store checks
app.get('/health', async (req, res) => {
  // Also handle /api/health for consistency
  const health = await getHealthStatus();
  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

app.get('/api/health', async (req, res) => {
  const health = await getHealthStatus();
  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

async function getHealthStatus() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    checks: {
      database: 'unknown',
      redis: 'unknown',
      g2a: 'unknown',
    },
  };

  try {
    // Check database
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database = 'ok';
  } catch {
    health.checks.database = 'error';
    health.status = 'degraded';
  }

  try {
    // Check Redis (idempotency store)
    const redis = await import('./config/redis.js');
    if (redis.default.isOpen) {
      await redis.default.ping();
      health.checks.redis = 'ok';
    } else {
      health.checks.redis = 'disconnected';
      health.status = 'degraded';
    }
  } catch {
    health.checks.redis = 'error';
    health.status = 'degraded';
  }

  try {
    // Check G2A connectivity (try to get config - if it throws, G2A is misconfigured)
    const { getG2AConfig } = await import('./config/g2a.js');
    getG2AConfig(); // Verify config is accessible
    // Try a simple token validation check
    const { validateG2ACredentials } = await import('./services/g2a.service.js');
    validateG2ACredentials();
    health.checks.g2a = 'ok';
  } catch {
    health.checks.g2a = 'error';
    health.status = 'degraded';
  }

  return health;
}

// API Routes - using routes imported at the top
app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/user', userRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/faq', faqRoutes);
app.use('/api/g2a', g2aWebhookRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize database (for both server and serverless)
let dbInitialized = false;

async function initializeApp(): Promise<boolean> {
  if (!dbInitialized) {
    const dbConnected = await initializeDatabase();
    dbInitialized = true;
    return dbConnected;
  }
  return true;
}

// Initialize database and start server (only if not in Vercel/serverless environment or test)
const isVercel = !!process.env.VERCEL;
const isServerless = !!process.env.VERCEL_ENV;
const isTest = process.env.NODE_ENV === 'test';

if (!isVercel && !isServerless && !isTest) {
  // Running as standalone server (development/production server)
  async function startServer() {
    const dbConnected = await initializeApp();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);

      // Start scheduled jobs only if database is connected
      if (process.env.NODE_ENV !== 'test' && dbConnected) {
        startG2ASyncJob();
        startStockCheckJob();
        console.log('⏰ Scheduled jobs started');
        
        // Initialize order processing queue (if Redis is available)
        (async () => {
          try {
            const { isQueueAvailable } = await import('./queues/order-processing.queue.js');
            if (isQueueAvailable()) {
              console.log('✅ Order processing queue initialized');
            } else {
              console.log('⚠️  Order processing queue not available (Redis may not be configured). Orders will be processed synchronously.');
            }
          } catch (error) {
            console.warn('⚠️  Failed to initialize order processing queue:', error);
          }
        })();
      }
    });
  }

  startServer().catch((error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });
} else {
  // Running as Vercel serverless function
  // Initialize database on first request (lazy initialization)
  initializeApp().catch((error) => {
    console.error('⚠️  Database initialization failed:', error);
  });
}

export default app;
