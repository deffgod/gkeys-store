/**
 * Unified Authentication Manager for G2A API
 * Handles both OAuth2 (Import API) and Hash-based (Export API) authentication
 */

import axios from 'axios';
import { TokenManager } from './TokenManager.js';
import { HashAuthenticator, AuthHeaders } from './HashAuthenticator.js';
import { G2ALogger } from '../utils/logger.js';

export type ApiType = 'import' | 'export';

export class AuthManager {
  private tokenManager: TokenManager;
  private hashAuthenticator: HashAuthenticator;
  private isSandbox: boolean;
  
  constructor(
    private apiHash: string,
    private apiKey: string,
    private env: string,
    private baseUrl: string,
    private timeoutMs: number,
    private logger: G2ALogger,
    private email?: string,
    redisUrl?: string
  ) {
    this.isSandbox = baseUrl.includes('sandboxapi.g2a.com');
    this.tokenManager = new TokenManager(logger, redisUrl);
    this.hashAuthenticator = new HashAuthenticator(apiHash, apiKey, logger, email);
  }
  
  /**
   * Initialize authentication manager
   */
  async initialize(): Promise<void> {
    await this.tokenManager.initialize();
    
    // Validate credentials
    const validation = this.hashAuthenticator.validateCredentials();
    if (!validation.valid) {
      this.logger.error('Invalid G2A credentials', { errors: validation.errors });
      throw new Error(`Invalid G2A credentials: ${validation.errors.join(', ')}`);
    }
    
    this.logger.info('AuthManager initialized', {
      env: this.env,
      isSandbox: this.isSandbox,
    });
  }
  
  /**
   * Get authentication headers for a specific API type
   */
  async getAuthHeaders(apiType: ApiType): Promise<AuthHeaders> {
    if (apiType === 'import') {
      // OAuth2 token authentication for Import API
      const token = await this.tokenManager.getToken(this.env, () => this.fetchOAuth2Token());
      return {
        'Authorization': `Bearer ${token}`,
      };
    } else {
      // Hash-based authentication for Export API
      return this.hashAuthenticator.getAuthHeaders(this.isSandbox);
    }
  }
  
  /**
   * Fetch OAuth2 token from G2A API
   */
  private async fetchOAuth2Token(): Promise<{ access_token: string; expires_in: number; token_type: string }> {
    // Use hash-based auth to fetch OAuth2 token
    const authHeaders = this.hashAuthenticator.getAuthHeaders(this.isSandbox);
    
    const tokenClient = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeoutMs,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
    });
    
    this.logger.debug('Fetching OAuth2 token from /token endpoint');
    
    try {
      const response = await tokenClient.get('/token');
      
      if (response.status !== 200) {
        throw new Error(`Token fetch failed with status ${response.status}`);
      }
      
      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch OAuth2 token', error);
      throw error;
    }
  }
  
  /**
   * Refresh OAuth2 token (force fetch new token)
   */
  async refreshOAuth2Token(): Promise<void> {
    this.logger.info('Refreshing OAuth2 token');
    await this.tokenManager.refreshToken(this.env, () => this.fetchOAuth2Token());
  }
  
  /**
   * Invalidate OAuth2 token cache
   */
  async invalidateToken(): Promise<void> {
    this.logger.info('Invalidating OAuth2 token');
    await this.tokenManager.invalidateToken(this.env);
  }
  
  /**
   * Test authentication by fetching a token (Import API) or validating headers (Export API)
   */
  async testAuthentication(apiType: ApiType = 'export'): Promise<boolean> {
    try {
      if (apiType === 'import') {
        // Test by fetching a token
        await this.tokenManager.getToken(this.env, () => this.fetchOAuth2Token());
        this.logger.info('Import API authentication test successful');
        return true;
      } else {
        // Test by validating credentials
        const validation = this.hashAuthenticator.validateCredentials();
        if (!validation.valid) {
          this.logger.error('Export API authentication test failed', { errors: validation.errors });
          return false;
        }
        this.logger.info('Export API authentication test successful');
        return true;
      }
    } catch (error) {
      this.logger.error('Authentication test failed', error);
      return false;
    }
  }
  
  /**
   * Close connections
   */
  async close(): Promise<void> {
    await this.tokenManager.close();
  }
}
