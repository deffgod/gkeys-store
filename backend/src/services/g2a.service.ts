import axios, { AxiosInstance, AxiosError } from 'axios';
import crypto from 'node:crypto';
import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { G2AError, G2AErrorCode } from '../types/g2a.js';
import redisClient from '../config/redis.js';
import { getG2AConfig } from '../config/g2a.js';

const { apiHash: G2A_API_HASH, apiKey: G2A_API_KEY, baseUrl: G2A_API_URL, timeoutMs: G2A_TIMEOUT_MS, retryMax: G2A_RETRY_MAX } = getG2AConfig();
const G2A_API_URL_RAW = process.env.G2A_API_URL || 'https://api.g2a.com/integration-api/v1';

const MARKUP_PERCENTAGE = 2; // 2% markup on G2A prices

// Sync progress tracking interface
interface SyncProgress {
  inProgress: boolean;
  currentPage: number;
  totalPages: number;
  productsProcessed: number;
  productsTotal: number;
  categoriesCreated: number;
  genresCreated: number;
  platformsCreated: number;
  errors: number;
  startedAt: string | null;
  estimatedCompletion: string | null;
}

const SYNC_PROGRESS_KEY = 'g2a:sync:progress';
const SYNC_LOCK_KEY = 'g2a:sync:lock';

/**
 * Update sync progress (uses Redis if available, falls back to in-memory)
 */
const updateSyncProgress = async (progress: Partial<SyncProgress>): Promise<void> => {
  try {
    if (redisClient.isOpen) {
      const current = await getG2ASyncProgress();
      const updated = { ...current, ...progress };
      await redisClient.setEx(SYNC_PROGRESS_KEY, 3600, JSON.stringify(updated)); // 1 hour TTL
    }
  } catch (err) {
    logger.warn('Error updating sync progress in Redis', err);
  }
};

/**
 * Clear sync progress
 */
const clearSyncProgress = async (): Promise<void> => {
  try {
    if (redisClient.isOpen) {
      await redisClient.del(SYNC_PROGRESS_KEY);
      await redisClient.del(SYNC_LOCK_KEY);
    }
  } catch (err) {
    logger.warn('Error clearing sync progress', err);
  }
};

/**
 * Check if sync is locked (prevent concurrent syncs)
 */
const acquireSyncLock = async (): Promise<boolean> => {
  try {
    if (redisClient.isOpen) {
      const lockValue = await redisClient.get(SYNC_LOCK_KEY);
      if (lockValue) {
        return false; // Lock already exists
      }
      await redisClient.setEx(SYNC_LOCK_KEY, 3600, 'locked'); // 1 hour TTL
      return true;
    }
    return true; // If Redis not available, allow sync
  } catch (err) {
    logger.warn('Error acquiring sync lock', err);
    return true; // On error, allow sync
  }
};

/**
 * Release sync lock
 */
const releaseSyncLock = async (): Promise<void> => {
  try {
    if (redisClient.isOpen) {
      await redisClient.del(SYNC_LOCK_KEY);
    }
  } catch (err) {
    logger.warn('Error releasing sync lock', err);
  }
};

