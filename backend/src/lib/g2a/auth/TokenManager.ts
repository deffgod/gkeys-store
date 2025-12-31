/**
 * OAuth2 Token Manager for G2A Import API
 * Handles token caching, refresh, and expiration
 */

import { createClient, RedisClientType } from 'redis';
import { G2AError, G2AErrorCode } from '../errors/G2AError.js';
import { G2ALogger } from '../utils/logger.js';

interface OAuth2TokenResponse {
  access_token: string;
  expires_in: number; // seconds
  token_type: string;
}

interface CachedToken {
  token: string;
  expiresAt: number; // timestamp
}

export class TokenManager {
  private redis: RedisClientType | null = null;
  private cacheKeyPrefix = 'g2a:oauth2:token';
  private refreshThresholdMs = 5 * 60 * 1000; // 5 minutes
  private inMemoryCache: CachedToken | null = null;
  
  constructor(
    private logger: G2ALogger,
    private redisUrl?: string
  ) {}
  
  /**
   * Initialize Redis connection
   */
  async initialize(): Promise<void> {
    if (!this.redisUrl) {
      this.logger.warn('Redis URL not provided, using in-memory token cache only');
      return;
    }
    
    try {
      this.redis = createClient({ url: this.redisUrl }) as RedisClientType;
      await this.redis.connect();
      this.logger.info('TokenManager: Redis connected for token caching');
    } catch (error) {
      this.logger.warn('TokenManager: Failed to connect to Redis, falling back to in-memory cache', error);
      this.redis = null;
    }
  }
  
  /**
   * Get cached token key for environment
   */
  private getCacheKey(env: string): string {
    return `${this.cacheKeyPrefix}:${env}`;
  }
  
  /**
   * Get token from cache (Redis or in-memory)
   */
  private async getFromCache(env: string): Promise<CachedToken | null> {
    // Try Redis first
    if (this.redis?.isOpen) {
      try {
        const key = this.getCacheKey(env);
        const cached = await this.redis.get(key);
        if (cached) {
          const parsed = JSON.parse(cached) as CachedToken;
          this.logger.debug('Token retrieved from Redis cache', {
            expiresAt: new Date(parsed.expiresAt).toISOString(),
          });
          return parsed;
        }
      } catch (error) {
        this.logger.warn('Failed to get token from Redis', error);
      }
    }
    
    // Fallback to in-memory cache
    if (this.inMemoryCache) {
      this.logger.debug('Token retrieved from in-memory cache', {
        expiresAt: new Date(this.inMemoryCache.expiresAt).toISOString(),
      });
      return this.inMemoryCache;
    }
    
    return null;
  }
  
  /**
   * Store token in cache (Redis and in-memory)
   */
  private async storeInCache(env: string, token: CachedToken): Promise<void> {
    const ttlSeconds = Math.floor((token.expiresAt - Date.now()) / 1000);
    
    // Store in Redis
    if (this.redis?.isOpen && ttlSeconds > 0) {
      try {
        const key = this.getCacheKey(env);
        await this.redis.setEx(key, ttlSeconds, JSON.stringify(token));
        this.logger.debug('Token stored in Redis cache', { ttlSeconds });
      } catch (error) {
        this.logger.warn('Failed to store token in Redis', error);
      }
    }
    
    // Always store in in-memory cache as backup
    this.inMemoryCache = token;
    this.logger.debug('Token stored in in-memory cache');
  }
  
  /**
   * Check if token needs refresh
   */
  private needsRefresh(cachedToken: CachedToken): boolean {
    const now = Date.now();
    const timeUntilExpiry = cachedToken.expiresAt - now;
    return timeUntilExpiry < this.refreshThresholdMs;
  }
  
  /**
   * Get OAuth2 access token (from cache or fetch new)
   */
  async getToken(
    env: string,
    fetchTokenFn: () => Promise<OAuth2TokenResponse>
  ): Promise<string> {
    // Check cache
    const cached = await this.getFromCache(env);
    
    if (cached && !this.needsRefresh(cached)) {
      const timeUntilExpiry = cached.expiresAt - Date.now();
      this.logger.debug('Using cached OAuth2 token', {
        expiresIn: Math.floor(timeUntilExpiry / 1000),
      });
      return cached.token;
    }
    
    if (cached && this.needsRefresh(cached)) {
      this.logger.info('OAuth2 token expires soon, refreshing', {
        expiresIn: Math.floor((cached.expiresAt - Date.now()) / 1000),
      });
    }
    
    // Fetch new token
    this.logger.info('Fetching new OAuth2 token from G2A API');
    
    try {
      const tokenResponse = await fetchTokenFn();
      
      const newToken: CachedToken = {
        token: tokenResponse.access_token,
        expiresAt: Date.now() + (tokenResponse.expires_in * 1000),
      };
      
      await this.storeInCache(env, newToken);
      
      this.logger.info('OAuth2 token obtained successfully', {
        expiresIn: tokenResponse.expires_in,
        tokenType: tokenResponse.token_type,
      });
      
      return newToken.token;
    } catch (error) {
      this.logger.error('Failed to fetch OAuth2 token', error);
      throw new G2AError(
        G2AErrorCode.G2A_AUTH_FAILED,
        'Failed to obtain OAuth2 token for Import API',
        {
          retryable: true,
          context: { error: error instanceof Error ? error.message : 'Unknown error' },
        }
      );
    }
  }
  
  /**
   * Refresh token (force fetch new token)
   */
  async refreshToken(
    env: string,
    fetchTokenFn: () => Promise<OAuth2TokenResponse>
  ): Promise<string> {
    // Clear cache
    await this.invalidateToken(env);
    
    // Fetch new token
    return this.getToken(env, fetchTokenFn);
  }
  
  /**
   * Invalidate cached token
   */
  async invalidateToken(env: string): Promise<void> {
    // Clear from Redis
    if (this.redis?.isOpen) {
      try {
        const key = this.getCacheKey(env);
        await this.redis.del(key);
        this.logger.info('Token invalidated from Redis cache');
      } catch (error) {
        this.logger.warn('Failed to invalidate token from Redis', error);
      }
    }
    
    // Clear from in-memory cache
    this.inMemoryCache = null;
    this.logger.info('Token invalidated from in-memory cache');
  }
  
  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (this.redis?.isOpen) {
      await this.redis.quit();
      this.logger.info('TokenManager: Redis connection closed');
    }
  }
}
