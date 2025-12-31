/**
 * Rate Limiter for G2A API requests
 * Implements token bucket algorithm with per-endpoint limits
 */

import { G2AQuotaExceededError } from '../errors/G2AError.js';

interface TokenBucket {
  tokens: number;
  maxTokens: number;
  refillRate: number; // tokens per second
  lastRefill: number;
}

export class RateLimiter {
  private enabled: boolean;
  private globalBucket: TokenBucket;
  private endpointBuckets: Map<string, TokenBucket> = new Map();

  constructor(
    enabled: boolean = true,
    globalRequestsPerSecond: number = 10,
    globalBurstSize: number = 20,
    private endpointLimits: Record<string, { requestsPerSecond: number; burstSize: number }> = {}
  ) {
    this.enabled = enabled;
    this.globalBucket = {
      tokens: globalBurstSize,
      maxTokens: globalBurstSize,
      refillRate: globalRequestsPerSecond,
      lastRefill: Date.now(),
    };
  }

  private refillBucket(bucket: TokenBucket): void {
    const now = Date.now();
    const elapsed = (now - bucket.lastRefill) / 1000; // seconds
    const tokensToAdd = elapsed * bucket.refillRate;

    bucket.tokens = Math.min(bucket.maxTokens, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }

  private consumeToken(bucket: TokenBucket): boolean {
    this.refillBucket(bucket);

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return true;
    }

    return false;
  }

  private getEndpointBucket(endpoint: string): TokenBucket | null {
    if (!this.endpointLimits[endpoint]) {
      return null;
    }

    if (!this.endpointBuckets.has(endpoint)) {
      const limit = this.endpointLimits[endpoint];
      this.endpointBuckets.set(endpoint, {
        tokens: limit.burstSize,
        maxTokens: limit.burstSize,
        refillRate: limit.requestsPerSecond,
        lastRefill: Date.now(),
      });
    }

    return this.endpointBuckets.get(endpoint)!;
  }

  private calculateWaitTime(bucket: TokenBucket): number {
    this.refillBucket(bucket);

    if (bucket.tokens >= 1) {
      return 0;
    }

    // Calculate time needed to refill 1 token
    const tokensNeeded = 1 - bucket.tokens;
    return Math.ceil((tokensNeeded / bucket.refillRate) * 1000); // milliseconds
  }

  async checkLimit(endpoint: string): Promise<boolean> {
    if (!this.enabled) {
      return true;
    }

    // Check global limit
    if (!this.consumeToken(this.globalBucket)) {
      return false;
    }

    // Check endpoint-specific limit
    const endpointBucket = this.getEndpointBucket(endpoint);
    if (endpointBucket && !this.consumeToken(endpointBucket)) {
      // Restore global token since endpoint limit failed
      this.globalBucket.tokens += 1;
      return false;
    }

    return true;
  }

  async waitIfNeeded(endpoint: string): Promise<void> {
    if (!this.enabled) {
      return;
    }

    // Calculate wait time for global bucket
    const globalWait = this.calculateWaitTime(this.globalBucket);

    // Calculate wait time for endpoint bucket
    const endpointBucket = this.getEndpointBucket(endpoint);
    const endpointWait = endpointBucket ? this.calculateWaitTime(endpointBucket) : 0;

    const waitTime = Math.max(globalWait, endpointWait);

    if (waitTime > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    // Try to consume tokens
    const canProceed = await this.checkLimit(endpoint);
    if (!canProceed) {
      // Should not happen after waiting, but throw error if it does
      throw new G2AQuotaExceededError(endpoint, waitTime);
    }
  }

  getRemainingTokens(endpoint?: string): number {
    if (endpoint) {
      const bucket = this.getEndpointBucket(endpoint);
      if (bucket) {
        this.refillBucket(bucket);
        return Math.floor(bucket.tokens);
      }
    }

    this.refillBucket(this.globalBucket);
    return Math.floor(this.globalBucket.tokens);
  }

  reset(): void {
    this.globalBucket.tokens = this.globalBucket.maxTokens;
    this.globalBucket.lastRefill = Date.now();
    this.endpointBuckets.clear();
  }
}
