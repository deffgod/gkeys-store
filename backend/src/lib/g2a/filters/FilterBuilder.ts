/**
 * Fluent Filter Builder API
 * Provides a chainable interface for building complex filters
 */

import { G2ALogger } from '../utils/logger.js';
import { ValidationError } from '../utils/validation.js';

export type SortDirection = 'asc' | 'desc';
export type FilterOperator =
  | 'eq'
  | 'ne'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'nin'
  | 'like'
  | 'between';

export interface FilterCriterion {
  field: string;
  operator: FilterOperator;
  value: any;
}

export interface SortCriterion {
  field: string;
  direction: SortDirection;
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
}

export class FilterBuilder<TEntity> {
  private criteria: FilterCriterion[] = [];
  private sortCriteria: SortCriterion[] = [];
  private paginationOptions: PaginationOptions | null = null;
  private searchQuery: string | null = null;
  private searchFields: string[] = [];

  constructor(
    private logger: G2ALogger,
    private entityName: string
  ) {}

  /**
   * Add an equality filter
   */
  where(field: keyof TEntity, value: any): this {
    return this.addCriterion(String(field), 'eq', value);
  }

  /**
   * Add a not-equal filter
   */
  whereNot(field: keyof TEntity, value: any): this {
    return this.addCriterion(String(field), 'ne', value);
  }

  /**
   * Add a greater-than filter
   */
  whereGreaterThan(field: keyof TEntity, value: number | string): this {
    return this.addCriterion(String(field), 'gt', value);
  }

  /**
   * Add a greater-than-or-equal filter
   */
  whereGreaterThanOrEqual(field: keyof TEntity, value: number | string): this {
    return this.addCriterion(String(field), 'gte', value);
  }

  /**
   * Add a less-than filter
   */
  whereLessThan(field: keyof TEntity, value: number | string): this {
    return this.addCriterion(String(field), 'lt', value);
  }

  /**
   * Add a less-than-or-equal filter
   */
  whereLessThanOrEqual(field: keyof TEntity, value: number | string): this {
    return this.addCriterion(String(field), 'lte', value);
  }

  /**
   * Add an "in" filter (value in array)
   */
  whereIn(field: keyof TEntity, values: any[]): this {
    if (!Array.isArray(values) || values.length === 0) {
      throw new ValidationError('whereIn requires a non-empty array', String(field), values);
    }
    return this.addCriterion(String(field), 'in', values);
  }

  /**
   * Add a "not in" filter (value not in array)
   */
  whereNotIn(field: keyof TEntity, values: any[]): this {
    if (!Array.isArray(values) || values.length === 0) {
      throw new ValidationError('whereNotIn requires a non-empty array', String(field), values);
    }
    return this.addCriterion(String(field), 'nin', values);
  }

  /**
   * Add a "like" filter (partial string match)
   */
  whereLike(field: keyof TEntity, pattern: string): this {
    if (typeof pattern !== 'string') {
      throw new ValidationError('whereLike requires a string pattern', String(field), pattern);
    }
    return this.addCriterion(String(field), 'like', pattern);
  }

  /**
   * Add a "between" filter (value between min and max)
   */
  whereBetween(field: keyof TEntity, min: number, max: number): this {
    if (min > max) {
      throw new ValidationError(
        'whereBetween: min must be less than or equal to max',
        String(field),
        { min, max }
      );
    }
    return this.addCriterion(String(field), 'between', [min, max]);
  }

  /**
   * Add a generic criterion
   */
  private addCriterion(field: string, operator: FilterOperator, value: any): this {
    this.criteria.push({ field, operator, value });
    return this;
  }

  /**
   * Add a sort criterion
   */
  sortBy(field: keyof TEntity, direction: SortDirection = 'asc'): this {
    this.sortCriteria.push({
      field: String(field),
      direction,
    });
    return this;
  }

  /**
   * Set pagination options
   */
  paginate(page: number, pageSize: number): this {
    if (page < 1) {
      throw new ValidationError('Page number must be >= 1', 'page', page);
    }
    if (pageSize < 1 || pageSize > 500) {
      throw new ValidationError('Page size must be between 1 and 500', 'pageSize', pageSize);
    }

    this.paginationOptions = { page, pageSize };
    return this;
  }

  /**
   * Add a full-text search query
   */
  search(query: string, fields: (keyof TEntity)[]): this {
    if (!query || query.trim().length === 0) {
      throw new ValidationError('Search query cannot be empty', 'query', query);
    }
    if (!fields || fields.length === 0) {
      throw new ValidationError('Search requires at least one field', 'fields', fields);
    }

    this.searchQuery = query.trim();
    this.searchFields = fields.map((f) => String(f));
    return this;
  }

  /**
   * Build the filter object
   */
  build(): {
    criteria: FilterCriterion[];
    sort: SortCriterion[];
    pagination: PaginationOptions | null;
    search: { query: string; fields: string[] } | null;
  } {
    this.logger.debug(`Building filter for ${this.entityName}`, {
      criteriaCount: this.criteria.length,
      sortCount: this.sortCriteria.length,
      hasPagination: !!this.paginationOptions,
      hasSearch: !!this.searchQuery,
    });

    return {
      criteria: [...this.criteria],
      sort: [...this.sortCriteria],
      pagination: this.paginationOptions ? { ...this.paginationOptions } : null,
      search: this.searchQuery ? { query: this.searchQuery, fields: [...this.searchFields] } : null,
    };
  }

  /**
   * Reset the filter builder
   */
  reset(): this {
    this.criteria = [];
    this.sortCriteria = [];
    this.paginationOptions = null;
    this.searchQuery = null;
    this.searchFields = [];
    return this;
  }

  /**
   * Clone the filter builder
   */
  clone(): FilterBuilder<TEntity> {
    const cloned = new FilterBuilder<TEntity>(this.logger, this.entityName);
    cloned.criteria = [...this.criteria];
    cloned.sortCriteria = [...this.sortCriteria];
    cloned.paginationOptions = this.paginationOptions ? { ...this.paginationOptions } : null;
    cloned.searchQuery = this.searchQuery;
    cloned.searchFields = [...this.searchFields];
    return cloned;
  }
}
