/**
 * Unit tests for G2AIntegrationClient
 */

import { describe, it, expect, afterEach } from 'vitest';
import { G2AIntegrationClient } from '../../../lib/g2a/G2AIntegrationClient.js';
import { G2AConfig } from '../../../lib/g2a/config/G2AConfig.js';

describe('G2AIntegrationClient', () => {
  const mockConfig: G2AConfig = {
    apiKey: 'test-key',
    apiHash: 'test-hash',
    baseUrl: 'https://sandboxapi.g2a.com/v1',
    env: 'sandbox',
    timeoutMs: 5000,
    retry: {
      maxRetries: 2,
      initialDelayMs: 1000,
      maxDelayMs: 5000,
      backoffMultiplier: 2,
      jitter: true,
    },
    circuitBreaker: {
      enabled: true,
      failureThreshold: 3,
      failureWindowMs: 10000,
      resetTimeoutMs: 5000,
      halfOpenSuccessThreshold: 1,
    },
    rateLimiting: {
      enabled: true,
      requestsPerSecond: 10,
      burstSize: 20,
      perEndpoint: {},
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
      level: 'info',
      maskSecrets: true,
    },
    metrics: {
      enabled: true,
    },
  };

  afterEach(async () => {
    await G2AIntegrationClient.resetInstance();
  });

  describe('Configuration', () => {
    it('should create client with valid config', async () => {
      const client = await G2AIntegrationClient.create(mockConfig);
      
      expect(client).toBeDefined();
      expect(client.isInitialized()).toBe(true);
      
      const config = client.getConfig();
      expect(config.apiKey).toBe('test-key');
      expect(config.env).toBe('sandbox');
    });

    it('should merge user config with defaults', async () => {
      const partialConfig = {
        apiKey: 'test-key',
        apiHash: 'test-hash',
      };
      
      const client = await G2AIntegrationClient.create(partialConfig);
      const config = client.getConfig();
      
      // Check defaults are applied
      expect(config.timeoutMs).toBe(8000);
      expect(config.retry.maxRetries).toBe(3);
    });

    it('should validate required credentials', async () => {
      const invalidConfig = {
        apiKey: '',
        apiHash: '',
      } as any;
      
      await expect(G2AIntegrationClient.create(invalidConfig))
        .rejects.toThrow();
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance when calling getInstance', async () => {
      const instance1 = await G2AIntegrationClient.getInstance(mockConfig);
      const instance2 = await G2AIntegrationClient.getInstance();
      
      expect(instance1).toBe(instance2);
    });

    it('should throw if getInstance called without config on first call', async () => {
      await expect(G2AIntegrationClient.getInstance())
        .rejects.toThrow('must be initialized with config');
    });
  });

  describe('API Modules', () => {
    it('should have all API modules initialized', async () => {
      const client = await G2AIntegrationClient.create(mockConfig);
      
      expect(client.products).toBeDefined();
      expect(client.orders).toBeDefined();
      expect(client.offers).toBeDefined();
      expect(client.reservations).toBeDefined();
      expect(client.jobs).toBeDefined();
      expect(client.bestsellers).toBeDefined();
      expect(client.priceSimulations).toBeDefined();
    });
  });
});
