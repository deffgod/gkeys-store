#!/usr/bin/env tsx
/**
 * Post-Deployment Validation Script
 * 
 * Validates that deployed application functions correctly in production
 */

import { validateFrontend } from './deployment/validate-frontend.js';
import { validateEndpoints, validateHealthCheck } from './deployment/validate-endpoints.js';
import { validateServices } from './deployment/validate-services.js';
import { validateCORS } from './deployment/validate-cors.js';
import { formatValidationReport } from './deployment/utils/validation-report-formatter.js';
import {
  calculateOverallStatus,
  collectIssues,
} from './deployment/utils/validation.js';
import type { PostDeploymentValidationReport } from './deployment/types/validation.js';

/**
 * Main validation function
 */
async function validateDeployment(
  deploymentUrl: string,
  options: {
    backendUrl?: string;
    frontendUrl?: string;
    endpoints?: Array<{
      path: string;
      method?: string;
      expectedStatus?: number;
      critical?: boolean;
    }>;
  } = {}
): Promise<PostDeploymentValidationReport> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  // Determine backend URL (use provided or assume same as deployment URL for monolithic)
  const backendUrl = options.backendUrl || deploymentUrl;
  const frontendUrl = options.frontendUrl || deploymentUrl;
  
  console.log('🔍 Starting post-deployment validation...\n');
  console.log(`Deployment URL: ${deploymentUrl}`);
  if (options.backendUrl) {
    console.log(`Backend URL: ${backendUrl}`);
  }
  if (options.frontendUrl) {
    console.log(`Frontend URL: ${frontendUrl}`);
  }
  console.log('');
  
  const checks: PostDeploymentValidationReport['checks'] = [];
  const nextSteps: string[] = [];
  
  // 1. Frontend Accessibility
  console.log('🌐 Checking frontend accessibility...');
  try {
    const frontendCheck = await validateFrontend(frontendUrl);
    checks.push(frontendCheck);
    
    if (frontendCheck.status === 'fail' || frontendCheck.status === 'timeout') {
      nextSteps.push('Fix frontend deployment issues');
    }
  } catch (error: any) {
    checks.push({
      id: 'frontend-accessibility',
      name: 'Frontend Accessibility',
      category: 'frontend',
      status: 'fail',
      message: 'Frontend validation failed',
      errors: [error.message || String(error)],
      duration: 0,
      critical: true,
    });
  }
  
  // 2. Health Check
  console.log('🏥 Checking health endpoint...');
  try {
    const healthResult = await validateHealthCheck(backendUrl);
    checks.push(healthResult.check);
    
    if (healthResult.check.status === 'fail' || healthResult.check.status === 'timeout') {
      nextSteps.push('Check backend deployment and health endpoint');
    }
  } catch (error: any) {
    checks.push({
      id: 'health-check',
      name: 'Health Check',
      category: 'api',
      status: 'fail',
      message: 'Health check validation failed',
      errors: [error.message || String(error)],
      duration: 0,
      critical: true,
    });
  }
  
  // 3. API Endpoints
  console.log('🔌 Checking API endpoints...');
  try {
    const endpointsResult = await validateEndpoints(backendUrl, options.endpoints);
    checks.push(...endpointsResult.checks);
    
    const failedEndpoints = endpointsResult.checks.filter(c => c.status === 'fail' || c.status === 'timeout');
    if (failedEndpoints.length > 0) {
      nextSteps.push(`Fix ${failedEndpoints.length} failing API endpoint(s)`);
    }
  } catch (error: any) {
    checks.push({
      id: 'api-endpoints',
      name: 'API Endpoints',
      category: 'api',
      status: 'fail',
      message: 'API endpoint validation failed',
      errors: [error.message || String(error)],
      duration: 0,
      critical: true,
    });
  }
  
  // 4. Service Connectivity
  console.log('🔗 Checking service connectivity...');
  try {
    const servicesResult = await validateServices(backendUrl);
    checks.push(servicesResult.database);
    checks.push(servicesResult.redis);
    checks.push(servicesResult.g2a);
    
    if (servicesResult.database.status === 'fail' || servicesResult.database.status === 'timeout') {
      nextSteps.push('Check database connection and DATABASE_URL configuration');
    }
    if (servicesResult.redis.status === 'warning') {
      nextSteps.push('Review Redis configuration (optional service)');
    }
    if (servicesResult.g2a.status === 'warning') {
      nextSteps.push('Review G2A API configuration (optional service)');
    }
  } catch (error: any) {
    checks.push({
      id: 'services',
      name: 'Service Connectivity',
      category: 'connectivity',
      status: 'fail',
      message: 'Service connectivity validation failed',
      errors: [error.message || String(error)],
      duration: 0,
      critical: true,
    });
  }
  
  // 5. CORS Configuration (only for separate deployments)
  if (options.backendUrl && options.frontendUrl && options.backendUrl !== options.frontendUrl) {
    console.log('🌍 Checking CORS configuration...');
    try {
      const corsCheck = await validateCORS(backendUrl, frontendUrl);
      checks.push(corsCheck);
      
      if (corsCheck.status === 'fail') {
        nextSteps.push('Fix CORS configuration in backend (FRONTEND_URL or ALLOWED_ORIGINS)');
      }
    } catch (error: any) {
      checks.push({
        id: 'cors-config',
        name: 'CORS Configuration',
        category: 'cors',
        status: 'fail',
        message: 'CORS validation failed',
        errors: [error.message || String(error)],
        duration: 0,
        critical: true,
      });
    }
  }
  
  const duration = Date.now() - startTime;
  
  // Calculate overall status
  const overallStatus = calculateOverallStatus(checks);
  
  // Collect issues
  const issues = collectIssues(checks);
  
  // Extract health check details
  const healthCheck = checks.find(c => c.id === 'health-check');
  let healthCheckDetails: PostDeploymentValidationReport['healthCheckDetails'];
  if (healthCheck?.status === 'pass') {
    try {
      const url = `${backendUrl.replace(/\/$/, '')}/api/health`;
      const response = await fetch(url);
      const data = await response.json();
      healthCheckDetails = {
        status: data.status || 'unknown',
        timestamp: data.timestamp || new Date().toISOString(),
        services: data.checks || {},
      };
    } catch {
      // Failed to parse health check details
    }
  }
  
  // Build report
  const report: PostDeploymentValidationReport = {
    timestamp,
    deploymentUrl,
    frontendStatus: checks.find(c => c.id === 'frontend-accessibility')?.status || 'skipped',
    frontendErrors: checks.find(c => c.id === 'frontend-accessibility')?.errors || [],
    apiEndpointsStatus: checks.find(c => c.category === 'api' && c.id !== 'health-check')?.status || 'skipped',
    endpointResults: checks
      .filter(c => c.category === 'api' && c.endpoint && c.id !== 'health-check')
      .reduce((acc, check) => {
        if (check.endpoint) {
          acc[check.endpoint] = {
            status: check.status,
            responseTime: check.responseTime,
            errors: check.errors,
          };
        }
        return acc;
      }, {} as Record<string, { status: ValidationCheck['status']; responseTime?: number; errors?: string[] }>),
    healthCheckStatus: checks.find(c => c.id === 'health-check')?.status || 'skipped',
    healthCheckDetails,
    databaseConnectionStatus: checks.find(c => c.id === 'service-database')?.status || 'skipped',
    redisConnectionStatus: checks.find(c => c.id === 'service-redis')?.status,
    g2aConnectionStatus: checks.find(c => c.id === 'service-g2a')?.status,
    corsStatus: checks.find(c => c.id === 'cors-config')?.status || 'skipped',
    corsErrors: checks.find(c => c.id === 'cors-config')?.errors || [],
    overallStatus,
    issues,
    nextSteps,
    checks,
    duration,
  };
  
  return report;
}

