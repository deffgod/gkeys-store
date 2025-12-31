/**
 * Batch Price Updater
 * Update prices for multiple products with delta detection
 */

import { BatchOperations, BatchResult } from './BatchOperations.js';
import { G2ALogger } from '../utils/logger.js';
import { PriceSimulationsAPI } from '../api/PriceSimulationsAPI.js';
import { PriceSimulationResponse } from '../types/index.js';

export interface PriceUpdateRequest {
  productId: string;
  newPrice: number;
  currentPrice?: number; // For delta detection
  country?: string;
}

export interface PriceUpdateResult {
  productId: string;
  oldPrice?: number;
  newPrice: number;
  simulation: PriceSimulationResponse;
  changed: boolean;
}

export class BatchPriceUpdater {
  private batchOperations: BatchOperations;
  
  constructor(
    private priceSimulationsAPI: PriceSimulationsAPI,
    private logger: G2ALogger,
    chunkSize: number = 10,
    maxConcurrency: number = 3
  ) {
    this.batchOperations = new BatchOperations(logger, {
      chunkSize,
      maxConcurrency,
      continueOnError: true,
    });
  }
  
  /**
   * Simulate price updates for multiple products
   */
  async simulatePrices(
    updates: PriceUpdateRequest[]
  ): Promise<BatchResult<PriceUpdateResult>> {
    this.logger.info('Batch simulating price updates', { count: updates.length });
    
    // Filter out updates where price hasn't changed (delta detection)
    const changedUpdates = updates.filter(update => {
      if (update.currentPrice === undefined) {
        return true; // Include if we don't know current price
      }
      return update.newPrice !== update.currentPrice;
    });
    
    if (changedUpdates.length < updates.length) {
      this.logger.info('Filtered out unchanged prices', {
        total: updates.length,
        changed: changedUpdates.length,
        skipped: updates.length - changedUpdates.length,
      });
    }
    
    return this.batchOperations.execute(
      changedUpdates,
      async (update, index) => {
        this.logger.debug('Simulating price', {
          index,
          productId: update.productId,
          oldPrice: update.currentPrice,
          newPrice: update.newPrice,
        });
        
        const simulation = await this.priceSimulationsAPI.simulate(
          update.productId,
          update.newPrice,
          update.country
        );
        
        return {
          productId: update.productId,
          oldPrice: update.currentPrice,
          newPrice: update.newPrice,
          simulation,
          changed: true,
        };
      },
      'BatchPriceUpdater.simulatePrices'
    );
  }
  
  /**
   * Apply price updates with validation
   * Returns products that passed validation
   */
  async applyPricesWithValidation(
    updates: PriceUpdateRequest[],
    validator?: (result: PriceUpdateResult) => boolean
  ): Promise<BatchResult<PriceUpdateResult>> {
    this.logger.info('Applying price updates with validation', { count: updates.length });
    
    // First simulate all prices
    const simulationResult = await this.simulatePrices(updates);
    
    // Filter results through validator
    const validResults: PriceUpdateResult[] = [];
    const validationFailures: Array<{ index: number; error: Error }> = [];
    
    simulationResult.success.forEach((result, index) => {
      const isValid = validator ? validator(result) : true;
      
      if (isValid) {
        validResults.push(result);
      } else {
        validationFailures.push({
          index,
          error: new Error(`Price validation failed for product ${result.productId}`),
        });
      }
    });
    
    this.logger.info('Price validation completed', {
      total: simulationResult.success.length,
      valid: validResults.length,
      invalid: validationFailures.length,
    });
    
    return {
      success: validResults,
      failures: [...simulationResult.failures, ...validationFailures],
      totalProcessed: updates.length,
      successCount: validResults.length,
      failureCount: simulationResult.failureCount + validationFailures.length,
      duration: simulationResult.duration,
    };
  }
  
  /**
   * Get price recommendations for multiple products
   * Returns optimal prices based on market data
   */
  async getRecommendedPrices(
    productIds: string[],
    currentPrices: Record<string, number>
  ): Promise<BatchResult<{ productId: string; currentPrice: number; recommendedPrice: number; increase: number }>> {
    this.logger.info('Getting recommended prices', { count: productIds.length });
    
    // For now, this is a placeholder
    // In production, this would use market data, competitor pricing, etc.
    return this.batchOperations.execute(
      productIds,
      async (productId, _index) => {
        const currentPrice = currentPrices[productId] || 0;
        
        // Placeholder logic: recommend 5% increase
        const recommendedPrice = currentPrice * 1.05;
        
        return {
          productId,
          currentPrice,
          recommendedPrice,
          increase: recommendedPrice - currentPrice,
        };
      },
      'BatchPriceUpdater.getRecommendedPrices'
    );
  }
}
