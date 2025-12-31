/**
 * Map G2A API errors to internal error types
 */

import { AxiosError } from 'axios';
import { G2AError, G2AErrorCode } from './G2AError.js';

interface G2AApiErrorResponse {
  code?: string;
  message?: string;
  errors?: Array<{
    field?: string;
    message?: string;
  }>;
}

export class ErrorMapper {
  static fromAxiosError(error: AxiosError, operation: string): G2AError {
    const status = error.response?.status;
    const data = error.response?.data as G2AApiErrorResponse | undefined;
    const g2aErrorCode = data?.code;
    const message = data?.message || error.message;
    
    // Map G2A API error codes
    if (g2aErrorCode) {
      return ErrorMapper.mapG2AApiErrorCode(g2aErrorCode, message, status, operation);
    }
    
    // Map by HTTP status
    if (status) {
      return ErrorMapper.mapHttpStatus(status, message, operation);
    }
    
    // Network error
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new G2AError(
        G2AErrorCode.G2A_TIMEOUT,
        `Request timeout in ${operation}: ${message}`,
        {
          retryable: true,
          context: { operation, originalError: error.message },
        }
      );
    }
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return new G2AError(
        G2AErrorCode.G2A_NETWORK_ERROR,
        `Network error in ${operation}: ${message}`,
        {
          retryable: true,
          context: { operation, originalError: error.message },
        }
      );
    }
    
    // Generic API error
    return new G2AError(
      G2AErrorCode.G2A_API_ERROR,
      `G2A API error in ${operation}: ${message}`,
      {
        retryable: false,
        context: { operation, originalError: error.message },
      }
    );
  }
  
  private static mapG2AApiErrorCode(code: string, message: string, status?: number, operation?: string): G2AError {
    const errorMap: Record<string, G2AErrorCode> = {
      // Authentication errors
      AUTH01: G2AErrorCode.G2A_AUTH_FAILED,
      AUTH02: G2AErrorCode.G2A_INVALID_CREDENTIALS,
      AUTH03: G2AErrorCode.G2A_AUTH_FAILED,
      AUTH04: G2AErrorCode.G2A_AUTH_FAILED,
      
      // Order errors
      ORD02: G2AErrorCode.G2A_ORDER_NOT_FOUND,
      ORD004: G2AErrorCode.G2A_INVALID_REQUEST,
      ORD03: G2AErrorCode.G2A_INVALID_REQUEST,
      ORD05: G2AErrorCode.G2A_INVALID_REQUEST,
      ORD112: G2AErrorCode.G2A_INVALID_REQUEST,
      ORD114: G2AErrorCode.G2A_INVALID_REQUEST,
      ORD121: G2AErrorCode.G2A_QUOTA_EXCEEDED,
      ORD122: G2AErrorCode.G2A_API_ERROR,
      
      // Rate limiting
      BR03: G2AErrorCode.G2A_RATE_LIMIT,
    };
    
    const mappedCode = errorMap[code] || G2AErrorCode.G2A_API_ERROR;
    
    return new G2AError(mappedCode, message, {
      errorCode: code,
      httpStatus: status,
      context: { operation },
      retryable: mappedCode === G2AErrorCode.G2A_RATE_LIMIT,
    });
  }
  
  private static mapHttpStatus(status: number, message: string, operation?: string): G2AError {
    if (status === 401 || status === 403) {
      return new G2AError(
        G2AErrorCode.G2A_AUTH_FAILED,
        `Authentication failed in ${operation}: ${message}`,
        {
          httpStatus: status,
          retryable: false,
          context: { operation },
        }
      );
    }
    
    if (status === 404) {
      return new G2AError(
        G2AErrorCode.G2A_PRODUCT_NOT_FOUND,
        `Resource not found in ${operation}: ${message}`,
        {
          httpStatus: status,
          retryable: false,
          context: { operation },
        }
      );
    }
    
    if (status === 429) {
      return new G2AError(
        G2AErrorCode.G2A_RATE_LIMIT,
        `Rate limit exceeded in ${operation}: ${message}`,
        {
          httpStatus: status,
          retryable: true,
          retryAfter: 5000, // Default 5 seconds
          context: { operation },
        }
      );
    }
    
    if (status >= 500) {
      return new G2AError(
        G2AErrorCode.G2A_API_ERROR,
        `Server error in ${operation}: ${message}`,
        {
          httpStatus: status,
          retryable: true,
          context: { operation },
        }
      );
    }
    
    if (status >= 400) {
      return new G2AError(
        G2AErrorCode.G2A_INVALID_REQUEST,
        `Invalid request in ${operation}: ${message}`,
        {
          httpStatus: status,
          retryable: false,
          context: { operation },
        }
      );
    }
    
    return new G2AError(
      G2AErrorCode.G2A_API_ERROR,
      `Unexpected error in ${operation}: ${message}`,
      {
        httpStatus: status,
        retryable: false,
        context: { operation },
      }
    );
  }
  
  static fromError(error: unknown, operation: string): G2AError {
    if (error instanceof G2AError) {
      return error;
    }
    
    if (error instanceof Error && 'isAxiosError' in error) {
      return ErrorMapper.fromAxiosError(error as AxiosError, operation);
    }
    
    const message = error instanceof Error ? error.message : String(error);
    return new G2AError(
      G2AErrorCode.G2A_API_ERROR,
      `Unexpected error in ${operation}: ${message}`,
      {
        retryable: false,
        context: { operation, originalError: message },
      }
    );
  }
}
