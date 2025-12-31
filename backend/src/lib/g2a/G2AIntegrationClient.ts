/**
 * G2A Integration Client
 * Unified client for G2A API operations following the official PHP client pattern
 */

import axios, { AxiosInstance } from 'axios';
import { Agent as HttpAgent } from 'node:http';
import { Agent as HttpsAgent } from 'node:https';
import { G2AConfig, PartialG2AConfig } from './config/G2AConfig.js';
import { getDefaultConfig } from './config/defaults.js';
import { createLogger, G2ALogger } from './utils/logger.js';
import { createMetrics, G2AMetrics } from './utils/metrics.js';
import { RateLimiter } from './resilience/RateLimiter.js';
import { CircuitBreaker } from './resilience/CircuitBreaker.js';
import { RetryStrategy } from './resilience/RetryStrategy.js';
import { ErrorMapper } from './errors/ErrorMapper.js';
import { AuthManager, ApiType } from './auth/AuthManager.js';
import { ProductsAPI } from './api/ProductsAPI.js';
import { OrdersAPI } from './api/OrdersAPI.js';
import { OffersAPI } from './api/OffersAPI.js';
import { ReservationsAPI } from './api/ReservationsAPI.js';
import { JobsAPI } from './api/JobsAPI.js';
import { BestsellersAPI } from './api/BestsellersAPI.js';
import { PriceSimulationsAPI } from './api/PriceSimulationsAPI.js';
import { BatchProductFetcher } from './batch/BatchProductFetcher.js';

export class G2AIntegrationClient {
  private static instance: G2AIntegrationClient | null = null;

  private config: G2AConfig;
  private exportHttpClient: AxiosInstance;
  private importHttpClient: AxiosInstance;
  private authManager: AuthManager;
  private logger: G2ALogger;
  private metrics: G2AMetrics;
  private rateLimiter: RateLimiter;
  private retryStrategy: RetryStrategy;
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private initialized: boolean = false;

  // API modules
  public readonly products: ProductsAPI;
  public readonly orders: OrdersAPI;
  public readonly offers: OffersAPI;
  public readonly reservations: ReservationsAPI;
  public readonly jobs: JobsAPI;
  public readonly bestsellers: BestsellersAPI;
  public readonly priceSimulations: PriceSimulationsAPI;

  private constructor(userConfig: PartialG2AConfig) {
    // Merge user config with defaults
    const defaults = getDefaultConfig(userConfig.env || 'sandbox');
    this.config = {
      ...defaults,
      ...userConfig,
      retry: {
        ...defaults.retry,
        ...userConfig.retry,
      },
      circuitBreaker: {
        ...defaults.circuitBreaker,
        ...userConfig.circuitBreaker,
      },
      rateLimiting: {
        ...defaults.rateLimiting,
        ...userConfig.rateLimiting,
        perEndpoint: {
          ...defaults.rateLimiting.perEndpoint,
          ...userConfig.rateLimiting?.perEndpoint,
        },
      },
      batch: {
        ...defaults.batch,
        ...userConfig.batch,
      },
      httpAgent: {
        ...defaults.httpAgent,
        ...userConfig.httpAgent,
      },
      logging: {
        ...defaults.logging,
        ...userConfig.logging,
      },
      metrics: {
        ...defaults.metrics,
        ...userConfig.metrics,
      },
    };

    // Initialize utilities
    this.logger = createLogger(this.config.logging.level, this.config.logging.maskSecrets);
    this.metrics = createMetrics(this.config.metrics.enabled);
    this.rateLimiter = new RateLimiter(
      this.config.rateLimiting.enabled,
      this.config.rateLimiting.requestsPerSecond,
      this.config.rateLimiting.burstSize,
      this.config.rateLimiting.perEndpoint
    );

    // Initialize retry strategy with circuit breaker integration
    // Circuit breaker will be created per-endpoint, so we pass undefined here
    this.retryStrategy = new RetryStrategy(
      this.config.retry,
      this.logger,
      undefined // Will check circuit breaker in executeRequest
    );

    // Initialize auth manager
    this.authManager = new AuthManager(
      this.config.apiHash,
      this.config.apiKey,
      this.config.env,
      this.config.baseUrl,
      this.config.timeoutMs,
      this.logger,
      this.config.email,
      process.env.REDIS_URL || process.env.REDIS_GKEYS_REDIS_URL
    );

    // Initialize HTTP clients (will be fully configured after auth init)
    this.exportHttpClient = this.createHttpClient('export');
    this.importHttpClient = this.createHttpClient('import');

    // Initialize API modules with executeRequest method bound to this
    const executeRequest = this.executeRequest.bind(this);

    this.products = new ProductsAPI(this.exportHttpClient, this.logger, executeRequest);
    this.orders = new OrdersAPI(this.exportHttpClient, this.logger, executeRequest);
    this.offers = new OffersAPI(this.importHttpClient, this.logger, executeRequest);
    this.reservations = new ReservationsAPI(this.importHttpClient, this.logger, executeRequest);
    this.jobs = new JobsAPI(this.importHttpClient, this.logger, executeRequest);
    this.bestsellers = new BestsellersAPI(this.importHttpClient, this.logger, executeRequest);
    this.priceSimulations = new PriceSimulationsAPI(
      this.importHttpClient,
      this.logger,
      executeRequest
    );

    this.logger.info('G2A Integration Client created', {
      env: this.config.env,
      baseUrl: this.config.baseUrl,
      rateLimiting: this.config.rateLimiting.enabled,
      circuitBreaker: this.config.circuitBreaker.enabled,
    });
  }

