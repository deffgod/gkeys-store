/**
 * Order-related types for G2A API
 */

export interface G2ACreateOrderRequest {
  product_id: string;
  currency?: string; // default: EUR
  max_price?: number;
}

export interface G2AOrderResponse {
  order_id: string;
  price: number;
  currency: string;
}

export interface G2AOrderDetailsResponse {
  order_id: string;
  status: 'complete' | 'pending';
  price: number;
  currency: string;
  created_at?: string;
  updated_at?: string;
}

export interface G2AOrderKeyResponse {
  key: string;
  isFile?: boolean; // API v1.9.0+
}

export interface G2APayOrderResponse {
  status: boolean;
  transaction_id: string;
}

export interface G2AOrder {
  id: string;
  externalOrderId?: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  signature?: string;
  nonce?: string;
  timestamp?: number;
}
