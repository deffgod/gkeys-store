/**
 * Sync Reconciliation
 * Verifies sync integrity with checksums and validation
 */

import crypto from 'node:crypto';
import { G2AProduct } from '../types/index.js';
import { G2ALogger } from '../utils/logger.js';

export interface ReconciliationResult {
  valid: boolean;
  totalRecords: number;
  checksum: string;
  mismatches: Array<{
    field: string;
    expected: any;
    actual: any;
  }>;
  errors: string[];
}

export class SyncReconciliation {
  constructor(private logger: G2ALogger) {}

  /**
   * Generate checksum for a set of products
   */
  generateChecksum(products: G2AProduct[]): string {
    const sortedProducts = [...products].sort((a, b) => a.id.localeCompare(b.id));

    const hash = crypto.createHash('sha256');
    sortedProducts.forEach((product) => {
      hash.update(
        JSON.stringify({
          id: product.id,
          name: product.name,
          price: product.price,
          qty: product.qty,
          updatedAt: product.updatedAt,
        })
      );
    });

    return hash.digest('hex');
  }

  /**
   * Verify sync integrity
   */
  async verify(
    sourceProducts: G2AProduct[],
    destinationProducts: G2AProduct[]
  ): Promise<ReconciliationResult> {
    this.logger.info('Starting sync reconciliation', {
      sourceCount: sourceProducts.length,
      destinationCount: destinationProducts.length,
    });

    const errors: string[] = [];
    const mismatches: Array<{ field: string; expected: any; actual: any }> = [];

    // Check counts
    if (sourceProducts.length !== destinationProducts.length) {
      errors.push(
        `Product count mismatch: expected ${sourceProducts.length}, got ${destinationProducts.length}`
      );
    }

    // Generate checksums
    const sourceChecksum = this.generateChecksum(sourceProducts);
    const destChecksum = this.generateChecksum(destinationProducts);

    if (sourceChecksum !== destChecksum) {
      errors.push('Checksum mismatch detected');

      // Find specific mismatches
      const sourceMap = new Map(sourceProducts.map((p) => [p.id, p]));
      destinationProducts.forEach((destProduct) => {
        const sourceProduct = sourceMap.get(destProduct.id);
        if (sourceProduct) {
          const productMismatches = this.compareProducts(sourceProduct, destProduct);
          mismatches.push(...productMismatches);
        }
      });
    }

    const valid = errors.length === 0 && mismatches.length === 0;

    this.logger.info('Sync reconciliation completed', {
      valid,
      errorCount: errors.length,
      mismatchCount: mismatches.length,
    });

    return {
      valid,
      totalRecords: sourceProducts.length,
      checksum: sourceChecksum,
      mismatches,
      errors,
    };
  }

  /**
   * Compare two products and find mismatches
   */
  private compareProducts(
    source: G2AProduct,
    destination: G2AProduct
  ): Array<{ field: string; expected: any; actual: any }> {
    const mismatches: Array<{ field: string; expected: any; actual: any }> = [];

    const fieldsToCheck: (keyof G2AProduct)[] = ['name', 'price', 'qty', 'currency'];

    fieldsToCheck.forEach((field) => {
      if (source[field] !== destination[field]) {
        mismatches.push({
          field: `${source.id}.${field}`,
          expected: source[field],
          actual: destination[field],
        });
      }
    });

    return mismatches;
  }
}