/**
 * Main entry point
 */
async function main() {
  // Parse command line arguments
  const urlArg = process.argv.find(arg => arg.startsWith('--url='));
  const backendUrlArg = process.argv.find(arg => arg.startsWith('--backend-url='));
  const frontendUrlArg = process.argv.find(arg => arg.startsWith('--frontend-url='));
  
  if (!urlArg) {
    console.error('❌ Deployment URL is required');
    console.error('Usage: npm run validate:deployment -- --url=https://your-project.vercel.app');
    console.error('For separate deployments:');
    console.error('  npm run validate:deployment -- --url=https://frontend.vercel.app --backend-url=https://backend.vercel.app');
    process.exit(1);
  }
  
  const deploymentUrl = urlArg.split('=')[1];
  const backendUrl = backendUrlArg ? backendUrlArg.split('=')[1] : undefined;
  const frontendUrl = frontendUrlArg ? frontendUrlArg.split('=')[1] : undefined;
  
  try {
    const report = await validateDeployment(deploymentUrl, {
      backendUrl,
      frontendUrl,
    });
    
    // Print formatted report
    console.log('\n');
    console.log(formatValidationReport(report));
    
    // Exit with appropriate code
    if (report.overallStatus === 'success') {
      process.exit(0);
    } else if (report.overallStatus === 'partial') {
      console.log('\n⚠️  Validation completed with warnings. Review issues before production use.');
      process.exit(0);
    } else {
      console.log('\n❌ Validation failed. Fix critical issues before production use.');
      process.exit(1);
    }
  } catch (error: any) {
    console.error('❌ Validation failed:', error.message || String(error));
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { validateDeployment };
