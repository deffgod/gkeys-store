/**
 * Batch Order Creator
 * Create multiple orders with transaction-like behavior
 */

import { G2ACreateOrderRequest, G2AOrderResponse } from '../types/index.js';
import { OrdersAPI } from '../api/OrdersAPI.js';
import { BatchOperations, BatchResult } from './BatchOperations.js';
import { G2ALogger } from '../utils/logger.js';

export interface BatchOrderRequest extends G2ACreateOrderRequest {
  clientOrderId?: string; // Optional client-side order ID for tracking
}

export interface BatchOrderResponse extends G2AOrderResponse {
  clientOrderId?: string;
}

export class BatchOrderCreator {
  private batchOperations: BatchOperations;
  
  constructor(
    private ordersAPI: OrdersAPI,
    private logger: G2ALogger,
    chunkSize: number = 5, // Smaller chunks for orders (more expensive operations)
    maxConcurrency: number = 2 // Lower concurrency for orders
  ) {
    this.batchOperations = new BatchOperations(logger, {
      chunkSize,
      maxConcurrency,
      continueOnError: true,
    });
  }
  
  /**
   * Create multiple orders
   */
  async createOrders(
    orders: BatchOrderRequest[]
  ): Promise<BatchResult<BatchOrderResponse>> {
    this.logger.info('Batch creating orders', { count: orders.length });
    
    return this.batchOperations.execute(
      orders,
      async (orderRequest, index) => {
        this.logger.debug('Creating order', {
          index,
          clientOrderId: orderRequest.clientOrderId,
          productId: orderRequest.product_id,
        });
        
        const response = await this.ordersAPI.create({
          product_id: orderRequest.product_id,
          currency: orderRequest.currency,
          max_price: orderRequest.max_price,
        });
        
        return {
          ...response,
          clientOrderId: orderRequest.clientOrderId,
        };
      },
      'BatchOrderCreator.createOrders'
    );
  }
  
  /**
   * Create orders and pay for them in batch
   */
  async createAndPayOrders(
    orders: BatchOrderRequest[]
  ): Promise<BatchResult<{ order: BatchOrderResponse; paid: boolean; transactionId?: string }>> {
    this.logger.info('Batch creating and paying for orders', { count: orders.length });
    
    // Step 1: Create all orders
    const createResult = await this.createOrders(orders);
    
    if (createResult.failureCount > 0) {
      this.logger.warn('Some orders failed to create', {
        failureCount: createResult.failureCount,
      });
    }
    
    // Step 2: Pay for successfully created orders
    return this.batchOperations.execute(
      createResult.success,
      async (order, index) => {
        this.logger.debug('Paying for order', {
          index,
          orderId: order.order_id,
          clientOrderId: order.clientOrderId,
        });
        
        try {
          const paymentResponse = await this.ordersAPI.pay(order.order_id);
          return {
            order,
            paid: true,
            transactionId: paymentResponse.transaction_id,
          };
        } catch (error) {
          // If payment fails, still return the order but mark as unpaid
          this.logger.error('Failed to pay for order', {
            orderId: order.order_id,
            error,
          });
          throw error;
        }
      },
      'BatchOrderCreator.payOrders'
    );
  }
  
  /**
   * Create orders with automatic retry on specific errors
   */
  async createOrdersWithRetry(
    orders: BatchOrderRequest[],
    maxRetries: number = 2
  ): Promise<BatchResult<BatchOrderResponse>> {
    const result = await this.createOrders(orders);
    let retryCount = 0;
    
    // Retry failed orders
    while (result.failureCount > 0 && retryCount < maxRetries) {
      retryCount++;
      this.logger.info('Retrying failed orders', {
        retryCount,
        failureCount: result.failureCount,
      });
      
      // Extract failed order requests
      const failedOrders = result.failures.map(f => orders[f.index]);
      
      // Retry failed orders
      const retryResult = await this.createOrders(failedOrders);
      
      // Merge results
      result.success.push(...retryResult.success);
      result.successCount += retryResult.successCount;
      
      // Update failures (only keep still-failing orders)
      result.failures = retryResult.failures;
      result.failureCount = retryResult.failureCount;
    }
    
    return result;
  }
}
