/**
 * Product-related types for G2A API
 */

export interface G2AProduct {
  id: string;
  name: string;
  slug: string;
  qty: number; // stock quantity
  price: number;
  currency: string;
  type: string;
  region: string | null;
  platform: string | null;
  releaseDate: string | null;
  developer: string | null;
  publisher: string | null;
  description: string | null;
  shortDescription: string | null;
  availableToBuy: boolean;
  priceLimit: {
    min: number | null;
    max: number | null;
  } | null;
  retailMinBasePrice: number | null;
  coverImage: string | null;
  images: string[];
  categories: Array<{
    id: string | number;
    name: string;
  }>;
  restrictions: {
    pegi?: number;
    [key: string]: unknown;
  } | null;
  requirements: {
    minimal?: Record<string, unknown>;
    recommended?: Record<string, unknown>;
  } | null;
  videos: Array<{
    type: string;
    url: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface G2AProductFilters {
  page?: number;
  id?: string;
  minQty?: number;
  minPriceFrom?: number;
  minPriceTo?: number;
  includeOutOfStock?: boolean;
  updatedAtFrom?: string; // yyyy-mm-dd hh:mm:ss
  updatedAtTo?: string; // yyyy-mm-dd hh:mm:ss
}

export interface G2AProductsResponse {
  total: number;
  page: number;
  docs: G2AProduct[];
}

export interface G2AStockResponse {
  productId: string;
  stock: number;
  available: boolean;
}

export interface G2APriceResponse {
  productId: string;
  price: number;
  currency: string;
}
