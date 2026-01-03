/**
 * Report formatter for pre-deployment verification
 */

import type { PreDeploymentVerificationReport, VerificationCheck } from '../types/verification.js';

/**
 * Format verification check status with emoji
 */
function formatStatus(status: VerificationCheck['status']): string {
  switch (status) {
    case 'pass':
      return '✅ PASS';
    case 'fail':
      return '❌ FAIL';
    case 'warning':
      return '⚠️  WARNING';
    case 'skipped':
      return '⏭️  SKIPPED';
    default:
      return status.toUpperCase();
  }
}

/**
 * Format overall status with emoji
 */
function formatOverallStatus(status: PreDeploymentVerificationReport['overallStatus']): string {
  switch (status) {
    case 'ready':
      return '✅ READY';
    case 'not-ready':
      return '❌ NOT READY';
    case 'warning':
      return '⚠️  WARNING';
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
 * Format verification report as human-readable text
 */
export function formatVerificationReport(report: PreDeploymentVerificationReport): string {
  const lines: string[] = [];
  
  lines.push('='.repeat(80));
  lines.push('PRE-DEPLOYMENT VERIFICATION REPORT');
  lines.push('='.repeat(80));
  lines.push(`Timestamp: ${report.timestamp}`);
  lines.push(`Overall Status: ${formatOverallStatus(report.overallStatus)}`);
  lines.push(`Duration: ${formatDuration(report.duration)}`);
  lines.push('');
  
  // Summary section
  lines.push('SUMMARY');
  lines.push('-'.repeat(80));
  const passed = report.checks.filter(c => c.status === 'pass').length;
  const failed = report.checks.filter(c => c.status === 'fail').length;
  const warnings = report.checks.filter(c => c.status === 'warning').length;
  lines.push(`Total Checks: ${report.checks.length}`);
  lines.push(`Passed: ${passed}`);
  lines.push(`Failed: ${failed}`);
  lines.push(`Warnings: ${warnings}`);
  lines.push('');
  
  // Checks by category
  const categories = ['build', 'environment', 'database', 'tests', 'configuration'] as const;
  for (const category of categories) {
    const categoryChecks = report.checks.filter(c => c.category === category);
    if (categoryChecks.length === 0) continue;
    
    lines.push(`${category.toUpperCase()} CHECKS`);
    lines.push('-'.repeat(80));
    
    for (const check of categoryChecks) {
      lines.push(`${formatStatus(check.status)} ${check.name}`);
      lines.push(`  ${check.message}`);
      if (check.duration > 0) {
        lines.push(`  Duration: ${formatDuration(check.duration)}`);
      }
      if (check.errors && check.errors.length > 0) {
        lines.push(`  Errors:`);
        for (const error of check.errors) {
          lines.push(`    - ${error}`);
        }
      }
      lines.push('');
    }
  }
  
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
  
  // Recommendations section
  if (report.recommendations.length > 0) {
    lines.push('RECOMMENDATIONS');
    lines.push('-'.repeat(80));
    for (const rec of report.recommendations) {
      lines.push(`💡 ${rec}`);
    }
    lines.push('');
  }
  
  // Final status
  lines.push('='.repeat(80));
  if (report.overallStatus === 'ready') {
    lines.push('✅ DEPLOYMENT READY - All critical checks passed');
  } else if (report.overallStatus === 'warning') {
    lines.push('⚠️  DEPLOYMENT READY WITH WARNINGS - Review warnings before deploying');
  } else {
    lines.push('❌ DEPLOYMENT NOT READY - Fix critical issues before deploying');
  }
  lines.push('='.repeat(80));
  
  return lines.join('\n');
}

/**
 * Format verification report as JSON
 */
export function formatVerificationReportJson(report: PreDeploymentVerificationReport): string {
  return JSON.stringify(report, null, 2);
}
