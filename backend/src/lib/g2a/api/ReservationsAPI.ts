/**
 * Reservations API wrapper for G2A Import API (dropshipping)
 */

import { AxiosInstance } from 'axios';
import { G2AReservation } from '../types/index.js';
import { G2ALogger } from '../utils/logger.js';
import { G2AError, G2AErrorCode } from '../errors/G2AError.js';

export interface CreateReservationRequest {
  orderId: string;
  productId: string;
  quantity: number;
}

export interface ConfirmReservationResponse {
  reservationId: string;
  status: 'confirmed';
  stockReady: boolean;
}

export interface InventoryCheckResponse {
  orderId: string;
  stockReady: boolean;
  keys?: string[];
}

export class ReservationsAPI {
  private readonly RESERVATION_TIMEOUT_MS = 9000; // 9 seconds as per G2A requirements
  
  constructor(
    private httpClient: AxiosInstance,
    private logger: G2ALogger,
    private executeRequest: <T>(endpoint: string, operation: string, requestFn: () => Promise<T>) => Promise<T>
  ) {}
  
  /**
   * Create a reservation for dropshipping order
   */
  async create(data: CreateReservationRequest): Promise<G2AReservation> {
    return this.executeRequest('/reservations', 'ReservationsAPI.create', async () => {
      this.logger.info('Creating reservation', {
        orderId: data.orderId,
        productId: data.productId,
        quantity: data.quantity,
      });
      
      const response = await this.httpClient.post<G2AReservation>(
        '/reservations',
        data,
        { timeout: this.RESERVATION_TIMEOUT_MS }
      );
      
      if (response.status !== 200 && response.status !== 201) {
        throw new Error(`Failed to create reservation: ${response.status}`);
      }
      
      this.logger.info('Reservation created successfully', {
        reservationId: response.data.reservationId,
        orderId: data.orderId,
        expiresAt: response.data.expiresAt,
      });
      
      return response.data;
    });
  }
  
  /**
   * Confirm a reservation
   */
  async confirm(reservationId: string): Promise<ConfirmReservationResponse> {
    return this.executeRequest(`/reservations/${reservationId}/confirm`, 'ReservationsAPI.confirm', async () => {
      this.logger.info('Confirming reservation', { reservationId });
      
      const response = await this.httpClient.post<ConfirmReservationResponse>(
        `/reservations/${reservationId}/confirm`,
        {},
        { timeout: this.RESERVATION_TIMEOUT_MS }
      );
      
      if (response.status !== 200) {
        throw new Error(`Failed to confirm reservation: ${response.status}`);
      }
      
      this.logger.info('Reservation confirmed', {
        reservationId,
        stockReady: response.data.stockReady,
      });
      
      return response.data;
    });
  }
  
  /**
   * Check inventory availability for an order
   */
  async checkInventory(orderId: string): Promise<InventoryCheckResponse> {
    return this.executeRequest(`/inventory/${orderId}`, 'ReservationsAPI.checkInventory', async () => {
      this.logger.debug('Checking inventory', { orderId });
      
      const response = await this.httpClient.get<InventoryCheckResponse>(`/inventory/${orderId}`);
      
      if (response.status !== 200) {
        throw new Error(`Failed to check inventory: ${response.status}`);
      }
      
      this.logger.debug('Inventory check completed', {
        orderId,
        stockReady: response.data.stockReady,
        hasKeys: !!response.data.keys && response.data.keys.length > 0,
      });
      
      return response.data;
    });
  }
  
  /**
   * Poll inventory until stock is ready
   */
  async waitForInventoryReady(
    orderId: string,
    maxWaitTimeMs: number = 5 * 60 * 1000, // 5 minutes default
    pollIntervalMs: number = 5000 // 5 seconds default
  ): Promise<InventoryCheckResponse> {
    const startTime = Date.now();
    
    this.logger.info('Starting inventory polling', { orderId, maxWaitTimeMs, pollIntervalMs });
    
    while (true) {
      const elapsed = Date.now() - startTime;
      
      if (elapsed > maxWaitTimeMs) {
        throw new G2AError(
          G2AErrorCode.G2A_TIMEOUT,
          `Inventory for order ${orderId} did not become ready within ${maxWaitTimeMs}ms`,
          {
            retryable: false,
            context: { orderId, maxWaitTimeMs, elapsed },
          }
        );
      }
      
      const inventory = await this.checkInventory(orderId);
      
      if (inventory.stockReady) {
        this.logger.info('Inventory ready', {
          orderId,
          keysCount: inventory.keys?.length || 0,
          elapsed,
        });
        return inventory;
      }
      
      this.logger.debug('Inventory not ready yet', { orderId, elapsed });
      
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }
  }
}
