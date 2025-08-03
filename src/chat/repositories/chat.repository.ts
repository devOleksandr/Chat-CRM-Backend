import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { 
  ChatRepositoryPort, 
  ChatWithParticipants, 
  ChatWithLastMessage, 
  CreateChatData, 
  ChatFilters, 
  ProjectChatFilters 
} from '../ports/chat-repository.port';
import { ChatNotFoundError } from '../errors/chat.errors';

/**
 * Concrete implementation of ChatRepositoryPort using Prisma
 * Handles all database interactions for chat-related operations
 */
@Injectable()
export class ChatRepository extends ChatRepositoryPort {
  private readonly logger = new Logger(ChatRepository.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  /**
   * Find all chats for a specific user (as admin or participant)
   * @param filters - Filtering options including userId, projectId, pagination, and active status
   * @returns Promise<ChatWithLastMessage[]> Array of chats with last message
   */
  async findChatsForUser(filters: ChatFilters): Promise<ChatWithLastMessage[]> {
    try {
      const { userId, projectId, limit = 20, offset = 0, isActive = true } = filters;

      const whereCondition: any = {
        OR: [
          { adminId: userId },
          { participantId: userId },
        ],
        isActive,
      };

      if (projectId) {
        whereCondition.projectId = projectId;
      }

      const chats = await this.prisma.chat.findMany({
        where: whereCondition,
        include: {
          admin: {
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
          participant: {
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
          project: {
            select: {
              id: true,
              name: true,
              uniqueId: true,
            },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              content: true,
              createdAt: true,
              senderId: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: offset,
      });

      return chats as unknown as ChatWithLastMessage[];
    } catch (error) {
      this.logger.error(`Failed to find chats for user: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find all chats for a specific project
   * @param filters - Filtering options including projectId, adminId, participantId, pagination
   * @returns Promise<ChatWithLastMessage[]> Array of chats with last message
   */
  async findChatsForProject(filters: ProjectChatFilters): Promise<ChatWithLastMessage[]> {
    try {
      const { projectId, adminId, participantId, limit = 20, offset = 0, isActive = true } = filters;

      const whereCondition: any = {
        projectId,
        isActive,
      };

      if (adminId) {
        whereCondition.adminId = adminId;
      }

      if (participantId) {
        whereCondition.participantId = participantId;
      }

      const chats = await this.prisma.chat.findMany({
        where: whereCondition,
        include: {
          admin: {
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
          participant: {
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
          project: {
            select: {
              id: true,
              name: true,
              uniqueId: true,
            },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              content: true,
              createdAt: true,
              senderId: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: offset,
      });

      return chats as unknown as ChatWithLastMessage[];
    } catch (error) {
      this.logger.error(`Failed to find chats for project: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find a specific chat by its ID
   * @param chatId - The unique identifier of the chat
   * @returns Promise<ChatWithParticipants | null> Chat with participants or null if not found
   */
  async findChatById(chatId: number): Promise<ChatWithParticipants | null> {
    try {
      const chat = await this.prisma.chat.findUnique({
        where: { id: chatId },
        include: {
          admin: {
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
          participant: {
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
          project: {
            select: {
              id: true,
              name: true,
              uniqueId: true,
            },
          },
        },
      });

      return chat as unknown as ChatWithParticipants;
    } catch (error) {
      this.logger.error(`Failed to find chat by ID: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find a chat between specific admin and participant in a project
   * @param projectId - The project ID
   * @param adminId - The admin user ID
   * @param participantId - The participant user ID
   * @returns Promise<ChatWithParticipants | null> Chat with participants or null if not found
   */
  async findChatByParticipants(projectId: number, adminId: number, participantId: number): Promise<ChatWithParticipants | null> {
    try {
      const chat = await this.prisma.chat.findFirst({
        where: {
          projectId,
          adminId,
          participantId,
        },
        include: {
          admin: {
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
          participant: {
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
          project: {
            select: {
              id: true,
              name: true,
              uniqueId: true,
            },
          },
        },
      });

      return chat as unknown as ChatWithParticipants;
    } catch (error) {
      this.logger.error(`Failed to find chat by participants: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create a new chat or return existing one
   * @param data - Chat creation data
   * @returns Promise<ChatWithParticipants> Newly created or existing chat with participants
   */
  async createChat(data: CreateChatData): Promise<ChatWithParticipants> {
    try {
      // Check if chat already exists
      const existingChat = await this.findChatByParticipants(data.projectId, data.adminId, data.participantId);

      if (existingChat) {
        this.logger.log(`Chat already exists between admin ${data.adminId} and participant ${data.participantId} in project ${data.projectId}, returning existing chat: ${existingChat.id}`);
        return existingChat;
      }

      const chat = await this.prisma.chat.create({
        data: {
          projectId: data.projectId,
          adminId: data.adminId,
          participantId: data.participantId,
          isActive: true,
          unreadCount: 0,
        },
        include: {
          admin: {
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
          participant: {
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
          project: {
            select: {
              id: true,
              name: true,
              uniqueId: true,
            },
          },
        },
      });

      this.logger.log(`✅ Successfully created chat: ${chat.id} between admin ${data.adminId} and participant ${data.participantId} in project ${data.projectId}`);
      return chat as unknown as ChatWithParticipants;
    } catch (error) {
      this.logger.error(`Failed to create chat: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update chat's last message timestamp
   * @param chatId - The chat ID
   * @param messageId - The message ID
   * @returns Promise<void>
   */
  async updateChatLastMessage(chatId: number, messageId: number): Promise<void> {
    try {
      await this.prisma.chat.update({
        where: { id: chatId },
        data: {
          updatedAt: new Date(),
        },
      });

      this.logger.log(`✅ Updated last message for chat: ${chatId}`);
    } catch (error) {
      this.logger.error(`Failed to update chat last message: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Mark all messages in a chat as read for a specific user
   * @param chatId - The chat ID
   * @param userId - The user ID who read the messages
   * @returns Promise<void>
   */
  async markChatAsRead(chatId: number, userId: number): Promise<void> {
    try {
      // Mark messages as read
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

      // Update unread count
      await this.prisma.chat.update({
        where: { id: chatId },
        data: {
          unreadCount: 0,
        },
      });

      this.logger.log(`✅ Marked chat ${chatId} as read for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to mark chat as read: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Deactivate a chat
   * @param chatId - The chat ID to deactivate
   * @returns Promise<void>
   */
  async deactivateChat(chatId: number): Promise<void> {
    try {
      await this.prisma.chat.update({
        where: { id: chatId },
        data: {
          isActive: false,
        },
      });

      this.logger.log(`✅ Deactivated chat: ${chatId}`);
    } catch (error) {
      this.logger.error(`Failed to deactivate chat: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get the count of chats for a specific user
   * @param userId - The user ID
   * @param filters - Optional filtering options
   * @returns Promise<number> Count of chats
   */
  async getChatsCount(userId: number, filters?: ChatFilters): Promise<number> {
    try {
      const { projectId, isActive = true } = filters || {};

      const whereCondition: any = {
        OR: [
          { adminId: userId },
          { participantId: userId },
        ],
        isActive,
      };

      if (projectId) {
        whereCondition.projectId = projectId;
      }

      return await this.prisma.chat.count({
        where: whereCondition,
      });
    } catch (error) {
      this.logger.error(`Failed to get chats count: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get the count of chats for a specific project
   * @param projectId - The project ID
   * @param filters - Optional filtering options
   * @returns Promise<number> Count of chats
   */
  async getProjectChatsCount(projectId: number, filters?: ProjectChatFilters): Promise<number> {
    try {
      const { adminId, participantId, isActive = true } = filters || {};

      const whereCondition: any = {
        projectId,
        isActive,
      };

      if (adminId) {
        whereCondition.adminId = adminId;
      }

      if (participantId) {
        whereCondition.participantId = participantId;
      }

      return await this.prisma.chat.count({
        where: whereCondition,
      });
    } catch (error) {
      this.logger.error(`Failed to get project chats count: ${error.message}`, error.stack);
      throw error;
    }
  }
} 
