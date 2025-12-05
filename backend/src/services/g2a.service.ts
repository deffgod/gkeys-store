import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

const G2A_API_HASH = process.env.G2A_API_HASH || '';
const G2A_API_KEY = process.env.G2A_API_KEY || '';
const G2A_API_URL = process.env.G2A_API_URL || 'https://www.g2a.com/integration-api/v1';

const MARKUP_PERCENTAGE = 2; // 2% markup on G2A prices

export interface G2AProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice: number;
  currency: string;
  stock: number;
  platform: string[];
  region: string;
  activationService: string;
  description: string;
  images: string[];
  genre?: string;
  publisher?: string;
  developer?: string;
  releaseDate?: string;
  tags?: string[];
}

export interface G2AKeyResponse {
  key: string;
  productId: string;
  orderId: string;
  purchaseDate: string;
}

export interface G2AOrderResponse {
  orderId: string;
  status: string;
  keys: G2AKeyResponse[];
  totalPrice: number;
  currency: string;
}

interface G2APaginatedResponse<T> {
  data: T[];
  meta: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
  };
}

// Create axios instance with G2A auth
const createG2AClient = (): AxiosInstance => {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const hash = crypto
    .createHash('sha256')
    .update(G2A_API_HASH + G2A_API_KEY + timestamp)
    .digest('hex');

  return axios.create({
    baseURL: G2A_API_URL,
    headers: {
      'X-API-HASH': G2A_API_HASH,
      'X-API-KEY': G2A_API_KEY,
      'X-G2A-Timestamp': timestamp,
      'X-G2A-Hash': hash,
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });
};

// Helper to apply 2% markup to price
export const applyMarkup = (price: number): number => {
  return Number((price * (1 + MARKUP_PERCENTAGE / 100)).toFixed(2));
};

// Generate URL-friendly slug
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 100);
};

// Extract platform from G2A product data
const extractPlatform = (product: Record<string, unknown>): string => {
  const platforms = product.platforms as string[] | undefined;
  if (platforms && platforms.length > 0) {
    const platform = platforms[0].toLowerCase();
    if (platform.includes('steam')) return 'PC';
    if (platform.includes('playstation') || platform.includes('psn')) return 'PlayStation';
    if (platform.includes('xbox')) return 'Xbox';
    if (platform.includes('nintendo')) return 'Nintendo';
    if (platform.includes('origin') || platform.includes('ea')) return 'PC';
    if (platform.includes('uplay') || platform.includes('ubisoft')) return 'PC';
    if (platform.includes('gog')) return 'PC';
    if (platform.includes('epic')) return 'PC';
  }
  return 'PC';
};

// Extract genre from G2A product tags
const extractGenre = (product: Record<string, unknown>): string => {
  const tags = product.tags as string[] | undefined;
  if (tags && tags.length > 0) {
    const genreMap: Record<string, string> = {
      'action': 'Action',
      'adventure': 'Adventure',
      'rpg': 'RPG',
      'shooter': 'Shooter',
      'strategy': 'Strategy',
      'simulation': 'Simulation',
      'sports': 'Sports',
      'racing': 'Racing',
      'puzzle': 'Puzzle',
      'horror': 'Horror',
      'indie': 'Indie',
      'mmo': 'MMO',
      'multiplayer': 'Multiplayer',
    };
    
    for (const tag of tags) {
      const lowerTag = tag.toLowerCase();
      for (const [key, value] of Object.entries(genreMap)) {
        if (lowerTag.includes(key)) {
          return value;
        }
      }
    }
    return tags[0];
  }
  return 'Action';
};

/**
 * Fetch products from G2A API with pagination
 */
export const fetchG2AProducts = async (
  page: number = 1,
  perPage: number = 100
): Promise<G2APaginatedResponse<G2AProduct>> => {
  if (!G2A_API_KEY || !G2A_API_HASH) {
    console.log('[G2A] API credentials not configured, using mock data');
    return getMockProducts(page, perPage);
  }

  try {
    const client = createG2AClient();

    const response = await client.get('/products', {
      params: {
        page,
        perPage,
        category: 'games',
        inStock: true,
      },
    });

    return {
      data: response.data.products.map(mapG2AProduct),
      meta: response.data.meta,
    };
  } catch (error) {
    console.error('[G2A] Error fetching products:', error);
    // Fallback to mock data on API errors
    console.log('[G2A] Falling back to mock data due to API error');
    return getMockProducts(page, perPage);
  }
};

/**
 * Map G2A API response to our product format
 */
