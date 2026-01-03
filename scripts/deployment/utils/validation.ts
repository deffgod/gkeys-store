/**
 * Validation utilities for post-deployment checks
 */

import type {
  ValidationCheck,
  ValidationCheckStatus,
  Issue,
} from '../types/validation.js';

/**
 * Create a validation check result
 */
export function createValidationCheck(
  id: string,
  name: string,
  category: ValidationCheck['category'],
  status: ValidationCheckStatus,
  message: string,
  options: {
    endpoint?: string;
    responseTime?: number;
    errors?: string[];
    duration?: number;
    critical?: boolean;
  } = {}
): ValidationCheck {
  return {
    id,
    name,
    category,
    status,
    message,
    endpoint: options.endpoint,
    responseTime: options.responseTime,
    errors: options.errors,
    duration: options.duration ?? 0,
    critical: options.critical ?? true,
  };
}

/**
 * Create an issue for the validation report
 */
export function createIssue(
  severity: Issue['severity'],
  category: string,
  message: string,
  remediation: string
): Issue {
  return {
    severity,
    category,
    message,
    remediation,
  };
}

/**
 * Calculate overall status from checks
 */
export function calculateOverallStatus(
  checks: ValidationCheck[]
): 'success' | 'partial' | 'failed' {
  const criticalChecks = checks.filter(c => c.critical);
  const failedCritical = criticalChecks.some(c => c.status === 'fail' || c.status === 'timeout');
  const warnings = checks.some(c => c.status === 'warning');
  const allPassed = checks.every(c => c.status === 'pass');
  
  if (failedCritical) {
    return 'failed';
  }
  
  if (warnings || !allPassed) {
    return 'partial';
  }
  
  return 'success';
}

/**
 * Collect all issues from checks
 */
export function collectIssues(checks: ValidationCheck[]): Issue[] {
  const issues: Issue[] = [];
  
  for (const check of checks) {
    if ((check.status === 'fail' || check.status === 'timeout') && check.errors) {
      for (const error of check.errors) {
        issues.push(createIssue(
          check.critical ? 'error' : 'warning',
          check.category,
          error,
          `Fix ${check.name.toLowerCase()} issues`
        ));
      }
    } else if (check.status === 'warning') {
      issues.push(createIssue(
        'warning',
        check.category,
        check.message,
        `Review ${check.name.toLowerCase()}`
      ));
    }
  }
  
  return issues;
}