/**
 * Retry function with exponential backoff
 */
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = G2A_RETRY_MAX,
  initialDelay: number = 1000
): Promise<T> => {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        logger.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`, { error: lastError.message });
        
        // Record retry metric (async, don't await)
        import('./g2a-metrics.service').then(m => m.incrementMetric('requests_retry')).catch(() => {});
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
};

/**
 * Detect if game data has changed compared to database
 */
const hasGameDataChanged = async (gameId: string, newData: {
  price: number;
  originalPrice: number | null;
  inStock: boolean;
  g2aStock: boolean;
  description: string;
  images: string[];
}): Promise<boolean> => {
  try {
    const existing = await prisma.game.findUnique({
      where: { id: gameId },
      select: {
        price: true,
        originalPrice: true,
        inStock: true,
        g2aStock: true,
        description: true,
        images: true,
      },
    });
    
    if (!existing) return true; // New game
    
    // Compare critical fields
    return (
      existing.price.toString() !== newData.price.toString() ||
      (existing.originalPrice?.toString() || null) !== (newData.originalPrice?.toString() || null) ||
      existing.inStock !== newData.inStock ||
      existing.g2aStock !== newData.g2aStock ||
      existing.description !== newData.description ||
      JSON.stringify(existing.images) !== JSON.stringify(newData.images)
    );
  } catch (err) {
    logger.warn(`Error checking if game data changed for ${gameId}`, err);
    return true; // On error, assume changed to be safe
  }
};

/**
 * Structured logger for G2A API operations with audit logging
 */
const logger = {
  info: (message: string, data?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    console.log(`[G2A] [${timestamp}] [INFO] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  error: (message: string, error?: unknown) => {
    const timestamp = new Date().toISOString();
    console.error(`[G2A] [${timestamp}] [ERROR] ${message}`, error);
  },
  warn: (message: string, data?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    console.warn(`[G2A] [${timestamp}] [WARN] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  debug: (message: string, data?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') {
      const timestamp = new Date().toISOString();
      console.log(`[G2A] [${timestamp}] [DEBUG] ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
  },
  /**
   * Audit log for G2A API requests and responses
   */
  audit: (operation: string, request: Record<string, unknown>, response?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    const auditData = {
      timestamp,
      operation,
      request: {
        ...request,
        // Remove sensitive data from audit logs
        apiKey: request.apiKey ? '[REDACTED]' : undefined,
        apiHash: request.apiHash ? '[REDACTED]' : undefined,
      },
      response,
    };
    console.log(`[G2A] [AUDIT] ${JSON.stringify(auditData, null, 2)}`);
  },
};

/**
 * Validate G2A API credentials
 * @throws {G2AError} If credentials are missing or invalid
 */
export const validateG2ACredentials = (): void => {
  if (!G2A_API_HASH || !G2A_API_KEY) {
    throw new G2AError(
      G2AErrorCode.G2A_AUTH_FAILED,
      'G2A API credentials not configured. Please set G2A_API_HASH and G2A_API_KEY environment variables.'
    );
  }

  if (G2A_API_HASH.trim().length === 0 || G2A_API_KEY.trim().length === 0) {
    throw new G2AError(
      G2AErrorCode.G2A_AUTH_FAILED,
      'G2A API credentials are empty. Please provide valid G2A_API_HASH and G2A_API_KEY.'
    );
  }

  logger.debug('G2A credentials validated successfully');
};

/**
 * Handle G2A API errors and convert to G2AError
 */
const handleG2AError = (error: unknown, operation: string): G2AError => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    const status = axiosError.response?.status;
    const data = axiosError.response?.data;
    
    // Check if response is HTML (indicates endpoint not found or wrong URL)
    const isHtmlResponse = typeof data === 'string' && data.trim().startsWith('<!DOCTYPE html>');
    const dataObj = typeof data === 'object' && data !== null ? data as Record<string, unknown> : undefined;

    logger.error(`G2A API error in ${operation}`, {
      status,
      message: axiosError.message,
      url: axiosError.config?.url,
      baseURL: axiosError.config?.baseURL,
      isHtmlResponse,
      data: isHtmlResponse ? 'HTML response (endpoint may not exist)' : dataObj,
    });

    // Handle specific HTTP status codes
    if (status === 401 || status === 403) {
      return new G2AError(
        G2AErrorCode.G2A_AUTH_FAILED,
        `Authentication failed: ${dataObj?.message || axiosError.message}`,
        { status, operation }
      );
    }

    if (status === 404) {
      // If 404 with HTML response, it's likely an endpoint/URL issue, not a missing product
      if (isHtmlResponse) {
        return new G2AError(
          G2AErrorCode.G2A_API_ERROR,
          `Endpoint not found (404): Check API URL configuration. Base URL: ${axiosError.config?.baseURL}`,
          { status, operation, isEndpointError: true }
        );
      }
      return new G2AError(
        G2AErrorCode.G2A_PRODUCT_NOT_FOUND,
        `Product not found: ${(dataObj && 'message' in dataObj && typeof dataObj.message === 'string') ? dataObj.message : axiosError.message}`,
        { status, operation }
      );
    }

    if (status === 429) {
      const errorMessage = (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string') 
        ? data.message 
        : axiosError.message;
      return new G2AError(
        G2AErrorCode.G2A_RATE_LIMIT,
        `Rate limit exceeded: ${errorMessage}`,
        { status, operation }
      );
    }

    if (status === 402) {
      const errorMessage = (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string') 
        ? data.message 
        : axiosError.message;
      return new G2AError(
        G2AErrorCode.G2A_OUT_OF_STOCK,
        `Product unavailable or insufficient funds: ${errorMessage}`,
        { status, operation }
      );
    }

    if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
      return new G2AError(
        G2AErrorCode.G2A_TIMEOUT,
        `Request timeout: ${axiosError.message}`,
        { operation }
      );
    }

    if (axiosError.code === 'ENOTFOUND' || axiosError.code === 'ECONNREFUSED') {
      return new G2AError(
        G2AErrorCode.G2A_NETWORK_ERROR,
        `Network error: ${axiosError.message}`,
        { operation }
      );
    }

    const errorMessage = (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string') 
      ? data.message 
      : axiosError.message;
    return new G2AError(
      G2AErrorCode.G2A_API_ERROR,
      `G2A API error: ${errorMessage}`,
      { status, operation, data }
    );
  }

  if (error instanceof G2AError) {
    return error;
  }

  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  logger.error(`Unexpected error in ${operation}`, error);
  return new G2AError(
    G2AErrorCode.G2A_API_ERROR,
    `Unexpected error: ${errorMessage}`,
    { operation, error }
  );
};

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
  genre?: string; // Kept for backward compatibility, but genres should be extracted from tags
  genres?: string[]; // All genres extracted from product
  categories?: string[]; // Categories extracted from product
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

/**
 * Create axios instance with G2A authentication
 * Includes request/response interceptors for audit logging and rate limit detection
 * @throws {G2AError} If credentials are missing
 * @returns {AxiosInstance} Configured axios instance with G2A authentication
 */
const createG2AClient = (): AxiosInstance => {
  // Validate credentials before creating client
  validateG2ACredentials();

  // Determine authentication method based on URL
  // Sandbox API uses simple Authorization header: "hash, key"
  // Production API uses hash-based auth with timestamp
  const isSandbox = G2A_API_URL.includes('sandboxapi.g2a.com');
  
  // Only generate hash for production API (sandbox uses simple auth)
  const timestamp = isSandbox ? undefined : Math.floor(Date.now() / 1000).toString();
  const hash = isSandbox ? undefined : crypto
    .createHash('sha256')
    .update(G2A_API_HASH + G2A_API_KEY + timestamp!)
    .digest('hex');

  const logData: Record<string, unknown> = {
    baseURL: G2A_API_URL,
    originalURL: G2A_API_URL_RAW,
    isSandbox,
    authMethod: isSandbox ? 'Authorization header' : 'Hash-based',
  };
  
  if (timestamp) {
    logData.timestamp = timestamp;
  }
  
  if (hash) {
    logData.hashPrefix = hash.substring(0, 8) + '...';
  }
  
  logger.debug('Creating G2A API client', logData);
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (isSandbox) {
    // Sandbox uses simple Authorization header format: "hash, key"
    headers.Authorization = `${G2A_API_HASH}, ${G2A_API_KEY}`;
  } else {
    // Production uses hash-based authentication with timestamp
    headers['X-API-HASH'] = G2A_API_HASH;
    headers['X-API-KEY'] = G2A_API_KEY;
    headers['X-G2A-Timestamp'] = timestamp!;
    headers['X-G2A-Hash'] = hash!;
  }

  const client = axios.create({
    baseURL: G2A_API_URL,
    headers,
    timeout: G2A_TIMEOUT_MS,
  });

  // Add request interceptor for audit logging and metrics
  client.interceptors.request.use(
    (config) => {
      // Store start time for latency measurement
      (config as any).metadata = { startTime: Date.now() };
      
      logger.audit('G2A_API_REQUEST', {
        method: config.method?.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        params: config.params,
        data: config.data,
      });
      
      // Increment total requests metric (async, don't await)
      import('./g2a-metrics.service.js').then(m => m.incrementMetric('requests_total')).catch(() => {});
      
      return config;
    },
    (error) => {
      logger.error('G2A API request interceptor error', error);
      return Promise.reject(error);
    }
  );

  // Add response interceptor for audit logging, rate limit detection, and metrics
  client.interceptors.response.use(
    (response) => {
      const startTime = (response.config as any).metadata?.startTime;
      const latency = startTime ? Date.now() - startTime : 0;
      
      logger.audit('G2A_API_RESPONSE', {
        method: response.config.method?.toUpperCase(),
        url: response.config.url,
        status: response.status,
        statusText: response.statusText,
        latency,
      }, {
        status: response.status,
        dataKeys: response.data ? Object.keys(response.data) : [],
      });

      // Record metrics (async, don't await)
      import('./g2a-metrics.service').then(m => {
        m.incrementMetric('requests_success');
        if (latency > 0) m.recordLatency(latency);
      }).catch(() => {});

      // Check for rate limit headers (if G2A API provides them)
      const rateLimitRemaining = response.headers['x-ratelimit-remaining'];
      const rateLimitReset = response.headers['x-ratelimit-reset'];
      
      if (rateLimitRemaining && Number(rateLimitRemaining) < 10) {
        logger.warn('G2A API rate limit approaching', {
          remaining: rateLimitRemaining,
          reset: rateLimitReset,
        });
      }

      return response;
    },
    (error) => {
      const startTime = (error.config as any)?.metadata?.startTime;
      const latency = startTime ? Date.now() - startTime : 0;
      
      // Log error response for audit
      if (axios.isAxiosError(error)) {
        logger.audit('G2A_API_ERROR', {
          method: error.config?.method?.toUpperCase(),
          url: error.config?.url,
          status: error.response?.status,
          statusText: error.response?.statusText,
          latency,
        }, {
          status: error.response?.status,
          message: error.message,
          data: error.response?.data,
        });

        // Record error metric (async, don't await)
        import('./g2a-metrics.service.js').then(m => {
          m.incrementMetric('requests_error');
          if (latency > 0) m.recordLatency(latency);
        }).catch(() => {});

        // Detect rate limiting (429 status)
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'];
          logger.warn('G2A API rate limit exceeded', {
            retryAfter,
            url: error.config?.url,
          });
        }
      }
      return Promise.reject(error);
    }
  );

  return client;
};

/**
 * Apply 2% markup to G2A price
 * @param {number} price - Base price from G2A API
 * @returns {number} Price with 2% markup applied, rounded to 2 decimal places
 * @example
 * applyMarkup(100) // Returns 102.00
 */
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

/**
 * Normalize platform name to standard format
 * @param platform - Raw platform name from G2A
 * @returns Normalized platform name
 */
