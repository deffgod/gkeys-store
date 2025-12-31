/**
 * G2A API Error Types
 *
 * Error codes for G2A API integration based on contracts specification
 */

export enum G2AErrorCode {
  /** Authentication failed - invalid credentials */
  G2A_AUTH_FAILED = 'G2A_AUTH_FAILED',

  /** Product not found in G2A catalog */
  G2A_PRODUCT_NOT_FOUND = 'G2A_PRODUCT_NOT_FOUND',

  /** Product out of stock */
  G2A_OUT_OF_STOCK = 'G2A_OUT_OF_STOCK',

  /** G2A API returned an error */
  G2A_API_ERROR = 'G2A_API_ERROR',

  /** Rate limit exceeded */
  G2A_RATE_LIMIT = 'G2A_RATE_LIMIT',

  /** Request timeout */
  G2A_TIMEOUT = 'G2A_TIMEOUT',

  /** Invalid request parameters */
  G2A_INVALID_REQUEST = 'G2A_INVALID_REQUEST',

  /** Network error connecting to G2A API */
  G2A_NETWORK_ERROR = 'G2A_NETWORK_ERROR',
}

/**
 * G2A API Error
 */
export class G2AError extends Error {
  constructor(
    public code: G2AErrorCode,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'G2AError';
    Object.setPrototypeOf(this, G2AError.prototype);
  }
}

/**
 * Stock validation response
 */
export interface G2AStockResponse {
  productId: string;
  stock: number;
  available: boolean;
}

/**
 * Price update response
 */
export interface G2APriceResponse {
  productId: string;
  price: number;
  currency: string;
}

/**
 * G2A Webhook Event
 */
export interface G2AWebhookEvent {
  event_id: string;
  order_id: string;
  type: string;
  payload: Record<string, unknown>;
  signature?: string;
  nonce?: string;
  timestamp?: number;
}

/**
 * Idempotency Record
 */
export interface IdempotencyRecord {
  key: string;
  status: 'processing' | 'done' | 'failed';
  attempts: number;
  last_error: string | null;
  updated_at: Date;
}
