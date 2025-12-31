/**
 * Enhanced G2A Error Classes
 */

export enum G2AErrorCode {
  // Authentication errors
  G2A_AUTH_FAILED = 'G2A_AUTH_FAILED',
  G2A_TOKEN_EXPIRED = 'G2A_TOKEN_EXPIRED',
  G2A_INVALID_CREDENTIALS = 'G2A_INVALID_CREDENTIALS',

  // Resource errors
  G2A_PRODUCT_NOT_FOUND = 'G2A_PRODUCT_NOT_FOUND',
  G2A_ORDER_NOT_FOUND = 'G2A_ORDER_NOT_FOUND',
  G2A_OUT_OF_STOCK = 'G2A_OUT_OF_STOCK',

  // API errors
  G2A_API_ERROR = 'G2A_API_ERROR',
  G2A_RATE_LIMIT = 'G2A_RATE_LIMIT',
  G2A_TIMEOUT = 'G2A_TIMEOUT',
  G2A_INVALID_REQUEST = 'G2A_INVALID_REQUEST',
  G2A_NETWORK_ERROR = 'G2A_NETWORK_ERROR',

  // New error codes
  G2A_CIRCUIT_OPEN = 'G2A_CIRCUIT_OPEN',
  G2A_BATCH_PARTIAL_FAILURE = 'G2A_BATCH_PARTIAL_FAILURE',
  G2A_SYNC_CONFLICT = 'G2A_SYNC_CONFLICT',
  G2A_VALIDATION_ERROR = 'G2A_VALIDATION_ERROR',
  G2A_QUOTA_EXCEEDED = 'G2A_QUOTA_EXCEEDED',
}

export interface G2AErrorMetadata {
  retryable: boolean;
  retryAfter?: number; // milliseconds
  errorCode?: string; // G2A API error code (ORD02, AUTH01, etc.)
  context?: Record<string, unknown>;
  httpStatus?: number;
  endpoint?: string;
  timestamp?: number;
}

export class G2AError extends Error {
  public readonly code: G2AErrorCode;
  public readonly metadata: G2AErrorMetadata;

  constructor(code: G2AErrorCode, message: string, metadata?: Partial<G2AErrorMetadata>) {
    super(message);
    this.name = 'G2AError';
    this.code = code;
    this.metadata = {
      retryable: G2AError.isRetryableError(code),
      timestamp: Date.now(),
      ...metadata,
    };

    Object.setPrototypeOf(this, G2AError.prototype);
  }

  static isRetryableError(code: G2AErrorCode): boolean {
    const retryableErrors = [
      G2AErrorCode.G2A_TIMEOUT,
      G2AErrorCode.G2A_NETWORK_ERROR,
      G2AErrorCode.G2A_RATE_LIMIT,
      G2AErrorCode.G2A_API_ERROR, // Some API errors are retryable
    ];
    return retryableErrors.includes(code);
  }

  isRetryable(): boolean {
    return this.metadata.retryable;
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      metadata: this.metadata,
      stack: this.stack,
    };
  }
}

export class G2ACircuitOpenError extends G2AError {
  constructor(endpoint: string, message: string = 'Circuit breaker is open') {
    super(G2AErrorCode.G2A_CIRCUIT_OPEN, message, {
      retryable: false,
      endpoint,
    });
    this.name = 'G2ACircuitOpenError';
  }
}

export class G2ABatchPartialFailureError extends G2AError {
  constructor(
    successCount: number,
    failureCount: number,
    failures: Array<{ index: number; error: Error }>
  ) {
    super(
      G2AErrorCode.G2A_BATCH_PARTIAL_FAILURE,
      `Batch operation partially failed: ${successCount} succeeded, ${failureCount} failed`,
      {
        retryable: true,
        context: {
          successCount,
          failureCount,
          failures: failures.map((f) => ({
            index: f.index,
            error: f.error.message,
          })),
        },
      }
    );
    this.name = 'G2ABatchPartialFailureError';
  }
}

export class G2ASyncConflictError extends G2AError {
  constructor(resourceId: string, message: string, conflictData?: Record<string, unknown>) {
    super(G2AErrorCode.G2A_SYNC_CONFLICT, message, {
      retryable: false,
      context: {
        resourceId,
        conflictData,
      },
    });
    this.name = 'G2ASyncConflictError';
  }
}

export class G2AValidationError extends G2AError {
  constructor(message: string, field?: string, value?: unknown) {
    super(G2AErrorCode.G2A_VALIDATION_ERROR, message, {
      retryable: false,
      context: {
        field,
        value,
      },
    });
    this.name = 'G2AValidationError';
  }
}

export class G2AQuotaExceededError extends G2AError {
  constructor(endpoint: string, retryAfter?: number) {
    super(G2AErrorCode.G2A_QUOTA_EXCEEDED, `Rate limit quota exceeded for endpoint: ${endpoint}`, {
      retryable: true,
      retryAfter,
      endpoint,
    });
    this.name = 'G2AQuotaExceededError';
  }
}
