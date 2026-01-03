# API Contracts: Deployment Verification and Validation

**Feature**: Vercel Deployment Preparation  
**Date**: 2025-01-03

## Overview

This document defines the contracts for deployment verification and validation operations. These are primarily internal tooling APIs, not user-facing endpoints.

## Pre-Deployment Verification API

### Verify Deployment Readiness

**Purpose**: Verify that all components are ready for deployment

**Input**: 
- Deployment configuration
- Environment variable values (for validation)
- Optional: Test suite execution flag

**Output**: Pre-Deployment Verification Report

**Contract**:
```typescript
interface VerifyDeploymentReadinessRequest {
  deploymentType: 'monolithic' | 'separate-frontend' | 'separate-backend';
  skipTests?: boolean;
  environmentVariables?: Record<string, string>;
}

interface VerifyDeploymentReadinessResponse {
  status: 'ready' | 'not-ready' | 'warning';
  timestamp: string;
  checks: VerificationCheck[];
  issues: Issue[];
  recommendations: string[];
  duration: number; // milliseconds
}

interface VerificationCheck {
  id: string;
  name: string;
  category: 'build' | 'environment' | 'database' | 'tests' | 'configuration';
  status: 'pass' | 'fail' | 'warning' | 'skipped';
  message: string;
  errors?: string[];
  duration: number;
  critical: boolean;
}

interface Issue {
  severity: 'error' | 'warning';
  category: string;
  message: string;
  remediation: string;
}
```

**Behavior**:
- Executes all verification checks in sequence
- Stops on first critical failure (if configured)
- Collects all issues for comprehensive report
- Returns overall status based on check results

**Error Handling**:
- Network errors during database connectivity checks → `warning` status
- Missing non-critical environment variables → `warning` status
- Build failures → `fail` status with detailed errors
- Critical environment variable missing → `fail` status

## Post-Deployment Validation API

### Validate Deployment

**Purpose**: Validate that deployed application functions correctly

**Input**:
- Deployment URL
- Expected endpoints to test
- Optional: Service connectivity checks

**Output**: Post-Deployment Validation Report

**Contract**:
```typescript
interface ValidateDeploymentRequest {
  deploymentUrl: string;
  deploymentType: 'monolithic' | 'separate-frontend' | 'separate-backend';
  backendUrl?: string; // Required for separate deployments
  endpointsToTest?: string[]; // Optional: specific endpoints to test
  skipServiceChecks?: boolean;
}

interface ValidateDeploymentResponse {
  status: 'success' | 'partial' | 'failed';
  timestamp: string;
  deploymentUrl: string;
  checks: ValidationCheck[];
  issues: Issue[];
  nextSteps: string[];
  duration: number; // milliseconds
}

interface ValidationCheck {
  id: string;
  name: string;
  category: 'frontend' | 'api' | 'connectivity' | 'cors';
  status: 'pass' | 'fail' | 'warning' | 'timeout';
  message: string;
  endpoint?: string;
  responseTime?: number;
  errors?: string[];
  duration: number;
  critical: boolean;
}
```

**Behavior**:
- Tests frontend accessibility
- Tests all critical API endpoints
- Verifies service connectivity (database, Redis, G2A)
- Checks CORS configuration
- Returns comprehensive validation report

**Error Handling**:
- Timeout on endpoint → `timeout` status with retry suggestion
- CORS errors → `fail` status with configuration guidance
- Service unavailability → `warning` status (if non-critical) or `fail` (if critical)

## Environment Variable Validation API

### Validate Environment Variables

**Purpose**: Validate environment variable configuration

**Input**:
- Environment variable values
- Deployment type
- Optional: Validation rules override

**Output**: Environment Variable Validation Report

**Contract**:
```typescript
interface ValidateEnvironmentVariablesRequest {
  variables: Record<string, string>;
  deploymentType: 'monolithic' | 'separate-frontend' | 'separate-backend';
}

interface ValidateEnvironmentVariablesResponse {
  status: 'valid' | 'invalid' | 'partial';
  timestamp: string;
  variables: EnvironmentVariableValidation[];
  missing: string[];
  invalid: InvalidVariable[];
  recommendations: string[];
}

interface EnvironmentVariableValidation {
  name: string;
  status: 'valid' | 'invalid' | 'missing';
  category: 'frontend' | 'backend' | 'g2a' | 'database' | 'security';
  required: boolean;
  format?: string;
  message: string;
}

interface InvalidVariable {
  name: string;
  reason: string;
  expectedFormat: string;
  currentValue?: string; // Masked for security
}
```

**Behavior**:
- Checks all required variables are present
- Validates variable formats (URLs, connection strings, secrets)
- Verifies variable values meet requirements (length, format)
- Returns detailed validation results

**Error Handling**:
- Missing required variable → `invalid` status
- Invalid format → `invalid` status with format guidance
- Partial validation (some missing, some invalid) → `partial` status

## Build Verification API

### Verify Build Process

**Purpose**: Verify that build commands execute successfully

**Input**:
- Build configuration
- Optional: Build command override

**Output**: Build Verification Report

**Contract**:
```typescript
interface VerifyBuildRequest {
  deploymentType: 'monolithic' | 'separate-frontend' | 'separate-backend';
  buildCommand?: string;
  outputDirectory?: string;
}

interface VerifyBuildResponse {
  status: 'success' | 'failed' | 'warning';
  timestamp: string;
  buildSteps: BuildStep[];
  artifacts: Artifact[];
  errors: BuildError[];
  duration: number;
  recommendations?: string[];
}

interface BuildStep {
  name: string;
  command: string;
  status: 'success' | 'failed' | 'skipped';
  duration: number;
  output?: string;
  errors?: string[];
}

interface Artifact {
  path: string;
  type: 'file' | 'directory';
  exists: boolean;
  size?: number;
}

interface BuildError {
  step: string;
  message: string;
  details?: string;
  remediation?: string;
}
```

**Behavior**:
- Executes build commands in sequence
- Verifies build artifacts are created
- Checks artifact sizes and structure
- Returns detailed build report

**Error Handling**:
- Build command failure → `failed` status with error details
- Missing artifacts → `failed` status with artifact list
- Warnings (non-blocking issues) → `warning` status

## Database Connectivity Verification API

### Verify Database Connectivity

**Purpose**: Verify database connection and migration readiness

**Input**:
- Database connection string
- Optional: Migration verification flag

**Output**: Database Connectivity Report

**Contract**:
```typescript
interface VerifyDatabaseConnectivityRequest {
  databaseUrl: string;
  directUrl?: string;
  verifyMigrations?: boolean;
}

interface VerifyDatabaseConnectivityResponse {
  status: 'connected' | 'failed' | 'timeout';
  timestamp: string;
  connectionTest: ConnectionTest;
  migrationStatus?: MigrationStatus;
  errors: string[];
  recommendations?: string[];
}

interface ConnectionTest {
  status: 'success' | 'failed' | 'timeout';
  responseTime: number;
  error?: string;
}

interface MigrationStatus {
  status: 'ready' | 'pending' | 'failed';
  pendingMigrations: string[];
  errors?: string[];
}
```

**Behavior**:
- Tests database connection with simple query
- Verifies Prisma migrations can be applied
- Checks for pending migrations
- Returns connectivity and migration status

**Error Handling**:
- Connection timeout → `timeout` status with network troubleshooting
- Authentication failure → `failed` status with credential guidance
- Migration errors → `failed` status with migration details
