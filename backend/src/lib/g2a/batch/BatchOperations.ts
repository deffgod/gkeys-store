/**
 * Generic batch operation framework
 * Provides intelligent chunking, parallel execution, and error handling
 */

import { G2ALogger } from '../utils/logger.js';
import { G2ABatchPartialFailureError } from '../errors/G2AError.js';

export interface BatchConfig {
  chunkSize: number;
  maxConcurrency: number;
  continueOnError: boolean; // Continue processing even if some items fail
}

export interface BatchResult<T> {
  success: T[];
  failures: Array<{
    index: number;
    error: Error;
  }>;
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  duration: number;
}

export class BatchOperations {
  constructor(
    private logger: G2ALogger,
    private config: BatchConfig
  ) {}

  /**
   * Split array into chunks
   */
  private chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Execute batch operation with controlled concurrency
   */
  async execute<TInput, TOutput>(
    items: TInput[],
    processor: (item: TInput, index: number) => Promise<TOutput>,
    operationName: string
  ): Promise<BatchResult<TOutput>> {
    const startTime = Date.now();

    this.logger.info(`Starting batch operation: ${operationName}`, {
      totalItems: items.length,
      chunkSize: this.config.chunkSize,
      maxConcurrency: this.config.maxConcurrency,
    });

    const chunks = this.chunk(items, this.config.chunkSize);
    const successes: TOutput[] = [];
    const failures: Array<{ index: number; error: Error }> = [];

    // Process chunks with controlled concurrency
    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex += this.config.maxConcurrency) {
      const chunkBatch = chunks.slice(chunkIndex, chunkIndex + this.config.maxConcurrency);

      const chunkPromises = chunkBatch.map(async (chunk, batchOffset) => {
        const results = await this.processChunk(
          chunk,
          processor,
          chunkIndex + batchOffset,
          this.config.chunkSize
        );
        return results;
      });

      const chunkResults = await Promise.all(chunkPromises);

      // Aggregate results
      chunkResults.forEach((result) => {
        successes.push(...result.successes);
        failures.push(...result.failures);
      });

      this.logger.debug(`Batch progress: ${operationName}`, {
        processedChunks: Math.min(chunkIndex + this.config.maxConcurrency, chunks.length),
        totalChunks: chunks.length,
        successCount: successes.length,
        failureCount: failures.length,
      });
    }

    const duration = Date.now() - startTime;

    this.logger.info(`Batch operation completed: ${operationName}`, {
      totalProcessed: items.length,
      successCount: successes.length,
      failureCount: failures.length,
      duration,
    });

    return {
      success: successes,
      failures,
      totalProcessed: items.length,
      successCount: successes.length,
      failureCount: failures.length,
      duration,
    };
  }

  /**
   * Process a single chunk
   */
  private async processChunk<TInput, TOutput>(
    chunk: TInput[],
    processor: (item: TInput, index: number) => Promise<TOutput>,
    chunkOffset: number,
    chunkSize: number
  ): Promise<{ successes: TOutput[]; failures: Array<{ index: number; error: Error }> }> {
    const successes: TOutput[] = [];
    const failures: Array<{ index: number; error: Error }> = [];

    for (let i = 0; i < chunk.length; i++) {
      const globalIndex = chunkOffset * chunkSize + i;
      try {
        const result = await processor(chunk[i], globalIndex);
        successes.push(result);
      } catch (error) {
        failures.push({
          index: globalIndex,
          error: error instanceof Error ? error : new Error(String(error)),
        });

        if (!this.config.continueOnError) {
          // Stop processing this chunk on first error
          throw error;
        }
      }
    }

    return { successes, failures };
  }

  /**
   * Execute batch operation and throw on partial failure
   */
  async executeStrict<TInput, TOutput>(
    items: TInput[],
    processor: (item: TInput, index: number) => Promise<TOutput>,
    operationName: string
  ): Promise<TOutput[]> {
    const result = await this.execute(items, processor, operationName);

    if (result.failureCount > 0) {
      throw new G2ABatchPartialFailureError(
        result.successCount,
        result.failureCount,
        result.failures
      );
    }

    return result.success;
  }
}
