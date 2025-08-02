import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import {
  UserNotFoundError,
  UserAlreadyExistsError,
  InvalidUserDataError,
  UserOperationFailedError,
  InvalidCurrentPasswordError,
  PasswordChangeTokenExpiredError,
  PasswordChangeTokenInvalidError,
  PasswordChangeRateLimitExceededError,
} from '../errors/user.errors';

/**
 * Exception filter for user-related errors
 */
@Catch(
  UserNotFoundError,
  UserAlreadyExistsError,
  InvalidUserDataError,
  UserOperationFailedError,
  InvalidCurrentPasswordError,
  PasswordChangeTokenExpiredError,
  PasswordChangeTokenInvalidError,
  PasswordChangeRateLimitExceededError,
)
export class UserExceptionFilter implements ExceptionFilter {
  /**
   * Catch and handle user exceptions
   */
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as any;

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: ctx.getRequest().url,
      message: exceptionResponse.message || exception.message,
      error: exceptionResponse.error || 'UserError',
      ...(exceptionResponse.context && { context: exceptionResponse.context }),
    };

    response.status(status).json(errorResponse);
  }
} 