/**
 * Sync Orchestrator
 * Coordinates multiple sync operations (catalog, categories, genres, platforms)
 */

import { G2ALogger } from '../utils/logger.js';
import { DeltaSync, DeltaSyncResult } from './DeltaSync.js';
import { ConflictResolver } from './ConflictResolver.js';

export interface SyncOrchestratorOptions {
  syncCatalog?: boolean;
  syncCategories?: boolean;
  syncGenres?: boolean;
  syncPlatforms?: boolean;
  parallel?: boolean;
  lastSyncTimestamp?: string;
}

export interface SyncOrchestratorResult {
  catalog?: DeltaSyncResult;
  categories?: { count: number; duration: number };
  genres?: { count: number; duration: number };
  platforms?: { count: number; duration: number };
  totalDuration: number;
  errors: string[];
}

export class SyncOrchestrator {
  constructor(
    private deltaSync: DeltaSync,
    private conflictResolver: ConflictResolver,
    private logger: G2ALogger
  ) {}
  
  /**
   * Orchestrate full synchronization
   */
  async sync(options: SyncOrchestratorOptions = {}): Promise<SyncOrchestratorResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    
    this.logger.info('Starting sync orchestration', {
      syncCatalog: options.syncCatalog ?? true,
      syncCategories: options.syncCategories ?? false,
      syncGenres: options.syncGenres ?? false,
      syncPlatforms: options.syncPlatforms ?? false,
      parallel: options.parallel ?? false,
    });
    
    const result: SyncOrchestratorResult = {
      totalDuration: 0,
      errors,
    };
    
    if (options.parallel) {
      // Parallel execution
      const promises: Promise<void>[] = [];
      
      if (options.syncCatalog ?? true) {
        promises.push(this.syncCatalogWithErrorHandling(options, result, errors));
      }
      
      if (options.syncCategories) {
        promises.push(this.syncCategoriesWithErrorHandling(result, errors));
      }
      
      if (options.syncGenres) {
        promises.push(this.syncGenresWithErrorHandling(result, errors));
      }
      
      if (options.syncPlatforms) {
        promises.push(this.syncPlatformsWithErrorHandling(result, errors));
      }
      
      await Promise.allSettled(promises);
    } else {
      // Sequential execution
      if (options.syncCatalog ?? true) {
        await this.syncCatalogWithErrorHandling(options, result, errors);
      }
      
      if (options.syncCategories) {
        await this.syncCategoriesWithErrorHandling(result, errors);
      }
      
      if (options.syncGenres) {
        await this.syncGenresWithErrorHandling(result, errors);
      }
      
      if (options.syncPlatforms) {
        await this.syncPlatformsWithErrorHandling(result, errors);
      }
    }
    
    result.totalDuration = Date.now() - startTime;
    
    this.logger.info('Sync orchestration completed', {
      totalDuration: result.totalDuration,
      errorCount: errors.length,
    });
    
    return result;
  }
  
  /**
   * Sync catalog with error handling
   */
  private async syncCatalogWithErrorHandling(
    options: SyncOrchestratorOptions,
    result: SyncOrchestratorResult,
    errors: string[]
  ): Promise<void> {
    try {
      result.catalog = await this.deltaSync.sync({
        lastSyncTimestamp: options.lastSyncTimestamp,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`Catalog sync failed: ${message}`);
      this.logger.error('Catalog sync failed', error);
    }
  }
  
  /**
   * Sync categories with error handling
   */
  private async syncCategoriesWithErrorHandling(
    result: SyncOrchestratorResult,
    errors: string[]
  ): Promise<void> {
    try {
      const startTime = Date.now();
      // Placeholder: actual category sync logic would go here
      result.categories = {
        count: 0,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`Category sync failed: ${message}`);
      this.logger.error('Category sync failed', error);
    }
  }
  
  /**
   * Sync genres with error handling
   */
  private async syncGenresWithErrorHandling(
    result: SyncOrchestratorResult,
    errors: string[]
  ): Promise<void> {
    try {
      const startTime = Date.now();
      // Placeholder: actual genre sync logic would go here
      result.genres = {
        count: 0,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`Genre sync failed: ${message}`);
      this.logger.error('Genre sync failed', error);
    }
  }
  
  /**
   * Sync platforms with error handling
   */
  private async syncPlatformsWithErrorHandling(
    result: SyncOrchestratorResult,
    errors: string[]
  ): Promise<void> {
    try {
      const startTime = Date.now();
      // Placeholder: actual platform sync logic would go here
      result.platforms = {
        count: 0,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`Platform sync failed: ${message}`);
      this.logger.error('Platform sync failed', error);
    }
  }
}
