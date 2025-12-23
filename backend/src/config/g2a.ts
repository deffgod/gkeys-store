import { AppError } from '../middleware/errorHandler.js';

export type G2AEnvironment = 'sandbox' | 'live';

export interface G2AConfig {
  apiKey: string;
  apiHash: string;
  baseUrl: string;
  env: G2AEnvironment;
  timeoutMs: number;
  retryMax: number;
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

export const getG2AConfig = (): G2AConfig => {
  const rawUrl = process.env.G2A_API_URL || 'https://api.g2a.com/integration-api/v1';
  const apiKey = process.env.G2A_API_KEY || '';
  const apiHash = process.env.G2A_API_HASH || '';
  const env = (process.env.G2A_ENV as G2AEnvironment) || 'sandbox';
  const timeoutMs = Number(process.env.G2A_TIMEOUT_MS || 8000);
  const retryMax = Number(process.env.G2A_RETRY_MAX || 2);

  if (!apiKey || !apiHash) {
    throw new AppError('G2A credentials missing: G2A_API_KEY/G2A_API_HASH', 500);
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
  };
};
