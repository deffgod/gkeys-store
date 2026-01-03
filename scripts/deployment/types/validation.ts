/**
 * Types for Post-Deployment Validation
 * Based on data-model.md
 */

export type ValidationCheckStatus = 'pass' | 'fail' | 'warning' | 'timeout';
export type ValidationCheckCategory = 'frontend' | 'api' | 'connectivity' | 'cors';
export type OverallValidationStatus = 'success' | 'partial' | 'failed';

export interface ValidationCheck {
  id: string;
  name: string;
  category: ValidationCheckCategory;
  status: ValidationCheckStatus;
  message: string;
  endpoint?: string;
  responseTime?: number; // milliseconds
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

export interface PostDeploymentValidationReport {
  timestamp: string;
  deploymentUrl: string;
  frontendStatus: ValidationCheckStatus;
  frontendErrors: string[];
  apiEndpointsStatus: ValidationCheckStatus;
  endpointResults: Record<string, {
    status: ValidationCheckStatus;
    responseTime?: number;
    errors?: string[];
  }>;
  healthCheckStatus: ValidationCheckStatus;
  healthCheckDetails?: {
    status: string;
    timestamp: string;
    services?: Record<string, string>;
  };
  databaseConnectionStatus: ValidationCheckStatus;
  redisConnectionStatus?: ValidationCheckStatus;
  g2aConnectionStatus?: ValidationCheckStatus;
  corsStatus: ValidationCheckStatus;
  corsErrors: string[];
  overallStatus: OverallValidationStatus;
  issues: Issue[];
  nextSteps: string[];
  checks: ValidationCheck[];
  duration: number; // milliseconds
}
