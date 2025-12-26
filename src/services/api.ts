// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.DEV ? 'http://localhost:3001/api' : '');

interface RequestConfig extends RequestInit {
  params?: Record<string, string>;
  responseType?: 'json' | 'blob' | 'text';
}

// API Client class
class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    // In production, try to auto-detect base URL if not set
    let finalBaseURL = baseURL;
    if (!finalBaseURL && !import.meta.env.DEV) {
      // Auto-detect from current origin
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      if (origin) {
        finalBaseURL = `${origin}/api`;
        console.warn(`⚠️ VITE_API_BASE_URL not set, auto-detected: ${finalBaseURL}`);
        console.warn('⚠️ Please set VITE_API_BASE_URL in Vercel Environment Variables for better performance');
      } else {
        const errorMsg = 'VITE_API_BASE_URL is not set! Please configure it in Vercel Environment Variables.\n' +
          'For production, set VITE_API_BASE_URL=https://your-project.vercel.app/api';
        console.error('❌', errorMsg);
        throw new Error('API base URL is required. Set VITE_API_BASE_URL environment variable.');
      }
    }
    
    if (!finalBaseURL) {
      finalBaseURL = 'http://localhost:3001/api';
      console.warn('⚠️ Using development fallback: http://localhost:3001/api');
    }
    
    this.baseURL = this.normalizeBaseURL(finalBaseURL);
    console.log(`✅ API Client initialized with baseURL: ${this.baseURL}`);
    this.loadToken();
  }

  /**
   * Normalize base URL by ensuring it has a protocol and is valid
   * Automatically adds https:// if protocol is missing (except for localhost)
   */
  private normalizeBaseURL(baseURL: string): string {
    let normalized = baseURL.trim();
    
    // Remove trailing slashes
    normalized = normalized.replace(/\/+$/, '');
    
    // Check if protocol is missing
    if (!normalized.match(/^https?:\/\//)) {
      const original = normalized;
      // For localhost, use http, otherwise https
      if (normalized.includes('localhost') || normalized.includes('127.0.0.1')) {
        normalized = `http://${normalized}`;
      } else {
        normalized = `https://${normalized}`;
      }
      
      // Log warning in development if URL was modified
      if (import.meta.env.DEV) {
        console.warn(
          `⚠️ VITE_API_BASE_URL missing protocol. Auto-corrected:\n` +
          `  Original: "${original}"\n` +
          `  Corrected: "${normalized}"\n` +
          `  Please update VITE_API_BASE_URL to include protocol (https://)`
        );
      }
    }
    
    // Validate URL
    try {
      new URL(normalized);
      return normalized;
    } catch (error) {
      const errorMsg = `Invalid VITE_API_BASE_URL format: "${baseURL}". ` +
        `Expected format: "https://your-domain.com/api" or "http://localhost:3001/api"`;
      console.error('❌', errorMsg);
      throw new Error(errorMsg);
    }
  }

  private loadToken() {
    this.token = localStorage.getItem('gkeys_auth_token');
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('gkeys_auth_token', token);
    } else {
      localStorage.removeItem('gkeys_auth_token');
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  private buildURL(endpoint: string, params?: Record<string, string>): string {
    // Ensure endpoint starts with /
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    // Build full URL
    const url = new URL(normalizedEndpoint, this.baseURL);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const finalURL = url.toString();
    // Log in development only to avoid console spam in production
    if (import.meta.env.DEV) {
      console.log(`🔗 API Request: ${finalURL}`);
    }
    return finalURL;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        // Try to parse JSON error response
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const error = await response.json();
          errorMessage = error.message || error.error?.message || errorMessage;
        } else {
          // If not JSON, try to get text
          const text = await response.text();
          if (text) {
            // Try to parse as JSON if it looks like JSON
            try {
              const parsed = JSON.parse(text);
              errorMessage = parsed.message || parsed.error?.message || errorMessage;
            } catch {
              // Not JSON, use status text
              errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }
          }
        }
      } catch (parseError) {
        // If parsing fails, use default error message
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }

      throw new Error(errorMessage);
    }

    // Parse successful response
    try {
      return await response.json();
    } catch (parseError) {
      throw new Error('Invalid JSON response from server');
    }
  }

  async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    const url = this.buildURL(endpoint, config?.params);
    
    const response = await fetch(url, {
      ...config,
      method: 'GET',
      headers: {
        ...this.getHeaders(),
        ...config?.headers,
      },
    });

    // Handle blob responses
    if (config?.responseType === 'blob') {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.blob() as Promise<T>;
    }

    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    const url = this.buildURL(endpoint, config?.params);
    
    const response = await fetch(url, {
      ...config,
      method: 'POST',
      headers: {
        ...this.getHeaders(),
        ...config?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    const url = this.buildURL(endpoint, config?.params);
    
    const response = await fetch(url, {
      ...config,
      method: 'PUT',
      headers: {
        ...this.getHeaders(),
        ...config?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async patch<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    const url = this.buildURL(endpoint, config?.params);
    
    const response = await fetch(url, {
      ...config,
      method: 'PATCH',
      headers: {
        ...this.getHeaders(),
        ...config?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    const url = this.buildURL(endpoint, config?.params);
    
    const response = await fetch(url, {
      ...config,
      method: 'DELETE',
      headers: {
        ...this.getHeaders(),
        ...config?.headers,
      },
    });

    return this.handleResponse<T>(response);
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient(API_BASE_URL);

export default apiClient;

