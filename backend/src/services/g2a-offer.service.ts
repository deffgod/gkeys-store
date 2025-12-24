import axios, { AxiosError } from 'axios';
import { G2AError, G2AErrorCode } from '../types/g2a.js';
import { getG2AConfig } from '../config/g2a.js';
import { createG2AClient } from './g2a.service.js';

const { baseUrl: G2A_API_URL } = getG2AConfig();

/**
 * Structured logger for G2A Offer API operations
 */
const logger = {
  info: (message: string, data?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    console.log(`[G2A Offer] [${timestamp}] [INFO] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  error: (message: string, error?: unknown) => {
    const timestamp = new Date().toISOString();
    console.error(`[G2A Offer] [${timestamp}] [ERROR] ${message}`, error);
  },
  warn: (message: string, data?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    console.warn(`[G2A Offer] [${timestamp}] [WARN] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  debug: (message: string, data?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') {
      const timestamp = new Date().toISOString();
      console.log(`[G2A Offer] [${timestamp}] [DEBUG] ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
  },
};

/**
 * Offer Types supported by G2A Import API
 */
export type OfferType = 'dropshipping' | 'promo' | 'steamgift' | 'game' | 'preorder';

/**
 * Offer Visibility
 */
export type OfferVisibility = 'retail' | 'business' | 'both';

/**
 * Offer Status
 */
export type OfferStatus = 'New' | 'Accepted' | 'Active' | 'Rejected' | 'Cancelled' | 'Finished' | 'Banned';

/**
 * Create Offer Request interface
 */
export interface CreateOfferRequest {
  offerType: OfferType;
  productId: string;
  price: number;
  visibility: OfferVisibility;
  inventory?: {
    size: number;
    keys?: string[];
    imageKeys?: File[];
  };
  variant?: {
    tmpInventoryId?: string; // For promo/preorder offers
  };
  // Additional fields for specific offer types
  [key: string]: unknown;
}

/**
 * Update Offer Request interface (partial)
 */
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
  [key: string]: unknown;
}

/**
 * Offer Filters interface
 */
export interface OfferFilters {
  productId?: string;
  status?: OfferStatus;
  offerType?: OfferType;
  active?: boolean;
  page?: number;
  perPage?: number; // 10, 20, 50, 100
}

/**
 * Offer Response interface
 */
export interface G2AOffer {
  id: string;
  type: OfferType;
  productId: string;
  productName?: string;
  price: number;
  visibility: OfferVisibility;
  status: OfferStatus;
  active: boolean;
  inventory?: {
    size: number;
    sold: number;
    type: string;
  };
  createdAt?: string;
  updatedAt?: string;
  promoStatus?: string;
}

/**
 * Offers List Response interface
 */
export interface G2AOffersResponse {
  data: G2AOffer[];
  meta?: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
  };
}

/**
 * Create Offer Response interface
 */
export interface CreateOfferResponse {
  jobId: string; // Use this to check job status and get resourceId
}

/**
 * Add Offer Inventory Response interface
 */
export interface AddOfferInventoryResponse {
  collectionUuid: string; // Use this as tmpInventoryId when updating offer
}

/**
 * Handle G2A API errors for offer operations
 */
const handleG2AOfferError = (error: unknown, operation: string): G2AError => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    const status = axiosError.response?.status;
    const data = axiosError.response?.data;
    
    const errorMessage = typeof data === 'object' && data !== null && 'message' in data
      ? String(data.message)
      : axiosError.message;

    return new G2AError(
      G2AErrorCode.G2A_API_ERROR,
      `G2A Offer API error in ${operation}: ${errorMessage}`,
      { status, operation, originalError: axiosError.message }
    );
  }

  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  return new G2AError(
    G2AErrorCode.G2A_API_ERROR,
    `Unexpected error in ${operation}: ${errorMessage}`,
    { operation, error }
  );
};

/**
 * Create a new offer via G2A Import API
 * Returns jobId which should be used to check job status and get resourceId (offerId)
 * @param {CreateOfferRequest} data - Offer creation data
 * @returns {Promise<CreateOfferResponse>} Job ID for tracking offer creation
 * @throws {G2AError} If API call fails
 */
export const createOffer = async (data: CreateOfferRequest): Promise<CreateOfferResponse> => {
  try {
    logger.info('Creating offer', { offerType: data.offerType, productId: data.productId });
    
    // Import API uses OAuth2 token authentication
    const client = await createG2AClient('import');
    
    const response = await client.post<CreateOfferResponse>('/offers', data);

    logger.info('Offer creation initiated', {
      jobId: response.data.jobId,
      offerType: data.offerType,
    });

    return response.data;
  } catch (error) {
    const g2aError = handleG2AOfferError(error, 'createOffer');
    logger.error('Error creating offer', g2aError);
    throw g2aError;
  }
};

/**
 * Get offer details from G2A Import API
 * @param {string} offerId - Offer ID
 * @returns {Promise<G2AOffer>} Offer details
 * @throws {G2AError} If API call fails or offer not found
 */
export const getOffer = async (offerId: string): Promise<G2AOffer> => {
  try {
    logger.debug('Getting offer details', { offerId });
    
    // Import API uses OAuth2 token authentication
    const client = await createG2AClient('import');
    
    const response = await client.get<G2AOffer>(`/offers/${offerId}`);

    logger.debug('Offer details obtained', {
      offerId,
      status: response.data.status,
      type: response.data.type,
    });

    return response.data;
  } catch (error) {
    const g2aError = handleG2AOfferError(error, 'getOffer');
    
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new G2AError(
        G2AErrorCode.G2A_PRODUCT_NOT_FOUND,
        `Offer not found: ${offerId}`,
        { offerId, originalError: g2aError }
      );
    }
    
    logger.error('Error getting offer', g2aError);
    throw g2aError;
  }
};

/**
 * Get list of offers from G2A Import API
 * @param {OfferFilters} filters - Optional filters for offers
 * @returns {Promise<G2AOffersResponse>} Offers list
 * @throws {G2AError} If API call fails
 */
export const getOffers = async (filters?: OfferFilters): Promise<G2AOffersResponse> => {
  try {
    logger.info('Getting offers list', { filters });
    
    // Import API uses OAuth2 token authentication
    const client = await createG2AClient('import');
    
    const params: Record<string, string | number | boolean> = {};
    if (filters?.productId) {
      params.productId = filters.productId;
    }
    if (filters?.status) {
      params.status = filters.status;
    }
    if (filters?.offerType) {
      params.offerType = filters.offerType;
    }
    if (filters?.active !== undefined) {
      params.active = filters.active;
    }
    if (filters?.page) {
      params.page = filters.page;
    }
    if (filters?.perPage) {
      params.perPage = filters.perPage;
    }
    
    const response = await client.get<G2AOffersResponse>('/offers', {
      params,
    });

    logger.info('Offers list obtained', {
      count: response.data.data?.length || 0,
      total: response.data.meta?.total || 0,
    });

    return response.data;
  } catch (error) {
    const g2aError = handleG2AOfferError(error, 'getOffers');
    logger.error('Error getting offers', g2aError);
    throw g2aError;
  }
};

/**
 * Admin: Get all offers with filters (wrapper for getOffers)
 */
export const getAllOffersForAdmin = async (filters?: OfferFilters): Promise<G2AOffersResponse> => {
  return getOffers(filters);
};

/**
 * Admin: Get offer by ID (wrapper for getOffer)
 */
export const getOfferByIdForAdmin = async (offerId: string): Promise<G2AOffer> => {
  return getOffer(offerId);
};

/**
 * Update offer partially via G2A Import API
 * Only certain offer types can be edited: dropshipping, promo, steamgift, game
 * @param {string} offerId - Offer ID to update
 * @param {Partial<UpdateOfferRequest>} data - Partial update data
 * @returns {Promise<G2AOffer>} Updated offer
 * @throws {G2AError} If API call fails or offer not found
 */
export const updateOfferPartial = async (
  offerId: string,
  data: Partial<UpdateOfferRequest>
): Promise<G2AOffer> => {
  try {
    logger.info('Updating offer', { offerId, updates: Object.keys(data) });
    
    // Import API uses OAuth2 token authentication
    const client = await createG2AClient('import');
    
    const response = await client.patch<G2AOffer>(`/offers/${offerId}`, data);

    logger.info('Offer updated successfully', {
      offerId,
      status: response.data.status,
    });

    return response.data;
  } catch (error) {
    const g2AError = handleG2AOfferError(error, 'updateOfferPartial');
    
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new G2AError(
        G2AErrorCode.G2A_PRODUCT_NOT_FOUND,
        `Offer not found: ${offerId}`,
        { offerId, originalError: g2AError }
      );
    }
    
    logger.error('Error updating offer', g2AError);
    throw g2AError;
  }
};

/**
 * Add inventory to offer via G2A Import API
 * Used for promo offers to add keys collection
 * Returns collectionUuid which should be used as tmpInventoryId when updating offer
 * @param {string} offerId - Offer ID
 * @param {string[] | File[]} keys - Array of keys (as strings) or image files
 * @returns {Promise<AddOfferInventoryResponse>} Collection UUID
 * @throws {G2AError} If API call fails
 */
export const addOfferInventory = async (
  offerId: string,
  keys: string[] | File[]
): Promise<AddOfferInventoryResponse> => {
  try {
    logger.info('Adding inventory to offer', {
      offerId,
      keysCount: keys.length,
      isFileKeys: keys.length > 0 && keys[0] instanceof File,
    });
    
    // Import API uses OAuth2 token authentication
    const client = await createG2AClient('import');
    
    // Prepare form data if files are provided, otherwise JSON
    let requestData: FormData | { keys: string[] };
    
    if (keys.length > 0 && keys[0] instanceof File) {
      const formData = new FormData();
      (keys as File[]).forEach((file, index) => {
        formData.append(`keys[${index}]`, file);
      });
      requestData = formData;
    } else {
      requestData = { keys: keys as string[] };
    }
    
    const response = await client.post<AddOfferInventoryResponse>(
      `/offers/${offerId}/inventory`,
      requestData,
      keys.length > 0 && keys[0] instanceof File
        ? {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        : undefined
    );

    logger.info('Inventory added successfully', {
      offerId,
      collectionUuid: response.data.collectionUuid,
    });

    return response.data;
  } catch (error) {
    const g2aError = handleG2AOfferError(error, 'addOfferInventory');
    logger.error('Error adding inventory', g2aError);
    throw g2aError;
  }
};

