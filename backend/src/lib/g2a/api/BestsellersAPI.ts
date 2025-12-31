/**
 * Bestsellers API wrapper for G2A Import API
 */

import { AxiosInstance } from 'axios';
import { G2ABestseller } from '../types/index.js';
import { G2ALogger } from '../utils/logger.js';

export interface BestsellerFilters {
  category?: string;
  platform?: string;
  page?: number;
  perPage?: number;
}

export interface G2ABestsellersResponse {
  data: G2ABestseller[];
  meta?: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
  };
}

export class BestsellersAPI {
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
   * Get bestsellers list with optional filters
   */
  async list(filters?: BestsellerFilters): Promise<G2ABestsellersResponse> {
    return this.executeRequest('/bestsellers', 'BestsellersAPI.list', async () => {
      this.logger.info('Fetching bestsellers', { filters });

      const params: Record<string, string | number> = {};
      if (filters?.category) params.category = filters.category;
      if (filters?.platform) params.platform = filters.platform;
      if (filters?.page) params.page = filters.page;
      if (filters?.perPage) params.perPage = filters.perPage;

      const response = await this.httpClient.get<G2ABestsellersResponse>('/bestsellers', {
        params,
      });

      if (response.status !== 200) {
        throw new Error(`Failed to fetch bestsellers: ${response.status}`);
      }

      this.logger.info('Bestsellers fetched successfully', {
        count: response.data.data?.length || 0,
        total: response.data.meta?.total || 0,
      });

      return response.data;
    });
  }
}
