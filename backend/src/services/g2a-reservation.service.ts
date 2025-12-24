import axios, { AxiosError } from 'axios';
import { G2AError, G2AErrorCode } from '../types/g2a.js';
import { createG2AClient } from './g2a.service.js';

/**
 * Structured logger for G2A Reservation API operations
 */
const logger = {
  info: (message: string, data?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    console.log(`[G2A Reservation] [${timestamp}] [INFO] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  error: (message: string, error?: unknown) => {
    const timestamp = new Date().toISOString();
    console.error(`[G2A Reservation] [${timestamp}] [ERROR] ${message}`, error);
  },
  warn: (message: string, data?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    console.warn(`[G2A Reservation] [${timestamp}] [WARN] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  debug: (message: string, data?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') {
      const timestamp = new Date().toISOString();
      console.log(`[G2A Reservation] [${timestamp}] [DEBUG] ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
  },
};

/**
 * Reservation Status
 */
export type ReservationStatus = 'pending' | 'confirmed' | 'expired' | 'cancelled';

/**
 * Create Reservation Request interface
 */
export interface CreateReservationRequest {
  orderId: string;
  productId: string;
  quantity: number;
}

/**
 * Reservation Response interface
 */
export interface G2AReservation {
  reservationId: string;
  orderId: string;
  productId: string;
  quantity: number;
  status: ReservationStatus;
  expiresAt: string; // ISO timestamp
  createdAt: string;
}

/**
 * Confirm Reservation Response interface
 */
export interface ConfirmReservationResponse {
  reservationId: string;
  status: 'confirmed';
  stockReady: boolean; // If false, respond with HTTP 202
}

/**
 * Inventory Check Response interface
 */
export interface InventoryCheckResponse {
  orderId: string;
  stockReady: boolean;
  keys?: string[]; // Available if stockReady is true
}

/**
 * Handle G2A API errors for reservation operations
 */
const handleG2AReservationError = (error: unknown, operation: string): G2AError => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    const status = axiosError.response?.status;
    const data = axiosError.response?.data;
    
    const errorMessage = typeof data === 'object' && data !== null && 'message' in data
      ? String(data.message)
      : axiosError.message;

    return new G2AError(
      G2AErrorCode.G2A_API_ERROR,
      `G2A Reservation API error in ${operation}: ${errorMessage}`,
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
 * Create a reservation for dropshipping order
 * API must respond within 9 seconds
 * Reservation is valid for minimum 30 minutes
 * @param {CreateReservationRequest} data - Reservation data
 * @returns {Promise<G2AReservation>} Created reservation
 * @throws {G2AError} If API call fails or timeout (9 seconds)
 */
export const createReservation = async (data: CreateReservationRequest): Promise<G2AReservation> => {
  try {
    logger.info('Creating reservation', { orderId: data.orderId, productId: data.productId, quantity: data.quantity });
    
    // Import API uses OAuth2 token authentication
    const client = await createG2AClient('import');
    
    // Set timeout to 9 seconds as per G2A requirements
    const timeout = 9000;
    
    const response = await client.post<G2AReservation>(
      '/reservations',
      data,
      {
        timeout,
      }
    );

    logger.info('Reservation created successfully', {
      reservationId: response.data.reservationId,
      orderId: data.orderId,
      expiresAt: response.data.expiresAt,
    });

    return response.data;
  } catch (error) {
    const g2aError = handleG2AReservationError(error, 'createReservation');
    
    // Handle timeout specifically (9 seconds requirement)
    if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
      throw new G2AError(
        G2AErrorCode.G2A_TIMEOUT,
        `Reservation creation timed out (9 seconds limit exceeded)`,
        { orderId: data.orderId, originalError: g2aError }
      );
    }
    
    logger.error('Error creating reservation', g2aError);
    throw g2aError;
  }
};

/**
 * Confirm a reservation
 * Must be called within 9 seconds of creation
 * Returns stockReady status - if false, respond with HTTP 202
 * @param {string} reservationId - Reservation ID to confirm
 * @returns {Promise<ConfirmReservationResponse>} Confirmation result
 * @throws {G2AError} If API call fails or timeout
 */
export const confirmReservation = async (reservationId: string): Promise<ConfirmReservationResponse> => {
  try {
    logger.info('Confirming reservation', { reservationId });
    
    // Import API uses OAuth2 token authentication
    const client = await createG2AClient('import');
    
    // Set timeout to 9 seconds as per G2A requirements
    const timeout = 9000;
    
    const response = await client.post<ConfirmReservationResponse>(
      `/reservations/${reservationId}/confirm`,
      {},
      {
        timeout,
      }
    );

    logger.info('Reservation confirmed', {
      reservationId,
      stockReady: response.data.stockReady,
    });

    return response.data;
  } catch (error) {
    const g2aError = handleG2AReservationError(error, 'confirmReservation');
    
    // Handle timeout specifically (9 seconds requirement)
    if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
      throw new G2AError(
        G2AErrorCode.G2A_TIMEOUT,
        `Reservation confirmation timed out (9 seconds limit exceeded)`,
        { reservationId, originalError: g2aError }
      );
    }
    
    logger.error('Error confirming reservation', g2aError);
    throw g2aError;
  }
};

/**
 * Check inventory availability for an order
 * Used when stock is not ready (HTTP 202 response)
 * Should be called repeatedly until stockReady is true
 * @param {string} orderId - Order ID to check inventory for
 * @returns {Promise<InventoryCheckResponse>} Inventory status
 * @throws {G2AError} If API call fails
 */
export const checkInventory = async (orderId: string): Promise<InventoryCheckResponse> => {
  try {
    logger.debug('Checking inventory', { orderId });
    
    // Import API uses OAuth2 token authentication
    const client = await createG2AClient('import');
    
    const response = await client.get<InventoryCheckResponse>(`/inventory/${orderId}`);

    logger.debug('Inventory check completed', {
      orderId,
      stockReady: response.data.stockReady,
      hasKeys: !!response.data.keys && response.data.keys.length > 0,
    });

    return response.data;
  } catch (error) {
    const g2aError = handleG2AReservationError(error, 'checkInventory');
    logger.error('Error checking inventory', g2aError);
    throw g2aError;
  }
};

/**
 * Poll inventory until stock is ready
 * Useful when order was created with HTTP 202 (stock not ready)
 * @param {string} orderId - Order ID to poll inventory for
 * @param {number} maxWaitTime - Maximum time to wait in milliseconds (default: 5 minutes)
 * @param {number} pollInterval - Interval between polls in milliseconds (default: 5 seconds)
 * @returns {Promise<InventoryCheckResponse>} Inventory status when stock is ready
 * @throws {G2AError} If timeout or API call fails
 */
export const waitForInventoryReady = async (
  orderId: string,
  maxWaitTime: number = 5 * 60 * 1000, // 5 minutes default
  pollInterval: number = 5000 // 5 seconds default
): Promise<InventoryCheckResponse> => {
  const startTime = Date.now();
  
  logger.info('Starting inventory polling', { orderId, maxWaitTime, pollInterval });
  
  while (true) {
    const elapsed = Date.now() - startTime;
    
    if (elapsed > maxWaitTime) {
      throw new G2AError(
        G2AErrorCode.G2A_TIMEOUT,
        `Inventory for order ${orderId} did not become ready within ${maxWaitTime}ms`,
        { orderId, maxWaitTime, elapsed }
      );
    }
    
    const inventory = await checkInventory(orderId);
    
    if (inventory.stockReady) {
      logger.info('Inventory ready', {
        orderId,
        keysCount: inventory.keys?.length || 0,
        elapsed,
      });
      return inventory;
    }
    
    // Stock not ready yet, wait and poll again
    logger.debug('Inventory not ready yet', {
      orderId,
      elapsed,
    });
    
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
};

/**
 * Admin: Get all reservations from orders with G2A externalOrderId
 * Since G2A API doesn't provide a list endpoint, we get reservations from our orders
 */
export const getAllReservationsForAdmin = async (filters?: {
  orderId?: string;
  status?: ReservationStatus;
  page?: number;
  pageSize?: number;
}): Promise<{
  reservations: Array<{
    reservationId: string;
    orderId: string;
    productId: string;
    quantity: number;
    status: ReservationStatus;
    expiresAt: string;
    createdAt: string;
    order?: {
      id: string;
      status: string;
      total: number;
      user: {
        id: string;
        email: string;
        nickname: string;
      };
    };
  }>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> => {
  // Note: G2A API doesn't provide a list reservations endpoint
  // This is a placeholder that would need to be implemented based on how reservations are tracked
  // For now, return empty result with structure
  // In a real implementation, you might:
  // 1. Store reservationId in Order model when reservation is created
  // 2. Query orders with externalOrderId and reconstruct reservation info
  // 3. Or call G2A API for each order to get reservation status
  
  return {
    reservations: [],
    total: 0,
    page: filters?.page || 1,
    pageSize: filters?.pageSize || 20,
    totalPages: 0,
  };
};

/**
 * Admin: Cancel a reservation
 * Note: G2A API may not support direct cancellation - reservations expire automatically
 * This function is a placeholder for potential future implementation
 */
export const cancelReservationForAdmin = async (reservationId: string): Promise<void> => {
  // Note: G2A API may not support direct reservation cancellation
  // Reservations typically expire automatically after their expiration time
  // This is a placeholder for potential future implementation
  // If G2A API supports cancellation, implement it here
  
  throw new G2AError(
    G2AErrorCode.G2A_API_ERROR,
    'Reservation cancellation not supported by G2A API. Reservations expire automatically.',
    { reservationId }
  );
};

