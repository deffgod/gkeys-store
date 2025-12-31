/**
 * Advanced Retry Strategy for G2A API
 * Implements exponential backoff with jitter and per-error-type policies
 */

import { G2AError, G2AErrorCode } from '../errors/G2AError.js';
import { G2ALogger } from '../utils/logger.js';
import { CircuitBreaker } from './CircuitBreaker.js';

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitter: boolean;
  retryBudgetMs?: number; // Maximum total time for all retries
}

export interface RetryPolicy {
  shouldRetry: boolean;
  delayMs?: number;
  maxRetries?: number;
}

export class RetryStrategy {
  private retryPolicies: Map<G2AErrorCode, RetryPolicy> = new Map();

  constructor(
    private config: RetryConfig,
    private logger: G2ALogger,
    private circuitBreaker?: CircuitBreaker
  ) {
    this.initializeDefaultPolicies();
  }

  /**
   * Initialize default retry policies for different error types
   */
  private initializeDefaultPolicies(): void {
    // Retryable errors with standard policy
    this.retryPolicies.set(G2AErrorCode.G2A_TIMEOUT, {
      shouldRetry: true,
      maxRetries: this.config.maxRetries,
    });

    this.retryPolicies.set(G2AErrorCode.G2A_NETWORK_ERROR, {
      shouldRetry: true,
      maxRetries: this.config.maxRetries,
    });

    // Rate limit errors - retry with longer delay
    this.retryPolicies.set(G2AErrorCode.G2A_RATE_LIMIT, {
      shouldRetry: true,
      maxRetries: this.config.maxRetries,
      delayMs: 5000, // 5 seconds minimum delay
    });

    // Quota exceeded - similar to rate limit
    this.retryPolicies.set(G2AErrorCode.G2A_QUOTA_EXCEEDED, {
      shouldRetry: true,
      maxRetries: this.config.maxRetries,
      delayMs: 10000, // 10 seconds minimum delay
    });

    // API errors - limited retries
    this.retryPolicies.set(G2AErrorCode.G2A_API_ERROR, {
      shouldRetry: true,
      maxRetries: Math.floor(this.config.maxRetries / 2), // Half the normal retries
    });

    // Non-retryable errors
    const nonRetryableErrors = [
      G2AErrorCode.G2A_AUTH_FAILED,
      G2AErrorCode.G2A_TOKEN_EXPIRED,
      G2AErrorCode.G2A_INVALID_CREDENTIALS,
      G2AErrorCode.G2A_PRODUCT_NOT_FOUND,
      G2AErrorCode.G2A_ORDER_NOT_FOUND,
      G2AErrorCode.G2A_INVALID_REQUEST,
      G2AErrorCode.G2A_VALIDATION_ERROR,
      G2AErrorCode.G2A_CIRCUIT_OPEN,
      G2AErrorCode.G2A_SYNC_CONFLICT,
    ];

    nonRetryableErrors.forEach((code) => {
      this.retryPolicies.set(code, { shouldRetry: false });
    });
  }

  /**
   * Calculate retry delay with exponential backoff and optional jitter
   */
  private calculateDelay(attempt: number, baseDelay?: number): number {
    const delay = baseDelay || this.config.initialDelayMs;
    const exponentialDelay = delay * Math.pow(this.config.backoffMultiplier, attempt);
    const cappedDelay = Math.min(exponentialDelay, this.config.maxDelayMs);

    if (!this.config.jitter) {
      return cappedDelay;
    }

    // Add jitter: random value between 0 and cappedDelay
    // This prevents thundering herd problem
    const jitter = Math.random() * cappedDelay;
    return Math.floor(jitter);
  }

  /**
   * Get retry policy for a specific error
   */
  getRetryPolicy(error: G2AError): RetryPolicy {
    const policy = this.retryPolicies.get(error.code);

    if (policy) {
      return policy;
    }

    // Default policy: use error's retryable flag
    return {
      shouldRetry: error.isRetryable(),
      maxRetries: this.config.maxRetries,
    };
  }

  /**
   * Check if operation should be retried
   */
  shouldRetry(error: G2AError, attempt: number): boolean {
    // Don't retry if circuit breaker is open
    if (this.circuitBreaker && this.circuitBreaker.isOpen()) {
      this.logger.debug('Skipping retry: circuit breaker is open');
      return false;
    }

    const policy = this.getRetryPolicy(error);

    if (!policy.shouldRetry) {
      this.logger.debug('Error is not retryable', { errorCode: error.code });
      return false;
    }

    const maxRetries = policy.maxRetries || this.config.maxRetries;
    if (attempt >= maxRetries) {
      this.logger.debug('Max retries reached', { attempt, maxRetries });
      return false;
    }

    // Check if error has suggested retry delay (e.g., rate limit with Retry-After header)
    if (error.metadata.retryAfter !== undefined) {
      this.logger.debug('Error includes retry delay', { retryAfter: error.metadata.retryAfter });
    }

    return true;
  }

  /**
   * Execute a function with retry logic
   */
  async execute<T>(
    fn: () => Promise<T>,
    operationName: string,
    idempotencyKey?: string
  ): Promise<T> {
    const startTime = Date.now();
    let attempt = 0;

    while (true) {
      try {
        // Add idempotency key to request if provided (could be passed to headers)
        this.logger.debug('Executing operation', { operationName, attempt, idempotencyKey });

        const result = await fn();

        if (attempt > 0) {
          this.logger.info('Operation succeeded after retries', {
            operationName,
            attempt,
            totalTime: Date.now() - startTime,
          });
        }

        return result;
      } catch (error) {
        const g2aError =
          error instanceof G2AError
            ? error
            : new G2AError(
                G2AErrorCode.G2A_API_ERROR,
                error instanceof Error ? error.message : String(error),
                { retryable: false }
              );

        // Check retry budget
        if (this.config.retryBudgetMs) {
          const elapsed = Date.now() - startTime;
          if (elapsed > this.config.retryBudgetMs) {
            this.logger.warn('Retry budget exceeded', {
              operationName,
              elapsed,
              retryBudgetMs: this.config.retryBudgetMs,
            });
            throw g2aError;
          }
        }

        // Check if should retry
        if (!this.shouldRetry(g2aError, attempt)) {
          throw g2aError;
        }

        // Calculate delay
        const policy = this.getRetryPolicy(g2aError);
        const suggestedDelay = g2aError.metadata.retryAfter || policy.delayMs;
        const delay = this.calculateDelay(attempt, suggestedDelay);

        this.logger.warn('Operation failed, retrying', {
          operationName,
          attempt: attempt + 1,
          maxRetries: policy.maxRetries || this.config.maxRetries,
          delay,
          error: g2aError.message,
          errorCode: g2aError.code,
        });

        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, delay));

        attempt++;
      }
    }
  }

  /**
   * Set custom retry policy for an error code
   */
  setRetryPolicy(errorCode: G2AErrorCode, policy: RetryPolicy): void {
    this.retryPolicies.set(errorCode, policy);
  }

  /**
   * Get retry statistics
   */
  getStats(): {
    config: RetryConfig;
    policies: Record<string, RetryPolicy>;
  } {
    const policies: Record<string, RetryPolicy> = {};
    this.retryPolicies.forEach((policy, code) => {
      policies[code] = policy;
    });

    return {
      config: this.config,
      policies,
    };
  }
}
