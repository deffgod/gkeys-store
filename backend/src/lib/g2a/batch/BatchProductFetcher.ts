/**
 * Batch Product Fetcher
 * Efficiently fetch multiple products with intelligent chunking and caching
 */

import { G2AProduct } from '../types/index.js';
import { ProductsAPI } from '../api/ProductsAPI.js';
import { BatchOperations, BatchResult } from './BatchOperations.js';
import { G2ALogger } from '../utils/logger.js';

export class BatchProductFetcher {
  private batchOperations: BatchOperations;

  constructor(
    private productsAPI: ProductsAPI,
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
   * Fetch multiple products by IDs
   */
  async fetchByIds(productIds: string[]): Promise<BatchResult<G2AProduct>> {
    this.logger.info('Batch fetching products by IDs', { count: productIds.length });

    return this.batchOperations.execute(
      productIds,
      async (productId, index) => {
        this.logger.debug('Fetching product', { productId, index });
        return await this.productsAPI.get(productId);
      },
      'BatchProductFetcher.fetchByIds'
    );
  }

  /**
   * Fetch products with filters (paginated)
   * Automatically fetches all pages until no more products are available
   *
   * @param filters - Product filters (page will be ignored)
   * @param maxPages - Optional maximum pages limit (0 = unlimited, default: 0)
   * @param onProgress - Optional progress callback
   */
  async fetchWithFilters(
    filters: any,
    maxPages: number = 0,
    onProgress?: (page: number, total: number, currentCount: number) => void
  ): Promise<BatchResult<G2AProduct>> {
    this.logger.info('Batch fetching products with filters', {
      filters,
      maxPages: maxPages === 0 ? 'unlimited' : maxPages,
    });

    const allProducts: G2AProduct[] = [];
    const failures: Array<{ index: number; error: Error }> = [];
    const startTime = Date.now();
    let page = 1;
    let totalProducts = 0;
    let hasMore = true;

    while (hasMore && (maxPages === 0 || page <= maxPages)) {
      try {
        const response = await this.productsAPI.list({ ...filters, page });

        if (response.docs && response.docs.length > 0) {
          allProducts.push(...response.docs);
          totalProducts = response.total;

          this.logger.debug('Fetched page', {
            page,
            count: response.docs.length,
            total: response.total,
            accumulated: allProducts.length,
          });

          // Call progress callback if provided
          if (onProgress) {
            onProgress(page, totalProducts, allProducts.length);
          }

          // Check if we've fetched all products
          if (allProducts.length >= response.total || response.docs.length === 0) {
            hasMore = false;
          } else {
            page++;
            // Small delay to respect rate limits
            await new Promise((resolve) => setTimeout(resolve, 200));
          }
        } else {
          // No more products
          hasMore = false;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const isCircuitOpen =
          errorMessage.includes('Circuit breaker is open') ||
          errorMessage.includes('G2A_CIRCUIT_OPEN');

        failures.push({
          index: page,
          error: error instanceof Error ? error : new Error(String(error)),
        });

        this.logger.warn('Failed to fetch page', { page, error: errorMessage });

        // If circuit breaker is open, stop immediately
        if (isCircuitOpen) {
          this.logger.error('Circuit breaker is open, stopping pagination', { page });
          hasMore = false;
          break;
        }

        // If maxPages is set and we hit an error, stop
        // Otherwise, continue to next page
        if (maxPages > 0) {
          hasMore = false;
        } else {
          page++;
          // Wait a bit longer on error before retrying
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    }

    const duration = Date.now() - startTime;

    this.logger.info('Batch fetch completed', {
      totalPages: page,
      totalFetched: allProducts.length,
      expectedTotal: totalProducts,
      failures: failures.length,
      duration: `${(duration / 1000).toFixed(2)}s`,
    });

    return {
      success: allProducts,
      failures,
      totalProcessed: allProducts.length + failures.length,
      successCount: allProducts.length,
      failureCount: failures.length,
      duration,
    };
  }

  /**
   * Fetch products updated since a specific date
   * Useful for incremental sync
   *
   * @param updatedAtFrom - Date string in format yyyy-mm-dd hh:mm:ss
   * @param maxPages - Optional maximum pages limit (0 = unlimited, default: 0)
   */
  async fetchUpdatedSince(
    updatedAtFrom: string,
    maxPages: number = 0
  ): Promise<BatchResult<G2AProduct>> {
    this.logger.info('Fetching products updated since', {
      updatedAtFrom,
      maxPages: maxPages === 0 ? 'unlimited' : maxPages,
    });

    return this.fetchWithFilters({ updatedAtFrom }, maxPages);
  }

  /**
   * Fetch all products from G2A Export API
   * Automatically handles pagination to get the complete catalog
   *
   * @param filters - Optional filters (excluding pagination)
   * @param onProgress - Optional progress callback
   */
  async fetchAll(
    filters?: Omit<any, 'page'>,
    onProgress?: (page: number, total: number, currentCount: number) => void
  ): Promise<BatchResult<G2AProduct>> {
    this.logger.info('Fetching all products from G2A Export API', { filters });

    return this.fetchWithFilters(filters, 0, onProgress);
  }
}
