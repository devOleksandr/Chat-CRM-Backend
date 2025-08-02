/**
 * Utility functions for password validation and security
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
  score: number;
}

/**
 * Validate password strength and requirements
 * @param password - The password to validate
 * @returns PasswordValidationResult - Validation result with details
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  let score = 0;

  // Check minimum length
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  } else {
    score += 1;
  }

  // Check for uppercase letters
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else {
    score += 1;
  }

  // Check for lowercase letters
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else {
    score += 1;
  }

  // Check for numbers
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  } else {
    score += 1;
  }

  // Check for special characters
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  } else {
    score += 1;
  }

  // Check for common weak passwords
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123',
    'password123', 'admin', 'letmein', 'welcome', 'monkey'
  ];

  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common, please choose a more unique password');
    score = 0;
  }

  // Determine strength based on score
  let strength: 'weak' | 'medium' | 'strong';
  if (score <= 2) {
    strength = 'weak';
  } else if (score <= 4) {
    strength = 'medium';
  } else {
    strength = 'strong';
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
    score,
  };
}

/**
 * Check if password meets minimum requirements
 * @param password - The password to check
 * @returns boolean - True if password meets minimum requirements
 */
export function isPasswordValid(password: string): boolean {
  const result = validatePassword(password);
  return result.isValid;
}

/**
 * Get password strength description
 * @param password - The password to analyze
 * @returns string - Human-readable strength description
 */
export function getPasswordStrengthDescription(password: string): string {
  const result = validatePassword(password);
  
  switch (result.strength) {
    case 'weak':
      return 'Weak password. Please use a stronger password with uppercase, lowercase, numbers, and special characters.';
    case 'medium':
      return 'Medium strength password. Consider adding more complexity for better security.';
    case 'strong':
      return 'Strong password! Good job on creating a secure password.';
    default:
      return 'Password strength unknown.';
  }
}

/**
 * Generate a random secure password
 * @param length - Length of the password (default: 12)
 * @returns string - Generated secure password
 */
export function generateSecurePassword(length: number = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*(),.?":{}|<>';
  
  const allChars = uppercase + lowercase + numbers + special;
  
  let password = '';
  
  // Ensure at least one character from each category
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Fill the rest with random characters
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Check if password has been compromised (basic check)
 * @param password - The password to check
 * @returns boolean - True if password might be compromised
 */
export function isPasswordCompromised(password: string): boolean {
  // This is a basic check - in production, you might want to use a service like HaveIBeenPwned
  const compromisedPatterns = [
    /password/i,
    /123456/,
    /qwerty/i,
    /admin/i,
    /letmein/i,
    /welcome/i,
    /monkey/i,
    /abc123/i,
  ];

  return compromisedPatterns.some(pattern => pattern.test(password));
} 