import { Injectable } from '@nestjs/common';
import { DefaultUserErrorStrategy } from '../strategies/user-error.strategies';
import { UserErrorContext } from '../interfaces/error-context.interface';

/**
 * Handler for user-related errors
 */
@Injectable()
export class UserErrorHandler {
  constructor(private readonly errorStrategy: DefaultUserErrorStrategy) {}

  /**
   * Handle error with context
   */
  handle(error: Error, context?: UserErrorContext): never {
    return this.errorStrategy.handle(error, context);
  }

  /**
   * Handle error with user ID context
   */
  handleWithUserId(error: Error, userId: number, operation?: string): never {
    return this.handle(error, { userId, operation });
  }

  /**
   * Handle error with email context
   */
  handleWithEmail(error: Error, email: string, operation?: string): never {
    return this.handle(error, { email, operation });
  }
} 