/**
 * Default configuration values for G2A Integration Client
 */

import { G2AConfig, G2AEnvironment } from './G2AConfig.js';

export const getDefaultConfig = (
  env: G2AEnvironment = 'sandbox'
): Omit<G2AConfig, 'apiKey' | 'apiHash' | 'email'> => ({
  baseUrl:
    env === 'sandbox' ? 'https://sandboxapi.g2a.com/v1' : 'https://api.g2a.com/integration-api/v1',
  env,
  timeoutMs: 8000,

  retry: {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
    jitter: true,
  },

  circuitBreaker: {
    enabled: true,
    failureThreshold: 5,
    failureWindowMs: 60000, // 60 seconds
    resetTimeoutMs: 30000, // 30 seconds
    halfOpenSuccessThreshold: 2,
  },

  rateLimiting: {
    enabled: true,
    requestsPerSecond: 10,
    burstSize: 20,
    perEndpoint: {
      '/products': {
        requestsPerSecond: 5,
        burstSize: 10,
      },
      '/orders': {
        requestsPerSecond: 3,
        burstSize: 5,
      },
      '/reservations': {
        requestsPerSecond: 2,
        burstSize: 3,
      },
    },
  },

  batch: {
    maxBatchSize: 100,
    maxConcurrentRequests: 3,
    productFetchChunkSize: 10,
  },

  httpAgent: {
    maxSockets: 50,
    maxFreeSockets: 10,
    keepAlive: true,
    keepAliveMsecs: 30000,
  },

  logging: {
    enabled: true,
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    maskSecrets: true,
  },

  metrics: {
    enabled: true,
  },
});
