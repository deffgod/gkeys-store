/**
 * Offers API wrapper for G2A Import API
 */

import { AxiosInstance } from 'axios';
import { G2AOffer, OfferType, OfferVisibility, OfferStatus } from '../types/index.js';
import { G2ALogger } from '../utils/logger.js';

export interface CreateOfferRequest {
  offerType: OfferType;
  productId: string;
  price: number;
  visibility: OfferVisibility;
  inventory?: {
    size: number;
    keys?: string[];
  };
  variant?: {
    tmpInventoryId?: string;
  };
}

export interface UpdateOfferRequest {
  price?: number;
  visibility?: OfferVisibility;
  active?: boolean;
  inventory?: {
    size?: number;
  };
  variant?: {
    tmpInventoryId?: string;
  };
}

export interface OfferFilters {
  productId?: string;
  status?: OfferStatus;
  offerType?: OfferType;
  active?: boolean;
  page?: number;
  perPage?: number;
}

export interface CreateOfferResponse {
  jobId: string;
}

export interface G2AOffersResponse {
  data: G2AOffer[];
  meta?: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
  };
}

export class OffersAPI {
  constructor(
    private httpClient: AxiosInstance,
    private logger: G2ALogger,
    private executeRequest: <T>(endpoint: string, operation: string, requestFn: () => Promise<T>) => Promise<T>
  ) {}
  
  /**
   * Create a new offer (Import API)
   */
  async create(data: CreateOfferRequest): Promise<CreateOfferResponse> {
    return this.executeRequest('/offers', 'OffersAPI.create', async () => {
      this.logger.info('Creating offer', {
        offerType: data.offerType,
        productId: data.productId,
      });
      
      const response = await this.httpClient.post<CreateOfferResponse>('/offers', data);
      
      if (response.status !== 200 && response.status !== 201) {
        throw new Error(`Failed to create offer: ${response.status}`);
      }
      
      this.logger.info('Offer creation initiated', { jobId: response.data.jobId });
      
      return response.data;
    });
  }
  
  /**
   * Get offer by ID
   */
  async get(offerId: string): Promise<G2AOffer> {
    return this.executeRequest(`/offers/${offerId}`, 'OffersAPI.get', async () => {
      this.logger.debug('Fetching offer', { offerId });
      
      const response = await this.httpClient.get<G2AOffer>(`/offers/${offerId}`);
      
      if (response.status !== 200) {
        throw new Error(`Failed to fetch offer: ${response.status}`);
      }
      
      this.logger.debug('Offer fetched successfully', {
        offerId,
        status: response.data.status,
      });
      
      return response.data;
    });
  }
  
  /**
   * Get list of offers with filters
   */
  async list(filters?: OfferFilters): Promise<G2AOffersResponse> {
    return this.executeRequest('/offers', 'OffersAPI.list', async () => {
      this.logger.info('Fetching offers list', { filters });
      
      const params: Record<string, string | number | boolean> = {};
      if (filters?.productId) params.productId = filters.productId;
      if (filters?.status) params.status = filters.status;
      if (filters?.offerType) params.offerType = filters.offerType;
      if (filters?.active !== undefined) params.active = filters.active;
      if (filters?.page) params.page = filters.page;
      if (filters?.perPage) params.perPage = filters.perPage;
      
      const response = await this.httpClient.get<G2AOffersResponse>('/offers', { params });
      
      if (response.status !== 200) {
        throw new Error(`Failed to fetch offers: ${response.status}`);
      }
      
      this.logger.info('Offers fetched successfully', {
        count: response.data.data?.length || 0,
        total: response.data.meta?.total || 0,
      });
      
      return response.data;
    });
  }
  
  /**
   * Update offer partially
   */
  async update(offerId: string, data: UpdateOfferRequest): Promise<G2AOffer> {
    return this.executeRequest(`/offers/${offerId}`, 'OffersAPI.update', async () => {
      this.logger.info('Updating offer', { offerId, updates: Object.keys(data) });
      
      const response = await this.httpClient.patch<G2AOffer>(`/offers/${offerId}`, data);
      
      if (response.status !== 200) {
        throw new Error(`Failed to update offer: ${response.status}`);
      }
      
      this.logger.info('Offer updated successfully', { offerId });
      
      return response.data;
    });
  }
  
  /**
   * Add inventory to offer
   */
  async addInventory(offerId: string, keys: string[]): Promise<{ collectionUuid: string }> {
    return this.executeRequest(`/offers/${offerId}/inventory`, 'OffersAPI.addInventory', async () => {
      this.logger.info('Adding inventory to offer', {
        offerId,
        keysCount: keys.length,
      });
      
      const response = await this.httpClient.post<{ collectionUuid: string }>(
        `/offers/${offerId}/inventory`,
        { keys }
      );
      
      if (response.status !== 200 && response.status !== 201) {
        throw new Error(`Failed to add inventory: ${response.status}`);
      }
      
      this.logger.info('Inventory added successfully', {
        offerId,
        collectionUuid: response.data.collectionUuid,
      });
      
      return response.data;
    });
  }
}