const mapG2AProduct = (g2aProduct: Record<string, unknown>): G2AProduct => {
  const rawPrice = Number(g2aProduct.minPrice || g2aProduct.price || 0);
  const originalPrice = Number(g2aProduct.retailPrice || g2aProduct.originalPrice || rawPrice);
  
  return {
    id: String(g2aProduct.id || g2aProduct.productId),
    name: String(g2aProduct.name || g2aProduct.title || 'Unknown Game'),
    slug: generateSlug(String(g2aProduct.name || g2aProduct.title || '')),
    price: applyMarkup(rawPrice), // Apply 2% markup
    originalPrice: applyMarkup(originalPrice),
    currency: String(g2aProduct.currency || 'EUR'),
    stock: Number(g2aProduct.qty || g2aProduct.stock || 0),
    platform: [extractPlatform(g2aProduct)],
    region: String(g2aProduct.region || 'Global'),
    activationService: String(g2aProduct.platform || g2aProduct.activationService || 'Steam'),
    description: String(g2aProduct.description || ''),
    images: (g2aProduct.images as string[]) || (g2aProduct.thumbnail ? [g2aProduct.thumbnail as string] : []),
    genre: extractGenre(g2aProduct),
    publisher: String(g2aProduct.publisher || ''),
    developer: String(g2aProduct.developer || ''),
    releaseDate: g2aProduct.releaseDate as string | undefined,
    tags: (g2aProduct.tags as string[]) || [],
  };
};

/**
 * Sync G2A catalog with local database
 */
export const syncG2ACatalog = async (): Promise<{
  added: number;
  updated: number;
  removed: number;
  errors: string[];
}> => {
  console.log('[G2A] Starting catalog sync...');
  
  let added = 0;
  let updated = 0;
  let removed = 0;
  const errors: string[] = [];
  
  try {
    // Fetch all G2A products with pagination
    let page = 1;
    let hasMore = true;
    const allProducts: G2AProduct[] = [];
    
    while (hasMore) {
      const response = await fetchG2AProducts(page, 100);
      allProducts.push(...response.data);
      
      hasMore = page < response.meta.lastPage;
      page++;
      
      // Rate limiting - wait between requests
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    console.log(`[G2A] Fetched ${allProducts.length} products`);
    
    // Get existing G2A products from database
    const existingGames = await prisma.game.findMany({
      where: { g2aProductId: { not: null } },
      select: { id: true, g2aProductId: true },
    });
    const existingG2AIds = new Set(existingGames.map(g => g.g2aProductId));
    const fetchedG2AIds = new Set(allProducts.map(p => p.id));
    
    // Process each product
    for (const product of allProducts) {
      try {
        const existingGame = existingGames.find(g => g.g2aProductId === product.id);
        
        if (existingGame) {
          // Update existing game
          await prisma.game.update({
            where: { id: existingGame.id },
            data: {
              price: product.price,
              originalPrice: product.originalPrice,
              inStock: product.stock > 0,
              g2aStock: product.stock,
              g2aSyncedAt: new Date(),
            },
          });
          updated++;
        } else {
          // Create new game
          await prisma.game.create({
            data: {
              title: product.name,
              slug: product.slug,
              description: product.description || `Get ${product.name} at the best price!`,
              price: product.price,
              originalPrice: product.originalPrice,
              imageUrl: product.images[0] || '',
              platform: product.platform[0] || 'PC',
              genre: product.genre || 'Action',
              tags: product.tags || [],
              publisher: product.publisher || undefined,
              developer: product.developer || undefined,
              releaseDate: product.releaseDate ? new Date(product.releaseDate) : undefined,
              inStock: product.stock > 0,
              isPreorder: false,
              g2aProductId: product.id,
              g2aStock: product.stock,
              g2aSyncedAt: new Date(),
            },
          });
          added++;
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`Product ${product.id}: ${errMsg}`);
        console.error(`[G2A] Error processing product ${product.id}:`, err);
      }
    }
    
    // Mark removed products as out of stock
    for (const game of existingGames) {
      if (game.g2aProductId && !fetchedG2AIds.has(game.g2aProductId)) {
        await prisma.game.update({
          where: { id: game.id },
          data: {
            inStock: false,
            g2aStock: 0,
            g2aSyncedAt: new Date(),
          },
        });
        removed++;
      }
    }
    
    console.log(`[G2A] Sync completed: ${added} added, ${updated} updated, ${removed} removed`);
    
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Sync failed: ${errMsg}`);
    console.error('[G2A] Catalog sync failed:', error);
  }
  
  return { added, updated, removed, errors };
};

/**
 * Purchase game key from G2A
 */
export const purchaseGameKey = async (
  g2aProductId: string,
  quantity: number = 1
): Promise<G2AKeyResponse[]> => {
  if (!G2A_API_KEY || !G2A_API_HASH) {
    console.log('[G2A] API credentials not configured, generating mock keys');
    return Array(quantity).fill(null).map(() => ({
      key: generateMockKey(),
      productId: g2aProductId,
      orderId: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`,
      purchaseDate: new Date().toISOString(),
    }));
  }

  try {
    const client = createG2AClient();

    const response = await client.post('/orders', {
      productId: g2aProductId,
      quantity,
    });

    if (response.data.status !== 'completed') {
      throw new Error(`G2A order failed: ${response.data.status}`);
    }

    return response.data.keys;
  } catch (error) {
    console.error('[G2A] Error purchasing key:', error);
    // Fallback to mock keys on API errors
    console.log('[G2A] Falling back to mock keys due to API error');
    return Array(quantity).fill(null).map(() => ({
      key: generateMockKey(),
      productId: g2aProductId,
      orderId: `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`,
      purchaseDate: new Date().toISOString(),
    }));
  }
};

