import { Injectable, Logger } from '@nestjs/common';
import { AuthError } from '../errors/auth.errors';
import { 
  ErrorHandlingStrategy, 
  ErrorContext,
  InvalidCredentialsStrategy,
  InvalidRefreshTokenStrategy,
  InvalidResetTokenStrategy,
  EmailNotFoundStrategy,
  WeakPasswordStrategy,
  EmailAlreadyExistsStrategy,
  InvalidJwtTokenStrategy,
  UnauthenticatedStrategy,
  InsufficientPermissionsStrategy,
  GeneralAuthErrorStrategy,
} from '../strategies/auth-error.strategies';

/**
 * Centralized error handler for authentication module
 * Focuses on business logic: logging, metrics, security monitoring
 * HTTP responses are handled by AuthExceptionFilter
 */
@Injectable()
export class AuthErrorHandler {
  private readonly logger = new Logger(AuthErrorHandler.name);
  private readonly strategies = new Map<string, ErrorHandlingStrategy>();

  constructor(
    // Inject all error handling strategies
    private readonly invalidCredentialsStrategy: InvalidCredentialsStrategy,
    private readonly invalidRefreshTokenStrategy: InvalidRefreshTokenStrategy,
    private readonly invalidResetTokenStrategy: InvalidResetTokenStrategy,
    private readonly emailNotFoundStrategy: EmailNotFoundStrategy,
    private readonly weakPasswordStrategy: WeakPasswordStrategy,
    private readonly emailAlreadyExistsStrategy: EmailAlreadyExistsStrategy,
    private readonly invalidJwtTokenStrategy: InvalidJwtTokenStrategy,
    private readonly unauthenticatedStrategy: UnauthenticatedStrategy,
    private readonly insufficientPermissionsStrategy: InsufficientPermissionsStrategy,
    private readonly generalAuthErrorStrategy: GeneralAuthErrorStrategy,
  ) {
    this.initializeStrategies();
  }

  /**
   * Initialize error handling strategies mapping
   */
  private initializeStrategies(): void {
    this.strategies.set('INVALID_CREDENTIALS', this.invalidCredentialsStrategy);
    this.strategies.set('INVALID_REFRESH_TOKEN', this.invalidRefreshTokenStrategy);
    this.strategies.set('INVALID_RESET_TOKEN', this.invalidResetTokenStrategy);
    this.strategies.set('EMAIL_NOT_FOUND', this.emailNotFoundStrategy);
    this.strategies.set('WEAK_PASSWORD', this.weakPasswordStrategy);
    this.strategies.set('EMAIL_ALREADY_EXISTS', this.emailAlreadyExistsStrategy);
    this.strategies.set('INVALID_JWT_TOKEN', this.invalidJwtTokenStrategy);
    this.strategies.set('UNAUTHENTICATED', this.unauthenticatedStrategy);
    this.strategies.set('INSUFFICIENT_PERMISSIONS', this.insufficientPermissionsStrategy);
    this.strategies.set('GENERAL_AUTH_ERROR', this.generalAuthErrorStrategy);
  }

  /**
   * Handle authentication error with business logic
   * @param error - The authentication error
   * @param context - Error context information
   */
  async handleError(error: AuthError, context: ErrorContext): Promise<void> {
    try {
      this.logger.debug(`Handling auth error: ${error.code}`, {
        errorCode: error.code,
        operation: context.operation,
        context,
      });

      // Get appropriate strategy for this error type
      const strategy = this.strategies.get(error.code) || this.generalAuthErrorStrategy;

      // Execute strategy-specific business logic
      await strategy.handle(error, context);

      // Additional centralized business logic
      await this.handleSecurityMonitoring(error, context);
      await this.handleMetrics(error, context);

    } catch (strategyError) {
      this.logger.error(`Error in error handler strategy: ${strategyError.message}`, strategyError.stack);
    }
  }

