/**
 * Report formatter for post-deployment validation
 */

import type { PostDeploymentValidationReport, ValidationCheck } from '../types/validation.js';

/**
 * Format validation check status with emoji
 */
function formatStatus(status: ValidationCheck['status']): string {
  switch (status) {
    case 'pass':
      return '✅ PASS';
    case 'fail':
      return '❌ FAIL';
    case 'warning':
      return '⚠️  WARNING';
    case 'timeout':
      return '⏱️  TIMEOUT';
    default:
      return status.toUpperCase();
  }
}

/**
 * Format overall status with emoji
 */
function formatOverallStatus(status: PostDeploymentValidationReport['overallStatus']): string {
  switch (status) {
    case 'success':
      return '✅ SUCCESS';
    case 'partial':
      return '⚠️  PARTIAL';
    case 'failed':
      return '❌ FAILED';
    default:
      return status.toUpperCase();
  }
}

/**
 * Format duration in human-readable format
 */
function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

/**
 * Format validation report as human-readable text
 */
export function formatValidationReport(report: PostDeploymentValidationReport): string {
  const lines: string[] = [];
  
  lines.push('='.repeat(80));
  lines.push('POST-DEPLOYMENT VALIDATION REPORT');
  lines.push('='.repeat(80));
  lines.push(`Timestamp: ${report.timestamp}`);
  lines.push(`Deployment URL: ${report.deploymentUrl}`);
  lines.push(`Overall Status: ${formatOverallStatus(report.overallStatus)}`);
  lines.push(`Duration: ${formatDuration(report.duration)}`);
  lines.push('');
  
  // Summary section
  lines.push('SUMMARY');
  lines.push('-'.repeat(80));
  const passed = report.checks.filter(c => c.status === 'pass').length;
  const failed = report.checks.filter(c => c.status === 'fail' || c.status === 'timeout').length;
  const warnings = report.checks.filter(c => c.status === 'warning').length;
  lines.push(`Total Checks: ${report.checks.length}`);
  lines.push(`Passed: ${passed}`);
  lines.push(`Failed: ${failed}`);
  lines.push(`Warnings: ${warnings}`);
  lines.push('');
  
  // Frontend section
  lines.push('FRONTEND');
  lines.push('-'.repeat(80));
  lines.push(`Status: ${formatStatus(report.frontendStatus)}`);
  if (report.frontendErrors.length > 0) {
    lines.push('Errors:');
    for (const error of report.frontendErrors) {
      lines.push(`  - ${error}`);
    }
  }
  lines.push('');
  
  // Health Check section
  lines.push('HEALTH CHECK');
  lines.push('-'.repeat(80));
  lines.push(`Status: ${formatStatus(report.healthCheckStatus)}`);
  if (report.healthCheckDetails) {
    lines.push(`Overall Status: ${report.healthCheckDetails.status}`);
    lines.push(`Timestamp: ${report.healthCheckDetails.timestamp}`);
    if (report.healthCheckDetails.services) {
      lines.push('Services:');
      for (const [service, status] of Object.entries(report.healthCheckDetails.services)) {
        const emoji = status === 'ok' ? '✅' : '❌';
        lines.push(`  ${emoji} ${service}: ${status}`);
      }
    }
  }
  lines.push('');
  
  // API Endpoints section
  lines.push('API ENDPOINTS');
  lines.push('-'.repeat(80));
  lines.push(`Status: ${formatStatus(report.apiEndpointsStatus)}`);
  if (Object.keys(report.endpointResults).length > 0) {
    for (const [endpoint, result] of Object.entries(report.endpointResults)) {
      lines.push(`${formatStatus(result.status)} ${endpoint}`);
      if (result.responseTime) {
        lines.push(`  Response Time: ${formatDuration(result.responseTime)}`);
      }
      if (result.errors && result.errors.length > 0) {
        lines.push(`  Errors:`);
        for (const error of result.errors) {
          lines.push(`    - ${error}`);
        }
      }
      lines.push('');
    }
  }
  lines.push('');
  
  // Service Connectivity section
  lines.push('SERVICE CONNECTIVITY');
  lines.push('-'.repeat(80));
  lines.push(`Database: ${formatStatus(report.databaseConnectionStatus)}`);
  if (report.redisConnectionStatus) {
    lines.push(`Redis: ${formatStatus(report.redisConnectionStatus)} (optional)`);
  }
  if (report.g2aConnectionStatus) {
    lines.push(`G2A API: ${formatStatus(report.g2aConnectionStatus)} (optional)`);
  }
  lines.push('');
  
  // CORS section
  lines.push('CORS CONFIGURATION');
  lines.push('-'.repeat(80));
  lines.push(`Status: ${formatStatus(report.corsStatus)}`);
  if (report.corsErrors.length > 0) {
    lines.push('Errors:');
    for (const error of report.corsErrors) {
      lines.push(`  - ${error}`);
    }
  }
  lines.push('');
  
  // Issues section
  if (report.issues.length > 0) {
    lines.push('ISSUES');
    lines.push('-'.repeat(80));
    for (const issue of report.issues) {
      const emoji = issue.severity === 'error' ? '❌' : '⚠️';
      lines.push(`${emoji} [${issue.category.toUpperCase()}] ${issue.message}`);
      lines.push(`   Remediation: ${issue.remediation}`);
      lines.push('');
    }
  }
  
  // Next Steps section
  if (report.nextSteps.length > 0) {
    lines.push('NEXT STEPS');
    lines.push('-'.repeat(80));
    for (const step of report.nextSteps) {
      lines.push(`💡 ${step}`);
    }
    lines.push('');
  }
  
  // Final status
  lines.push('='.repeat(80));
  if (report.overallStatus === 'success') {
    lines.push('✅ DEPLOYMENT VALIDATION SUCCESSFUL - Application is ready for production');
  } else if (report.overallStatus === 'partial') {
    lines.push('⚠️  DEPLOYMENT VALIDATION PARTIAL - Some issues found, review before production use');
  } else {
    lines.push('❌ DEPLOYMENT VALIDATION FAILED - Fix critical issues before production use');
  }
  lines.push('='.repeat(80));
  
  return lines.join('\n');
}

/**
 * Format validation report as JSON
 */
export function formatValidationReportJson(report: PostDeploymentValidationReport): string {
  return JSON.stringify(report, null, 2);
}
