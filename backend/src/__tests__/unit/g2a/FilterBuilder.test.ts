/**
 * Unit tests for FilterBuilder
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FilterBuilder } from '../../../lib/g2a/filters/FilterBuilder.js';
import { createLogger } from '../../../lib/g2a/utils/logger.js';

describe('FilterBuilder', () => {
  let filterBuilder: FilterBuilder<any>;
  const logger = createLogger('error', true);

  beforeEach(() => {
    filterBuilder = new FilterBuilder(logger, 'Test');
  });

  describe('Basic Filters', () => {
    it('should add equality filter', () => {
      filterBuilder.where('status', 'active');
      const built = filterBuilder.build();

      expect(built.criteria).toHaveLength(1);
      expect(built.criteria[0]).toEqual({
        field: 'status',
        operator: 'eq',
        value: 'active',
      });
    });

    it('should add not-equal filter', () => {
      filterBuilder.whereNot('status', 'deleted');
      const built = filterBuilder.build();

      expect(built.criteria[0].operator).toBe('ne');
    });

    it('should add greater-than filter', () => {
      filterBuilder.whereGreaterThan('price', 100);
      const built = filterBuilder.build();

      expect(built.criteria[0].operator).toBe('gt');
      expect(built.criteria[0].value).toBe(100);
    });

    it('should add between filter', () => {
      filterBuilder.whereBetween('price', 10, 100);
      const built = filterBuilder.build();

      expect(built.criteria[0].operator).toBe('between');
      expect(built.criteria[0].value).toEqual([10, 100]);
    });
  });

  describe('Sorting', () => {
    it('should add sort criterion', () => {
      filterBuilder.sortBy('createdAt', 'desc');
      const built = filterBuilder.build();

      expect(built.sort).toHaveLength(1);
      expect(built.sort[0]).toEqual({
        field: 'createdAt',
        direction: 'desc',
      });
    });

    it('should allow multiple sort criteria', () => {
      filterBuilder.sortBy('category', 'asc').sortBy('price', 'desc');

      const built = filterBuilder.build();
      expect(built.sort).toHaveLength(2);
    });
  });

  describe('Pagination', () => {
    it('should set pagination options', () => {
      filterBuilder.paginate(2, 50);
      const built = filterBuilder.build();

      expect(built.pagination).toEqual({
        page: 2,
        pageSize: 50,
      });
    });

    it('should validate page number', () => {
      expect(() => filterBuilder.paginate(0, 50)).toThrow('Page number must be >= 1');
    });

    it('should validate page size', () => {
      expect(() => filterBuilder.paginate(1, 1000)).toThrow('Page size must be between 1 and 500');
    });
  });

  describe('Search', () => {
    it('should add search query', () => {
      filterBuilder.search('test query', ['name', 'description']);
      const built = filterBuilder.build();

      expect(built.search).toEqual({
        query: 'test query',
        fields: ['name', 'description'],
      });
    });

    it('should validate search query', () => {
      expect(() => filterBuilder.search('', ['name'])).toThrow('Search query cannot be empty');
    });

    it('should validate search fields', () => {
      expect(() => filterBuilder.search('test', [])).toThrow('Search requires at least one field');
    });
  });

  describe('Chaining', () => {
    it('should support method chaining', () => {
      const result = filterBuilder
        .where('status', 'active')
        .whereBetween('price', 10, 100)
        .sortBy('createdAt', 'desc')
        .paginate(1, 20);

      expect(result).toBe(filterBuilder);
    });
  });

  describe('Clone', () => {
    it('should create independent copy', () => {
      filterBuilder.where('status', 'active');
      const cloned = filterBuilder.clone();

      cloned.where('type', 'premium');

      expect(filterBuilder.build().criteria).toHaveLength(1);
      expect(cloned.build().criteria).toHaveLength(2);
    });
  });
});
