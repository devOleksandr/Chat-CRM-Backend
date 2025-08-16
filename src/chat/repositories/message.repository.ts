import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MessageRepositoryPort, MessageWithSender, CreateMessageData, MessageFilters, MessageType } from '../ports/message-repository.port';
import { Message } from '../../prisma/generated/client';
import { MessageNotFoundError } from '../errors/chat.errors';

/**
 * Concrete implementation of MessageRepositoryPort using Prisma
 * Handles all database interactions for message operations
 */
@Injectable()
export class MessageRepository extends MessageRepositoryPort {
  private readonly logger = new Logger(MessageRepository.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  /**
   * Find messages by chat ID with pagination
   * @param filters - Filtering options including chatId, pagination, and read status
   * @returns Promise<MessageWithSender[]> Array of messages with sender information
   */
  async findMessagesByChatId(filters: MessageFilters): Promise<MessageWithSender[]> {
    try {
      const { chatId, senderId, limit = 20, offset = 0, unreadOnly = false } = filters;

      const whereCondition: any = {
        chatId,
      };

      if (senderId) {
        whereCondition.senderId = senderId;
      }

      if (unreadOnly) {
        whereCondition.read = false;
      }

      const messages = await this.prisma.message.findMany({
        where: whereCondition,
        include: {
          sender: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              uniqueId: true,
              isOnline: true,
              lastSeen: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      return messages as unknown as MessageWithSender[];
    } catch (error) {
      this.logger.error(`Failed to find messages by chat ID: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find a specific message by its ID
   * @param messageId - The unique identifier of the message
   * @returns Promise<MessageWithSender | null> Message with sender or null if not found
   */
  async findMessageById(messageId: number): Promise<MessageWithSender | null> {
    try {
      const message = await this.prisma.message.findUnique({
        where: { id: messageId },
        include: {
          sender: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              uniqueId: true,
              isOnline: true,
              lastSeen: true,
            },
          },
        },
      });

      return message as unknown as MessageWithSender;
    } catch (error) {
      this.logger.error(`Failed to find message by ID: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create a new message
   * @param data - Message creation data
   * @returns Promise<MessageWithSender> Newly created message with sender
   */
  async createMessage(data: CreateMessageData): Promise<MessageWithSender> {
    try {
      const message = await this.prisma.message.create({
        data: {
          chatId: data.chatId,
          senderId: data.senderId,
          content: data.content,
          type: data.type || MessageType.TEXT,
          metadata: data.metadata,
          read: false,
        },
        include: {
          sender: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              uniqueId: true,
              isOnline: true,
              lastSeen: true,
            },
          },
        },
      });

      this.logger.log(`✅ Created message: ${message.id} in chat ${data.chatId}`);
      return message as unknown as MessageWithSender;
    } catch (error) {
      this.logger.error(`Failed to create message: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Mark a specific message as read
   * @param messageId - The message ID to mark as read
   * @returns Promise<void>
   */
  async markMessageAsRead(messageId: number): Promise<void> {
    try {
      await this.prisma.message.update({
        where: { id: messageId },
        data: {
          read: true,
          readAt: new Date(),
        },
      });

      this.logger.log(`✅ Marked message ${messageId} as read`);
    } catch (error) {
      this.logger.error(`Failed to mark message as read: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Mark all messages in a chat as read for a specific user
   * @param chatId - The chat ID
   * @param userId - The user ID who read the messages
   * @returns Promise<void>
   */
  async markChatMessagesAsRead(chatId: number, userId: number): Promise<void> {
    try {
      await this.prisma.message.updateMany({
        where: {
          chatId,
          senderId: { not: userId },
          read: false,
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      });

      this.logger.log(`✅ Marked all messages in chat ${chatId} as read for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to mark chat messages as read: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get the count of unread messages in a chat for a specific user
   * @param chatId - The chat ID
   * @param userId - The user ID
   * @returns Promise<number> Count of unread messages
   */
  async getUnreadCount(chatId: number, userId: number): Promise<number> {
    try {
      return await this.prisma.message.count({
        where: {
          chatId,
          senderId: { not: userId },
          read: false,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to get unread count: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find recent messages by a user for spam protection
   * @param userId - The user ID
   * @param limit - Maximum number of messages to return
   * @param timeWindowSeconds - Time window in seconds to look back
   * @returns Promise<Message[]> Array of recent messages
   */
  async findRecentMessagesByUser(userId: number, limit: number, timeWindowSeconds: number): Promise<Message[]> {
    try {
      const timeWindow = new Date(Date.now() - timeWindowSeconds * 1000);

      return await this.prisma.message.findMany({
        where: {
          senderId: userId,
          createdAt: {
            gte: timeWindow,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    } catch (error) {
      this.logger.error(`Failed to find recent messages by user: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete a message (soft delete or hard delete based on implementation)
   * @param messageId - The message ID to delete
   * @returns Promise<void>
   */
  async deleteMessage(messageId: number): Promise<void> {
    try {
      await this.prisma.message.delete({
        where: { id: messageId },
      });

      this.logger.log(`✅ Deleted message: ${messageId}`);
    } catch (error) {
      this.logger.error(`Failed to delete message: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get the total count of messages in a chat
   * @param chatId - The chat ID
   * @returns Promise<number> Total count of messages
   */
  async getMessagesCount(chatId: number): Promise<number> {
    try {
      return await this.prisma.message.count({
        where: { chatId },
      });
    } catch (error) {
      this.logger.error(`Failed to get messages count: ${error.message}`, error.stack);
      throw error;
    }
  }
} 
