import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

let prisma: ReturnType<typeof createPrismaClient> | null = null;

function createPrismaClient() {
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
