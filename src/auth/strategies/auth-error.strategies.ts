import { Injectable, Logger } from '@nestjs/common';
import { AuthError, InvalidCredentialsError, InvalidRefreshTokenError, InvalidResetTokenError, EmailNotFoundError, WeakPasswordError, EmailAlreadyExistsError, InvalidJwtTokenError, UnauthenticatedError, InsufficientPermissionsError } from '../errors/auth.errors';

export interface ErrorContext {
  operation: string;
  userId?: string;
  email?: string;
  timestamp: Date;
  ip?: string;
  userAgent?: string;
}

export abstract class ErrorHandlingStrategy {
  abstract handle(error: AuthError, context: ErrorContext): Promise<void>;
}

/**
 * Strategy for handling invalid credentials errors
 * Logs the attempt and tracks failed login attempts
 */
@Injectable()
export class InvalidCredentialsStrategy extends ErrorHandlingStrategy {
  private readonly logger = new Logger(InvalidCredentialsStrategy.name);

  async handle(error: InvalidCredentialsError, context: ErrorContext): Promise<void> {
    this.logger.warn(`Invalid credentials attempt: ${error.message}`, {
      error: error.message,
      context,
      email: context.email,
    });

    // Here you could add metrics tracking
    // this.metricsService.incrementCounter('invalid_credentials_attempt', {
    //   email: context.email,
    //   operation: context.operation,
    // });
  }
}

/**
 * Strategy for handling invalid refresh token errors
 * Logs the attempt and tracks token refresh failures
 */
@Injectable()
export class InvalidRefreshTokenStrategy extends ErrorHandlingStrategy {
  private readonly logger = new Logger(InvalidRefreshTokenStrategy.name);

  async handle(error: InvalidRefreshTokenError, context: ErrorContext): Promise<void> {
    this.logger.warn(`Invalid refresh token attempt: ${error.message}`, {
      error: error.message,
      context,
      userId: context.userId,
    });

    // Here you could add security monitoring
    // this.securityService.flagSuspiciousActivity({
    //   type: 'INVALID_REFRESH_TOKEN',
    //   userId: context.userId,
    //   context,
    // });
  }
}

/**
 * Strategy for handling invalid reset token errors
 * Logs the attempt and tracks password reset failures
 */
@Injectable()
export class InvalidResetTokenStrategy extends ErrorHandlingStrategy {
  private readonly logger = new Logger(InvalidResetTokenStrategy.name);

  async handle(error: InvalidResetTokenError, context: ErrorContext): Promise<void> {
    this.logger.warn(`Invalid reset token attempt: ${error.message}`, {
      error: error.message,
      context,
    });

    // Here you could add security monitoring
    // this.securityService.flagSuspiciousActivity({
    //   type: 'INVALID_RESET_TOKEN',
    //   context,
    // });
  }
}

/**
 * Strategy for handling email not found errors
 * Logs the attempt for password reset requests
 */
@Injectable()
export class EmailNotFoundStrategy extends ErrorHandlingStrategy {
  private readonly logger = new Logger(EmailNotFoundStrategy.name);

  async handle(error: EmailNotFoundError, context: ErrorContext): Promise<void> {
    this.logger.log(`Password reset requested for non-existent email: ${error.message}`, {
      error: error.message,
      context,
      email: context.email,
    });

    // Here you could add metrics tracking
    // this.metricsService.incrementCounter('password_reset_requested', {
    //   email_exists: false,
    //   email: context.email,
    // });
  }
}

/**
 * Strategy for handling weak password errors
 * Logs the attempt and provides feedback
 */
@Injectable()
export class WeakPasswordStrategy extends ErrorHandlingStrategy {
  private readonly logger = new Logger(WeakPasswordStrategy.name);

  async handle(error: WeakPasswordError, context: ErrorContext): Promise<void> {
    this.logger.log(`Weak password attempt: ${error.message}`, {
      error: error.message,
      context,
      userId: context.userId,
    });

    // Here you could add user education
    // this.notificationService.sendPasswordStrengthNotification({
    //   userId: context.userId,
    //   message: 'Please use a stronger password with at least 8 characters',
    // });
  }
}

/**
 * Strategy for handling email already exists errors
 * Logs the attempt during registration
 */
@Injectable()
export class EmailAlreadyExistsStrategy extends ErrorHandlingStrategy {
  private readonly logger = new Logger(EmailAlreadyExistsStrategy.name);

  async handle(error: EmailAlreadyExistsError, context: ErrorContext): Promise<void> {
    this.logger.log(`Registration attempt with existing email: ${error.message}`, {
      error: error.message,
      context,
      email: context.email,
    });

    // Here you could add metrics tracking
    // this.metricsService.incrementCounter('registration_attempt_existing_email', {
    //   email: context.email,
    // });
  }
}

/**
 * Strategy for handling invalid JWT token errors
 * Logs the attempt and tracks authentication failures
 */
@Injectable()
export class InvalidJwtTokenStrategy extends ErrorHandlingStrategy {
  private readonly logger = new Logger(InvalidJwtTokenStrategy.name);

  async handle(error: InvalidJwtTokenError, context: ErrorContext): Promise<void> {
    this.logger.warn(`Invalid JWT token attempt: ${error.message}`, {
      error: error.message,
      context,
    });

    // Here you could add security monitoring
    // this.securityService.flagSuspiciousActivity({
    //   type: 'INVALID_JWT_TOKEN',
    //   context,
    // });
  }
}

/**
 * Strategy for handling unauthenticated errors
 * Logs the attempt when user tries to access protected resources
 */
@Injectable()
export class UnauthenticatedStrategy extends ErrorHandlingStrategy {
  private readonly logger = new Logger(UnauthenticatedStrategy.name);

  async handle(error: UnauthenticatedError, context: ErrorContext): Promise<void> {
    this.logger.warn(`Unauthenticated access attempt: ${error.message}`, {
      error: error.message,
      context,
    });

    // Here you could add security monitoring
    // this.securityService.flagSuspiciousActivity({
    //   type: 'UNAUTHENTICATED_ACCESS',
    //   context,
    // });
  }
}

/**
 * Strategy for handling insufficient permissions errors
 * Logs the attempt when user tries to access restricted resources
 */
@Injectable()
export class InsufficientPermissionsStrategy extends ErrorHandlingStrategy {
  private readonly logger = new Logger(InsufficientPermissionsStrategy.name);

  async handle(error: InsufficientPermissionsError, context: ErrorContext): Promise<void> {
    this.logger.warn(`Insufficient permissions attempt: ${error.message}`, {
      error: error.message,
      context,
      userId: context.userId,
    });

    // Here you could add security monitoring
    // this.securityService.flagSuspiciousActivity({
    //   type: 'INSUFFICIENT_PERMISSIONS',
    //   userId: context.userId,
    //   context,
    // });
  }
}

/**
 * Strategy for handling general auth errors
 * Logs the error and provides fallback handling
 */
@Injectable()
export class GeneralAuthErrorStrategy extends ErrorHandlingStrategy {
  private readonly logger = new Logger(GeneralAuthErrorStrategy.name);

  async handle(error: AuthError, context: ErrorContext): Promise<void> {
    this.logger.error(`General auth error: ${error.message}`, {
      error: error.message,
      errorCode: error.code,
      context,
      userId: context.userId,
      email: context.email,
    });

    // Here you could add general error tracking
    // this.metricsService.incrementCounter('auth_error', {
    //   error_code: error.code,
    //   operation: context.operation,
    // });
  }
} 