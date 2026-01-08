import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

let prisma: PrismaClient | ReturnType<typeof createPrismaClient> | null = null;

function createPrismaClient() {
  // Always prefer DIRECT_URL if available (especially for Vercel/serverless)
  // Prisma Accelerate can have connection issues on serverless environments
  const isVercel = !!process.env.VERCEL || !!process.env.VERCEL_ENV;
  const isProduction = process.env.NODE_ENV === 'production';
  const hasDirectUrl = !!process.env.DIRECT_URL;
  const databaseUrl = process.env.DATABASE_URL || '';
  const hasPrismaAccelerate = databaseUrl.startsWith('prisma://') || databaseUrl.startsWith('prisma+postgres://');

  // Use direct connection if:
  // 1. We're on Vercel (serverless)
  // 2. DIRECT_URL is explicitly provided (bypasses Accelerate)
  // 3. FORCE_DIRECT_DB is set
  const useDirectConnection =
    isVercel ||
    hasDirectUrl ||
    process.env.FORCE_DIRECT_DB === 'true';

  const dbUrl = process.env.DIRECT_URL || databaseUrl;

  if (!dbUrl) {
    console.error('❌ DATABASE_URL or DIRECT_URL must be set');
    throw new Error('Database connection URL is required');
  }

  const baseClient = new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: isProduction ? ['error', 'warn'] : ['error', 'warn', 'info'],
  });

  // Use Accelerate extension if DATABASE_URL is an Accelerate connection string
  // and we're not forcing direct connection
  if (hasPrismaAccelerate && !useDirectConnection) {
    console.log('🚀 Using Prisma Accelerate with caching enabled');
    return baseClient.$extends(withAccelerate()) as any;
  }

  if (useDirectConnection) {
    // Use direct connection (bypass Accelerate)
    console.log(`🔗 Using direct database connection${isVercel ? ' (Vercel/serverless)' : ''}`);
    return baseClient;
  }

  // Use standard PrismaClient for local development
  console.log('🔗 Using standard Prisma Client (development mode)');
  return baseClient;
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Database connection failed:', errorMessage);

    // Provide helpful error messages
    if (
      errorMessage.includes("Can't reach database server") ||
      errorMessage.includes('db.prisma.io')
    ) {
      console.error(
        '💡 Tip: If using Prisma Accelerate, make sure DIRECT_URL is set in environment variables'
      );
      console.error('💡 For local development, ensure DATABASE_URL points to your local database');
    } else if (errorMessage.includes('P1001') || errorMessage.includes('connection')) {
      console.error('💡 Tip: Check that your database server is running and accessible');
      console.error('💡 Verify DATABASE_URL or DIRECT_URL in your .env file');
    }

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

// Export with proper type - prisma is guaranteed to be initialized
// or the process would have exited in production
// Using 'any' type to handle both PrismaClient and Accelerate extension
export default prisma as any;
