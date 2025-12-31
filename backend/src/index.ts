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

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration for multiple origins
const getAllowedOrigins = (): string[] => {
  const origins: string[] = [];

  // Production frontend URL
  if (process.env.FRONTEND_URL) {
    origins.push(process.env.FRONTEND_URL);
  }

  // Vercel preview URLs pattern
  if (process.env.VERCEL) {
    const vercelUrl = process.env.VERCEL_URL;
    if (vercelUrl) {
      origins.push(`https://${vercelUrl}`);
    }
  }

  // Explicit allowed origins
  if (process.env.ALLOWED_ORIGINS) {
    origins.push(...process.env.ALLOWED_ORIGINS.split(','));
  }

  // Development
  if (process.env.NODE_ENV !== 'production') {
    origins.push('http://localhost:5173', 'http://localhost:3000');
  }

  return origins;
};

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = getAllowedOrigins();

      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) {
        return callback(null, true);
      }

      // Check if origin is allowed
      if (allowedOrigins.some((allowed) => origin === allowed || origin.endsWith('.vercel.app'))) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sessionMiddleware);

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

// API Routes
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

// Initialize database and start server (only if not in Vercel/serverless environment)
const isVercel = !!process.env.VERCEL;
const isServerless = !!process.env.VERCEL_ENV;

if (!isVercel && !isServerless) {
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
