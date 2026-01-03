/**
 * Shared authentication error handling utilities
 * Provides consistent error message formatting across all authentication forms
 */

/**
 * Extract user-friendly error message from API error
 * @param error - Error object from API call
 * @param defaultMessage - Default message if error cannot be parsed
 * @returns User-friendly error message
 */
export function getAuthErrorMessage(error: unknown, defaultMessage: string = 'An error occurred'): string {
  if (error instanceof Error) {
    const message = error.message;
    
    // Provide more helpful error messages for common HTTP errors
    if (message.includes('HTTP 401') || message.includes('Unauthorized')) {
      return 'Invalid email or password. Please check your credentials and try again.';
    }
    if (message.includes('HTTP 409') || message.includes('already exists')) {
      return 'This email is already registered. Please use a different email or try logging in.';
    }
    if (message.includes('HTTP 400') || message.includes('Validation failed')) {
      return 'Invalid input. Please check your information and try again.';
    }
    if (message.includes('HTTP 500') || message.includes('Internal Server Error')) {
      return 'Server error. Please try again later.';
    }
    if (message.includes('Failed to fetch') || message.includes('NetworkError') || message.includes('Load failed')) {
      return 'Network error. Please check your internet connection and ensure the server is running.';
    }
    if (message.includes('CORS') || message.includes('access control')) {
      return 'CORS error. Please check server configuration or try again later.';
    }
    if (message.includes('Preflight') || message.includes('preflight')) {
      return 'Network error. Please check your connection and try again.';
    }
    
    // Return the error message if it's already user-friendly
    return message;
  }
  
  return defaultMessage;
}

/**
 * Format field-specific validation errors
 * @param errors - Object with field names as keys and error messages as values
 * @returns Formatted error object
 */
export function formatValidationErrors(errors: Record<string, string>): Record<string, string> {
  return errors;
}

/**
 * Get general error message (for non-field-specific errors)
 * @param error - Error object
 * @returns General error message
 */
export function getGeneralErrorMessage(error: unknown): string {
  return getAuthErrorMessage(error, 'An unexpected error occurred. Please try again.');
}
