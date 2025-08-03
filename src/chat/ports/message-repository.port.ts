import { Message, User } from '../../prisma/generated/client';

export interface MessageWithSender extends Message {
  sender: User;
}

export interface CreateMessageData {
  chatId: number;
  senderId: number;
  content: string;
  type?: MessageType;
  metadata?: Record<string, any>;
}

export interface MessageFilters {
  chatId?: number;
  senderId?: number;
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
}

export enum MessageType {
  TEXT = 'TEXT',
  EMOJI = 'EMOJI',
  FILE = 'FILE',
  IMAGE = 'IMAGE',
  SYSTEM = 'SYSTEM',
}

/**
 * Abstract port for message repository operations
 * This interface defines the contract for message storage operations
 * following the dependency inversion principle
 */
export abstract class MessageRepositoryPort {
  /**
   * Find messages by chat ID with pagination
   * @param filters - Filtering options including chatId, pagination, and read status
   * @returns Promise<MessageWithSender[]> Array of messages with sender information
   */
  abstract findMessagesByChatId(filters: MessageFilters): Promise<MessageWithSender[]>;

  /**
   * Find a specific message by its ID
   * @param messageId - The unique identifier of the message
   * @returns Promise<MessageWithSender | null> Message with sender or null if not found
   */
  abstract findMessageById(messageId: number): Promise<MessageWithSender | null>;

  /**
   * Create a new message
   * @param data - Message creation data
   * @returns Promise<MessageWithSender> Newly created message with sender
   */
  abstract createMessage(data: CreateMessageData): Promise<MessageWithSender>;

  /**
   * Mark a specific message as read
   * @param messageId - The message ID to mark as read
   * @returns Promise<void>
   */
  abstract markMessageAsRead(messageId: number): Promise<void>;

  /**
   * Mark all messages in a chat as read for a specific user
   * @param chatId - The chat ID
   * @param userId - The user ID who read the messages
   * @returns Promise<void>
   */
  abstract markChatMessagesAsRead(chatId: number, userId: number): Promise<void>;

  /**
   * Get the count of unread messages in a chat for a specific user
   * @param chatId - The chat ID
   * @param userId - The user ID
   * @returns Promise<number> Count of unread messages
   */
  abstract getUnreadCount(chatId: number, userId: number): Promise<number>;

  /**
   * Find recent messages by a user for spam protection
   * @param userId - The user ID
   * @param limit - Maximum number of messages to return
   * @param timeWindowSeconds - Time window in seconds to look back
   * @returns Promise<Message[]> Array of recent messages
   */
  abstract findRecentMessagesByUser(userId: number, limit: number, timeWindowSeconds: number): Promise<Message[]>;

  /**
   * Delete a message (soft delete or hard delete based on implementation)
   * @param messageId - The message ID to delete
   * @returns Promise<void>
   */
  abstract deleteMessage(messageId: number): Promise<void>;

  /**
   * Get the total count of messages in a chat
   * @param chatId - The chat ID
   * @returns Promise<number> Total count of messages
   */
  abstract getMessagesCount(chatId: number): Promise<number>;
} 