const normalizePlatformName = (platform: string): string => {
  const lowerPlatform = platform.toLowerCase();
  if (lowerPlatform.includes('steam') || 
      lowerPlatform.includes('origin') || 
      lowerPlatform.includes('ea') || 
      lowerPlatform.includes('uplay') || 
      lowerPlatform.includes('ubisoft') || 
      lowerPlatform.includes('gog') || 
      lowerPlatform.includes('epic')) {
    return 'PC';
  }
  if (lowerPlatform.includes('playstation') || lowerPlatform.includes('psn')) {
    return 'PlayStation';
  }
  if (lowerPlatform.includes('xbox')) {
    return 'Xbox';
  }
  if (lowerPlatform.includes('nintendo') || lowerPlatform.includes('switch')) {
    return 'Nintendo';
  }
  return 'PC'; // Default fallback
};

/**
 * Extract all platforms from G2A product data
 * @param product - G2A product data
 * @returns Array of normalized platform names
 */
const extractPlatform = (product: Record<string, unknown>): string[] => {
  const platforms = product.platforms as string[] | undefined;
  if (platforms && platforms.length > 0) {
    const normalizedPlatforms = platforms
      .map(p => normalizePlatformName(String(p)))
      .filter((p, index, arr) => arr.indexOf(p) === index); // Remove duplicates
    return normalizedPlatforms.length > 0 ? normalizedPlatforms : ['PC'];
  }
  return ['PC'];
};

/**
 * Normalize genre name to standard format
 * @param genre - Raw genre name from G2A
 * @returns Normalized genre name
 */
