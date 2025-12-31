/**
 * Jobs API wrapper for G2A Import API
 * Track async operations like offer creation
 */

import { AxiosInstance } from 'axios';
import { G2AJob } from '../types/index.js';
import { G2ALogger } from '../utils/logger.js';
import { G2AError, G2AErrorCode } from '../errors/G2AError.js';

export class JobsAPI {
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
   * Get job status by ID
   */
  async get(jobId: string): Promise<G2AJob> {
    return this.executeRequest(`/jobs/${jobId}`, 'JobsAPI.get', async () => {
      this.logger.debug('Fetching job status', { jobId });

      const response = await this.httpClient.get<G2AJob>(`/jobs/${jobId}`);

      if (response.status !== 200) {
        throw new Error(`Failed to fetch job status: ${response.status}`);
      }

      this.logger.debug('Job status fetched', {
        jobId,
        status: response.data.status,
        resourceId: response.data.resourceId,
      });

      return response.data;
    });
  }

  /**
   * Wait for job completion
   */
  async waitForCompletion(
    jobId: string,
    maxWaitTimeMs: number = 60000, // 1 minute default
    pollIntervalMs: number = 2000 // 2 seconds default
  ): Promise<G2AJob> {
    const startTime = Date.now();

    this.logger.info('Waiting for job completion', { jobId, maxWaitTimeMs, pollIntervalMs });

    while (true) {
      const elapsed = Date.now() - startTime;

      if (elapsed > maxWaitTimeMs) {
        throw new G2AError(
          G2AErrorCode.G2A_TIMEOUT,
          `Job ${jobId} did not complete within ${maxWaitTimeMs}ms`,
          {
            retryable: false,
            context: { jobId, maxWaitTimeMs, elapsed },
          }
        );
      }

      const job = await this.get(jobId);

      if (job.status === 'completed') {
        this.logger.info('Job completed successfully', {
          jobId,
          resourceId: job.resourceId,
          elapsed,
        });
        return job;
      }

      if (job.status === 'failed' || job.status === 'cancelled') {
        throw new G2AError(
          G2AErrorCode.G2A_API_ERROR,
          `Job ${jobId} ${job.status}: ${job.message || 'Unknown error'}`,
          {
            retryable: false,
            context: { jobId, status: job.status, message: job.message, code: job.code },
          }
        );
      }

      this.logger.debug('Job still processing', { jobId, status: job.status, elapsed });

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
  }
}