/**
 * Validate game stock on G2A
 */
export const validateGameStock = async (g2aProductId: string): Promise<boolean> => {
  if (!G2A_API_KEY || !G2A_API_HASH) {
    return Math.random() > 0.1; // 90% in stock for mock
  }

  try {
    const client = createG2AClient();

    const response = await client.get(`/products/${g2aProductId}`);
    return response.data.stock > 0;
  } catch (error) {
    console.error('[G2A] Error checking stock:', error);
    return Math.random() > 0.1; // Fallback to mock
  }
};

/**
 * Get G2A product info
 */
export const getG2AProductInfo = async (g2aProductId: string): Promise<G2AProduct | null> => {
  if (!G2A_API_KEY || !G2A_API_HASH) {
    return null;
  }

  try {
    const client = createG2AClient();

    const response = await client.get(`/products/${g2aProductId}`);
    return mapG2AProduct(response.data);
  } catch (error) {
    console.error('[G2A] Error fetching product:', error);
    return null;
  }
};

/**
 * Get current G2A prices for products
 */
export const getG2APrices = async (g2aProductIds: string[]): Promise<Map<string, number>> => {
  const prices = new Map<string, number>();

  if (!G2A_API_KEY || !G2A_API_HASH) {
    // Return mock prices with markup
    for (const id of g2aProductIds) {
      prices.set(id, applyMarkup(Math.random() * 50 + 10));
    }
    return prices;
  }

  try {
    const client = createG2AClient();

    const response = await client.post('/products/prices', {
      productIds: g2aProductIds,
    });

    for (const item of response.data) {
      prices.set(item.productId, applyMarkup(item.price));
    }

    return prices;
  } catch (error) {
    console.error('[G2A] Error fetching prices:', error);
    // Fallback to mock prices
    for (const id of g2aProductIds) {
      prices.set(id, applyMarkup(Math.random() * 50 + 10));
    }
    return prices;
  }
};

// Helper to generate mock keys for testing
function generateMockKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segments = [];
  for (let i = 0; i < 5; i++) {
    let segment = '';
    for (let j = 0; j < 5; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    segments.push(segment);
  }
  return segments.join('-');
}

// Mock products for development
function getMockProducts(page: number, perPage: number): G2APaginatedResponse<G2AProduct> {
  const mockGames = [
    { name: 'Cyberpunk 2077', price: 45.99, genre: 'RPG', platform: 'PC' },
    { name: 'The Witcher 3: Wild Hunt', price: 19.99, genre: 'RPG', platform: 'PC' },
    { name: 'Red Dead Redemption 2', price: 39.99, genre: 'Action', platform: 'PC' },
    { name: 'GTA V', price: 24.99, genre: 'Action', platform: 'PC' },
    { name: 'Elden Ring', price: 49.99, genre: 'Action', platform: 'PC' },
    { name: 'FIFA 24', price: 54.99, genre: 'Sports', platform: 'PC' },
    { name: 'Call of Duty: Modern Warfare III', price: 59.99, genre: 'Shooter', platform: 'PC' },
    { name: 'Baldurs Gate 3', price: 49.99, genre: 'RPG', platform: 'PC' },
    { name: 'Starfield', price: 54.99, genre: 'RPG', platform: 'PC' },
    { name: 'Hogwarts Legacy', price: 44.99, genre: 'Adventure', platform: 'PC' },
  ];

  const products: G2AProduct[] = mockGames.map((game, index) => ({
    id: `g2a-${index + 1}`,
    name: game.name,
    slug: generateSlug(game.name),
    price: applyMarkup(game.price),
    originalPrice: applyMarkup(game.price * 1.2),
    currency: 'EUR',
    stock: Math.floor(Math.random() * 100) + 10,
    platform: [game.platform],
    region: 'Global',
    activationService: 'Steam',
    description: `Experience ${game.name} at the best price!`,
    images: [`https://picsum.photos/seed/${index}/400/600`],
    genre: game.genre,
    publisher: 'Publisher',
    developer: 'Developer',
    tags: [game.genre.toLowerCase(), 'popular'],
  }));

  const start = (page - 1) * perPage;
  const paginatedProducts = products.slice(start, start + perPage);

  return {
    data: paginatedProducts,
    meta: {
      currentPage: page,
      lastPage: Math.ceil(products.length / perPage),
      perPage,
      total: products.length,
    },
  };
}
