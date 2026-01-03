/**
 * Types for Pre-Deployment Verification
 * Based on data-model.md
 */

export type VerificationCheckStatus = 'pass' | 'fail' | 'warning' | 'skipped';
export type VerificationCheckCategory = 'build' | 'environment' | 'database' | 'tests' | 'configuration';
export type OverallVerificationStatus = 'ready' | 'not-ready' | 'warning';

export interface VerificationCheck {
  id: string;
  name: string;
  category: VerificationCheckCategory;
  status: VerificationCheckStatus;
  message: string;
  errors?: string[];
  duration: number; // milliseconds
  critical: boolean;
}

export interface Issue {
  severity: 'error' | 'warning';
  category: string;
  message: string;
  remediation: string;
}

export interface PreDeploymentVerificationReport {
  timestamp: string;
  buildStatus: VerificationCheckStatus;
  buildErrors: string[];
  environmentVariablesStatus: VerificationCheckStatus;
  missingVariables: string[];
  invalidVariables: Array<{
    name: string;
    reason: string;
  }>;
  databaseConnectivityStatus: VerificationCheckStatus;
  databaseErrors: string[];
  migrationStatus: VerificationCheckStatus;
  migrationErrors: string[];
  testStatus: VerificationCheckStatus;
  testFailures: string[];
  overallStatus: OverallVerificationStatus;
  issues: Issue[];
  recommendations: string[];
  checks: VerificationCheck[];
  duration: number; // milliseconds
}
