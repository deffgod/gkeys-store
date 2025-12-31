/**
 * Re-export all G2A types
 */

export * from './products.js';
export * from './orders.js';

// Offer types (from existing services)
export type OfferType = 'dropshipping' | 'promo' | 'steamgift' | 'game' | 'preorder';
export type OfferVisibility = 'retail' | 'business' | 'both';
export type OfferStatus =
  | 'New'
  | 'Accepted'
  | 'Active'
  | 'Rejected'
  | 'Cancelled'
  | 'Finished'
  | 'Banned';

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

// Reservation types
export type ReservationStatus = 'pending' | 'confirmed' | 'expired' | 'cancelled';

export interface G2AReservation {
  reservationId: string;
  orderId: string;
  productId: string;
  quantity: number;
  status: ReservationStatus;
  expiresAt: string;
  createdAt: string;
}

// Job types
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface G2AJob {
  jobId: string;
  resourceId?: string;
  resourceType?: string;
  status: JobStatus;
  code?: string;
  message?: string;
}

// Bestseller types
export interface G2ABestseller {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  platform?: string;
  category?: string;
  coverImage?: string;
  rank?: number;
}

// Price simulation types
export interface PriceSimulationResponse {
  income: number;
  finalPrice: number;
  businessFinalPrice: number;
  businessIncome: number;
  country?: string;
}

// Webhook types
export interface G2AWebhookEvent {
  event_id: string;
  order_id: string;
  type: string;
  payload: Record<string, unknown>;
  signature?: string;
  nonce?: string;
  timestamp?: number;
}

// Idempotency types
export interface IdempotencyRecord {
  key: string;
  status: 'processing' | 'done' | 'failed';
  attempts: number;
  last_error: string | null;
  updated_at: Date;
}
