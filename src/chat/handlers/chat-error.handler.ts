import { Injectable, Logger } from '@nestjs/common';
import { ChatError, ChatAccessDeniedError, MessageSpamError, WebSocketConnectionError } from '../errors/chat.errors';
import { ErrorContext, ErrorHandlingStrategy } from '../strategies/chat-error.strategies';
import { ChatAccessDeniedStrategy } from '../strategies/chat-error.strategies';
import { MessageSpamStrategy } from '../strategies/chat-error.strategies';
import { WebSocketConnectionStrategy } from '../strategies/chat-error.strategies';
import { GeneralChatErrorStrategy } from '../strategies/chat-error.strategies';

/**
 * Centralized error handler for chat module
 * Routes different error types to appropriate handling strategies
 */
@Injectable()
export class ChatErrorHandler {
  private readonly logger = new Logger(ChatErrorHandler.name);
  private readonly strategies = new Map<string, ErrorHandlingStrategy>();

  constructor(
    private readonly chatAccessDeniedStrategy: ChatAccessDeniedStrategy,
    private readonly messageSpamStrategy: MessageSpamStrategy,
    private readonly webSocketConnectionStrategy: WebSocketConnectionStrategy,
    private readonly generalChatErrorStrategy: GeneralChatErrorStrategy,
  ) {
    this.initializeStrategies();
  }

  /**
   * Initialize error handling strategies mapping
   */
  private initializeStrategies(): void {
    this.strategies.set('CHAT_ACCESS_DENIED', this.chatAccessDeniedStrategy);
    this.strategies.set('MESSAGE_SPAM', this.messageSpamStrategy);
    this.strategies.set('WEBSOCKET_CONNECTION_ERROR', this.webSocketConnectionStrategy);
  }

  /**
   * Handle chat-related errors using appropriate strategy
   * @param error - The error to handle
   * @param context - Error context information
   */
  async handleError(error: ChatError, context: ErrorContext): Promise<void> {
    try {
      const strategy = this.strategies.get(error.code);
      
      if (strategy) {
        await strategy.handle(error, context);
      } else {
        // Fallback to general error strategy for unknown error types
        await this.generalChatErrorStrategy.handle(error, context);
      }
    } catch (handlerError) {
      // Log error in the error handler itself
      this.logger.error('Error in chat error handler', {
        originalError: error.message,
        originalErrorCode: error.code,
        handlerError: handlerError.message,
        context,
      });
    }
  }

  /**
   * Handle specific error types with type safety
   * @param error - The specific error type
   * @param context - Error context information
   */
  async handleChatAccessDeniedError(error: ChatAccessDeniedError, context: ErrorContext): Promise<void> {
    await this.chatAccessDeniedStrategy.handle(error, context);
  }

  async handleMessageSpamError(error: MessageSpamError, context: ErrorContext): Promise<void> {
    await this.messageSpamStrategy.handle(error, context);
  }

  async handleWebSocketConnectionError(error: WebSocketConnectionError, context: ErrorContext): Promise<void> {
    await this.webSocketConnectionStrategy.handle(error, context);
  }
} 