  /**
   * Handle security monitoring for suspicious activities
   * @param error - The authentication error
   * @param context - Error context information
   */
  private async handleSecurityMonitoring(error: AuthError, context: ErrorContext): Promise<void> {
    const securityRelevantErrors = [
      'INVALID_CREDENTIALS',
      'INVALID_JWT_TOKEN',
      'INSUFFICIENT_PERMISSIONS',
      'UNAUTHENTICATED',
    ];

    if (securityRelevantErrors.includes(error.code)) {
      this.logger.warn(`Security event detected: ${error.code}`, {
        errorCode: error.code,
        operation: context.operation,
        email: context.email,
        ip: context.ip,
        userAgent: context.userAgent,
        timestamp: context.timestamp,
      });

      // Here you could integrate with security services:
      // await this.securityService.flagSuspiciousActivity(error, context);
      // await this.notificationService.sendSecurityAlert(error, context);
    }
  }

  /**
   * Handle metrics collection for monitoring
   * @param error - The authentication error
   * @param context - Error context information
   */
  private async handleMetrics(error: AuthError, context: ErrorContext): Promise<void> {
    this.logger.debug(`Recording metrics for error: ${error.code}`, {
      errorCode: error.code,
      operation: context.operation,
    });

    // Here you could integrate with metrics services:
    // await this.metricsService.incrementCounter('auth_error', {
    //   error_code: error.code,
    //   operation: context.operation,
    // });
    // 
    // await this.metricsService.recordHistogram('auth_error_duration', {
    //   error_code: error.code,
    //   operation: context.operation,
    // }, Date.now() - context.timestamp.getTime());
  }

  /**
   * Handle invalid credentials error
   * @param error - Invalid credentials error
   * @param context - Error context
   */
  async handleInvalidCredentials(error: AuthError, context: ErrorContext): Promise<void> {
    await this.handleError(error, context);
  }

  /**
   * Handle invalid refresh token error
   * @param error - Invalid refresh token error
   * @param context - Error context
   */
  async handleInvalidRefreshToken(error: AuthError, context: ErrorContext): Promise<void> {
    await this.handleError(error, context);
  }

  /**
   * Handle invalid reset token error
   * @param error - Invalid reset token error
   * @param context - Error context
   */
  async handleInvalidResetToken(error: AuthError, context: ErrorContext): Promise<void> {
    await this.handleError(error, context);
  }

  /**
   * Handle email not found error
   * @param error - Email not found error
   * @param context - Error context
   */
  async handleEmailNotFound(error: AuthError, context: ErrorContext): Promise<void> {
    await this.handleError(error, context);
  }

  /**
   * Handle weak password error
   * @param error - Weak password error
   * @param context - Error context
   */
  async handleWeakPassword(error: AuthError, context: ErrorContext): Promise<void> {
    await this.handleError(error, context);
  }

  /**
   * Handle email already exists error
   * @param error - Email already exists error
   * @param context - Error context
   */
  async handleEmailAlreadyExists(error: AuthError, context: ErrorContext): Promise<void> {
    await this.handleError(error, context);
  }

  /**
   * Handle invalid JWT token error
   * @param error - Invalid JWT token error
   * @param context - Error context
   */
  async handleInvalidJwtToken(error: AuthError, context: ErrorContext): Promise<void> {
    await this.handleError(error, context);
  }

  /**
   * Handle unauthenticated error
   * @param error - Unauthenticated error
   * @param context - Error context
   */
  async handleUnauthenticated(error: AuthError, context: ErrorContext): Promise<void> {
    await this.handleError(error, context);
  }

  /**
   * Handle insufficient permissions error
   * @param error - Insufficient permissions error
   * @param context - Error context
   */
  async handleInsufficientPermissions(error: AuthError, context: ErrorContext): Promise<void> {
    await this.handleError(error, context);
  }

  /**
   * Handle general auth error
   * @param error - General auth error
   * @param context - Error context
   */
  async handleGeneralAuthError(error: AuthError, context: ErrorContext): Promise<void> {
    await this.handleError(error, context);
  }
} 