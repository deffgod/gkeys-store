/**
 * G2A Integration Client Configuration
 */

export type G2AEnvironment = 'sandbox' | 'live';

export interface G2AConfig {
  // Authentication
  apiKey: string;
  apiHash: string;
  email?: string;
  
  // Environment
  baseUrl: string;
  env: G2AEnvironment;
  
  // HTTP Settings
  timeoutMs: number;
  
  // Retry Configuration
  retry: {
    maxRetries: number;
    initialDelayMs: number;
    maxDelayMs: number;
    backoffMultiplier: number;
    jitter: boolean;
  };
  
  // Circuit Breaker Configuration
  circuitBreaker: {
    enabled: boolean;
    failureThreshold: number;
    failureWindowMs: number;
    resetTimeoutMs: number;
    halfOpenSuccessThreshold: number;
  };
  
  // Rate Limiting Configuration
  rateLimiting: {
    enabled: boolean;
    requestsPerSecond: number;
    burstSize: number;
    perEndpoint: {
      [endpoint: string]: {
        requestsPerSecond: number;
        burstSize: number;
      };
    };
  };
  
  // Batch Operations Configuration
  batch: {
    maxBatchSize: number;
    maxConcurrentRequests: number;
    productFetchChunkSize: number;
  };
  
  // Connection Pooling
  httpAgent: {
    maxSockets: number;
    maxFreeSockets: number;
    keepAlive: boolean;
    keepAliveMsecs: number;
  };
  
  // Logging & Metrics
  logging: {
    enabled: boolean;
    level: 'debug' | 'info' | 'warn' | 'error';
    maskSecrets: boolean;
  };
  
  metrics: {
    enabled: boolean;
  };
}

export type PartialG2AConfig = Partial<G2AConfig> & {
  apiKey: string;
  apiHash: string;
};
