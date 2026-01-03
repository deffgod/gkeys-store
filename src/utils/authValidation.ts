/**
 * Shared authentication validation utilities
 * Used across all authentication forms (LoginPage, LoginSideMenu, RegisterSideMenu)
 * to ensure consistent validation rules and error messages
 */

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validate email address
 * @param email - Email address to validate
 * @returns Error message if invalid, empty string if valid
 */
export function validateEmail(email: string): string {
  if (!email) {
    return 'Email is required';
  }
  if (!/\S+@\S+\.\S+/.test(email)) {
    return 'Invalid email address';
  }
  return '';
}

/**
 * Validate password according to security requirements
 * Minimum 8 characters, must contain uppercase, lowercase, and number
 * @param password - Password to validate
 * @returns Error message if invalid, empty string if valid
 */
export function validatePassword(password: string): string {
  if (!password) {
    return 'Password is required';
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
  }
  return '';
}

/**
 * Validate nickname (optional field)
 * @param nickname - Nickname to validate
 * @returns Error message if invalid, empty string if valid
 */
export function validateNickname(nickname: string): string {
  if (!nickname) {
    return ''; // Nickname is optional
  }
  if (nickname.length < 2) {
    return 'Nickname must be at least 2 characters';
  }
  if (nickname.length > 50) {
    return 'Nickname must be less than 50 characters';
  }
  return '';
}

/**
 * Validate login form data
 * @param email - Email address
 * @param password - Password
 * @returns Validation result with errors
 */
export function validateLoginForm(email: string, password: string): ValidationResult {
  const errors: Record<string, string> = {};
  
  const emailError = validateEmail(email);
  if (emailError) {
    errors.email = emailError;
  }
  
  const passwordError = validatePassword(password);
  if (passwordError) {
    errors.password = passwordError;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate registration form data
 * @param email - Email address
 * @param password - Password
 * @param nickname - Optional nickname
 * @returns Validation result with errors
 */
export function validateRegisterForm(
  email: string,
  password: string,
  nickname?: string
): ValidationResult {
  const errors: Record<string, string> = {};
  
  const emailError = validateEmail(email);
  if (emailError) {
    errors.email = emailError;
  }
  
  const passwordError = validatePassword(password);
  if (passwordError) {
    errors.password = passwordError;
  }
  
  if (nickname) {
    const nicknameError = validateNickname(nickname);
    if (nicknameError) {
      errors.nickname = nicknameError;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
