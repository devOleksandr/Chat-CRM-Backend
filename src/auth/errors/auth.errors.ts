/**
 * Base error class for authentication-related errors
 */
export class AuthError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Error thrown when user credentials are invalid
 */
export class InvalidCredentialsError extends AuthError {
  constructor(email: string) {
    super(`Invalid credentials for email: ${email}`, 'INVALID_CREDENTIALS');
  }
}

/**
 * Error thrown when user is not found
 */
export class UserNotFoundError extends AuthError {
  constructor(email: string) {
    super(`User not found with email: ${email}`, 'USER_NOT_FOUND');
  }
}

/**
 * Error thrown when refresh token is invalid or expired
 */
export class InvalidRefreshTokenError extends AuthError {
  constructor() {
    super('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN');
  }
}

/**
 * Error thrown when password reset token is invalid or expired
 */
export class InvalidResetTokenError extends AuthError {
  constructor() {
    super('Invalid or expired password reset token', 'INVALID_RESET_TOKEN');
  }
}

/**
 * Error thrown when email is not found for password reset
 */
export class EmailNotFoundError extends AuthError {
  constructor(email: string) {
    super(`Email not found: ${email}`, 'EMAIL_NOT_FOUND');
  }
}

/**
 * Error thrown when password is too weak
 */
export class WeakPasswordError extends AuthError {
  constructor() {
    super('Password is too weak. Must be at least 6 characters long', 'WEAK_PASSWORD');
  }
}

/**
 * Error thrown when email is already in use
 */
export class EmailAlreadyExistsError extends AuthError {
  constructor(email: string) {
    super(`Email already exists: ${email}`, 'EMAIL_ALREADY_EXISTS');
  }
}

/**
 * Error thrown when JWT token is invalid
 */
export class InvalidJwtTokenError extends AuthError {
  constructor() {
    super('Invalid JWT token', 'INVALID_JWT_TOKEN');
  }
}

/**
 * Error thrown when user is not authenticated
 */
export class UnauthenticatedError extends AuthError {
  constructor() {
    super('User is not authenticated', 'UNAUTHENTICATED');
  }
}

/**
 * Error thrown when user doesn't have required role
 */
export class InsufficientPermissionsError extends AuthError {
  constructor(requiredRole: string, userRole: string) {
    super(`Insufficient permissions. Required: ${requiredRole}, User has: ${userRole}`, 'INSUFFICIENT_PERMISSIONS');
  }
}

/**
 * Error thrown for general authentication errors
 * Used as fallback for unexpected errors
 */
export class GeneralAuthError extends AuthError {
  constructor(message: string) {
    super(message, 'GENERAL_AUTH_ERROR');
  }
} 