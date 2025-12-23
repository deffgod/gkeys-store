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
    if (!baseURL) {
      const errorMsg = 'VITE_API_BASE_URL is not set! Please configure it in Vercel Environment Variables.\n' +
        'For production, set VITE_API_BASE_URL=https://your-project.vercel.app/api';
      console.error('❌', errorMsg);
      // В production выбрасываем ошибку, в dev используем fallback
      if (!import.meta.env.DEV) {
        throw new Error('API base URL is required. Set VITE_API_BASE_URL environment variable.');
      }
      console.warn('⚠️ Using development fallback: http://localhost:3001/api');
    }
    this.baseURL = baseURL || 'http://localhost:3001/api';
    this.loadToken();
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
    const url = new URL(endpoint, this.baseURL);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    return url.toString();
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'An error occurred',
      }));

      throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
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

