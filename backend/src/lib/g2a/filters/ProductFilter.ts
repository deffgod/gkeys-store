/**
 * Product-specific filter implementation
 * Extends FilterBuilder with product-specific methods
 */

import { G2AProduct, G2AProductFilters, G2AProductsResponse } from '../types/index.js';
import { FilterBuilder } from './FilterBuilder.js';
import { G2ALogger } from '../utils/logger.js';
import { ProductsAPI } from '../api/ProductsAPI.js';

export class ProductFilter {
  private filterBuilder: FilterBuilder<G2AProduct>;
  private g2aFilters: G2AProductFilters = {};

  constructor(
    private productsAPI: ProductsAPI,
    private logger: G2ALogger
  ) {
    this.filterBuilder = new FilterBuilder<G2AProduct>(logger, 'Product');
  }

  /**
   * Filter by product ID
   */
  id(productId: string): this {
    this.g2aFilters.id = productId;
    this.filterBuilder.where('id', productId);
    return this;
  }

  /**
   * Filter by minimum quantity (stock)
   */
  minQuantity(qty: number): this {
    this.g2aFilters.minQty = qty;
    this.filterBuilder.whereGreaterThanOrEqual('qty', qty);
    return this;
  }

  /**
   * Filter by price range
   */
  priceRange(min: number, max: number): this {
    this.g2aFilters.minPriceFrom = min;
    this.g2aFilters.minPriceTo = max;
    this.filterBuilder.whereBetween('price', min, max);
    return this;
  }

  /**
   * Filter by minimum price
   */
  minPrice(price: number): this {
    this.g2aFilters.minPriceFrom = price;
    this.filterBuilder.whereGreaterThanOrEqual('price', price);
    return this;
  }

  /**
   * Filter by maximum price
   */
  maxPrice(price: number): this {
    this.g2aFilters.minPriceTo = price;
    this.filterBuilder.whereLessThanOrEqual('price', price);
    return this;
  }

  /**
   * Include out-of-stock products
   */
  includeOutOfStock(include: boolean = true): this {
    this.g2aFilters.includeOutOfStock = include;
    return this;
  }

  /**
   * Filter to only in-stock products
   */
  inStock(): this {
    this.g2aFilters.includeOutOfStock = false;
    this.filterBuilder.whereGreaterThan('qty', 0);
    return this;
  }

  /**
   * Filter by platform
   */
  platform(platform: string): this {
    this.filterBuilder.where('platform', platform);
    return this;
  }

  /**
   * Filter by multiple platforms
   */
  platforms(platforms: string[]): this {
    this.filterBuilder.whereIn('platform', platforms);
    return this;
  }

  /**
   * Filter by region
   */
  region(region: string): this {
    this.filterBuilder.where('region', region);
    return this;
  }

  /**
   * Filter by type
   */
  type(type: string): this {
    this.filterBuilder.where('type', type);
    return this;
  }

  /**
   * Filter by products updated since a date
   */
  updatedSince(date: string): this {
    this.g2aFilters.updatedAtFrom = date;
    this.filterBuilder.whereGreaterThanOrEqual('updatedAt', date);
    return this;
  }

  /**
   * Filter by products updated until a date
   */
  updatedUntil(date: string): this {
    this.g2aFilters.updatedAtTo = date;
    this.filterBuilder.whereLessThanOrEqual('updatedAt', date);
    return this;
  }

  /**
   * Filter by products updated between dates
   */
  updatedBetween(from: string, to: string): this {
    this.g2aFilters.updatedAtFrom = from;
    this.g2aFilters.updatedAtTo = to;
    return this;
  }

  /**
   * Search products by name
   */
  search(query: string): this {
    this.filterBuilder.search(query, ['name', 'description']);
    return this;
  }

  /**
   * Sort by field
   */
  sortBy(field: keyof G2AProduct, direction: 'asc' | 'desc' = 'asc'): this {
    this.filterBuilder.sortBy(field, direction);
    return this;
  }

  /**
   * Set pagination
   */
  paginate(page: number, pageSize: number = 20): this {
    this.g2aFilters.page = page;
    this.filterBuilder.paginate(page, pageSize);
    return this;
  }

  /**
   * Execute the filter and fetch products from G2A API
   */
  async execute(): Promise<G2AProductsResponse> {
    this.logger.info('Executing product filter', { g2aFilters: this.g2aFilters });

    // Use G2A API filters (server-side filtering)
    let response = await this.productsAPI.list(this.g2aFilters);

    // Apply client-side filters (for filters not supported by G2A API)
    const builtFilter = this.filterBuilder.build();

    if (builtFilter.search || builtFilter.criteria.length > 0 || builtFilter.sort.length > 0) {
      response = this.applyClientSideFilters(response, builtFilter);
    }

    return response;
  }

  /**
   * Apply client-side filters (fuzzy search, complex filtering, sorting)
   */
  private applyClientSideFilters(
    response: G2AProductsResponse,
    filter: ReturnType<FilterBuilder<G2AProduct>['build']>
  ): G2AProductsResponse {
    let filtered = [...response.docs];

    // Apply search (fuzzy matching)
    if (filter.search) {
      const query = filter.search.query.toLowerCase();
      filtered = filtered.filter((product) => {
        return filter.search!.fields.some((field) => {
          const value = (product as any)[field];
          if (typeof value === 'string') {
            return value.toLowerCase().includes(query);
          }
          return false;
        });
      });
    }

    // Apply additional criteria (client-side)
    filtered = filtered.filter((product) => {
      return filter.criteria.every((criterion) => {
        return this.evaluateCriterion(product, criterion);
      });
    });

    // Apply sorting
    if (filter.sort.length > 0) {
      filtered.sort((a, b) => {
        for (const sort of filter.sort) {
          const aValue = (a as any)[sort.field];
          const bValue = (b as any)[sort.field];

          if (aValue === bValue) continue;

          const comparison = aValue < bValue ? -1 : 1;
          return sort.direction === 'asc' ? comparison : -comparison;
        }
        return 0;
      });
    }

    this.logger.debug('Client-side filter applied', {
      originalCount: response.docs.length,
      filteredCount: filtered.length,
    });

    return {
      ...response,
      docs: filtered,
      total: filtered.length,
    };
  }

  /**
   * Evaluate a single filter criterion
   */
  private evaluateCriterion(product: G2AProduct, criterion: any): boolean {
    const value = (product as any)[criterion.field];

    switch (criterion.operator) {
      case 'eq':
        return value === criterion.value;
      case 'ne':
        return value !== criterion.value;
      case 'gt':
        return value > criterion.value;
      case 'gte':
        return value >= criterion.value;
      case 'lt':
        return value < criterion.value;
      case 'lte':
        return value <= criterion.value;
      case 'in':
        return criterion.value.includes(value);
      case 'nin':
        return !criterion.value.includes(value);
      case 'like':
        return (
          typeof value === 'string' && value.toLowerCase().includes(criterion.value.toLowerCase())
        );
      case 'between':
        return value >= criterion.value[0] && value <= criterion.value[1];
      default:
        return true;
    }
  }

  /**
   * Reset the filter
   */
  reset(): this {
    this.filterBuilder.reset();
    this.g2aFilters = {};
    return this;
  }

  /**
   * Clone the filter
   */
  clone(): ProductFilter {
    const cloned = new ProductFilter(this.productsAPI, this.logger);
    cloned.filterBuilder = this.filterBuilder.clone();
    cloned.g2aFilters = { ...this.g2aFilters };
    return cloned;
  }
}
