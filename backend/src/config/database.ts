import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

let prisma: ReturnType<typeof createPrismaClient> | null = null;

function createPrismaClient() {
  // In production or if DIRECT_URL is available, use direct connection
  // Prisma Accelerate can have connection issues on serverless
  const useDirectConnection = 
    process.env.NODE_ENV === 'production' || 
    !process.env.DATABASE_URL?.includes('prisma.io') ||
    process.env.FORCE_DIRECT_DB === 'true';

  if (useDirectConnection && process.env.DIRECT_URL) {
    // Use direct connection (bypass Accelerate) for production/serverless
    return new PrismaClient({
      datasources: {
        db: {
          url: process.env.DIRECT_URL,
        },
      },
      log: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['error', 'warn'],
    });
  }

  // Use Accelerate for development (if available)
  return new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['error', 'warn'],
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
}

export default prisma as ReturnType<typeof createPrismaClient>;
