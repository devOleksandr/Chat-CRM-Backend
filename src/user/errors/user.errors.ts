import { HttpException, HttpStatus } from '@nestjs/common';
import { UserErrorContext } from '../interfaces/error-context.interface';

/**
 * User not found error
 */
export class UserNotFoundError extends HttpException {
  constructor(context?: UserErrorContext) {
    const message = context?.userId 
      ? `User with ID ${context.userId} not found`
      : 'User not found';
    
    super(
      {
        message,
        error: 'UserNotFoundError',
        context,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

/**
 * User already exists error
 */
export class UserAlreadyExistsError extends HttpException {
  constructor(context?: UserErrorContext) {
    const message = context?.email 
      ? `User with email ${context.email} already exists`
      : 'User already exists';
    
    super(
      {
        message,
        error: 'UserAlreadyExistsError',
        context,
      },
      HttpStatus.CONFLICT,
    );
  }
}

/**
 * Invalid user data error
 */
export class InvalidUserDataError extends HttpException {
  constructor(message: string, context?: UserErrorContext) {
    super(
      {
        message,
        error: 'InvalidUserDataError',
        context,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * User operation failed error
 */
export class UserOperationFailedError extends HttpException {
  constructor(operation: string, context?: UserErrorContext) {
    super(
      {
        message: `User operation '${operation}' failed`,
        error: 'UserOperationFailedError',
        context: { ...context, operation },
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

/**
 * Invalid current password error
 */
export class InvalidCurrentPasswordError extends HttpException {
  constructor(context?: UserErrorContext) {
    super(
      {
        message: 'Current password is incorrect',
        error: 'InvalidCurrentPasswordError',
        context,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * Password change token expired error
 */
export class PasswordChangeTokenExpiredError extends HttpException {
  constructor(context?: UserErrorContext) {
    super(
      {
        message: 'Password change token has expired',
        error: 'PasswordChangeTokenExpiredError',
        context,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * Password change token invalid error
 */
export class PasswordChangeTokenInvalidError extends HttpException {
  constructor(context?: UserErrorContext) {
    super(
      {
        message: 'Invalid password change token',
        error: 'PasswordChangeTokenInvalidError',
        context,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * Password change rate limit exceeded error
 */
export class PasswordChangeRateLimitExceededError extends HttpException {
  constructor(context?: UserErrorContext) {
    super(
      {
        message: 'Password change rate limit exceeded. Please try again later.',
        error: 'PasswordChangeRateLimitExceededError',
        context,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
} 