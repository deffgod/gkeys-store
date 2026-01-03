#!/usr/bin/env tsx
/**
 * Pre-Deployment Verification Script
 * 
 * Verifies that all components are ready for production deployment
 */

import { checkEnvironmentVariables, type DeploymentType } from './check-env.js';
import { verifyBuilds } from './deployment/verify-build.js';
import { verifyDatabase } from './deployment/verify-database.js';
import { verifyTests } from './deployment/verify-tests.js';
import { verifyConfiguration } from './deployment/verify-config.js';
import { formatVerificationReport } from './deployment/utils/report-formatter.js';
import {
  createVerificationCheck,
  calculateOverallStatus,
  collectIssues,
} from './deployment/utils/verification.js';
import type { PreDeploymentVerificationReport } from './deployment/types/verification.js';

/**
 * Main verification function
 */
async function verifyDeployment(deploymentType?: DeploymentType): Promise<PreDeploymentVerificationReport> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  const checks: PreDeploymentVerificationReport['checks'] = [];
  const recommendations: string[] = [];
  
  console.log('🔍 Starting pre-deployment verification...\n');
  
  // 1. Environment Variables Check
  console.log('📋 Checking environment variables...');
  try {
    const envResults = checkEnvironmentVariables(deploymentType);
    const missingVars = envResults.filter(r => !r.exists && r.var.required).map(r => r.var.name);
    const invalidVars = envResults
      .filter(r => r.exists && !r.valid)
      .map(r => ({
        name: r.var.name,
        reason: r.error || 'Invalid format',
      }));
    
    const envStatus = missingVars.length > 0 || invalidVars.length > 0 ? 'fail' : 'pass';
    
    checks.push(createVerificationCheck(
      'env-variables',
      'Environment Variables',
      'environment',
      envStatus,
      missingVars.length > 0
        ? `${missingVars.length} required variables missing`
        : invalidVars.length > 0
        ? `${invalidVars.length} variables have invalid format`
        : 'All required environment variables are set and valid',
      {
        errors: [
          ...missingVars.map(v => `Missing: ${v}`),
          ...invalidVars.map(v => `Invalid ${v.name}: ${v.reason}`),
        ],
        duration: 0,
        critical: true,
      }
    ));
  } catch (error: any) {
    checks.push(createVerificationCheck(
      'env-variables',
      'Environment Variables',
      'environment',
      'fail',
      'Environment variable check failed',
      {
        errors: [error.message || String(error)],
        duration: 0,
        critical: true,
      }
    ));
  }
  
  // 2. Build Verification
  console.log('🔨 Verifying builds...');
  try {
    const buildResults = await verifyBuilds();
    checks.push(buildResults.frontend.check);
    checks.push(buildResults.backend.check);
    
    if (buildResults.frontend.check.status === 'fail' || buildResults.backend.check.status === 'fail') {
      recommendations.push('Fix build errors before deployment');
    }
  } catch (error: any) {
    checks.push(createVerificationCheck(
      'build',
      'Build Verification',
      'build',
      'fail',
      'Build verification failed',
      {
        errors: [error.message || String(error)],
        duration: 0,
        critical: true,
      }
    ));
  }
  
  // 3. Database Verification
  console.log('🗄️  Verifying database connectivity...');
  try {
    const dbResults = await verifyDatabase();
    checks.push(dbResults.connectivity);
    checks.push(dbResults.migrations);
    
    if (dbResults.connectivity.status === 'fail') {
      recommendations.push('Check DATABASE_URL and ensure database is accessible');
    }
    if (dbResults.migrations.status === 'fail') {
      recommendations.push('Review and fix Prisma migration issues');
    }
  } catch (error: any) {
    checks.push(createVerificationCheck(
      'database',
      'Database Verification',
      'database',
      'fail',
      'Database verification failed',
      {
        errors: [error.message || String(error)],
        duration: 0,
        critical: true,
      }
    ));
  }
  
  // 4. Test Suite Verification
  console.log('🧪 Verifying test suite...');
  try {
    const testCheck = await verifyTests();
    checks.push(testCheck);
    
    if (testCheck.status === 'fail') {
      recommendations.push('Fix failing tests before deployment');
    } else if (testCheck.status === 'warning') {
      recommendations.push('Review test warnings');
    }
  } catch (error: any) {
    checks.push(createVerificationCheck(
      'tests',
      'Test Suite',
      'tests',
      'warning',
      'Test verification encountered an error',
      {
        errors: [error.message || String(error)],
        duration: 0,
        critical: false,
      }
    ));
  }
  
  // 5. Configuration Verification
  console.log('⚙️  Verifying configuration...');
  try {
    const configResults = await verifyConfiguration();
    checks.push(configResults.vercel);
    checks.push(configResults.apiEntry);
    
    if (configResults.vercel.status === 'fail' || configResults.apiEntry.status === 'fail') {
      recommendations.push('Fix configuration issues before deployment');
    }
  } catch (error: any) {
    checks.push(createVerificationCheck(
      'config',
      'Configuration',
      'configuration',
      'fail',
      'Configuration verification failed',
      {
        errors: [error.message || String(error)],
        duration: 0,
        critical: true,
      }
    ));
  }
  
  const duration = Date.now() - startTime;
  
  // Calculate overall status
  const overallStatus = calculateOverallStatus(checks);
  
  // Collect issues
  const issues = collectIssues(checks);
  
  // Build report
  const report: PreDeploymentVerificationReport = {
    timestamp,
    buildStatus: checks.find(c => c.category === 'build')?.status || 'skipped',
    buildErrors: checks
      .filter(c => c.category === 'build' && c.errors)
      .flatMap(c => c.errors || []),
    environmentVariablesStatus: checks.find(c => c.id === 'env-variables')?.status || 'skipped',
    missingVariables: checks
      .find(c => c.id === 'env-variables')
      ?.errors?.filter(e => e.startsWith('Missing:'))
      .map(e => e.replace('Missing: ', '')) || [],
    invalidVariables: checks
      .find(c => c.id === 'env-variables')
      ?.errors?.filter(e => e.startsWith('Invalid'))
      .map(e => {
        const match = e.match(/Invalid (\w+): (.+)/);
        return match ? { name: match[1], reason: match[2] } : { name: 'unknown', reason: e };
      }) || [],
    databaseConnectivityStatus: checks.find(c => c.id === 'database-connectivity')?.status || 'skipped',
    databaseErrors: checks.find(c => c.id === 'database-connectivity')?.errors || [],
    migrationStatus: checks.find(c => c.id === 'migrations')?.status || 'skipped',
    migrationErrors: checks.find(c => c.id === 'migrations')?.errors || [],
    testStatus: checks.find(c => c.id === 'tests')?.status || 'skipped',
    testFailures: checks.find(c => c.id === 'tests')?.errors || [],
    overallStatus,
    issues,
    recommendations,
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
  const deploymentTypeArg = process.argv.find(arg => 
    arg.startsWith('--deployment-type=') || arg.startsWith('--type=')
  );
  const deploymentType: DeploymentType | undefined = deploymentTypeArg
    ? (deploymentTypeArg.split('=')[1] as DeploymentType)
    : undefined;
  
  if (deploymentType && !['monolithic', 'separate-frontend', 'separate-backend'].includes(deploymentType)) {
    console.error(`❌ Invalid deployment type: ${deploymentType}`);
    console.error('Valid values: monolithic, separate-frontend, separate-backend');
    process.exit(1);
  }
  
  try {
    const report = await verifyDeployment(deploymentType);
    
    // Print formatted report
    console.log('\n');
    console.log(formatVerificationReport(report));
    
    // Exit with appropriate code
    if (report.overallStatus === 'ready') {
      process.exit(0);
    } else if (report.overallStatus === 'warning') {
      console.log('\n⚠️  Deployment ready with warnings. Review and proceed with caution.');
      process.exit(0);
    } else {
      console.log('\n❌ Deployment not ready. Fix issues before deploying.');
      process.exit(1);
    }
  } catch (error: any) {
    console.error('❌ Verification failed:', error.message || String(error));
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { verifyDeployment };
