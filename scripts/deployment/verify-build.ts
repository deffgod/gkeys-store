/**
 * Build verification for pre-deployment checks
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import type { VerificationCheck } from './types/verification.js';
import { createVerificationCheck } from './utils/verification.js';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '../..');

export interface BuildVerificationResult {
  check: VerificationCheck;
  artifacts: Array<{
    path: string;
    exists: boolean;
  }>;
}

/**
 * Verify frontend build
 */
async function verifyFrontendBuild(): Promise<BuildVerificationResult> {
  const startTime = Date.now();
  const artifacts: Array<{ path: string; exists: boolean }> = [];
  
  try {
    // Run frontend build
    const { stdout, stderr } = await execAsync('npm run build', {
      cwd: rootDir,
      timeout: 300000, // 5 minutes
    });
    
    // Check for build artifacts
    const distPath = resolve(rootDir, 'dist');
    const indexHtml = resolve(distPath, 'index.html');
    const distExists = existsSync(distPath);
    const indexExists = existsSync(indexHtml);
    
    artifacts.push(
      { path: 'dist/', exists: distExists },
      { path: 'dist/index.html', exists: indexExists }
    );
    
    const duration = Date.now() - startTime;
    
    if (!distExists || !indexExists) {
      return {
        check: createVerificationCheck(
          'build-frontend',
          'Frontend Build',
          'build',
          'fail',
          'Frontend build artifacts not found',
          {
            errors: [
              `dist/ directory ${distExists ? 'exists' : 'missing'}`,
              `dist/index.html ${indexExists ? 'exists' : 'missing'}`,
            ],
            duration,
            critical: true,
          }
        ),
        artifacts,
      };
    }
    
    if (stderr && !stderr.includes('warning')) {
      return {
        check: createVerificationCheck(
          'build-frontend',
          'Frontend Build',
          'build',
          'warning',
          'Frontend build completed with warnings',
          {
            errors: [stderr],
            duration,
            critical: false,
          }
        ),
        artifacts,
      };
    }
    
    return {
      check: createVerificationCheck(
        'build-frontend',
        'Frontend Build',
        'build',
        'pass',
        'Frontend build completed successfully',
        { duration, critical: true }
      ),
      artifacts,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    return {
      check: createVerificationCheck(
        'build-frontend',
        'Frontend Build',
        'build',
        'fail',
        'Frontend build failed',
        {
          errors: [error.message || String(error)],
          duration,
          critical: true,
        }
      ),
      artifacts,
    };
  }
}

/**
 * Verify backend build
 */
async function verifyBackendBuild(): Promise<BuildVerificationResult> {
  const startTime = Date.now();
  const artifacts: Array<{ path: string; exists: boolean }> = [];
  
  try {
    // Run backend build
    const { stdout, stderr } = await execAsync('npm run build:deploy', {
      cwd: resolve(rootDir, 'backend'),
      timeout: 300000, // 5 minutes
    });
    
    // Check for build artifacts
    const distPath = resolve(rootDir, 'backend/dist');
    const indexJs = resolve(distPath, 'index.js');
    const distExists = existsSync(distPath);
    const indexExists = existsSync(indexJs);
    
    artifacts.push(
      { path: 'backend/dist/', exists: distExists },
      { path: 'backend/dist/index.js', exists: indexExists }
    );
    
    const duration = Date.now() - startTime;
    
    if (!distExists || !indexExists) {
      return {
        check: createVerificationCheck(
          'build-backend',
          'Backend Build',
          'build',
          'fail',
          'Backend build artifacts not found',
          {
            errors: [
              `backend/dist/ directory ${distExists ? 'exists' : 'missing'}`,
              `backend/dist/index.js ${indexExists ? 'exists' : 'missing'}`,
            ],
            duration,
            critical: true,
          }
        ),
        artifacts,
      };
    }
    
    if (stderr && !stderr.includes('warning')) {
      return {
        check: createVerificationCheck(
          'build-backend',
          'Backend Build',
          'build',
          'warning',
          'Backend build completed with warnings',
          {
            errors: [stderr],
            duration,
            critical: false,
          }
        ),
        artifacts,
      };
    }
    
    return {
      check: createVerificationCheck(
        'build-backend',
        'Backend Build',
        'build',
        'pass',
        'Backend build completed successfully',
        { duration, critical: true }
      ),
      artifacts,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    return {
      check: createVerificationCheck(
        'build-backend',
        'Backend Build',
        'build',
        'fail',
        'Backend build failed',
        {
          errors: [error.message || String(error)],
          duration,
          critical: true,
        }
      ),
      artifacts,
    };
  }
}

/**
 * Verify all builds
 */
export async function verifyBuilds(): Promise<{
  frontend: BuildVerificationResult;
  backend: BuildVerificationResult;
}> {
  const [frontend, backend] = await Promise.all([
    verifyFrontendBuild(),
    verifyBackendBuild(),
  ]);
  
  return { frontend, backend };
}
