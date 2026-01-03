/**
 * Database connectivity verification for pre-deployment checks
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import type { VerificationCheck } from './types/verification.js';
import { createVerificationCheck } from './utils/verification.js';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '../..');
const backendDir = resolve(rootDir, 'backend');

/**
 * Verify database connectivity
 */
export async function verifyDatabaseConnectivity(): Promise<VerificationCheck> {
  const startTime = Date.now();
  
  try {
    // Use Prisma CLI to test connection via db pull (lightweight check)
    // This works even if Prisma Client isn't generated yet
    const { stdout, stderr } = await execAsync('npx prisma db pull --print', {
      cwd: backendDir,
      timeout: 15000,
    });
    
    const duration = Date.now() - startTime;
    
    if (stderr && !stderr.includes('warning')) {
      return createVerificationCheck(
        'database-connectivity',
        'Database Connectivity',
        'database',
        'fail',
        'Database connection test failed',
        {
          errors: [stderr],
          duration,
          critical: true,
        }
      );
    }
    
    return createVerificationCheck(
      'database-connectivity',
      'Database Connectivity',
      'database',
      'pass',
      `Database connection successful (${duration}ms)`,
      { duration, critical: true }
    );
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    // Check if error is due to missing DATABASE_URL
    const errorMsg = error.message || String(error);
    if (errorMsg.includes('DATABASE_URL') || errorMsg.includes('connection string')) {
      return createVerificationCheck(
        'database-connectivity',
        'Database Connectivity',
        'database',
        'fail',
        'DATABASE_URL not configured',
        {
          errors: ['DATABASE_URL environment variable is required'],
          duration,
          critical: true,
        }
      );
    }
    
    return createVerificationCheck(
      'database-connectivity',
      'Database Connectivity',
      'database',
      'fail',
      'Database connection failed',
      {
        errors: [errorMsg],
        duration,
        critical: true,
      }
    );
  }
}

/**
 * Verify Prisma migrations can be applied
 */
export async function verifyMigrations(): Promise<VerificationCheck> {
  const startTime = Date.now();
  
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const { resolve } = await import('path');
    const { fileURLToPath } = await import('url');
    const { dirname } = await import('path');
    
    const execAsync = promisify(exec);
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const rootDir = resolve(__dirname, '../../..');
    const backendDir = resolve(rootDir, 'backend');
    
    // Check if migrations directory exists
    const { existsSync } = await import('fs');
    const migrationsDir = resolve(backendDir, 'prisma/migrations');
    
    if (!existsSync(migrationsDir)) {
      const duration = Date.now() - startTime;
      return createVerificationCheck(
        'migrations',
        'Prisma Migrations',
        'database',
        'warning',
        'No migrations directory found',
        {
          errors: ['Migrations directory not found - this may be expected for new projects'],
          duration,
          critical: false,
        }
      );
    }
    
    // Try to check migration status (dry run)
    // Note: We don't actually apply migrations, just verify they can be checked
    try {
      await execAsync('npx prisma migrate status', {
        cwd: backendDir,
        timeout: 30000,
      });
      
      const duration = Date.now() - startTime;
      return createVerificationCheck(
        'migrations',
        'Prisma Migrations',
        'database',
        'pass',
        'Migrations can be checked successfully',
        { duration, critical: true }
      );
    } catch (migrationError: any) {
      const duration = Date.now() - startTime;
      // Migration status check failed - this might be okay if no migrations exist
      const errorMsg = migrationError.message || String(migrationError);
      const isNoMigrations = errorMsg.includes('No migrations found') || 
                            errorMsg.includes('database is up to date');
      
      return createVerificationCheck(
        'migrations',
        'Prisma Migrations',
        'database',
        isNoMigrations ? 'warning' : 'fail',
        isNoMigrations 
          ? 'No migrations found (may be expected)'
          : 'Migration check failed',
        {
          errors: [errorMsg],
          duration,
          critical: !isNoMigrations,
        }
      );
    }
  } catch (error: any) {
    const duration = Date.now() - startTime;
    return createVerificationCheck(
      'migrations',
      'Prisma Migrations',
      'database',
      'fail',
      'Migration verification failed',
      {
        errors: [error.message || String(error)],
        duration,
        critical: true,
      }
    );
  }
}

/**
 * Verify database and migrations
 */
export async function verifyDatabase(): Promise<{
  connectivity: VerificationCheck;
  migrations: VerificationCheck;
}> {
  const [connectivity, migrations] = await Promise.all([
    verifyDatabaseConnectivity(),
    verifyMigrations(),
  ]);
  
  return { connectivity, migrations };
}
