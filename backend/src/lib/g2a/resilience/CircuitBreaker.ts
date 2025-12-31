/**
 * Circuit Breaker implementation for G2A API
 * Prevents cascading failures by stopping requests when service is unhealthy
 */

import { G2ACircuitOpenError } from '../errors/G2AError.js';

export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Circuit is open, rejecting requests
  HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

export interface CircuitBreakerStats {
  failures: number;
  successes: number;
  lastFailure: number | null;
  lastSuccess: number | null;
  state: CircuitState;
  stateChangedAt: number;
}

export class CircuitBreaker {
  private stats: CircuitBreakerStats;
  private failureTimestamps: number[] = [];
  
  constructor(
    private enabled: boolean = true,
    private failureThreshold: number = 5,
    private failureWindowMs: number = 60000,
    private resetTimeoutMs: number = 30000,
    private halfOpenSuccessThreshold: number = 2
  ) {
    this.stats = {
      failures: 0,
      successes: 0,
      lastFailure: null,
      lastSuccess: null,
      state: CircuitState.CLOSED,
      stateChangedAt: Date.now(),
    };
  }
  
  private cleanOldFailures(): void {
    const now = Date.now();
    const cutoff = now - this.failureWindowMs;
    this.failureTimestamps = this.failureTimestamps.filter(ts => ts > cutoff);
  }
  
  private shouldTransitionToOpen(): boolean {
    this.cleanOldFailures();
    return this.failureTimestamps.length >= this.failureThreshold;
  }
  
  private shouldAttemptReset(): boolean {
    if (this.stats.state !== CircuitState.OPEN) {
      return false;
    }
    
    const now = Date.now();
    const timeSinceOpen = now - this.stats.stateChangedAt;
    return timeSinceOpen >= this.resetTimeoutMs;
  }
  
  private transitionToState(newState: CircuitState): void {
    this.stats.state = newState;
    this.stats.stateChangedAt = Date.now();
    
    if (newState === CircuitState.HALF_OPEN) {
      // Reset success counter for half-open testing
      this.stats.successes = 0;
    }
    
    if (newState === CircuitState.CLOSED) {
      // Reset failure tracking when closing
      this.failureTimestamps = [];
    }
  }
  
  async execute<T>(fn: () => Promise<T>, operationName: string): Promise<T> {
    if (!this.enabled) {
      return fn();
    }
    
    // Check if we should attempt reset
    if (this.shouldAttemptReset()) {
      this.transitionToState(CircuitState.HALF_OPEN);
    }
    
    // Reject if circuit is open
    if (this.stats.state === CircuitState.OPEN) {
      throw new G2ACircuitOpenError(
        operationName,
        `Circuit breaker is open for ${operationName}. Will retry in ${Math.ceil((this.resetTimeoutMs - (Date.now() - this.stats.stateChangedAt)) / 1000)}s`
      );
    }
    
    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }
  
  recordSuccess(): void {
    if (!this.enabled) return;
    
    this.stats.successes += 1;
    this.stats.lastSuccess = Date.now();
    
    if (this.stats.state === CircuitState.HALF_OPEN) {
      // Check if we should close the circuit
      if (this.stats.successes >= this.halfOpenSuccessThreshold) {
        this.transitionToState(CircuitState.CLOSED);
      }
    }
  }
  
  recordFailure(): void {
    if (!this.enabled) return;
    
    const now = Date.now();
    this.stats.failures += 1;
    this.stats.lastFailure = now;
    this.failureTimestamps.push(now);
    
    if (this.stats.state === CircuitState.HALF_OPEN) {
      // Failed during testing, go back to open
      this.transitionToState(CircuitState.OPEN);
    } else if (this.stats.state === CircuitState.CLOSED) {
      // Check if we should open the circuit
      if (this.shouldTransitionToOpen()) {
        this.transitionToState(CircuitState.OPEN);
      }
    }
  }
  
  getStats(): CircuitBreakerStats {
    return { ...this.stats };
  }
  
  getState(): CircuitState {
    if (this.shouldAttemptReset() && this.stats.state === CircuitState.OPEN) {
      return CircuitState.HALF_OPEN;
    }
    return this.stats.state;
  }
  
  isOpen(): boolean {
    return this.getState() === CircuitState.OPEN;
  }
  
  reset(): void {
    this.stats = {
      failures: 0,
      successes: 0,
      lastFailure: null,
      lastSuccess: null,
      state: CircuitState.CLOSED,
      stateChangedAt: Date.now(),
    };
    this.failureTimestamps = [];
  }
}
