/**
 * CORS validation for post-deployment checks
 */

import type { ValidationCheck } from './types/validation.js';
import { createValidationCheck } from './utils/validation.js';

/**
 * Validate CORS configuration
 */
export async function validateCORS(
  backendUrl: string,
  frontendUrl?: string
): Promise<ValidationCheck> {
  const startTime = Date.now();
  
  if (!frontendUrl) {
    const duration = Date.now() - startTime;
    return createValidationCheck(
      'cors-config',
      'CORS Configuration',
      'cors',
      'warning',
      'Frontend URL not provided, CORS check skipped',
      {
        duration,
        critical: false,
      }
    );
  }
  
  try {
    // Make a preflight OPTIONS request
    const url = `${backendUrl.replace(/\/$/, '')}/api/health`;
    const response = await fetch(url, {
      method: 'OPTIONS',
      headers: {
        'Origin': frontendUrl,
        'Access-Control-Request-Method': 'GET',
      },
      signal: AbortSignal.timeout(10000),
    });
    
    const duration = Date.now() - startTime;
    
    // Check for CORS headers
    const accessControlAllowOrigin = response.headers.get('Access-Control-Allow-Origin');
    const accessControlAllowMethods = response.headers.get('Access-Control-Allow-Methods');
    const accessControlAllowCredentials = response.headers.get('Access-Control-Allow-Credentials');
    
    if (!accessControlAllowOrigin) {
      return createValidationCheck(
        'cors-config',
        'CORS Configuration',
        'cors',
        'fail',
        'CORS headers not present',
        {
          errors: [
            'Access-Control-Allow-Origin header missing',
            'CORS may not be configured correctly',
          ],
          duration,
          critical: true,
        }
      );
    }
    
    // Check if origin is allowed
    const normalizedFrontend = frontendUrl.replace(/\/$/, '').toLowerCase();
    const normalizedAllowed = accessControlAllowOrigin.toLowerCase();
    const isAllowed = normalizedAllowed === '*' || 
                     normalizedAllowed === normalizedFrontend ||
                     normalizedAllowed.includes(normalizedFrontend);
    
    if (!isAllowed && normalizedAllowed !== '*') {
      return createValidationCheck(
        'cors-config',
        'CORS Configuration',
        'cors',
        'fail',
        'Frontend origin not allowed by CORS',
        {
          errors: [
            `Frontend origin: ${frontendUrl}`,
            `Allowed origin: ${accessControlAllowOrigin}`,
            'Update FRONTEND_URL or ALLOWED_ORIGINS in backend environment variables',
          ],
          duration,
          critical: true,
        }
      );
    }
    
    // Check if credentials are allowed (important for authenticated requests)
    if (accessControlAllowCredentials !== 'true' && accessControlAllowOrigin !== '*') {
      return createValidationCheck(
        'cors-config',
        'CORS Configuration',
        'cors',
        'warning',
        'CORS credentials not enabled',
        {
          errors: [
            'Access-Control-Allow-Credentials is not set to true',
            'Authenticated requests may fail',
          ],
          duration,
          critical: false,
        }
      );
    }
    
    return createValidationCheck(
      'cors-config',
      'CORS Configuration',
      'cors',
      'pass',
      'CORS is configured correctly',
      {
        duration,
        critical: true,
      }
    );
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      return createValidationCheck(
        'cors-config',
        'CORS Configuration',
        'cors',
        'timeout',
        'CORS check timed out',
        {
          errors: ['Request exceeded 10 second timeout'],
          duration,
          critical: true,
        }
      );
    }
    
    return createValidationCheck(
      'cors-config',
      'CORS Configuration',
      'cors',
      'fail',
      'Failed to check CORS configuration',
      {
        errors: [error.message || String(error)],
        duration,
        critical: true,
      }
    );
  }
}
