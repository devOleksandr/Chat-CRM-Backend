/**
 * Base error class for chat-related errors
 */
export class ChatError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'ChatError';
  }
}

/**
 * Error thrown when a chat is not found
 */
export class ChatNotFoundError extends ChatError {
  constructor(chatId: number) {
    super(`Chat not found: ${chatId}`, 'CHAT_NOT_FOUND');
  }
}

/**
 * Error thrown when a user doesn't have access to a chat
 */
export class ChatAccessDeniedError extends ChatError {
  constructor(userId: number, chatId: number) {
    super(`User ${userId} has no access to chat ${chatId}`, 'CHAT_ACCESS_DENIED');
  }
}

/**
 * Error thrown when a message is not found
 */
export class MessageNotFoundError extends ChatError {
  constructor(messageId: number) {
    super(`Message not found: ${messageId}`, 'MESSAGE_NOT_FOUND');
  }
}

/**
 * Error thrown when a user is sending messages too frequently (spam protection)
 */
export class MessageSpamError extends ChatError {
  constructor(userId: number) {
    super(`User ${userId} is sending messages too frequently`, 'MESSAGE_SPAM');
  }
}

/**
 * Error thrown when WebSocket connection fails
 */
export class WebSocketConnectionError extends ChatError {
  constructor(userId: number) {
    super(`WebSocket connection failed for user ${userId}`, 'WEBSOCKET_CONNECTION_ERROR');
  }
}

/**
 * Error thrown when message content is invalid
 */
export class InvalidMessageContentError extends ChatError {
  constructor(reason: string) {
    super(`Invalid message content: ${reason}`, 'INVALID_MESSAGE_CONTENT');
  }
}

/**
 * Error thrown when trying to send message to inactive chat
 */
export class ChatInactiveError extends ChatError {
  constructor(chatId: number) {
    super(`Cannot send message to inactive chat: ${chatId}`, 'CHAT_INACTIVE');
  }
} 
