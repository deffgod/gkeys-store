/**
 * Frontend accessibility validation for post-deployment checks
 */

import type { ValidationCheck } from './types/validation.js';
import { createValidationCheck } from './utils/validation.js';

/**
 * Verify frontend accessibility
 */
export async function validateFrontend(deploymentUrl: string): Promise<ValidationCheck> {
  const startTime = Date.now();
  
  try {
    // Normalize URL (remove trailing slash)
    const normalizedUrl = deploymentUrl.replace(/\/$/, '');
    
    // Fetch frontend page
    const response = await fetch(normalizedUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/html',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });
    
    const duration = Date.now() - startTime;
    const responseTime = duration;
    
    if (!response.ok) {
      return createValidationCheck(
        'frontend-accessibility',
        'Frontend Accessibility',
        'frontend',
        'fail',
        `Frontend returned status ${response.status}`,
        {
          errors: [`HTTP ${response.status}: ${response.statusText}`],
          responseTime,
          duration,
          critical: true,
        }
      );
    }
    
    // Check if response is HTML
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('text/html')) {
      return createValidationCheck(
        'frontend-accessibility',
        'Frontend Accessibility',
        'frontend',
        'warning',
        'Frontend response is not HTML',
        {
          errors: [`Expected HTML, got: ${contentType}`],
          responseTime,
          duration,
          critical: false,
        }
      );
    }
    
    // Check response body for common errors
    const text = await response.text();
    const hasErrors = text.includes('Error') && 
                     (text.includes('404') || text.includes('500') || text.includes('Failed'));
    
    if (hasErrors) {
      return createValidationCheck(
        'frontend-accessibility',
        'Frontend Accessibility',
        'frontend',
        'warning',
        'Frontend page may contain errors',
        {
          errors: ['Page content suggests errors may be present'],
          responseTime,
          duration,
          critical: false,
        }
      );
    }
    
    return createValidationCheck(
      'frontend-accessibility',
      'Frontend Accessibility',
      'frontend',
      'pass',
      `Frontend is accessible (${responseTime}ms)`,
      {
        responseTime,
        duration,
        critical: true,
      }
    );
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    // Check if it's a timeout
    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      return createValidationCheck(
        'frontend-accessibility',
        'Frontend Accessibility',
        'frontend',
        'timeout',
        'Frontend request timed out',
        {
          errors: ['Request exceeded 10 second timeout'],
          duration,
          critical: true,
        }
      );
    }
    
    return createValidationCheck(
      'frontend-accessibility',
      'Frontend Accessibility',
      'frontend',
      'fail',
      'Failed to access frontend',
      {
        errors: [error.message || String(error)],
        duration,
        critical: true,
      }
    );
  }
}