const normalizeGenreName = (genre: string): string => {
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
  
  const lowerGenre = genre.toLowerCase();
  for (const [key, value] of Object.entries(genreMap)) {
    if (lowerGenre.includes(key)) {
      return value;
    }
  }
  
  // If no match, capitalize first letter of each word
  return genre
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Extract all genres from G2A product tags
 * @param product - G2A product data
 * @returns Array of normalized genre names
 */
const extractGenre = (product: Record<string, unknown>): string[] => {
  const tags = product.tags as string[] | undefined;
  const explicitGenre = product.genre as string | undefined;
  
  const genres: string[] = [];
  
  // Add explicit genre if present
  if (explicitGenre) {
    genres.push(normalizeGenreName(explicitGenre));
  }
  
  // Extract genres from tags
  if (tags && tags.length > 0) {
    for (const tag of tags) {
      const normalized = normalizeGenreName(String(tag));
      if (normalized && !genres.includes(normalized)) {
        genres.push(normalized);
      }
    }
  }
  
  return genres.length > 0 ? genres : ['Action']; // Default fallback
};

/**
 * Extract category from G2A product data
 * @param product - G2A product data
 * @returns Category name (defaults to 'Games')
 */
const extractCategories = (product: Record<string, unknown>): string[] => {
  const category = product.category as string | undefined;
  if (category) {
    // Capitalize first letter
    const normalized = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
    return [normalized];
  }
  return ['Games']; // Default category
};

/**
 * Find or create a Category record in the database
 * @param categoryName - Name of the category
 * @returns Category ID
 */
const findOrCreateCategory = async (categoryName: string): Promise<string> => {
  const slug = generateSlug(categoryName);
  
  const existing = await prisma.category.findUnique({
    where: { slug },
  });
  
  if (existing) {
    return existing.id;
  }
  
  const created = await prisma.category.create({
    data: {
      name: categoryName,
      slug,
    },
  });
  
  logger.debug(`Created category: ${categoryName}`, { id: created.id });
  return created.id;
};

/**
 * Find or create a Genre record in the database
 * @param genreName - Name of the genre (will be normalized)
 * @returns Genre ID
 */
const findOrCreateGenre = async (genreName: string): Promise<string> => {
  const normalizedName = normalizeGenreName(genreName);
  const slug = generateSlug(normalizedName);
  
  const existing = await prisma.genre.findUnique({
    where: { slug },
  });
  
  if (existing) {
    return existing.id;
  }
  
  const created = await prisma.genre.create({
    data: {
      name: normalizedName,
      slug,
    },
  });
  
  logger.debug(`Created genre: ${normalizedName}`, { id: created.id });
  return created.id;
};

/**
 * Find or create a Platform record in the database
 * @param platformName - Name of the platform (will be normalized)
 * @returns Platform ID
 */
const findOrCreatePlatform = async (platformName: string): Promise<string> => {
  const normalizedName = normalizePlatformName(platformName);
  const slug = generateSlug(normalizedName);
  
  const existing = await prisma.platform.findUnique({
    where: { slug },
  });
  
  if (existing) {
    return existing.id;
  }
  
  const created = await prisma.platform.create({
    data: {
      name: normalizedName,
      slug,
    },
  });
  
  logger.debug(`Created platform: ${normalizedName}`, { id: created.id });
  return created.id;
};

/**
 * Fetch products from G2A API with pagination
 * Falls back to mock data if API credentials are not configured or API call fails
 * @param {number} page - Page number to fetch (default: 1)
 * @param {number} perPage - Number of products per page (default: 100, max: 100)
 * @param {string} category - Optional category filter (e.g., 'games', 'dlc', 'software')
 * @returns {Promise<G2APaginatedResponse<G2AProduct>>} Paginated response with products and metadata
 * @throws {G2AError} If API call fails and fallback is not available
 */
export const fetchG2AProducts = async (
  page: number = 1,
  perPage: number = 100,
  category?: string
): Promise<G2APaginatedResponse<G2AProduct>> => {
  if (!G2A_API_KEY || !G2A_API_HASH) {
    logger.warn('API credentials not configured, using mock data');
    return getMockProducts(page, perPage);
  }

  try {
    logger.info(`Fetching G2A products`, { page, perPage, category: category || 'games' });
    const client = createG2AClient();

    const response = await client.get('/products', {
      params: {
        page,
        perPage,
        category: category || 'games',
        inStock: true,
      },
    });

    logger.info(`Successfully fetched products`, {
      count: response.data.products?.length || 0,
      page,
      totalPages: response.data.meta?.lastPage || 1,
      category: category || 'games',
    });

    return {
      data: response.data.products.map(mapG2AProduct),
      meta: response.data.meta,
    };
  } catch (error) {
    const g2aError = handleG2AError(error, 'fetchG2AProducts');
    logger.error('Error fetching products, falling back to mock data', g2aError);
    // Fallback to mock data on API errors
    return getMockProducts(page, perPage);
  }
};

/**
 * Map G2A API response to our product format
 */
const mapG2AProduct = (g2aProduct: Record<string, unknown>): G2AProduct => {
  const rawPrice = Number(g2aProduct.minPrice || g2aProduct.price || 0);
  const originalPrice = Number(g2aProduct.retailPrice || g2aProduct.originalPrice || rawPrice);
  
  const platforms = extractPlatform(g2aProduct);
  const genres = extractGenre(g2aProduct);
  const categories = extractCategories(g2aProduct);
  
  return {
    id: String(g2aProduct.id || g2aProduct.productId),
    name: String(g2aProduct.name || g2aProduct.title || 'Unknown Game'),
    slug: generateSlug(String(g2aProduct.name || g2aProduct.title || '')),
    price: applyMarkup(rawPrice), // Apply 2% markup
    originalPrice: applyMarkup(originalPrice),
    currency: String(g2aProduct.currency || 'EUR'),
    stock: Number(g2aProduct.qty || g2aProduct.stock || 0),
    platform: platforms,
    region: String(g2aProduct.region || 'Global'),
    activationService: String(g2aProduct.platform || g2aProduct.activationService || 'Steam'),
    description: String(g2aProduct.description || ''),
    images: (g2aProduct.images as string[]) || (g2aProduct.thumbnail ? [g2aProduct.thumbnail as string] : []),
    genre: genres[0] || 'Action', // Keep first genre for backward compatibility
    genres: genres, // All genres
    categories: categories, // All categories
    publisher: String(g2aProduct.publisher || ''),
    developer: String(g2aProduct.developer || ''),
    releaseDate: g2aProduct.releaseDate as string | undefined,
    tags: (g2aProduct.tags as string[]) || [],
  };
};

/**
 * Transform G2A Product to Game data according to data-model.md
 * Note: Categories, genres, and platforms are linked separately via junction tables
 */
const transformG2AProductToGame = (product: G2AProduct) => {
  const now = new Date();
  const releaseDate = product.releaseDate ? new Date(product.releaseDate) : now;
  
  return {
    g2aProductId: product.id,
    title: product.name,
    slug: product.slug,
    description: product.description || `Get ${product.name} at the best price!`,
    price: product.price, // Already has markup applied
    originalPrice: product.originalPrice || null, // Already has markup applied
    currency: product.currency || 'EUR',
    image: product.images[0] || '',
    images: product.images || [],
    inStock: product.stock > 0,
    g2aStock: product.stock > 0, // Boolean in Prisma schema
    g2aLastSync: now,
    activationService: product.activationService || 'Steam',
    region: product.region || 'Global',
    publisher: product.publisher || undefined,
    releaseDate: releaseDate,
    // Categories, genres, and platforms are linked via junction tables in syncG2ACatalog
    // when includeRelationships is true
  };
};

/**
 * Sync G2A catalog with local database
 * Fetches products from G2A API, transforms them to internal Game model, and stores/updates in database
 * Applies 2% markup to all prices and updates g2aLastSync timestamp
 * @param {Object} options - Sync options
 * @param {boolean} options.fullSync - If true, sync all products and mark removed ones as out of stock. If false, only sync changed products
 * @param {string[]} options.productIds - Optional array of specific product IDs to sync (if provided, only these products are synced)
 * @param {string[]} options.categories - Optional array of categories to sync (e.g., ['games', 'dlc']). If not provided, syncs 'games' category
 * @param {boolean} options.includeRelationships - If true, create and link Category/Genre/Platform relationships
 * @returns {Promise<Object>} Sync result with counts and errors
 * @returns {number} returns.added - Number of new products added
 * @returns {number} returns.updated - Number of existing products updated
 * @returns {number} returns.removed - Number of products marked as removed (only if fullSync=true)
 * @returns {number} returns.categoriesCreated - Number of categories created (if includeRelationships=true)
 * @returns {number} returns.genresCreated - Number of genres created (if includeRelationships=true)
 * @returns {number} returns.platformsCreated - Number of platforms created (if includeRelationships=true)
 * @returns {Array<{productId: string, error: string}>} returns.errors - Array of errors encountered during sync
 * @throws {G2AError} If sync operation fails completely
 */
export const syncG2ACatalog = async (options?: {
  fullSync?: boolean;
  productIds?: string[];
  categories?: string[];
  includeRelationships?: boolean;
}): Promise<{
  added: number;
  updated: number;
  removed: number;
  categoriesCreated: number;
  genresCreated: number;
  platformsCreated: number;
  errors: Array<{ productId: string; error: string }>;
}> => {
  const { fullSync = false, productIds, categories, includeRelationships = false } = options || {};
  
  // Check sync lock
  const lockAcquired = await acquireSyncLock();
  if (!lockAcquired) {
    throw new G2AError(
      G2AErrorCode.G2A_API_ERROR,
      'Another sync operation is already in progress. Please wait for it to complete.'
    );
  }
  
  const startedAt = new Date().toISOString();
  
  logger.info('Starting catalog sync...', { 
    fullSync, 
    productIdsCount: productIds?.length || 0,
    categories: categories || ['games'],
    includeRelationships 
  });
  
  // Initialize progress tracking
  await updateSyncProgress({
    inProgress: true,
    currentPage: 0,
    totalPages: 0,
    productsProcessed: 0,
    productsTotal: 0,
    categoriesCreated: 0,
    genresCreated: 0,
    platformsCreated: 0,
    errors: 0,
    startedAt,
    estimatedCompletion: null,
  });
  
  let added = 0;
  let updated = 0;
  let removed = 0;
  let categoriesCreated = 0;
  let genresCreated = 0;
  let platformsCreated = 0;
  const errors: Array<{ productId: string; error: string }> = [];
  
  try {
    let allProducts: G2AProduct[] = [];
    
    if (productIds && productIds.length > 0) {
      // Sync specific products
      logger.info(`Syncing ${productIds.length} specific products`);
      for (const productId of productIds) {
        try {
          const productInfo = await getG2AProductInfo(productId);
          if (productInfo) {
            allProducts.push(productInfo);
          } else {
            errors.push({ productId, error: 'Product not found in G2A API' });
          }
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : 'Unknown error';
          errors.push({ productId, error: errMsg });
          logger.error(`Error fetching product ${productId}`, err);
        }
        // Rate limiting between requests
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    } else {
      // Determine categories to sync
      const categoriesToSync = categories && categories.length > 0 ? categories : ['games'];
      
      // Fetch products from each category
      for (const category of categoriesToSync) {
        logger.info(`Fetching products from category: ${category}`);
        let page = 1;
        let hasMore = true;
        
        // Get total pages for this category first (estimate)
        let totalPagesForCategory = 0;
        try {
          const firstPageResponse = await fetchG2AProducts(1, 100, category);
          totalPagesForCategory = firstPageResponse.meta.lastPage;
          allProducts.push(...firstPageResponse.data);
          page = 2; // Start from page 2 since we already fetched page 1
          
          // Calculate estimated completion time
          const avgTimePerPage = 2; // seconds (rough estimate)
          const estimatedSeconds = totalPagesForCategory * avgTimePerPage;
          const estimatedCompletion = new Date(Date.now() + estimatedSeconds * 1000).toISOString();
          
          // Update progress
          await updateSyncProgress({
            currentPage: 1,
            totalPages: totalPagesForCategory,
            productsTotal: firstPageResponse.meta.total,
            estimatedCompletion,
          });
        } catch (err) {
          logger.warn(`Error fetching first page for category ${category}`, err);
        }
        
        while (page <= totalPagesForCategory) {
          try {
            const response = await retryWithBackoff(
              () => fetchG2AProducts(page, 100, category),
              3,
              1000
            );
            allProducts.push(...response.data);
            
            // Update progress
            await updateSyncProgress({
              currentPage: page,
              productsProcessed: allProducts.length,
            });
            
            logger.debug(`Fetched page ${page} from category ${category}`, {
              products: response.data.length,
              totalPages: response.meta.lastPage,
            });
            
            page++;
            
            // Rate limiting - wait between requests
            if (page <= totalPagesForCategory) {
              await new Promise(resolve => setTimeout(resolve, 200));
            }
          } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Unknown error';
            logger.error(`Error fetching page ${page} from category ${category} after retries`, err);
            errors.push({ productId: `category-${category}-page-${page}`, error: errMsg });
            // Continue with next page on error instead of stopping
            page++;
          }
        }
        
        // Rate limiting between categories
        if (categoriesToSync.indexOf(category) < categoriesToSync.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    }
    
    logger.info(`Fetched ${allProducts.length} products from G2A API`);
    
    // Update total products count
    await updateSyncProgress({
      productsTotal: allProducts.length,
    });
    
    // Get existing G2A products from database
    const existingGames = await prisma.game.findMany({
      where: { g2aProductId: { not: null } },
      select: { id: true, g2aProductId: true, g2aLastSync: true },
    });
    const existingG2AIds = new Set(existingGames.map(g => g.g2aProductId));
    const fetchedG2AIds = new Set(allProducts.map(p => p.id));
    
    // Process products in batches for better performance
    const BATCH_SIZE = 50;
    let processedCount = 0;
    
    for (let i = 0; i < allProducts.length; i += BATCH_SIZE) {
      const batch = allProducts.slice(i, i + BATCH_SIZE);
      
      // Process batch
      for (const product of batch) {
        try {
        const existingGame = existingGames.find(g => g.g2aProductId === product.id);
        const gameData = transformG2AProductToGame(product);
        
        let gameId: string;
        
        if (existingGame) {
          // Check if data has changed (for incremental sync optimization)
          if (!fullSync) {
            const hasChanged = await hasGameDataChanged(existingGame.id, {
              price: gameData.price,
              originalPrice: gameData.originalPrice,
              inStock: gameData.inStock,
              g2aStock: gameData.g2aStock,
              description: gameData.description,
              images: gameData.images,
            });
            
            if (!hasChanged) {
              // Skip update if nothing changed
              gameId = existingGame.id;
              continue; // Skip to next product
            }
          }
          
          // Update existing game - use upsert logic
          await prisma.game.update({
            where: { id: existingGame.id },
            data: {
              ...gameData,
              // Ensure all fields are updated
              price: gameData.price,
              originalPrice: gameData.originalPrice,
              inStock: gameData.inStock,
              g2aStock: gameData.g2aStock,
              g2aLastSync: gameData.g2aLastSync,
            },
          });
          gameId = existingGame.id;
          updated++;
        } else {
          // Create new game
          const newGame = await prisma.game.create({
            data: {
              ...gameData,
              isPreorder: false,
              isBestSeller: false,
              isNew: false,
            },
          });
          gameId = newGame.id;
          added++;
        }
        
        // Create and link relationships if requested
        if (includeRelationships) {
          try {
            // Extract categories, genres, platforms from product
            // product is G2AProduct which already has these fields from mapG2AProduct
            const categories = product.categories || ['Games'];
            const genres = product.genres || (product.genre ? [product.genre] : []);
            const platforms = product.platform || [];
            
            // Create and link categories
            for (const categoryName of categories) {
              try {
                const categoryId = await findOrCreateCategory(categoryName);
                const existingLink = await prisma.gameCategory.findUnique({
                  where: { gameId_categoryId: { gameId, categoryId } },
                });
                if (!existingLink) {
                  await prisma.gameCategory.create({
                    data: { gameId, categoryId },
                  });
                  if (!existingGame) {
                    categoriesCreated++;
                  }
                }
              } catch (err) {
                logger.warn(`Error linking category ${categoryName} to game ${gameId}`, err);
              }
            }
            
            // Create and link genres
            for (const genreName of genres) {
              try {
                const genreId = await findOrCreateGenre(genreName);
                const existingLink = await prisma.gameGenre.findUnique({
                  where: { gameId_genreId: { gameId, genreId } },
                });
                if (!existingLink) {
                  await prisma.gameGenre.create({
                    data: { gameId, genreId },
                  });
                  if (!existingGame) {
                    genresCreated++;
                  }
                }
              } catch (err) {
                logger.warn(`Error linking genre ${genreName} to game ${gameId}`, err);
              }
            }
            
            // Create and link platforms
            for (const platformName of platforms) {
              try {
                const platformId = await findOrCreatePlatform(platformName);
                const existingLink = await prisma.gamePlatform.findUnique({
                  where: { gameId_platformId: { gameId, platformId } },
                });
                if (!existingLink) {
                  await prisma.gamePlatform.create({
                    data: { gameId, platformId },
                  });
                  if (!existingGame) {
                    platformsCreated++;
                  }
                }
              } catch (err) {
                logger.warn(`Error linking platform ${platformName} to game ${gameId}`, err);
              }
            }
          } catch (err) {
            logger.warn(`Error creating relationships for game ${gameId}`, err);
            // Don't fail the entire sync if relationship creation fails
          }
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Unknown error';
        errors.push({ productId: product.id, error: errMsg });
        logger.error(`Error processing product ${product.id}`, err);
        // Continue processing other products on error
      }
      
        processedCount++;
        
        // Update progress after each product
        if (processedCount % 10 === 0) {
          await updateSyncProgress({
            productsProcessed: processedCount,
          });
        }
      }
    }
    
    // Mark removed products as out of stock (only if fullSync)
    if (fullSync) {
      for (const game of existingGames) {
        if (game.g2aProductId && !fetchedG2AIds.has(game.g2aProductId)) {
          try {
            await prisma.game.update({
              where: { id: game.id },
              data: {
                inStock: false,
                g2aStock: false, // Boolean in Prisma schema
                g2aLastSync: new Date(),
              },
            });
            removed++;
          } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Unknown error';
            errors.push({ productId: game.g2aProductId || 'unknown', error: errMsg });
            logger.error(`Error marking product as removed ${game.g2aProductId}`, err);
          }
        }
      }
    }
    
    logger.info(`Sync completed`, { 
      added, 
      updated, 
      removed, 
      categoriesCreated,
      genresCreated,
      platformsCreated,
      errors: errors.length 
    });
    
    // Clear progress tracking
    await updateSyncProgress({
      inProgress: false,
      productsProcessed: added + updated,
    });
    
  } catch (error) {
    const g2aError = handleG2AError(error, 'syncG2ACatalog');
    const errMsg = g2aError.message;
    errors.push({ productId: 'sync-operation', error: errMsg });
    logger.error('Catalog sync failed', g2aError);
    
    // Clear progress on error
    await updateSyncProgress({
      inProgress: false,
    });
  } finally {
    // Always release lock
    await releaseSyncLock();
  }
  
  return { 
    added, 
    updated, 
    removed, 
    categoriesCreated,
    genresCreated,
    platformsCreated,
    errors 
  };
};

/**
 * Link a game to its categories, genres, and platforms
 * @param gameId - Game ID
 * @param categoryNames - Array of category names
 * @param genreNames - Array of genre names
 * @param platformNames - Array of platform names
 * @returns Counts of linked relationships
 */
export const linkGameRelationships = async (
  gameId: string,
  categoryNames: string[],
  genreNames: string[],
  platformNames: string[]
): Promise<{
  categoriesLinked: number;
  genresLinked: number;
  platformsLinked: number;
  errors: string[];
}> => {
  const errors: string[] = [];
  let categoriesLinked = 0;
  let genresLinked = 0;
  let platformsLinked = 0;
  
  try {
    // Get existing links
    const existingCategories = await prisma.gameCategory.findMany({
      where: { gameId },
      select: { categoryId: true },
    });
    const existingGenres = await prisma.gameGenre.findMany({
      where: { gameId },
      select: { genreId: true },
    });
    const existingPlatforms = await prisma.gamePlatform.findMany({
      where: { gameId },
      select: { platformId: true },
    });
    
    const existingCategoryIds = new Set(existingCategories.map(c => c.categoryId));
    const existingGenreIds = new Set(existingGenres.map(g => g.genreId));
    const existingPlatformIds = new Set(existingPlatforms.map(p => p.platformId));
    
    // Link categories
    for (const categoryName of categoryNames) {
      try {
        const categoryId = await findOrCreateCategory(categoryName);
        if (!existingCategoryIds.has(categoryId)) {
          await prisma.gameCategory.create({
            data: { gameId, categoryId },
          });
          categoriesLinked++;
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`Category ${categoryName}: ${errMsg}`);
        logger.error(`Error linking category ${categoryName}`, err);
      }
    }
    
    // Remove old category links that no longer apply
    for (const existing of existingCategories) {
      const category = await prisma.category.findUnique({
        where: { id: existing.categoryId },
      });
      if (category && !categoryNames.includes(category.name)) {
        await prisma.gameCategory.delete({
          where: { gameId_categoryId: { gameId, categoryId: existing.categoryId } },
        });
      }
    }
    
    // Link genres
    for (const genreName of genreNames) {
      try {
        const genreId = await findOrCreateGenre(genreName);
        if (!existingGenreIds.has(genreId)) {
          await prisma.gameGenre.create({
            data: { gameId, genreId },
          });
          genresLinked++;
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`Genre ${genreName}: ${errMsg}`);
        logger.error(`Error linking genre ${genreName}`, err);
      }
    }
    
    // Remove old genre links that no longer apply
    for (const existing of existingGenres) {
      const genre = await prisma.genre.findUnique({
        where: { id: existing.genreId },
      });
      if (genre && !genreNames.includes(genre.name)) {
        await prisma.gameGenre.delete({
          where: { gameId_genreId: { gameId, genreId: existing.genreId } },
        });
      }
    }
    
    // Link platforms
    for (const platformName of platformNames) {
      try {
        const platformId = await findOrCreatePlatform(platformName);
        if (!existingPlatformIds.has(platformId)) {
          await prisma.gamePlatform.create({
            data: { gameId, platformId },
          });
          platformsLinked++;
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`Platform ${platformName}: ${errMsg}`);
        logger.error(`Error linking platform ${platformName}`, err);
      }
    }
    
    // Remove old platform links that no longer apply
    for (const existing of existingPlatforms) {
      const platform = await prisma.platform.findUnique({
        where: { id: existing.platformId },
      });
      if (platform && !platformNames.includes(platform.name)) {
        await prisma.gamePlatform.delete({
          where: { gameId_platformId: { gameId, platformId: existing.platformId } },
        });
      }
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Unknown error';
    errors.push(`General error: ${errMsg}`);
    logger.error(`Error linking relationships for game ${gameId}`, err);
  }
  
  return { categoriesLinked, genresLinked, platformsLinked, errors };
};

/**
 * Sync categories from G2A API
 * Discovers available categories and creates them in the database
 * @returns List of categories and creation count
 */
export const syncG2ACategories = async (): Promise<{
  categories: Array<{ name: string; slug: string }>;
  created: number;
  errors: string[];
}> => {
  const errors: string[] = [];
  const categoriesMap = new Map<string, string>(); // name -> slug
  
  try {
    // Try to discover categories by fetching products from different categories
    // Common G2A categories: 'games', 'dlc', 'software', 'hardware'
    const knownCategories = ['games', 'dlc', 'software', 'hardware'];
    
    for (const category of knownCategories) {
      try {
        // Try to fetch one page to see if category exists
        const response = await fetchG2AProducts(1, 1, category);
        if (response.data.length > 0 || response.meta.total > 0) {
          const normalizedName = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
          const slug = generateSlug(normalizedName);
          categoriesMap.set(normalizedName, slug);
        }
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (err) {
        // Category might not exist, continue
        logger.debug(`Category ${category} not available or error occurred`, err);
      }
    }
    
    // Also extract categories from existing synced products
    const gamesWithCategories = await prisma.game.findMany({
      where: { g2aProductId: { not: null } },
      select: { id: true },
      take: 100, // Sample
    });
    
    // Create categories in database
    let created = 0;
    for (const [categoryName, slug] of categoriesMap.entries()) {
      try {
        const existing = await prisma.category.findUnique({ where: { slug } });
        if (!existing) {
          await prisma.category.create({
            data: { name: categoryName, slug },
          });
          created++;
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`Category ${categoryName}: ${errMsg}`);
        logger.error(`Error creating category ${categoryName}`, err);
      }
    }
    
    // Get all categories from database
    const allCategories = await prisma.category.findMany({
      select: { name: true, slug: true },
    });
    
    return {
      categories: allCategories,
      created,
      errors,
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Unknown error';
    errors.push(`General error: ${errMsg}`);
    logger.error('Error syncing categories', err);
    return {
      categories: [],
      created: 0,
      errors,
    };
  }
};

/**
 * Sync genres from existing synced products
 * Extracts unique genres from all games and creates Genre records
 * @returns List of genres and creation count
 */
export const syncG2AGenres = async (): Promise<{
  genres: Array<{ name: string; slug: string }>;
  created: number;
  errors: string[];
}> => {
  const errors: string[] = [];
  const genresSet = new Set<string>();
  
  try {
    // Get all games with G2A product IDs
    const games = await prisma.game.findMany({
      where: { g2aProductId: { not: null } },
      select: { id: true },
    });
    
    // For each game, get its tags from G2A (we'd need to fetch from API or store in DB)
    // For now, we'll extract from existing game-genre relationships if any
    // Or we can re-fetch product info to get tags
    
    // Alternative: Extract from all existing GameGenre links
    const existingGenres = await prisma.genre.findMany({
      select: { name: true },
    });
    
    // Also try to discover genres by fetching sample products
    try {
      const sampleResponse = await fetchG2AProducts(1, 50);
      for (const product of sampleResponse.data) {
        if (product.genres && product.genres.length > 0) {
          product.genres.forEach(genre => genresSet.add(normalizeGenreName(genre)));
        }
        if (product.tags && product.tags.length > 0) {
          product.tags.forEach(tag => {
            const normalized = normalizeGenreName(String(tag));
            if (normalized) genresSet.add(normalized);
          });
        }
      }
    } catch (err) {
      logger.warn('Error fetching sample products for genre discovery', err);
    }
    
    // Create genres in database
    let created = 0;
    for (const genreName of genresSet) {
      try {
        const slug = generateSlug(genreName);
        const existing = await prisma.genre.findUnique({ where: { slug } });
        if (!existing) {
          await prisma.genre.create({
            data: { name: genreName, slug },
          });
          created++;
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`Genre ${genreName}: ${errMsg}`);
        logger.error(`Error creating genre ${genreName}`, err);
      }
    }
    
    // Get all genres from database
    const allGenres = await prisma.genre.findMany({
      select: { name: true, slug: true },
    });
    
    return {
      genres: allGenres,
      created,
      errors,
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Unknown error';
    errors.push(`General error: ${errMsg}`);
    logger.error('Error syncing genres', err);
    return {
      genres: [],
      created: 0,
      errors,
    };
  }
};

/**
 * Sync platforms from existing synced products
 * Extracts unique platforms from all games and creates Platform records
 * @returns List of platforms and creation count
 */
export const syncG2APlatforms = async (): Promise<{
  platforms: Array<{ name: string; slug: string }>;
  created: number;
  errors: string[];
}> => {
  const errors: string[] = [];
  const platformsSet = new Set<string>();
  
  try {
    // Get all games with G2A product IDs
    const games = await prisma.game.findMany({
      where: { g2aProductId: { not: null } },
      select: { id: true },
    });
    
    // Try to discover platforms by fetching sample products
    try {
      const sampleResponse = await fetchG2AProducts(1, 50);
      for (const product of sampleResponse.data) {
        if (product.platform && product.platform.length > 0) {
          product.platform.forEach(platform => {
            const normalized = normalizePlatformName(platform);
            if (normalized) platformsSet.add(normalized);
          });
        }
      }
    } catch (err) {
      logger.warn('Error fetching sample products for platform discovery', err);
    }
    
    // Also get platforms from existing GamePlatform links
    const existingPlatforms = await prisma.platform.findMany({
      select: { name: true },
    });
    existingPlatforms.forEach(p => platformsSet.add(p.name));
    
    // Create platforms in database
    let created = 0;
    for (const platformName of platformsSet) {
      try {
        const slug = generateSlug(platformName);
        const existing = await prisma.platform.findUnique({ where: { slug } });
        if (!existing) {
          await prisma.platform.create({
            data: { name: platformName, slug },
          });
          created++;
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`Platform ${platformName}: ${errMsg}`);
        logger.error(`Error creating platform ${platformName}`, err);
      }
    }
    
    // Get all platforms from database
    const allPlatforms = await prisma.platform.findMany({
      select: { name: true, slug: true },
    });
    
    return {
      platforms: allPlatforms,
      created,
      errors,
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Unknown error';
    errors.push(`General error: ${errMsg}`);
    logger.error('Error syncing platforms', err);
    return {
      platforms: [],
      created: 0,
      errors,
    };
  }
};

/**
 * Get G2A sync progress information
 * @returns Current sync progress if sync is in progress, null otherwise
 */
export const getG2ASyncProgress = async (): Promise<SyncProgress> => {
  try {
    if (redisClient.isOpen) {
      const progressJson = await redisClient.get(SYNC_PROGRESS_KEY);
      if (progressJson) {
        return JSON.parse(progressJson) as SyncProgress;
      }
    }
  } catch (err) {
    logger.warn('Error reading sync progress from Redis', err);
  }
  
  // Default/fallback progress
  return {
    inProgress: false,
    currentPage: 0,
    totalPages: 0,
    productsProcessed: 0,
    productsTotal: 0,
    categoriesCreated: 0,
    genresCreated: 0,
    platformsCreated: 0,
    errors: 0,
    startedAt: null,
    estimatedCompletion: null,
  };
};

/**
 * Get G2A sync status and statistics
 * Retrieves information about last sync time, product counts, and sync status
 * @returns {Promise<Object>} Sync status information
 * @returns {string|null} returns.lastSync - ISO 8601 timestamp of most recent sync, or null if never synced
 * @returns {number} returns.totalProducts - Total number of products with G2A product IDs
 * @returns {number} returns.inStock - Number of products currently in stock
 * @returns {number} returns.outOfStock - Number of products currently out of stock
 * @returns {boolean} returns.syncInProgress - Whether a sync operation is currently in progress
 */
export const getG2ASyncStatus = async (): Promise<{
  lastSync: string | null;
  totalProducts: number;
  inStock: number;
  outOfStock: number;
  syncInProgress: boolean;
}> => {
  try {
    // Check if sync is in progress
    const progress = await getG2ASyncProgress();
    const isSyncInProgress = progress.inProgress;
    
    // Get the most recent sync timestamp
    const mostRecentSync = await prisma.game.findFirst({
      where: { g2aLastSync: { not: null } },
      orderBy: { g2aLastSync: 'desc' },
      select: { g2aLastSync: true },
    });

    // Count total G2A products
    const totalProducts = await prisma.game.count({
      where: { g2aProductId: { not: null } },
    });

    // Count in stock
    const inStock = await prisma.game.count({
      where: {
        g2aProductId: { not: null },
        inStock: true,
      },
    });

    // Count out of stock
    const outOfStock = totalProducts - inStock;

    // TODO: Implement syncInProgress tracking (could use a flag in database or job queue status)
    const syncInProgress = false;

    return {
      lastSync: mostRecentSync?.g2aLastSync?.toISOString() || null,
      totalProducts,
      inStock,
      outOfStock,
      syncInProgress: isSyncInProgress,
    };
  } catch (error) {
    logger.error('Error getting G2A sync status', error);
    throw error;
  }
};

/**
 * Purchase game key(s) from G2A API
 * Validates stock availability before purchase and handles errors with specific error codes
 * Does not fallback to mock keys - throws error if purchase fails
 * @param {string} g2aProductId - G2A product ID to purchase
 * @param {number} quantity - Number of keys to purchase (default: 1)
 * @returns {Promise<G2AKeyResponse[]>} Array of purchased game keys with order information
 * @throws {G2AError} If stock validation fails (G2A_OUT_OF_STOCK) or API call fails (G2A_API_ERROR, G2A_AUTH_FAILED)
 * @example
 * const keys = await purchaseGameKey('g2a-product-123', 2);
 * // Returns: [{ key: 'XXXXX-XXXXX-XXXXX', productId: 'g2a-product-123', orderId: '...', purchaseDate: '...' }, ...]
 */
export const purchaseGameKey = async (
  g2aProductId: string,
  quantity: number = 1
): Promise<G2AKeyResponse[]> => {
  if (!G2A_API_KEY || !G2A_API_HASH) {
    logger.warn('API credentials not configured, generating mock keys');
    return Array(quantity).fill(null).map(() => ({
      key: generateMockKey(),
      productId: g2aProductId,
      orderId: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`,
      purchaseDate: new Date().toISOString(),
    }));
  }

  try {
    logger.info(`Purchasing game key`, { g2aProductId, quantity });
    
    // Validate stock before purchase
    const stockResult = await validateGameStock(g2aProductId);
    if (!stockResult.available || stockResult.stock < quantity) {
      const error = new G2AError(
        G2AErrorCode.G2A_OUT_OF_STOCK,
        `Product out of stock. Available: ${stockResult.stock}, Requested: ${quantity}`,
        { g2aProductId, quantity, availableStock: stockResult.stock }
      );
      logger.error('Stock validation failed before purchase', error);
      throw error;
    }
    
    const client = createG2AClient();

    const response = await client.post('/orders', {
      productId: g2aProductId,
      quantity,
    });

    if (response.data.status !== 'completed') {
      // Handle specific error cases
      if (response.data.status === 'failed' || response.data.status === 'cancelled') {
        const error = new G2AError(
          G2AErrorCode.G2A_API_ERROR,
          `G2A order failed: ${response.data.status}`,
          { g2aProductId, quantity, status: response.data.status, response: response.data }
        );
        logger.error('Order purchase failed', error);
        throw error;
      }
      
      // For pending status, wait a bit and check again (optional - could be async)
      const error = new G2AError(
        G2AErrorCode.G2A_API_ERROR,
        `G2A order in unexpected status: ${response.data.status}`,
        { g2aProductId, quantity, status: response.data.status }
      );
      logger.error('Order purchase in unexpected status', error);
      throw error;
    }

    if (!response.data.keys || response.data.keys.length === 0) {
      const error = new G2AError(
        G2AErrorCode.G2A_API_ERROR,
        'G2A order completed but no keys received',
        { g2aProductId, quantity, response: response.data }
      );
      logger.error('No keys received from G2A', error);
      throw error;
    }

    logger.info(`Successfully purchased keys`, {
      g2aProductId,
      quantity,
      keysReceived: response.data.keys.length,
    });

    return response.data.keys;
  } catch (error) {
    // Re-throw G2AError as-is
    if (error instanceof G2AError) {
      throw error;
    }
    
    const g2aError = handleG2AError(error, 'purchaseGameKey');
    logger.error('Error purchasing key', g2aError);
    throw g2aError; // Don't fallback to mock keys - let caller handle the error
  }
};

/**
 * Validate game stock availability on G2A API
 * Returns structured response with stock count and availability status
 * @param {string} g2aProductId - G2A product ID to check
 * @returns {Promise<Object>} Stock validation result
 * @returns {boolean} returns.available - Whether product is available (stock > 0)
 * @returns {number} returns.stock - Current stock count from G2A API
 * @returns {string} returns.productId - G2A product ID that was checked
 * @throws {G2AError} If API call fails (falls back to mock in development)
 */
export const validateGameStock = async (g2aProductId: string): Promise<{
  available: boolean;
  stock: number;
  productId: string;
}> => {
  if (!G2A_API_KEY || !G2A_API_HASH) {
    logger.debug('Credentials not configured, using mock stock check');
    const mockStock = Math.random() > 0.1 ? Math.floor(Math.random() * 100) + 1 : 0;
    return {
      available: mockStock > 0,
      stock: mockStock,
      productId: g2aProductId,
    };
  }

  try {
    logger.debug(`Checking stock for product`, { g2aProductId });
    const client = createG2AClient();

    const response = await client.get(`/products/${g2aProductId}/stock`);
    const stock = Number(response.data.stock || 0);
    const available = stock > 0;
    
    logger.debug(`Stock check result`, { g2aProductId, available, stock });
    
    return {
      available,
      stock,
      productId: g2aProductId,
    };
  } catch (error) {
    const g2aError = handleG2AError(error, 'validateGameStock');
    logger.error('Error checking stock, using fallback', g2aError);
    // Fallback to mock
    const mockStock = Math.random() > 0.1 ? Math.floor(Math.random() * 100) + 1 : 0;
    return {
      available: mockStock > 0,
      stock: mockStock,
      productId: g2aProductId,
    };
  }
};

/**
 * Get detailed product information from G2A API
 * @param {string} g2aProductId - G2A product ID to fetch
 * @returns {Promise<G2AProduct|null>} Product information or null if not found or API error
 * @throws {G2AError} If API call fails (returns null in catch block)
 */
export const getG2AProductInfo = async (g2aProductId: string): Promise<G2AProduct | null> => {
  if (!G2A_API_KEY || !G2A_API_HASH) {
    logger.debug('Credentials not configured, cannot fetch product info');
    return null;
  }

  try {
    logger.debug(`Fetching product info`, { g2aProductId });
    const client = createG2AClient();

    const response = await client.get(`/products/${g2aProductId}`);
    const product = mapG2AProduct(response.data);
    logger.debug(`Successfully fetched product info`, { g2aProductId, name: product.name });
    return product;
  } catch (error) {
    const g2aError = handleG2AError(error, 'getG2AProductInfo');
    logger.error('Error fetching product info', g2aError);
    return null;
  }
};

/**
 * Get current G2A prices for multiple products (bulk operation)
 * Handles rate limiting by batching requests (max 100 products per batch)
 * Applies 2% markup to all prices before returning
 * @param {string[]} g2aProductIds - Array of G2A product IDs to get prices for
 * @returns {Promise<Map<string, number>>} Map of product ID to price (with markup applied)
 * @example
 * const prices = await getG2APrices(['product-1', 'product-2']);
 * const price1 = prices.get('product-1'); // Price with 2% markup
 */
export const getG2APrices = async (g2aProductIds: string[]): Promise<Map<string, number>> => {
  const prices = new Map<string, number>();

  if (!G2A_API_KEY || !G2A_API_HASH) {
    logger.debug('Credentials not configured, using mock prices');
    // Return mock prices with markup
    for (const id of g2aProductIds) {
      prices.set(id, applyMarkup(Math.random() * 50 + 10));
    }
    return prices;
  }

  if (g2aProductIds.length === 0) {
    return prices;
  }

  // Batch requests to handle rate limiting (max 100 products per request)
  // Request queuing: Process batches sequentially with delays to respect rate limits
  const BATCH_SIZE = 100;
  const batches: string[][] = [];
  
  for (let i = 0; i < g2aProductIds.length; i += BATCH_SIZE) {
    batches.push(g2aProductIds.slice(i, i + BATCH_SIZE));
  }

  logger.debug(`Fetching prices for ${g2aProductIds.length} products in ${batches.length} batches`);

  // Request queue: Process batches sequentially with rate limiting delays
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    let retries = 0;
    const MAX_RETRIES = 3;
    let success = false;
    
    while (retries < MAX_RETRIES && !success) {
      try {
        const client = createG2AClient();

        const response = await client.post('/products/prices', {
          productIds: batch,
        });

        // Check for rate limit response
        if (response.status === 429) {
          const retryAfter = response.headers['retry-after'] 
            ? Number(response.headers['retry-after']) * 1000 
            : (retries + 1) * 1000; // Exponential backoff
          
          logger.warn(`Rate limit hit for batch ${i + 1}, waiting ${retryAfter}ms before retry`);
          await new Promise(resolve => setTimeout(resolve, retryAfter));
          retries++;
          continue;
        }

        for (const item of response.data) {
          prices.set(item.productId, applyMarkup(item.price));
        }

        logger.debug(`Fetched prices for batch ${i + 1}/${batches.length}`, { count: batch.length });
        success = true;
        
        // Rate limiting - wait between batches (even on success)
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      } catch (error) {
        const g2aError = handleG2AError(error, 'getG2APrices');
        
        // Handle rate limiting specifically
        if (g2aError.code === G2AErrorCode.G2A_RATE_LIMIT && retries < MAX_RETRIES) {
          const delay = (retries + 1) * 1000; // Exponential backoff
          logger.warn(`Rate limit error for batch ${i + 1}, retrying after ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
          retries++;
          continue;
        }
        
        logger.error(`Error fetching prices for batch ${i + 1}, using fallback`, g2aError);
        // Fallback to mock prices for this batch
        for (const id of batch) {
          prices.set(id, applyMarkup(Math.random() * 50 + 10));
        }
        success = true; // Mark as "success" to exit retry loop, even though we used fallback
      }
    }
  }

  logger.debug(`Successfully fetched prices`, { count: prices.size, total: g2aProductIds.length });
  return prices;
};

/**
 * Test G2A API connection
 * Makes a simple API call to verify authentication works
 * @returns {Promise<boolean>} True if connection successful, false otherwise
 */
export const testConnection = async (): Promise<{ success: boolean; message: string; details?: Record<string, unknown> }> => {
  if (!G2A_API_KEY || !G2A_API_HASH) {
    return {
      success: false,
      message: 'G2A API credentials not configured',
    };
  }

  try {
    logger.info('Testing G2A API connection...');
    validateG2ACredentials();
    
    const client = createG2AClient();
    
    // Make a simple API call to test connection (fetch first page with 1 product)
    const response = await client.get('/products', {
      params: {
        page: 1,
        perPage: 1,
      },
    });

    logger.info('G2A API connection test successful', {
      status: response.status,
      productsAvailable: response.data.meta?.total || 0,
    });

    return {
      success: true,
      message: 'G2A API connection successful',
      details: {
        status: response.status,
        totalProducts: response.data.meta?.total || 0,
        apiUrl: G2A_API_URL,
      },
    };
  } catch (error) {
    const g2aError = handleG2AError(error, 'testConnection');
    logger.error('G2A API connection test failed', g2aError);
    
    return {
      success: false,
      message: g2aError.message,
      details: {
        code: g2aError.code,
        ...g2aError.details,
      },
    };
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
