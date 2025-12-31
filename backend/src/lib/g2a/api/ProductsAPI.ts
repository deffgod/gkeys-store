/**
 * Products API wrapper for G2A Export API
 */

import { AxiosInstance } from 'axios';
import { G2AProduct, G2AProductFilters, G2AProductsResponse } from '../types/index.js';
import { G2ALogger } from '../utils/logger.js';
import { ErrorMapper } from '../errors/ErrorMapper.js';

export class ProductsAPI {
  constructor(
    private httpClient: AxiosInstance,
    private logger: G2ALogger,
    private executeRequest: <T>(
      endpoint: string,
      operation: string,
      requestFn: () => Promise<T>
    ) => Promise<T>
  ) {}

  /**
   * Get list of products with optional filters
   */
  async list(filters?: G2AProductFilters): Promise<G2AProductsResponse> {
    return this.executeRequest('/products', 'ProductsAPI.list', async () => {
      this.logger.info('Fetching products list', { filters });

      const params: Record<string, string | number | boolean> = {};
      if (filters?.page) params.page = filters.page;
      if (filters?.id) params.id = filters.id;
      if (filters?.minQty) params.minQty = filters.minQty;
      if (filters?.minPriceFrom) params.minPriceFrom = filters.minPriceFrom;
      if (filters?.minPriceTo) params.minPriceTo = filters.minPriceTo;
      if (filters?.includeOutOfStock !== undefined)
        params.includeOutOfStock = filters.includeOutOfStock;
      if (filters?.updatedAtFrom) params.updatedAtFrom = filters.updatedAtFrom;
      if (filters?.updatedAtTo) params.updatedAtTo = filters.updatedAtTo;

      const response = await this.httpClient.get<G2AProductsResponse>('/products', { params });

      if (response.status !== 200) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }

      this.logger.info('Products fetched successfully', {
        total: response.data.total,
        page: response.data.page,
        count: response.data.docs?.length || 0,
      });

      return response.data;
    });
  }

  /**
   * Get single product by ID
   */
  async get(productId: string): Promise<G2AProduct> {
    return this.executeRequest(`/products/${productId}`, 'ProductsAPI.get', async () => {
      this.logger.debug('Fetching product', { productId });

      const response = await this.httpClient.get<G2AProduct>(`/products/${productId}`);

      if (response.status !== 200) {
        throw new Error(`Failed to fetch product: ${response.status}`);
      }

      this.logger.debug('Product fetched successfully', { productId, name: response.data.name });

      return response.data;
    });
  }

  /**
   * Batch get multiple products by IDs
   * Note: G2A API doesn't have a native batch endpoint, so we fetch sequentially with rate limiting
   */
  async batchGet(productIds: string[]): Promise<G2AProduct[]> {
    this.logger.info('Batch fetching products', { count: productIds.length });

    const products: G2AProduct[] = [];
    const errors: Array<{ productId: string; error: Error }> = [];

    for (const productId of productIds) {
      try {
        const product = await this.get(productId);
        products.push(product);
      } catch (error) {
        errors.push({
          productId,
          error: ErrorMapper.fromError(error, 'ProductsAPI.batchGet'),
        });
      }
    }

    this.logger.info('Batch fetch completed', {
      totalRequested: productIds.length,
      successCount: products.length,
      errorCount: errors.length,
    });

    if (errors.length > 0) {
      this.logger.warn('Some products failed to fetch', {
        errors: errors.map((e) => ({ productId: e.productId, error: e.error.message })),
      });
    }

    return products;
  }

  /**
   * Search products by name (uses list with name filtering)
   */
  async search(
    query: string,
    filters?: Omit<G2AProductFilters, 'id'>
  ): Promise<G2AProductsResponse> {
    return this.executeRequest('/products', 'ProductsAPI.search', async () => {
      this.logger.info('Searching products', { query, filters });

      // G2A API doesn't have a dedicated search endpoint, so we'll fetch all and filter client-side
      // For production, this should be optimized with proper pagination
      const response = await this.list(filters);

      // Filter results by name (case-insensitive)
      const filteredDocs = response.docs.filter((product) =>
        product.name.toLowerCase().includes(query.toLowerCase())
      );

      this.logger.info('Search completed', {
        query,
        totalResults: filteredDocs.length,
        originalTotal: response.total,
      });

      return {
        ...response,
        docs: filteredDocs,
        total: filteredDocs.length,
      };
    });
  }

  /**
   * Get all products with automatic pagination
   * Fetches all pages until no more products are available
   *
   * @param filters - Optional filters (page will be ignored, as we paginate automatically)
   * @param onProgress - Optional callback for progress updates (page, total, currentCount)
   * @returns Array of all products
   */
  async getAll(
    filters?: Omit<G2AProductFilters, 'page'>,
    onProgress?: (page: number, total: number, currentCount: number) => void
  ): Promise<G2AProduct[]> {
    return this.executeRequest('/products', 'ProductsAPI.getAll', async () => {
      this.logger.info('Fetching all products with pagination', { filters });

      const allProducts: G2AProduct[] = [];
      let page = 1;
      let totalProducts = 0;
      let hasMore = true;

      while (hasMore) {
        const response = await this.list({ ...filters, page });

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
      }

      this.logger.info('All products fetched', {
        totalPages: page,
        totalProducts: allProducts.length,
        expectedTotal: totalProducts,
      });

      return allProducts;
    });
  }
}
