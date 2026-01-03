/**
 * Verification utilities for pre-deployment checks
 */

import type {
  VerificationCheck,
  VerificationCheckStatus,
  Issue,
} from '../types/verification.js';

/**
 * Create a verification check result
 */
export function createVerificationCheck(
  id: string,
  name: string,
  category: VerificationCheck['category'],
  status: VerificationCheckStatus,
  message: string,
  options: {
    errors?: string[];
    duration?: number;
    critical?: boolean;
  } = {}
): VerificationCheck {
  return {
    id,
    name,
    category,
    status,
    message,
    errors: options.errors,
    duration: options.duration ?? 0,
    critical: options.critical ?? true,
  };
}

/**
 * Create an issue for the verification report
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
  checks: VerificationCheck[]
): 'ready' | 'not-ready' | 'warning' {
  const criticalChecks = checks.filter(c => c.critical);
  const failedCritical = criticalChecks.some(c => c.status === 'fail');
  const warnings = checks.some(c => c.status === 'warning');
  
  if (failedCritical) {
    return 'not-ready';
  }
  
  if (warnings) {
    return 'warning';
  }
  
  return 'ready';
}

/**
 * Collect all issues from checks
 */
export function collectIssues(checks: VerificationCheck[]): Issue[] {
  const issues: Issue[] = [];
  
  for (const check of checks) {
    if (check.status === 'fail' && check.errors) {
      for (const error of check.errors) {
        issues.push(createIssue(
          check.critical ? 'error' : 'warning',
          check.category,
          error,
          `Fix ${check.name.toLowerCase()} issues before deployment`
        ));
      }
    } else if (check.status === 'warning') {
      issues.push(createIssue(
        'warning',
        check.category,
        check.message,
        `Review ${check.name.toLowerCase()} before deployment`
      ));
    }
  }
  
  return issues;
}
