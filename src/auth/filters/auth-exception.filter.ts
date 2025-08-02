import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthError } from '../errors/auth.errors';

/**
 * Exception filter for handling AuthError exceptions
 * Automatically maps error codes to appropriate HTTP status codes
 * and formats error responses consistently
 */
@Catch(AuthError)
export class AuthExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AuthExceptionFilter.name);

  catch(exception: AuthError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Get appropriate HTTP status code for the error
    const status = this.getHttpStatus(exception);

    // Log the error for debugging
    this.logger.error(
      `Auth error occurred: ${exception.message}`,
      {
        errorCode: exception.code,
        statusCode: status,
        path: request.url,
        method: request.method,
        timestamp: new Date().toISOString(),
      },
      exception.stack,
    );

    // Send formatted error response
    response.status(status).json({
      statusCode: status,
      message: exception.message,
      error: exception.code,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  /**
   * Map AuthError codes to HTTP status codes
   * @param error - The AuthError instance
   * @returns HTTP status code
   */
  private getHttpStatus(error: AuthError): number {
    const statusMap: Record<string, number> = {
      // Authentication errors
      'INVALID_CREDENTIALS': HttpStatus.UNAUTHORIZED,
      'USER_NOT_FOUND': HttpStatus.NOT_FOUND,
      'INVALID_REFRESH_TOKEN': HttpStatus.UNAUTHORIZED,
      'UNAUTHENTICATED': HttpStatus.UNAUTHORIZED,

      // Password errors
      'WEAK_PASSWORD': HttpStatus.BAD_REQUEST,
      'INVALID_RESET_TOKEN': HttpStatus.BAD_REQUEST,

      // Email errors
      'EMAIL_NOT_FOUND': HttpStatus.NOT_FOUND,
      'EMAIL_ALREADY_EXISTS': HttpStatus.CONFLICT,

      // JWT errors
      'INVALID_JWT_TOKEN': HttpStatus.UNAUTHORIZED,
      'INSUFFICIENT_PERMISSIONS': HttpStatus.FORBIDDEN,

      // Default to internal server error for unknown errors
      'GENERAL_AUTH_ERROR': HttpStatus.INTERNAL_SERVER_ERROR,
    };

    return statusMap[error.code] || HttpStatus.INTERNAL_SERVER_ERROR;
  }
} 