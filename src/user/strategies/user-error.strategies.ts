import { Injectable } from '@nestjs/common';
import { UserErrorContext } from '../interfaces/error-context.interface';
import {
  UserNotFoundError,
  UserAlreadyExistsError,
  InvalidUserDataError,
  UserOperationFailedError,
} from '../errors/user.errors';

/**
 * Strategy for handling user-related errors
 */
export interface UserErrorStrategy {
  handle(error: Error, context?: UserErrorContext): never;
}

/**
 * Default strategy for handling user errors
 */
@Injectable()
export class DefaultUserErrorStrategy implements UserErrorStrategy {
  /**
   * Handle user-related errors
   */
  handle(error: Error, context?: UserErrorContext): never {
    // If it's already a custom error, re-throw it
    if (error instanceof UserNotFoundError ||
        error instanceof UserAlreadyExistsError ||
        error instanceof InvalidUserDataError ||
        error instanceof UserOperationFailedError) {
      throw error;
    }

    // Handle Prisma errors
    if (error.name === 'PrismaClientKnownRequestError') {
      const prismaError = error as any;
      
      // Handle unique constraint violations
      if (prismaError.code === 'P2002') {
        const field = prismaError.meta?.target?.[0];
        if (field === 'email') {
          throw new UserAlreadyExistsError({ 
            email: context?.email,
            operation: context?.operation 
          });
        }
      }
      
      // Handle record not found
      if (prismaError.code === 'P2025') {
        throw new UserNotFoundError({ 
          userId: context?.userId,
          operation: context?.operation 
        });
      }
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      throw new InvalidUserDataError(error.message, context);
    }

    // Default case - wrap in generic error
    throw new UserOperationFailedError(
      context?.operation || 'unknown',
      context
    );
  }
} 