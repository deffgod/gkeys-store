/**
 * API endpoint validation for post-deployment checks
 */

import type { ValidationCheck } from './types/validation.js';
import { createValidationCheck } from './utils/validation.js';

export interface EndpointResult {
  status: ValidationCheck['status'];
  responseTime?: number;
  errors?: string[];
}

/**
 * Validate a single API endpoint
 */
async function validateEndpoint(
  baseUrl: string,
  path: string,
  options: {
    method?: string;
    expectedStatus?: number;
    timeout?: number;
  } = {}
): Promise<ValidationCheck> {
  const startTime = Date.now();
  const method = options.method || 'GET';
  const expectedStatus = options.expectedStatus || 200;
  const timeout = options.timeout || 10000; // 10 seconds
  
  try {
    const url = `${baseUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      method,
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    const responseTime = duration;
    
    if (response.status !== expectedStatus) {
      return createValidationCheck(
        `endpoint-${path.replace(/\//g, '-')}`,
        `API Endpoint: ${path}`,
        'api',
        response.status >= 500 ? 'fail' : 'warning',
        `Endpoint returned status ${response.status}, expected ${expectedStatus}`,
        {
          endpoint: path,
          errors: [`HTTP ${response.status}: ${response.statusText}`],
          responseTime,
          duration,
          critical: path === '/api/health' || path === '/health',
        }
      );
    }
    
    // Try to parse JSON response
    try {
      await response.json();
    } catch {
      // Not JSON, that's okay for some endpoints
    }
    
    return createValidationCheck(
      `endpoint-${path.replace(/\//g, '-')}`,
      `API Endpoint: ${path}`,
      'api',
      'pass',
      `Endpoint responded successfully (${responseTime}ms)`,
      {
        endpoint: path,
        responseTime,
        duration,
        critical: path === '/api/health' || path === '/health',
      }
    );
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      return createValidationCheck(
        `endpoint-${path.replace(/\//g, '-')}`,
        `API Endpoint: ${path}`,
        'api',
        'timeout',
        `Endpoint request timed out after ${timeout}ms`,
        {
          endpoint: path,
          errors: ['Request timeout'],
          duration,
          critical: path === '/api/health' || path === '/health',
        }
      );
    }
    
    return createValidationCheck(
      `endpoint-${path.replace(/\//g, '-')}`,
      `API Endpoint: ${path}`,
      'api',
      'fail',
      `Failed to reach endpoint`,
      {
        endpoint: path,
        errors: [error.message || String(error)],
        duration,
        critical: path === '/api/health' || path === '/health',
      }
    );
  }
}

/**
 * Validate health check endpoint
 */
export async function validateHealthCheck(baseUrl: string): Promise<{
  check: ValidationCheck;
  details?: {
    status: string;
    timestamp: string;
    services?: Record<string, string>;
  };
}> {
  const check = await validateEndpoint(baseUrl, '/api/health', {
    expectedStatus: 200,
  });
  
  let details: {
    status: string;
    timestamp: string;
    services?: Record<string, string>;
  } | undefined;
  
  if (check.status === 'pass') {
    try {
      const url = `${baseUrl.replace(/\/$/, '')}/api/health`;
      const response = await fetch(url);
      const data = await response.json();
      details = {
        status: data.status || 'unknown',
        timestamp: data.timestamp || new Date().toISOString(),
        services: data.checks || {},
      };
    } catch {
      // Failed to parse health check details
    }
  }
  
  return { check, details };
}

/**
 * Validate critical API endpoints
 */
export async function validateEndpoints(
  baseUrl: string,
  endpoints: Array<{
    path: string;
    method?: string;
    expectedStatus?: number;
    critical?: boolean;
  }> = []
): Promise<{
  checks: ValidationCheck[];
  results: Record<string, EndpointResult>;
}> {
  // Default critical endpoints
  const defaultEndpoints = [
    { path: '/api/health', critical: true },
    { path: '/api/auth/register', method: 'POST', expectedStatus: 400, critical: false }, // Should return validation error, not 404
    { path: '/api/games', critical: false },
  ];
  
  const endpointsToCheck = endpoints.length > 0 ? endpoints : defaultEndpoints;
  
  const checks = await Promise.all(
    endpointsToCheck.map(endpoint =>
      validateEndpoint(baseUrl, endpoint.path, {
        method: endpoint.method,
        expectedStatus: endpoint.expectedStatus,
      }).then(check => ({
        ...check,
        critical: endpoint.critical ?? check.critical,
      }))
    )
  );
  
  const results: Record<string, EndpointResult> = {};
  for (const check of checks) {
    if (check.endpoint) {
      results[check.endpoint] = {
        status: check.status,
        responseTime: check.responseTime,
        errors: check.errors,
      };
    }
  }
  
  return { checks, results };
}
