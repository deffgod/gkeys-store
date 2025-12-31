/**
 * Orders API wrapper for G2A Export API
 */

import { AxiosInstance } from 'axios';
import {
  G2ACreateOrderRequest,
  G2AOrderResponse,
  G2AOrderDetailsResponse,
  G2AOrderKeyResponse,
  G2APayOrderResponse,
} from '../types/index.js';
import { G2ALogger } from '../utils/logger.js';
import { G2AError, G2AErrorCode } from '../errors/G2AError.js';
import { ErrorMapper } from '../errors/ErrorMapper.js';

export class OrdersAPI {
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
   * Create a new order
   */
  async create(request: G2ACreateOrderRequest): Promise<G2AOrderResponse> {
    return this.executeRequest('/order', 'OrdersAPI.create', async () => {
      this.logger.info('Creating order', {
        productId: request.product_id,
        currency: request.currency || 'EUR',
        maxPrice: request.max_price,
      });

      const response = await this.httpClient.post<G2AOrderResponse>('/order', request);

      if (response.status !== 200 && response.status !== 201) {
        throw new Error(`Failed to create order: ${response.status}`);
      }

      this.logger.info('Order created successfully', {
        orderId: response.data.order_id,
        price: response.data.price,
        currency: response.data.currency,
      });

      return response.data;
    });
  }

  /**
   * Get order details
   */
  async get(orderId: string): Promise<G2AOrderDetailsResponse> {
    return this.executeRequest(`/order/details/${orderId}`, 'OrdersAPI.get', async () => {
      this.logger.debug('Fetching order details', { orderId });

      const response = await this.httpClient.get<G2AOrderDetailsResponse>(
        `/order/details/${orderId}`
      );

      if (response.status === 404) {
        throw new G2AError(G2AErrorCode.G2A_ORDER_NOT_FOUND, `Order not found: ${orderId}`, {
          context: { orderId },
        });
      }

      if (response.status !== 200) {
        throw new Error(`Failed to fetch order details: ${response.status}`);
      }

      this.logger.debug('Order details fetched successfully', {
        orderId,
        status: response.data.status,
      });

      return response.data;
    });
  }

  /**
   * Pay for an order
   */
  async pay(orderId: string): Promise<G2APayOrderResponse> {
    return this.executeRequest(`/order/pay/${orderId}`, 'OrdersAPI.pay', async () => {
      this.logger.info('Paying for order', { orderId });

      // PUT request with Content-Length: 0 (empty body)
      const response = await this.httpClient.put<G2APayOrderResponse>(
        `/order/pay/${orderId}`,
        {},
        {
          headers: {
            'Content-Length': '0',
          },
        }
      );

      if (response.status === 404) {
        throw new G2AError(G2AErrorCode.G2A_ORDER_NOT_FOUND, `Order not found: ${orderId}`, {
          context: { orderId },
        });
      }

      if (response.status === 402) {
        throw new G2AError(G2AErrorCode.G2A_INVALID_REQUEST, 'Payment required or in progress', {
          errorCode: 'ORD05',
          context: { orderId },
        });
      }

      if (response.status === 403) {
        const errorData = response.data as any;
        if (errorData.code === 'ORD112') {
          throw new G2AError(
            G2AErrorCode.G2A_INVALID_REQUEST,
            'Not enough funds to pay for order',
            { errorCode: 'ORD112', context: { orderId } }
          );
        }
        if (errorData.code === 'ORD114') {
          throw new G2AError(
            G2AErrorCode.G2A_INVALID_REQUEST,
            'Payment is too late. Try with another order',
            { errorCode: 'ORD114', context: { orderId } }
          );
        }
        if (errorData.code === 'ORD03') {
          throw new G2AError(
            G2AErrorCode.G2A_INVALID_REQUEST,
            'Payment is not ready yet. Try again later',
            { errorCode: 'ORD03', context: { orderId }, retryable: true }
          );
        }
      }

      if (response.status !== 200) {
        throw new Error(`Failed to pay for order: ${response.status}`);
      }

      this.logger.info('Order payment successful', {
        orderId,
        transactionId: response.data.transaction_id,
      });

      return response.data;
    });
  }

  /**
   * Get order key (can only be downloaded once)
   */
  async getKey(orderId: string): Promise<G2AOrderKeyResponse> {
    return this.executeRequest(`/order/key/${orderId}`, 'OrdersAPI.getKey', async () => {
      this.logger.info('Fetching order key', { orderId });

      const response = await this.httpClient.get<G2AOrderKeyResponse>(`/order/key/${orderId}`);

      if (response.status === 404) {
        throw new G2AError(G2AErrorCode.G2A_ORDER_NOT_FOUND, `Order not found: ${orderId}`, {
          context: { orderId },
        });
      }

      if (response.status === 400) {
        const errorData = response.data as any;
        if (errorData.code === 'ORD004') {
          throw new G2AError(
            G2AErrorCode.G2A_INVALID_REQUEST,
            'Order key has been downloaded already',
            { errorCode: 'ORD004', context: { orderId } }
          );
        }
      }

      if (response.status !== 200) {
        throw new Error(`Failed to fetch order key: ${response.status}`);
      }

      this.logger.info('Order key fetched successfully', {
        orderId,
        isFile: response.data.isFile || false,
      });

      return response.data;
    });
  }

  /**
   * Batch create multiple orders
   * Creates orders sequentially with shared transaction context
   */
  async batchCreate(requests: G2ACreateOrderRequest[]): Promise<G2AOrderResponse[]> {
    this.logger.info('Batch creating orders', { count: requests.length });

    const orders: G2AOrderResponse[] = [];
    const errors: Array<{ index: number; request: G2ACreateOrderRequest; error: Error }> = [];

    for (let i = 0; i < requests.length; i++) {
      try {
        const order = await this.create(requests[i]);
        orders.push(order);
      } catch (error) {
        errors.push({
          index: i,
          request: requests[i],
          error: ErrorMapper.fromError(error, 'OrdersAPI.batchCreate'),
        });
      }
    }

    this.logger.info('Batch order creation completed', {
      totalRequested: requests.length,
      successCount: orders.length,
      errorCount: errors.length,
    });

    if (errors.length > 0) {
      this.logger.warn('Some orders failed to create', {
        errors: errors.map((e) => ({
          index: e.index,
          productId: e.request.product_id,
          error: e.error.message,
        })),
      });
    }

    return orders;
  }
}
