/**
 * Configuration verification for pre-deployment checks
 */

import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import type { VerificationCheck } from './types/verification.js';
import { createVerificationCheck } from './utils/verification.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '../..');

/**
 * Verify vercel.json configuration
 */
export async function verifyVercelConfig(): Promise<VerificationCheck> {
  const startTime = Date.now();
  const vercelJsonPath = resolve(rootDir, 'vercel.json');
  
  if (!existsSync(vercelJsonPath)) {
    const duration = Date.now() - startTime;
    return createVerificationCheck(
      'config-vercel',
      'Vercel Configuration',
      'configuration',
      'fail',
      'vercel.json not found',
      {
        errors: ['vercel.json file is required for Vercel deployment'],
        duration,
        critical: true,
      }
    );
  }
  
  try {
    const vercelJson = JSON.parse(readFileSync(vercelJsonPath, 'utf-8'));
    
    const errors: string[] = [];
    
    // Check required fields
    if (!vercelJson.buildCommand) {
      errors.push('buildCommand is missing');
    }
    if (!vercelJson.outputDirectory) {
      errors.push('outputDirectory is missing');
    }
    if (!vercelJson.rewrites || !Array.isArray(vercelJson.rewrites)) {
      errors.push('rewrites configuration is missing or invalid');
    }
    
    // Check for API rewrite rule
    const hasApiRewrite = vercelJson.rewrites?.some((r: any) => 
      r.source?.includes('/api') && r.destination?.includes('/api')
    );
    
    if (!hasApiRewrite) {
      errors.push('API rewrite rule not found in rewrites configuration');
    }
    
    const duration = Date.now() - startTime;
    
    if (errors.length > 0) {
      return createVerificationCheck(
        'config-vercel',
        'Vercel Configuration',
        'configuration',
        'fail',
        'Vercel configuration has issues',
        {
          errors,
          duration,
          critical: true,
        }
      );
    }
    
    return createVerificationCheck(
      'config-vercel',
      'Vercel Configuration',
      'configuration',
      'pass',
      'Vercel configuration is valid',
      { duration, critical: true }
    );
  } catch (error: any) {
    const duration = Date.now() - startTime;
    return createVerificationCheck(
      'config-vercel',
      'Vercel Configuration',
      'configuration',
      'fail',
      'Failed to parse vercel.json',
      {
        errors: [error.message || String(error)],
        duration,
        critical: true,
      }
    );
  }
}

/**
 * Verify api/index.ts exists (serverless function entry point)
 */
export async function verifyApiEntryPoint(): Promise<VerificationCheck> {
  const startTime = Date.now();
  const apiIndexPath = resolve(rootDir, 'api/index.ts');
  
  if (!existsSync(apiIndexPath)) {
    const duration = Date.now() - startTime;
    return createVerificationCheck(
      'config-api-entry',
      'API Entry Point',
      'configuration',
      'fail',
      'api/index.ts not found',
      {
        errors: ['api/index.ts is required for Vercel serverless function'],
        duration,
        critical: true,
      }
    );
  }
  
  const duration = Date.now() - startTime;
  return createVerificationCheck(
    'config-api-entry',
    'API Entry Point',
    'configuration',
    'pass',
    'API entry point exists',
    { duration, critical: true }
  );
}

/**
 * Verify all configuration
 */
export async function verifyConfiguration(): Promise<{
  vercel: VerificationCheck;
  apiEntry: VerificationCheck;
}> {
  const [vercel, apiEntry] = await Promise.all([
    verifyVercelConfig(),
    verifyApiEntryPoint(),
  ]);
  
  return { vercel, apiEntry };
}
