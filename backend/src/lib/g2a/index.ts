/**
 * G2A Integration Client - Main Export
 *
 * A comprehensive TypeScript client for G2A Integration API
 * Based on the official PHP client with enhanced features
 */

// Main client
export { G2AIntegrationClient } from './G2AIntegrationClient.js';

// Configuration
export type { G2AConfig, PartialG2AConfig, G2AEnvironment } from './config/G2AConfig.js';
export { getDefaultConfig } from './config/defaults.js';

// API Modules
export { ProductsAPI } from './api/ProductsAPI.js';
export { OrdersAPI } from './api/OrdersAPI.js';
export { OffersAPI } from './api/OffersAPI.js';
export { ReservationsAPI } from './api/ReservationsAPI.js';
export { JobsAPI } from './api/JobsAPI.js';
export { BestsellersAPI } from './api/BestsellersAPI.js';
export { PriceSimulationsAPI } from './api/PriceSimulationsAPI.js';

// Authentication
export { AuthManager } from './auth/AuthManager.js';
export { TokenManager } from './auth/TokenManager.js';
export { HashAuthenticator } from './auth/HashAuthenticator.js';

// Batch Operations
export { BatchOperations } from './batch/BatchOperations.js';
export { BatchProductFetcher } from './batch/BatchProductFetcher.js';
export { BatchOrderCreator } from './batch/BatchOrderCreator.js';
export { BatchPriceUpdater } from './batch/BatchPriceUpdater.js';

// Filters
export { FilterBuilder } from './filters/FilterBuilder.js';
export { ProductFilter } from './filters/ProductFilter.js';
export { FilterValidator } from './filters/FilterValidator.js';

// Sync
export { DeltaSync } from './sync/DeltaSync.js';
export { ConflictResolver } from './sync/ConflictResolver.js';
export { SyncOrchestrator } from './sync/SyncOrchestrator.js';
export { SyncReconciliation } from './sync/SyncReconciliation.js';

// Resilience
export { CircuitBreaker, CircuitState } from './resilience/CircuitBreaker.js';
export { RateLimiter } from './resilience/RateLimiter.js';
export { RetryStrategy } from './resilience/RetryStrategy.js';

// Errors
export {
  G2AError,
  G2AErrorCode,
  G2ACircuitOpenError,
  G2ABatchPartialFailureError,
  G2ASyncConflictError,
  G2AValidationError,
  G2AQuotaExceededError,
} from './errors/G2AError.js';
export { ErrorMapper } from './errors/ErrorMapper.js';

// Utilities
export { createLogger } from './utils/logger.js';
export { createMetrics } from './utils/metrics.js';
export type { G2ALogger, LogLevel } from './utils/logger.js';
export type { G2AMetrics } from './utils/metrics.js';

// Types
export * from './types/index.js';
