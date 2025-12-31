/**
 * Conflict Resolver
 * Handles data conflicts during synchronization
 */

import { G2AProduct } from '../types/index.js';
import { G2ASyncConflictError } from '../errors/G2AError.js';
import { G2ALogger } from '../utils/logger.js';

export type ConflictStrategy = 'source_wins' | 'destination_wins' | 'newer_wins' | 'merge' | 'manual';

export interface ConflictResolution<T> {
  resolved: T;
  strategy: ConflictStrategy;
  changes: string[];
}

export class ConflictResolver {
  constructor(
    private logger: G2ALogger,
    private defaultStrategy: ConflictStrategy = 'newer_wins'
  ) {}
  
  /**
   * Resolve conflict between source (G2A) and destination (local) data
   */
  resolveProduct(
    source: G2AProduct,
    destination: G2AProduct,
    strategy?: ConflictStrategy
  ): ConflictResolution<G2AProduct> {
    const resolvedStrategy = strategy || this.defaultStrategy;
    
    this.logger.debug('Resolving product conflict', {
      productId: source.id,
      strategy: resolvedStrategy,
    });
    
    switch (resolvedStrategy) {
      case 'source_wins':
        return this.sourceWins(source, destination);
      
      case 'destination_wins':
        return this.destinationWins(source, destination);
      
      case 'newer_wins':
        return this.newerWins(source, destination);
      
      case 'merge':
        return this.merge(source, destination);
      
      case 'manual':
        throw new G2ASyncConflictError(
          source.id,
          'Manual conflict resolution required',
          { source, destination }
        );
      
      default:
        throw new Error(`Unknown conflict strategy: ${resolvedStrategy}`);
    }
  }
  
  /**
   * Source wins strategy - always use source data
   */
  private sourceWins(source: G2AProduct, destination: G2AProduct): ConflictResolution<G2AProduct> {
    return {
      resolved: source,
      strategy: 'source_wins',
      changes: this.detectChanges(destination, source),
    };
  }
  
  /**
   * Destination wins strategy - keep destination data
   */
  private destinationWins(source: G2AProduct, destination: G2AProduct): ConflictResolution<G2AProduct> {
    return {
      resolved: destination,
      strategy: 'destination_wins',
      changes: [],
    };
  }
  
  /**
   * Newer wins strategy - use data with most recent updatedAt
   */
  private newerWins(source: G2AProduct, destination: G2AProduct): ConflictResolution<G2AProduct> {
    const sourceUpdated = source.updatedAt ? new Date(source.updatedAt) : new Date(0);
    const destUpdated = destination.updatedAt ? new Date(destination.updatedAt) : new Date(0);
    
    const useSource = sourceUpdated >= destUpdated;
    
    return {
      resolved: useSource ? source : destination,
      strategy: 'newer_wins',
      changes: useSource ? this.detectChanges(destination, source) : [],
    };
  }
  
  /**
   * Merge strategy - intelligently merge data from both sources
   */
  private merge(source: G2AProduct, destination: G2AProduct): ConflictResolution<G2AProduct> {
    const merged: G2AProduct = { ...destination };
    const changes: string[] = [];
    
    // Always use source for critical fields
    const criticalFields: (keyof G2AProduct)[] = ['id', 'name', 'slug', 'qty', 'price', 'currency'];
    
    criticalFields.forEach(field => {
      if (source[field] !== destination[field]) {
        (merged as any)[field] = source[field];
        changes.push(`${field}: ${destination[field]} -> ${source[field]}`);
      }
    });
    
    // For timestamps, use the newer one
    if (source.updatedAt) {
      merged.updatedAt = source.updatedAt;
    }
    
    // For arrays, merge uniquely
    if (source.images && destination.images) {
      const uniqueImages = Array.from(new Set([...destination.images, ...source.images]));
      if (uniqueImages.length !== destination.images.length) {
        merged.images = uniqueImages;
        changes.push('images: merged');
      }
    }
    
    if (source.categories && destination.categories) {
      const existingIds = new Set(destination.categories.map(c => c.id));
      const newCategories = source.categories.filter(c => !existingIds.has(c.id));
      if (newCategories.length > 0) {
        merged.categories = [...destination.categories, ...newCategories];
        changes.push('categories: merged');
      }
    }
    
    return {
      resolved: merged,
      strategy: 'merge',
      changes,
    };
  }
  
  /**
   * Detect changes between two products
   */
  private detectChanges(original: G2AProduct, updated: G2AProduct): string[] {
    const changes: string[] = [];
    
    const fieldsToCheck: (keyof G2AProduct)[] = [
      'name', 'slug', 'qty', 'price', 'currency', 'type', 'region', 'platform',
      'releaseDate', 'developer', 'publisher', 'description', 'availableToBuy'
    ];
    
    fieldsToCheck.forEach(field => {
      if (original[field] !== updated[field]) {
        changes.push(`${field}: ${original[field]} -> ${updated[field]}`);
      }
    });
    
    return changes;
  }
  
  /**
   * Batch resolve conflicts
   */
  async resolveMany(
    conflicts: Array<{ source: G2AProduct; destination: G2AProduct }>,
    strategy?: ConflictStrategy
  ): Promise<ConflictResolution<G2AProduct>[]> {
    return conflicts.map(conflict =>
      this.resolveProduct(conflict.source, conflict.destination, strategy)
    );
  }
}
