/**
 * Request validation utilities for G2A Integration Client
 */

export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public value?: unknown
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const validateRequired = <T>(value: T | undefined | null, fieldName: string): T => {
  if (value === undefined || value === null || value === '') {
    throw new ValidationError(`${fieldName} is required`, fieldName, value);
  }
  return value;
};

export const validateString = (
  value: unknown,
  fieldName: string,
  minLength?: number,
  maxLength?: number
): string => {
  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} must be a string`, fieldName, value);
  }

  if (minLength !== undefined && value.length < minLength) {
    throw new ValidationError(
      `${fieldName} must be at least ${minLength} characters`,
      fieldName,
      value
    );
  }

  if (maxLength !== undefined && value.length > maxLength) {
    throw new ValidationError(
      `${fieldName} must be at most ${maxLength} characters`,
      fieldName,
      value
    );
  }

  return value;
};

export const validateNumber = (
  value: unknown,
  fieldName: string,
  min?: number,
  max?: number
): number => {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new ValidationError(`${fieldName} must be a number`, fieldName, value);
  }

  if (min !== undefined && value < min) {
    throw new ValidationError(`${fieldName} must be at least ${min}`, fieldName, value);
  }

  if (max !== undefined && value > max) {
    throw new ValidationError(`${fieldName} must be at most ${max}`, fieldName, value);
  }

  return value;
};

export const validateEnum = <T extends string>(
  value: unknown,
  fieldName: string,
  allowedValues: T[]
): T => {
  if (typeof value !== 'string' || !allowedValues.includes(value as T)) {
    throw new ValidationError(
      `${fieldName} must be one of: ${allowedValues.join(', ')}`,
      fieldName,
      value
    );
  }
  return value as T;
};

export const validateArray = <T>(
  value: unknown,
  fieldName: string,
  itemValidator?: (item: unknown) => T
): T[] => {
  if (!Array.isArray(value)) {
    throw new ValidationError(`${fieldName} must be an array`, fieldName, value);
  }

  if (itemValidator) {
    return value.map((item, index) => {
      try {
        return itemValidator(item);
      } catch (error) {
        throw new ValidationError(
          `${fieldName}[${index}] validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          `${fieldName}[${index}]`,
          item
        );
      }
    });
  }

  return value as T[];
};

export const validateUrl = (value: unknown, fieldName: string): string => {
  const url = validateString(value, fieldName);

  try {
    new URL(url);
    return url;
  } catch {
    throw new ValidationError(`${fieldName} must be a valid URL`, fieldName, value);
  }
};

export const validateEmail = (value: unknown, fieldName: string): string => {
  const email = validateString(value, fieldName);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    throw new ValidationError(`${fieldName} must be a valid email address`, fieldName, value);
  }

  return email;
};

/**
 * Normalize G2A API URL
 * Ensures the URL ends with /v1 for Export API or /integration-api/v1 for Import API
 */
export const normalizeG2AUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);

    // Remove trailing slash
    let pathname = urlObj.pathname.replace(/\/$/, '');

    // If pathname is empty or doesn't end with /v1, add it
    if (!pathname.endsWith('/v1') && !pathname.endsWith('/integration-api/v1')) {
      // Check if it's an Import API URL (contains 'integration-api')
      if (url.includes('integration-api')) {
        pathname = pathname.endsWith('/integration-api')
          ? `${pathname}/v1`
          : `${pathname}/integration-api/v1`;
      } else {
        // Export API - add /v1
        pathname = pathname ? `${pathname}/v1` : '/v1';
      }
    }

    urlObj.pathname = pathname;
    return urlObj.toString();
  } catch {
    // If URL parsing fails, return as-is (will be caught by validateUrl later)
    return url;
  }
};
