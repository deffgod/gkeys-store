import { AppError } from '../middleware/errorHandler.js';
import { getG2ASettings } from '../services/g2a-settings.service.js';

export type G2AEnvironment = 'sandbox' | 'live';

export interface G2AConfig {
  apiKey: string;
  apiHash: string;
  baseUrl: string;
  env: G2AEnvironment;
  timeoutMs: number;
  retryMax: number;
  email?: string; // Email for Export API key generation
}

/**
 * Normalize G2A API URL to ensure correct path and HTTPS usage.
 * For production, enforce /integration-api/v1; for sandbox, enforce /v1.
 */
export const normalizeG2AUrl = (url: string): string => {
  let normalized = url.trim();
  if (!normalized.startsWith('http')) {
    normalized = `https://${normalized}`;
  }
  // Remove trailing slashes
  normalized = normalized.replace(/\/+$/, '');

  const isSandbox = normalized.includes('sandboxapi.g2a.com');

  if (isSandbox) {
    if (normalized.endsWith('/v1')) return normalized;
    if (normalized === 'https://sandboxapi.g2a.com' || normalized === 'http://sandboxapi.g2a.com') {
      return `${normalized}/v1`;
    }
    return `${normalized}/v1`;
  }

  if (normalized.includes('/integration-api/v1')) return normalized;
  if (normalized.endsWith('/integration-api')) return `${normalized}/v1`;
  if (normalized.endsWith('/v1')) {
    const base = normalized.replace(/\/v1$/, '');
    return `${base}/integration-api/v1`;
  }
  if (
    normalized === 'https://api.g2a.com' ||
    normalized === 'https://www.g2a.com' ||
    normalized === 'http://api.g2a.com' ||
    normalized === 'http://www.g2a.com'
  ) {
    return `${normalized}/integration-api/v1`;
  }
  return `${normalized}/integration-api/v1`;
};

/**
 * Get G2A configuration from database settings or environment variables
 * Priority: Database settings > Environment variables
 */
export const getG2AConfig = async (): Promise<G2AConfig> => {
  // Try to get settings from database first
  let dbSettings = null;
  try {
    dbSettings = await getG2ASettings();
  } catch (error) {
    // Database might not be available, fallback to env vars
    console.debug('[G2A Config] Could not load settings from database, using environment variables');
  }

  // Use database settings if available, otherwise fallback to environment variables
  const apiKey = dbSettings?.clientId || process.env.G2A_API_KEY || '';
  const apiHash = dbSettings?.clientSecret || process.env.G2A_API_HASH || process.env.G2A_API_SECRET || '';
  const email = dbSettings?.email || process.env.G2A_EMAIL || 'Welcome@nalytoo.com';
  const envFromDb = dbSettings?.environment === 'production' ? 'live' : 'sandbox';
  const env = (process.env.G2A_ENV as G2AEnvironment) || envFromDb || 'sandbox';
  
  // Determine base URL based on environment
  let rawUrl = process.env.G2A_API_URL;
  if (!rawUrl) {
    rawUrl = env === 'sandbox' 
      ? 'https://sandboxapi.g2a.com/v1'
      : 'https://api.g2a.com/integration-api/v1';
  }

  const timeoutMs = Number(process.env.G2A_TIMEOUT_MS || 8000);
  const retryMax = Number(process.env.G2A_RETRY_MAX || 2);

  if (!apiKey || !apiHash) {
    throw new AppError(
      'G2A credentials missing: G2A_API_KEY and G2A_API_HASH (or G2A_API_SECRET) are required, or configure G2A settings in admin panel',
      500
    );
  }

  // Warn if using deprecated G2A_API_SECRET (only if not using DB settings)
  if (!dbSettings && process.env.G2A_API_SECRET && !process.env.G2A_API_HASH) {
    console.warn(
      '[G2A Config] WARNING: G2A_API_SECRET is deprecated. Please use G2A_API_HASH instead.'
    );
  }

  // Warn if G2A_EMAIL is not set and not using DB settings
  if (!dbSettings && !process.env.G2A_EMAIL) {
    console.warn(
      '[G2A Config] WARNING: G2A_EMAIL is not set. Using default "welcome@nalytoo.com" for Export API key generation. Consider configuring G2A settings in admin panel.'
    );
  }

  const baseUrl = normalizeG2AUrl(rawUrl);
  if (!baseUrl.startsWith('https://') && !baseUrl.startsWith('http://sandboxapi.g2a.com')) {
    throw new AppError('G2A_API_URL must use HTTPS', 500);
  }

  return {
    apiKey,
    apiHash,
    baseUrl,
    env,
    timeoutMs: Number.isFinite(timeoutMs) ? timeoutMs : 8000,
    retryMax: Number.isFinite(retryMax) ? retryMax : 2,
    email,
  };
};

/**
 * Synchronous version for backward compatibility (uses environment variables only)
 * @deprecated Use getG2AConfig() instead for database settings support
 */
export const getG2AConfigSync = (): G2AConfig => {
  const rawUrl = process.env.G2A_API_URL || 'https://api.g2a.com/integration-api/v1';
  const apiKey = process.env.G2A_API_KEY || '';
  const apiHash = process.env.G2A_API_HASH || process.env.G2A_API_SECRET || '';
  const email = process.env.G2A_EMAIL || 'Welcome@nalytoo.com';
  const env = (process.env.G2A_ENV as G2AEnvironment) || 'sandbox';
  const timeoutMs = Number(process.env.G2A_TIMEOUT_MS || 8000);
  const retryMax = Number(process.env.G2A_RETRY_MAX || 2);

  if (!apiKey || !apiHash) {
    throw new AppError(
      'G2A credentials missing: G2A_API_KEY and G2A_API_HASH (or G2A_API_SECRET) are required',
      500
    );
  }

  const baseUrl = normalizeG2AUrl(rawUrl);
  if (!baseUrl.startsWith('https://') && !baseUrl.startsWith('http://sandboxapi.g2a.com')) {
    throw new AppError('G2A_API_URL must use HTTPS', 500);
  }

  return {
    apiKey,
    apiHash,
    baseUrl,
    env,
    timeoutMs: Number.isFinite(timeoutMs) ? timeoutMs : 8000,
    retryMax: Number.isFinite(retryMax) ? retryMax : 2,
    email,
  };
};
