/**
 * Delta Sync - Incremental synchronization based on updatedAt timestamps
 * Only fetches products that have changed since last sync
 */

import { G2AProduct } from '../types/index.js';
import { ProductsAPI } from '../api/ProductsAPI.js';
import { G2ALogger } from '../utils/logger.js';
import { BatchProductFetcher } from '../batch/BatchProductFetcher.js';

export interface DeltaSyncOptions {
  lastSyncTimestamp?: string; // Format: yyyy-mm-dd hh:mm:ss
  batchSize?: number;
  maxPages?: number;
}

export interface DeltaSyncResult {
  newProducts: G2AProduct[];
  updatedProducts: G2AProduct[];
  totalFetched: number;
  lastSyncTimestamp: string;
  duration: number;
}

export class DeltaSync {
  private batchFetcher: BatchProductFetcher;

  constructor(
    private productsAPI: ProductsAPI,
    private logger: G2ALogger
  ) {
    this.batchFetcher = new BatchProductFetcher(productsAPI, logger);
  }

  /**
   * Perform incremental sync
   */
  async sync(options: DeltaSyncOptions = {}): Promise<DeltaSyncResult> {
    const startTime = Date.now();
    const lastSync = options.lastSyncTimestamp || this.getDefaultLastSync();

    this.logger.info('Starting delta sync', {
      lastSync,
      batchSize: options.batchSize,
      maxPages: options.maxPages,
    });

    // Fetch products updated since last sync
    const result = await this.batchFetcher.fetchUpdatedSince(lastSync, options.maxPages || 50);

    // Categorize products (new vs updated)
    const newProducts: G2AProduct[] = [];
    const updatedProducts: G2AProduct[] = [];

    result.success.forEach((product) => {
      if (product.createdAt && this.isAfterTimestamp(product.createdAt, lastSync)) {
        newProducts.push(product);
      } else {
        updatedProducts.push(product);
      }
    });

    const duration = Date.now() - startTime;
    const currentTimestamp = this.getCurrentTimestamp();

    this.logger.info('Delta sync completed', {
      totalFetched: result.successCount,
      newProducts: newProducts.length,
      updatedProducts: updatedProducts.length,
      duration,
    });

    return {
      newProducts,
      updatedProducts,
      totalFetched: result.successCount,
      lastSyncTimestamp: currentTimestamp,
      duration,
    };
  }

  /**
   * Get default last sync timestamp (24 hours ago)
   */
  private getDefaultLastSync(): string {
    const date = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.formatTimestamp(date);
  }

  /**
   * Get current timestamp
   */
  private getCurrentTimestamp(): string {
    return this.formatTimestamp(new Date());
  }

  /**
   * Format timestamp for G2A API (yyyy-mm-dd hh:mm:ss)
   */
  private formatTimestamp(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');

    return (
      `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
      `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    );
  }

  /**
   * Check if timestamp is after another timestamp
   */
  private isAfterTimestamp(timestamp: string, compareTimestamp: string): boolean {
    return new Date(timestamp) > new Date(compareTimestamp);
  }
}
