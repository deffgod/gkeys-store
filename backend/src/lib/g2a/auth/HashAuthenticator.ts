/**
 * Hash-based Authentication for G2A Export API
 * Implements SHA-256 hash generation for API requests
 */

import crypto from 'node:crypto';
import { G2ALogger } from '../utils/logger.js';

export interface AuthHeaders {
  [key: string]: string;
}

export class HashAuthenticator {
  constructor(
    private apiHash: string,
    private apiKey: string,
    private logger: G2ALogger,
    private email?: string
  ) {}
  
  /**
   * Generate authentication hash for Export API
   * Formula: SHA256(apiHash + apiKey + timestamp)
   */
  private generateHash(timestamp: string): string {
    const input = this.apiHash + this.apiKey + timestamp;
    return crypto.createHash('sha256').update(input).digest('hex');
  }
  
  /**
   * Generate authentication headers for Export API (production)
   * Uses Authorization header with format: "ClientId, ApiKey"
   * where ApiKey = SHA256(ClientId + Email + ClientSecret)
   */
  getExportApiHeaders(): AuthHeaders {
    if (!this.email) {
      this.logger.warn('Email not provided for Export API production auth, using default');
    }
    
    // Generate Export API key
    const exportApiKey = HashAuthenticator.generateExportApiKey(
      this.apiKey,
      this.email || 'Welcome@nalytoo.com',
      this.apiHash
    );
    
    this.logger.debug('Generated Export API auth headers (Authorization)', {
      clientId: this.apiKey.substring(0, 8) + '...',
      exportApiKeyLength: exportApiKey.length,
    });
    
    return {
      'Authorization': `${this.apiKey}, ${exportApiKey}`,
    };
  }
  
  /**
   * Generate authentication headers for sandbox environment
   * Sandbox uses simplified Authorization header
   * Format: "ClientId, ApiKey" (not "ApiHash, ClientId")
   */
  getSandboxAuthHeaders(): AuthHeaders {
    this.logger.debug('Generated sandbox auth headers');
    
    // For sandbox: Authorization: "ClientId, ApiKey"
    // Where apiKey is the Client ID and apiHash is the API Key
    return {
      'Authorization': `${this.apiKey}, ${this.apiHash}`,
    };
  }
  
  /**
   * Generate authentication headers based on environment
   */
  getAuthHeaders(isSandbox: boolean): AuthHeaders {
    return isSandbox ? this.getSandboxAuthHeaders() : this.getExportApiHeaders();
  }
  
  /**
   * Generate Export API key for initial authentication
   * Formula: SHA256(ClientId + Email + ClientSecret)
   * This is typically done once during setup
   */
  static generateExportApiKey(clientId: string, email: string, clientSecret: string): string {
    const input = clientId + email + clientSecret;
    return crypto.createHash('sha256').update(input).digest('hex');
  }
  
  /**
   * Validate authentication credentials
   */
  validateCredentials(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!this.apiHash || this.apiHash.length === 0) {
      errors.push('API Hash is required');
    }
    
    if (!this.apiKey || this.apiKey.length === 0) {
      errors.push('API Key is required');
    }
    
    if (this.apiHash.length < 8) {
      errors.push('API Hash is too short (minimum 8 characters)');
    }
    
    if (this.apiKey.length < 8) {
      errors.push('API Key is too short (minimum 8 characters)');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
