/**
 * Service connectivity validation for post-deployment checks
 */

import type { ValidationCheck } from './types/validation.js';
import { createValidationCheck } from './utils/validation.js';

/**
 * Validate database connection via health check
 */
export async function validateDatabaseConnection(
  baseUrl: string
): Promise<ValidationCheck> {
  const startTime = Date.now();
  
  try {
    const url = `${baseUrl.replace(/\/$/, '')}/api/health`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });
    
    if (!response.ok) {
      const duration = Date.now() - startTime;
      return createValidationCheck(
        'service-database',
        'Database Connection',
        'connectivity',
        'fail',
        'Health check failed',
        {
          errors: [`HTTP ${response.status}: ${response.statusText}`],
          duration,
          critical: true,
        }
      );
    }
    
    const data = await response.json();
    const duration = Date.now() - startTime;
    const dbStatus = data.checks?.database || 'unknown';
    
    if (dbStatus === 'ok') {
      return createValidationCheck(
        'service-database',
        'Database Connection',
        'connectivity',
        'pass',
        'Database connection is healthy',
        { duration, critical: true }
      );
    } else {
      return createValidationCheck(
        'service-database',
        'Database Connection',
        'connectivity',
        'fail',
        `Database status: ${dbStatus}`,
        {
          errors: [`Database check returned: ${dbStatus}`],
          duration,
          critical: true,
        }
      );
    }
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      return createValidationCheck(
        'service-database',
        'Database Connection',
        'connectivity',
        'timeout',
        'Database health check timed out',
        {
          errors: ['Request exceeded 10 second timeout'],
          duration,
          critical: true,
        }
      );
    }
    
    return createValidationCheck(
      'service-database',
      'Database Connection',
      'connectivity',
      'fail',
      'Failed to check database connection',
      {
        errors: [error.message || String(error)],
        duration,
        critical: true,
      }
    );
  }
}

/**
 * Validate Redis connection via health check
 */
export async function validateRedisConnection(
  baseUrl: string
): Promise<ValidationCheck> {
  const startTime = Date.now();
  
  try {
    const url = `${baseUrl.replace(/\/$/, '')}/api/health`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });
    
    if (!response.ok) {
      const duration = Date.now() - startTime;
      return createValidationCheck(
        'service-redis',
        'Redis Connection',
        'connectivity',
        'warning',
        'Health check failed (Redis check skipped)',
        {
          errors: [`HTTP ${response.status}: ${response.statusText}`],
          duration,
          critical: false, // Redis is optional
        }
      );
    }
    
    const data = await response.json();
    const duration = Date.now() - startTime;
    const redisStatus = data.checks?.redis || 'unknown';
    
    if (redisStatus === 'ok') {
      return createValidationCheck(
        'service-redis',
        'Redis Connection',
        'connectivity',
        'pass',
        'Redis connection is healthy',
        { duration, critical: false }
      );
    } else if (redisStatus === 'disconnected' || redisStatus === 'error') {
      return createValidationCheck(
        'service-redis',
        'Redis Connection',
        'connectivity',
        'warning',
        `Redis status: ${redisStatus} (optional service)`,
        {
          errors: [`Redis check returned: ${redisStatus}`],
          duration,
          critical: false, // Redis is optional
        }
      );
    } else {
      return createValidationCheck(
        'service-redis',
        'Redis Connection',
        'connectivity',
        'warning',
        `Redis status: ${redisStatus}`,
        {
          errors: [`Redis check returned: ${redisStatus}`],
          duration,
          critical: false,
        }
      );
    }
  } catch (error: any) {
    const duration = Date.now() - startTime;
    return createValidationCheck(
      'service-redis',
      'Redis Connection',
      'connectivity',
      'warning',
      'Failed to check Redis connection (optional service)',
      {
        errors: [error.message || String(error)],
        duration,
        critical: false, // Redis is optional
      }
    );
  }
}

/**
 * Validate G2A API connection via health check
 */
export async function validateG2AConnection(
  baseUrl: string
): Promise<ValidationCheck> {
  const startTime = Date.now();
  
  try {
    const url = `${baseUrl.replace(/\/$/, '')}/api/health`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });
    
    if (!response.ok) {
      const duration = Date.now() - startTime;
      return createValidationCheck(
        'service-g2a',
        'G2A API Connection',
        'connectivity',
        'warning',
        'Health check failed (G2A check skipped)',
        {
          errors: [`HTTP ${response.status}: ${response.statusText}`],
          duration,
          critical: false, // G2A is optional
        }
      );
    }
    
    const data = await response.json();
    const duration = Date.now() - startTime;
    const g2aStatus = data.checks?.g2a || 'unknown';
    
    if (g2aStatus === 'ok') {
      return createValidationCheck(
        'service-g2a',
        'G2A API Connection',
        'connectivity',
        'pass',
        'G2A API connection is healthy',
        { duration, critical: false }
      );
    } else {
      return createValidationCheck(
        'service-g2a',
        'G2A API Connection',
        'connectivity',
        'warning',
        `G2A status: ${g2aStatus} (optional service)`,
        {
          errors: [`G2A check returned: ${g2aStatus}`],
          duration,
          critical: false, // G2A is optional
        }
      );
    }
  } catch (error: any) {
    const duration = Date.now() - startTime;
    return createValidationCheck(
      'service-g2a',
      'G2A API Connection',
      'connectivity',
      'warning',
      'Failed to check G2A connection (optional service)',
      {
        errors: [error.message || String(error)],
        duration,
        critical: false, // G2A is optional
      }
    );
  }
}

/**
 * Validate all services
 */
export async function validateServices(baseUrl: string): Promise<{
  database: ValidationCheck;
  redis: ValidationCheck;
  g2a: ValidationCheck;
}> {
  const [database, redis, g2a] = await Promise.all([
    validateDatabaseConnection(baseUrl),
    validateRedisConnection(baseUrl),
    validateG2AConnection(baseUrl),
  ]);
  
  return { database, redis, g2a };
}
