/**
 * Test suite verification for pre-deployment checks
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import type { VerificationCheck } from './types/verification.js';
import { createVerificationCheck } from './utils/verification.js';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '../..');
const backendDir = resolve(rootDir, 'backend');

/**
 * Verify test suite execution
 */
export async function verifyTests(): Promise<VerificationCheck> {
  const startTime = Date.now();
  
  try {
    // Run backend tests
    const { stdout, stderr } = await execAsync('npm test', {
      cwd: backendDir,
      timeout: 300000, // 5 minutes
    });
    
    const duration = Date.now() - startTime;
    
    // Check for test failures in output
    const hasFailures = stdout.includes('FAIL') || 
                       stdout.includes('failed') ||
                       stderr.includes('FAIL') ||
                       stderr.includes('failed');
    
    if (hasFailures) {
      // Extract failure information
      const failureLines = stdout
        .split('\n')
        .filter(line => line.includes('FAIL') || line.includes('failed'))
        .slice(0, 10); // Limit to first 10 failures
      
      return createVerificationCheck(
        'tests',
        'Test Suite',
        'tests',
        'fail',
        'Test suite has failures',
        {
          errors: failureLines.length > 0 ? failureLines : ['Tests failed - see output above'],
          duration,
          critical: false, // Tests don't block deployment, but should be fixed
        }
      );
    }
    
    // Check if tests passed
    const hasPassed = stdout.includes('PASS') || 
                     stdout.includes('passed') ||
                     stdout.includes('✓');
    
    if (hasPassed) {
      return createVerificationCheck(
        'tests',
        'Test Suite',
        'tests',
        'pass',
        'All tests passed',
        { duration, critical: false }
      );
    }
    
    // If we can't determine status, return warning
    return createVerificationCheck(
      'tests',
      'Test Suite',
      'tests',
      'warning',
      'Test execution completed but status unclear',
      {
        errors: ['Could not determine test status from output'],
        duration,
        critical: false,
      }
    );
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    // Check if error is due to no tests found
    const errorMsg = error.message || String(error);
    const noTests = errorMsg.includes('No test files found') ||
                   errorMsg.includes('No tests found');
    
    return createVerificationCheck(
      'tests',
      'Test Suite',
      'tests',
      noTests ? 'warning' : 'fail',
      noTests ? 'No tests found (may be expected)' : 'Test execution failed',
      {
        errors: [errorMsg],
        duration,
        critical: false,
      }
    );
  }
}
