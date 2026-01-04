// API Configuration
// Vite loads .env.local with higher priority than .env
// Ensure we handle empty strings correctly
const getEnvApiUrl = (): string => {
  // In development mode, prefer localhost unless explicitly overridden
  if (import.meta.env.DEV) {
    const envUrl = import.meta.env.VITE_API_BASE_URL;
    // If VITE_API_BASE_URL is set and contains localhost, use it
    if (envUrl && (envUrl.includes('localhost') || envUrl.includes('127.0.0.1'))) {
      return envUrl.trim();
    }
    // Otherwise, default to localhost in dev mode
    return 'https://localhost$PORT';
  }
  // In production, use the env variable or fallback to production URL
  return import.meta.env.VITE_API_BASE_URL || 'https://gkeys2.vercel.app/api/';
};

const envApiUrl = getEnvApiUrl();

interface RequestConfig extends RequestInit {
  params?: Record<string, string>;
  responseType?: 'json' | 'blob' | 'text';
}

// API Client class
class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(_baseURL: string) {
    // In development, always use localhost unless explicitly set
    let finalBaseURL = envApiUrl;
    
    // Debug: log the baseURL value
    if (import.meta.env.DEV) {
      console.log('🔍 API Client Debug:', {
        'import.meta.env.DEV': import.meta.env.DEV,
        'import.meta.env.VITE_API_BASE_URL': import.meta.env.VITE_API_BASE_URL,
        'finalBaseURL': finalBaseURL,
      });
    }
    
    // In production, try to auto-detect base URL if not set
    if (!finalBaseURL && !import.meta.env.DEV) {
      // Auto-detect from current origin
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      if (origin) {
        // Always add /api to auto-detected URL
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
    
    // Ensure baseURL always ends with /api for production (not localhost)
    if (finalBaseURL && !finalBaseURL.includes('localhost') && !finalBaseURL.endsWith('/api') && !finalBaseURL.endsWith('/api/')) {
      finalBaseURL = finalBaseURL.replace(/\/+$/, '') + '/api';
      console.warn(`⚠️ VITE_API_BASE_URL missing /api suffix, auto-corrected to: ${finalBaseURL}`);
    }
    
    // Final fallback to localhost in dev (without /api, endpoints will add it)
    if (!finalBaseURL || (import.meta.env.DEV && !finalBaseURL.includes('localhost'))) {
      finalBaseURL = 'https://localhost:3001';
      if (import.meta.env.DEV) {
        console.log('✅ Using development API: https://localhost:3001');
      }
    }
    
    this.baseURL = this.normalizeBaseURL(finalBaseURL);
    console.log(`✅ API Client initialized with baseURL: ${this.baseURL}`);
    this.loadToken();
  }

  /**
   * Normalize base URL by ensuring it has a protocol and is valid
   * Automatically adds https:// if protocol is missing (except for localhost)
   * Automatically adds /api suffix if missing (except for localhost dev)
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
    
    // Ensure /api suffix for production URLs (not localhost)
    const isLocalhost = normalized.includes('localhost') || normalized.includes('127.0.0.1');
    if (!isLocalhost && !normalized.endsWith('/api') && !normalized.endsWith('/api/')) {
      normalized = normalized + '/api';
      if (import.meta.env.DEV) {
        console.warn(
          `⚠️ VITE_API_BASE_URL missing /api suffix. Auto-corrected:\n` +
          `  Corrected: "${normalized}"\n` +
          `  Please update VITE_API_BASE_URL to include /api suffix`
        );
      }
    }
    
    // Validate URL
    try {
      new URL(normalized);
      return normalized;
    } catch {
      const errorMsg = `Invalid VITE_API_BASE_URL format: "${baseURL}". ` +
        `Expected format: "https://your-domain.com/api" or "http://localhost:3001/api"`;
      console.error('❌', errorMsg);
      throw new Error(errorMsg);
    }
  }

  private loadToken() {
    try {
      this.token = localStorage.getItem('gkeys_auth_token');
      if (this.token && import.meta.env.DEV) {
        console.log('✅ Token loaded from localStorage');
      }
    } catch (error) {
      console.warn('⚠️ Failed to load token from localStorage:', error);
      this.token = null;
    }
  }

  public setToken(token: string | null) {
    this.token = token;
    try {
      if (token) {
        localStorage.setItem('gkeys_auth_token', token);
        if (import.meta.env.DEV) {
          console.log('✅ Token saved to localStorage');
        }
      } else {
        localStorage.removeItem('gkeys_auth_token');
        if (import.meta.env.DEV) {
          console.log('✅ Token removed from localStorage');
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to save token to localStorage:', error);
      // Continue even if localStorage fails (e.g., in private browsing mode)
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
    // Remove leading slash from endpoint if present
    let normalizedEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    
    // Use baseURL as-is (it's already normalized in constructor)
    const baseURL = this.baseURL;
    
    // Add /api prefix if baseURL doesn't contain /api (for localhost dev)
    const isLocalhost = baseURL.includes('localhost') || baseURL.includes('127.0.0.1');
    if (isLocalhost && !normalizedEndpoint.startsWith('api/')) {
      normalizedEndpoint = 'api/' + normalizedEndpoint;
    }
    
    // Remove /api prefix from endpoint if baseURL already contains /api (for production)
    // This prevents double /api/api/ in URLs
    if (!isLocalhost && normalizedEndpoint.startsWith('api/')) {
      normalizedEndpoint = normalizedEndpoint.slice(4);
    }
    
    // Ensure baseURL ends with / for proper URL joining
    const baseURLWithSlash = baseURL.endsWith('/') ? baseURL : `${baseURL}/`;
    
    // Build full URL by joining baseURL and endpoint
    const url = new URL(normalizedEndpoint, baseURLWithSlash);
    
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
      
      // Provide helpful messages for common errors
      if (response.status === 405) {
        errorMessage = `Method Not Allowed: The endpoint does not support ${response.url.includes('register') ? 'this HTTP method' : 'the requested HTTP method'}. Please check the API endpoint.`;
      } else if (response.status === 404) {
        errorMessage = `Not Found: The requested endpoint ${response.url} was not found.`;
      } else if (response.status === 500) {
        errorMessage = `Internal Server Error: The server encountered an error. Please try again later.`;
      } else if (response.status === 401) {
        errorMessage = `Unauthorized: Please check your credentials or login again.`;
      } else if (response.status === 403) {
        errorMessage = `Forbidden: You don't have permission to access this resource.`;
      }
      
      try {
        // Try to parse JSON error response
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const error = await response.json();
          const serverMessage = error.message || error.error?.message;
          if (serverMessage) {
            errorMessage = serverMessage;
          }
        } else {
          // If not JSON, try to get text
          const text = await response.text();
          if (text) {
            // Try to parse as JSON if it looks like JSON
            try {
              const parsed = JSON.parse(text);
              const serverMessage = parsed.message || parsed.error?.message;
              if (serverMessage) {
                errorMessage = serverMessage;
              }
            } catch {
              // Not JSON, use status text or keep the helpful message
            }
          }
        }
      } catch (parseError) {
        // If parsing fails, use the helpful error message we set above
      }

      // Log detailed error in development
      if (import.meta.env.DEV) {
        console.error('❌ API Error:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          message: errorMessage,
        });
      }

      throw new Error(errorMessage);
    }

    // Parse successful response
    try {
      return await response.json();
    } catch {
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
export const apiClient = new ApiClient(envApiUrl);

export default apiClient;

