import { Injectable, Logger } from '@nestjs/common';
import { ChatError, ChatAccessDeniedError, MessageSpamError, WebSocketConnectionError } from '../errors/chat.errors';

export interface ErrorContext {
  operation: string;
  userId?: string;
  chatId?: string;
  messageId?: string;
  socketId?: string;
  projectId?: string;
  adminId?: string;
  participantId?: string;
  timestamp: Date;
}

export abstract class ErrorHandlingStrategy {
  abstract handle(error: ChatError, context: ErrorContext): Promise<void>;
}

/**
 * Strategy for handling chat access denied errors
 * Logs the attempt and tracks metrics for security monitoring
 */
@Injectable()
export class ChatAccessDeniedStrategy extends ErrorHandlingStrategy {
  private readonly logger = new Logger(ChatAccessDeniedStrategy.name);

  async handle(error: ChatAccessDeniedError, context: ErrorContext): Promise<void> {
    this.logger.warn(`Chat access denied: ${error.message}`, {
      error: error.message,
      context,
      userId: context.userId,
      chatId: context.chatId,
    });

    // Here you could add metrics tracking
    // this.metricsService.incrementCounter('chat_access_denied', {
    //   userId: context.userId,
    //   chatId: context.chatId,
    //   operation: context.operation,
    // });
  }
}

/**
 * Strategy for handling message spam errors
 * Logs the spam attempt and applies timeout instead of blocking
 */
@Injectable()
export class MessageSpamStrategy extends ErrorHandlingStrategy {
  private readonly logger = new Logger(MessageSpamStrategy.name);
  private readonly spamTimeouts = new Map<string, Date>();

  async handle(error: MessageSpamError, context: ErrorContext): Promise<void> {
    const userId = context.userId;
    const timeoutKey = `spam_timeout_${userId}`;
    const timeoutDuration = 20 * 1000; // 20 seconds in milliseconds

    // Check if user is already in timeout
    const existingTimeout = this.spamTimeouts.get(timeoutKey);
    if (existingTimeout && existingTimeout > new Date()) {
      const remainingTime = Math.ceil((existingTimeout.getTime() - Date.now()) / 1000);
      this.logger.warn(`User ${userId} is still in spam timeout for ${remainingTime} more seconds`, {
        error: error.message,
        context,
        userId,
        remainingTime,
      });
      return;
    }

    // Set new timeout
    const timeoutExpiry = new Date(Date.now() + timeoutDuration);
    this.spamTimeouts.set(timeoutKey, timeoutExpiry);

    this.logger.warn(`Message spam detected: ${error.message}. User ${userId} timed out for 20 seconds`, {
      error: error.message,
      context,
      userId,
      socketId: context.socketId,
      timeoutExpiry,
    });

    // Clean up expired timeouts periodically
    this.cleanupExpiredTimeouts();

    // Here you could add admin notifications
    // await this.notificationService.notifyAdmins({
    //   type: 'MESSAGE_SPAM_DETECTED',
    //   message: `User ${userId} is sending messages too frequently and has been timed out for 20 seconds`,
    //   severity: 'LOW',
    //   context,
    // });
  }

  /**
   * Check if user is currently in spam timeout
   * @param userId - The user ID to check
   * @returns boolean - True if user is in timeout
   */
  isUserInTimeout(userId: string): boolean {
    const timeoutKey = `spam_timeout_${userId}`;
    const timeout = this.spamTimeouts.get(timeoutKey);
    return timeout ? timeout > new Date() : false;
  }

  /**
   * Get remaining timeout time for a user
   * @param userId - The user ID to check
   * @returns number - Remaining timeout time in seconds, 0 if not in timeout
   */
  getRemainingTimeout(userId: string): number {
    const timeoutKey = `spam_timeout_${userId}`;
    const timeout = this.spamTimeouts.get(timeoutKey);
    
    if (!timeout || timeout <= new Date()) {
      return 0;
    }
    
    return Math.ceil((timeout.getTime() - Date.now()) / 1000);
  }

  /**
   * Clean up expired timeouts to prevent memory leaks
   * @private
   */
  private cleanupExpiredTimeouts(): void {
    const now = new Date();
    for (const [key, timeout] of this.spamTimeouts.entries()) {
      if (timeout <= now) {
        this.spamTimeouts.delete(key);
      }
    }
  }
}

/**
 * Strategy for handling WebSocket connection errors
 * Logs connection issues and tracks connection metrics
 */
@Injectable()
export class WebSocketConnectionStrategy extends ErrorHandlingStrategy {
  private readonly logger = new Logger(WebSocketConnectionStrategy.name);

  async handle(error: WebSocketConnectionError, context: ErrorContext): Promise<void> {
    this.logger.error(`WebSocket connection error: ${error.message}`, {
      error: error.message,
      context,
      socketId: context.socketId,
      userId: context.userId,
    });

    // Here you could add connection metrics tracking
    // this.metricsService.incrementCounter('websocket_connection_errors', {
    //   socketId: context.socketId,
    //   userId: context.userId,
    //   operation: context.operation,
    // });
  }
}

/**
 * General strategy for handling unknown chat errors
 * Provides fallback error handling for unhandled error types
 */
@Injectable()
export class GeneralChatErrorStrategy extends ErrorHandlingStrategy {
  private readonly logger = new Logger(GeneralChatErrorStrategy.name);

  async handle(error: ChatError, context: ErrorContext): Promise<void> {
    this.logger.error(`Unhandled chat error: ${error.message}`, {
      error: error.message,
      errorCode: error.code,
      context,
      userId: context.userId,
      chatId: context.chatId,
    });

    // Here you could add general error metrics tracking
    // this.metricsService.incrementCounter('chat_errors', {
    //   errorCode: error.code,
    //   operation: context.operation,
    // });
  }
} 
