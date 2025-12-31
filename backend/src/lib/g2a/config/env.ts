/**
 * Environment variables loader with backward compatibility
 * Supports both old and new variable names
 */

import { G2AEnvironment } from './G2AConfig.js';
import { normalizeG2AUrl } from '../utils/validation.js';

interface G2AEnvVars {
  apiKey: string;
  apiHash: string;
  email?: string;
  baseUrl: string;
  env: G2AEnvironment;
  timeoutMs: number;
  retryMax: number;
}

/**
 * Load G2A configuration from environment variables
 * Supports both old and new variable names for backward compatibility
 * 
 * Variable name mapping:
 * - G2A_API_KEY (new) or G2A_CLIENT_ID (old)
 * - G2A_API_HASH (new) or G2A_CLIENT_SECRET (old)
 * - G2A_API_URL (new) or G2A_API_BASE (old)
 * - G2A_ENV (new) - no old equivalent
 * - G2A_EMAIL (both)
 * - G2A_TIMEOUT_MS (new) - no old equivalent
 * - G2A_RETRY_MAX (new) - no old equivalent
 */
export function loadG2AEnvVars(): G2AEnvVars {
  // API Key (supports both names)
  const apiKey = process.env.G2A_API_KEY || process.env.G2A_CLIENT_ID;
  if (!apiKey) {
    throw new Error('G2A_API_KEY or G2A_CLIENT_ID environment variable is required');
  }
  
  // Log if using old variable name
  if (!process.env.G2A_API_KEY && process.env.G2A_CLIENT_ID) {
    console.warn('[G2A Config] Using legacy variable name G2A_CLIENT_ID. Please migrate to G2A_API_KEY.');
  }
  
  // API Hash (supports both names)
  const apiHash = process.env.G2A_API_HASH || process.env.G2A_API_SECRET || process.env.G2A_CLIENT_SECRET;
  if (!apiHash) {
    throw new Error('G2A_API_HASH or G2A_CLIENT_SECRET environment variable is required');
  }
  
  // Log if using old variable name
  if (!process.env.G2A_API_HASH && process.env.G2A_CLIENT_SECRET) {
    console.warn('[G2A Config] Using legacy variable name G2A_CLIENT_SECRET. Please migrate to G2A_API_HASH.');
  }
  
  // Email (optional, same name in both versions)
  const email = process.env.G2A_EMAIL;
  if (!email) {
    console.warn('[G2A Config] WARNING: G2A_EMAIL is not set. Using default "Welcome@nalytoo.com" for Export API key generation.');
  }
  
  // Base URL (supports both names)
  let baseUrl = process.env.G2A_API_URL || process.env.G2A_API_BASE;
  if (!baseUrl) {
    // Default based on environment
    const env = (process.env.G2A_ENV as G2AEnvironment) || 'sandbox';
    baseUrl = env === 'sandbox'
      ? 'https://sandboxapi.g2a.com/v1'
      : 'https://api.g2a.com/integration-api/v1';
    console.warn(`[G2A Config] WARNING: G2A_API_URL is not set. Using default "${baseUrl}"`);
  }
  
  // Log if using old variable name
  if (!process.env.G2A_API_URL && process.env.G2A_API_BASE) {
    console.warn('[G2A Config] Using legacy variable name G2A_API_BASE. Please migrate to G2A_API_URL.');
  }
  
  // Normalize URL
  baseUrl = normalizeG2AUrl(baseUrl);
  
  // Environment
  const envStr = process.env.G2A_ENV || 'sandbox';
  if (!['sandbox', 'live'].includes(envStr)) {
    throw new Error(`Invalid G2A_ENV value: ${envStr}. Must be 'sandbox' or 'live'`);
  }
  const env = envStr as G2AEnvironment;
  
  // Timeout (default: 8000ms)
  const timeoutMs = process.env.G2A_TIMEOUT_MS 
    ? parseInt(process.env.G2A_TIMEOUT_MS, 10) 
    : 8000;
  
  // Retry max (default: 2)
  const retryMax = process.env.G2A_RETRY_MAX 
    ? parseInt(process.env.G2A_RETRY_MAX, 10) 
    : 2;
  
  return {
    apiKey,
    apiHash,
    email: email || 'Welcome@nalytoo.com',
    baseUrl,
    env,
    timeoutMs,
    retryMax,
  };
}

/**
 * Get summary of loaded configuration (for debugging)
 */
export function getConfigSummary(): string {
  const vars = loadG2AEnvVars();
  return `
G2A Configuration:
  Environment: ${vars.env}
  Base URL: ${vars.baseUrl}
  API Key: ${vars.apiKey.substring(0, 8)}...
  API Hash: ${vars.apiHash.substring(0, 4)}...
  Email: ${vars.email}
  Timeout: ${vars.timeoutMs}ms
  Max Retries: ${vars.retryMax}
  `.trim();
}