  /**
   * Initialize the client (must be called before using)
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      this.logger.warn('Client already initialized');
      return;
    }

    try {
      await this.authManager.initialize();

      // Configure HTTP clients with auth interceptors
      this.configureAuthInterceptors();

      this.initialized = true;
      this.logger.info('G2A Integration Client initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize G2A Integration Client', error);
      throw error;
    }
  }

  /**
   * Configure authentication interceptors for HTTP clients
   */
  private configureAuthInterceptors(): void {
    // Export API (hash-based auth)
    this.exportHttpClient.interceptors.request.use(
      async (config) => {
        const authHeaders = await this.authManager.getAuthHeaders('export');
        config.headers = {
          ...config.headers,
          ...authHeaders,
        };
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Import API (OAuth2 token auth)
    this.importHttpClient.interceptors.request.use(
      async (config) => {
        const authHeaders = await this.authManager.getAuthHeaders('import');
        config.headers = {
          ...config.headers,
          ...authHeaders,
        };
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  private createHttpClient(_apiType: ApiType): AxiosInstance {
    // Create HTTP agent with connection pooling
    const httpAgent = new HttpAgent({
      keepAlive: this.config.httpAgent.keepAlive,
      keepAliveMsecs: this.config.httpAgent.keepAliveMsecs,
      maxSockets: this.config.httpAgent.maxSockets,
      maxFreeSockets: this.config.httpAgent.maxFreeSockets,
    });

    const httpsAgent = new HttpsAgent({
      keepAlive: this.config.httpAgent.keepAlive,
      keepAliveMsecs: this.config.httpAgent.keepAliveMsecs,
      maxSockets: this.config.httpAgent.maxSockets,
      maxFreeSockets: this.config.httpAgent.maxFreeSockets,
    });

    const client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeoutMs,
      httpAgent,
      httpsAgent,
      validateStatus: (status) => status < 500, // Don't throw on 4xx errors
    });

    // Request interceptor
    client.interceptors.request.use(
      (config) => {
        const startTime = Date.now();
        (config as any).metadata = { startTime };

        this.logger.debug('G2A API Request', {
          method: config.method?.toUpperCase(),
          url: config.url,
          params: config.params,
        });

        this.metrics.increment('requests_total');

        return config;
      },
      (error) => {
        this.logger.error('Request interceptor error', error);
        this.metrics.increment('requests_error');
        return Promise.reject(error);
      }
    );

    // Response interceptor
    client.interceptors.response.use(
      (response) => {
        const startTime = (response.config as any).metadata?.startTime;
        const duration = startTime ? Date.now() - startTime : 0;

        this.logger.debug('G2A API Response', {
          method: response.config.method?.toUpperCase(),
          url: response.config.url,
          status: response.status,
          duration,
        });

        this.metrics.increment('requests_success');
        this.metrics.set('request_duration_ms', duration);

        return response;
      },
      (error) => {
        const startTime = (error.config as any)?.metadata?.startTime;
        const duration = startTime ? Date.now() - startTime : 0;

        this.logger.error('G2A API Error', {
          method: error.config?.method?.toUpperCase(),
          url: error.config?.url,
          status: error.response?.status,
          duration,
          error: error.message,
        });

        this.metrics.increment('requests_error');

        return Promise.reject(error);
      }
    );

    return client;
  }

  private getCircuitBreaker(endpoint: string): CircuitBreaker {
    if (!this.circuitBreakers.has(endpoint)) {
      this.circuitBreakers.set(
        endpoint,
        new CircuitBreaker(
          this.config.circuitBreaker.enabled,
          this.config.circuitBreaker.failureThreshold,
          this.config.circuitBreaker.failureWindowMs,
          this.config.circuitBreaker.resetTimeoutMs,
          this.config.circuitBreaker.halfOpenSuccessThreshold
        )
      );
    }
    return this.circuitBreakers.get(endpoint)!;
  }

  /**
   * Execute a request with rate limiting, circuit breaker, and retry logic
   */
  async executeRequest<T>(
    endpoint: string,
    operation: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    // Rate limiting
    await this.rateLimiter.waitIfNeeded(endpoint);

    // Circuit breaker
    const circuitBreaker = this.getCircuitBreaker(endpoint);

    // Retry with circuit breaker check
    return this.retryStrategy.execute(async () => {
      return circuitBreaker.execute(async () => {
        try {
          return await requestFn();
        } catch (error) {
          throw ErrorMapper.fromError(error, operation);
        }
      }, operation);
    }, operation);
  }

  /**
   * Get the underlying Axios instance for advanced usage
   */
  getHttpClient(apiType: ApiType = 'export'): AxiosInstance {
    return apiType === 'export' ? this.exportHttpClient : this.importHttpClient;
  }

  /**
   * Get the auth manager
   */
  getAuthManager(): AuthManager {
    return this.authManager;
  }

  /**
   * Get configuration
   */
  getConfig(): Readonly<G2AConfig> {
    return { ...this.config };
  }

  /**
   * Get logger
   */
  getLogger(): G2ALogger {
    return this.logger;
  }

  /**
   * Get metrics
   */
  getMetrics(): G2AMetrics {
    return this.metrics;
  }

  /**
   * Get batch product fetcher for efficient bulk operations
   */
  getBatchProductFetcher(): BatchProductFetcher {
    const executeRequest = <T>(endpoint: string, operation: string, requestFn: () => Promise<T>) =>
      this.executeRequest(endpoint, operation, requestFn);

    return new BatchProductFetcher(
      this.products,
      this.logger,
      this.config.batch.chunkSize,
      this.config.batch.maxConcurrency
    );
  }

  /**
   * Get rate limiter stats
   */
  getRateLimiterStats(endpoint?: string): { remainingTokens: number } {
    return {
      remainingTokens: this.rateLimiter.getRemainingTokens(endpoint),
    };
  }

  /**
   * Get circuit breaker stats
   */
  getCircuitBreakerStats(endpoint: string) {
    const circuitBreaker = this.getCircuitBreaker(endpoint);
    return circuitBreaker.getStats();
  }

  /**
   * Reset all circuit breakers and rate limiters
   */
  reset(): void {
    this.rateLimiter.reset();
    this.circuitBreakers.forEach((cb) => cb.reset());
    this.metrics.reset();
    this.logger.info('G2A Integration Client reset');
  }

  /**
   * Close connections and cleanup
   */
  async close(): Promise<void> {
    await this.authManager.close();
    this.initialized = false;
    this.logger.info('G2A Integration Client closed');
  }

  /**
   * Check if client is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Singleton instance getter (async to ensure initialization)
   */
  static async getInstance(config?: PartialG2AConfig): Promise<G2AIntegrationClient> {
    if (!G2AIntegrationClient.instance) {
      if (!config) {
        throw new Error('G2AIntegrationClient must be initialized with config on first call');
      }
      G2AIntegrationClient.instance = new G2AIntegrationClient(config);
      await G2AIntegrationClient.instance.initialize();
    }
    return G2AIntegrationClient.instance;
  }

  /**
   * Create a new client instance (useful for testing or multiple configs)
   */
  static async create(config: PartialG2AConfig): Promise<G2AIntegrationClient> {
    const client = new G2AIntegrationClient(config);
    await client.initialize();
    return client;
  }

  /**
   * Reset singleton instance
   */
  static async resetInstance(): Promise<void> {
    if (G2AIntegrationClient.instance) {
      await G2AIntegrationClient.instance.close();
    }
    G2AIntegrationClient.instance = null;
  }
}
