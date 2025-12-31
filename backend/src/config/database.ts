import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

let prisma: ReturnType<typeof createPrismaClient> | null = null;

function createPrismaClient() {
  // Always prefer DIRECT_URL if available (especially for Vercel/serverless)
  // Prisma Accelerate can have connection issues on serverless environments
  const isVercel = !!process.env.VERCEL || !!process.env.VERCEL_ENV;
  const isProduction = process.env.NODE_ENV === 'production';
  const hasDirectUrl = !!process.env.DIRECT_URL;
  const hasPrismaAccelerate = process.env.DATABASE_URL?.includes('prisma.io');
  
  // Use direct connection if:
  // 1. We're on Vercel (serverless)
  // 2. We're in production
  // 3. DIRECT_URL is explicitly provided
  // 4. DATABASE_URL points to Prisma Accelerate (which can be unreliable)
  const useDirectConnection = 
    isVercel || 
    isProduction || 
    hasDirectUrl || 
    hasPrismaAccelerate ||
    process.env.FORCE_DIRECT_DB === 'true';

  if (useDirectConnection) {
    // Use direct connection (bypass Accelerate)
    const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
    
    if (!dbUrl) {
      console.error('❌ DATABASE_URL or DIRECT_URL must be set');
      throw new Error('Database connection URL is required');
    }

    console.log(`🔗 Using direct database connection${isVercel ? ' (Vercel/serverless)' : ''}`);
    
    return new PrismaClient({
      datasources: {
        db: {
          url: dbUrl,
        },
      },
      log: isProduction ? ['error', 'warn'] : ['error', 'warn', 'info'],
    });
  }

  // Use Accelerate only for local development (if available and not Prisma Accelerate URL)
  console.log('⚡ Using Prisma Accelerate (development mode)');
  return new PrismaClient({
    log: isProduction ? ['error', 'warn'] : ['error', 'warn', 'info'],
  }).$extends(withAccelerate());
}

/**
 * Initialize Prisma client and test connection
 */
export async function initializeDatabase(): Promise<boolean> {
  try {
    if (!prisma) {
      prisma = createPrismaClient();
    }
    
    // Test connection with a simple query
    await prisma.$queryRaw`SELECT 1`;
    
    console.log('✅ Database connection established');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.warn('⚠️  Some features may not work without database connection');
    return false;
  }
}

// Initialize on module load (non-blocking)
if (process.env.NODE_ENV !== 'test') {
  initializeDatabase().catch((error) => {
    console.error('Failed to initialize database:', error);
  });
}

// Create client instance
try {
  prisma = createPrismaClient();
} catch (error) {
  console.warn('⚠️  Failed to create Prisma Client:', error);
  // Re-throw in production to prevent server startup with broken DB
  if (process.env.NODE_ENV === 'production') {
    throw error;
  }
}

// Export with proper type assertion - prisma is guaranteed to be initialized
// or the process would have exited in production
export default prisma!;
