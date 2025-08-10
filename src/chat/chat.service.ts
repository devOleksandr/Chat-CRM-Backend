import { Injectable, Logger } from '@nestjs/common';
import { ChatRepositoryPort } from './ports/chat-repository.port';
import { MessageRepositoryPort, MessageType } from './ports/message-repository.port';
import { ChatErrorHandler } from './handlers/chat-error.handler';
import { CreateMessageDto } from './dto/create-message.dto';
import { ChatResponseDto } from './dto/chat-response.dto';
import { MessageResponseDto, PaginatedMessagesResponseDto } from './dto/message-response.dto';
import { ChatAccessDeniedError, MessageSpamError, InvalidMessageContentError, ChatInactiveError } from './errors/chat.errors';
import { MessageSpamStrategy } from './strategies/chat-error.strategies';
import { ChatFilters, ProjectChatFilters } from './ports/chat-repository.port';
import { MessageFilters } from './ports/message-repository.port';
import { determineMessageType, validateImageMetadata } from './utils/message-validation.util';
import { BroadcastMessageDto } from './dto/broadcast-message.dto';
import { ProjectParticipantService } from '../project/services/project-participant.service';

/**
 * Chat service containing business logic for chat operations
 * Uses dependency injection with repository port interfaces
 * Implements error handling strategy pattern
 */
@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly chatRepository: ChatRepositoryPort,
    private readonly messageRepository: MessageRepositoryPort,
    private readonly errorHandler: ChatErrorHandler,
    private readonly messageSpamStrategy: MessageSpamStrategy,
    private readonly projectParticipantService: ProjectParticipantService,
  ) {}

  /**
   * Get all chats for a specific user with pagination
   * @param userId - The user ID
   * @param projectId - Optional project ID to filter chats
   * @param limit - Maximum number of chats to return
   * @param offset - Number of chats to skip
   * @returns Promise<ChatResponseDto[]> Array of chat responses
   */
  async getChatsForUser(
    userId: number, 
    projectId?: number,
    limit: number = 20, 
    offset: number = 0
  ): Promise<ChatResponseDto[]> {
    try {
      const filters: ChatFilters = { userId, projectId, limit, offset, isActive: true };
      const chats = await this.chatRepository.findChatsForUser(filters);

      const chatResponses = await Promise.all(
        chats.map(chat => this.mapChatToResponseDto(chat, userId))
      );
      return chatResponses;
    } catch (error) {
      await this.errorHandler.handleError(error, {
        operation: 'getChatsForUser',
        userId: userId.toString(),
        timestamp: new Date(),
      });
      throw error;
    }
  }

  /**
   * Get all chats for a specific project
   * @param projectId - The project ID
   * @param adminId - Optional admin ID to filter chats
   * @param participantId - Optional participant ID to filter chats
   * @param limit - Maximum number of chats to return
   * @param offset - Number of chats to skip
   * @returns Promise<ChatResponseDto[]> Array of chat responses
   */
  async getChatsForProject(
    projectId: number,
    adminId?: number,
    participantId?: number,
    limit: number = 20,
    offset: number = 0
  ): Promise<ChatResponseDto[]> {
    try {
      const filters: ProjectChatFilters = { 
        projectId, 
        adminId, 
        participantId, 
        limit, 
        offset, 
        isActive: true 
      };
      const chats = await this.chatRepository.findChatsForProject(filters);

      const chatResponses = await Promise.all(
        chats.map(chat => this.mapChatToResponseDto(chat, adminId || participantId || 0))
      );
      return chatResponses;
    } catch (error) {
      await this.errorHandler.handleError(error, {
        operation: 'getChatsForProject',
        projectId: projectId.toString(),
        timestamp: new Date(),
      });
      throw error;
    }
  }

  /**
   * Get a specific chat by ID
   * @param chatId - The chat ID
   * @param userId - The user ID requesting the chat
   * @returns Promise<ChatResponseDto> Chat response
   */
  async getChatById(chatId: number, userId: number): Promise<ChatResponseDto> {
    try {
      const chat = await this.chatRepository.findChatById(chatId);
      
      if (!chat) {
        throw new Error(`Chat not found: ${chatId}`);
      }

      // Check if user has access to this chat
      if (chat.admin.id !== userId && chat.participant.id !== userId) {
        const error = new ChatAccessDeniedError(userId, chatId);
        await this.errorHandler.handleChatAccessDeniedError(error, {
          operation: 'getChatById',
          userId: userId.toString(),
          chatId: chatId.toString(),
          timestamp: new Date(),
        });
        throw error;
      }

      return await this.mapChatToResponseDto(chat, userId);
    } catch (error) {
      await this.errorHandler.handleError(error, {
        operation: 'getChatById',
        userId: userId.toString(),
        chatId: chatId.toString(),
        timestamp: new Date(),
      });
      throw error;
    }
  }

  /**
   * Create a new chat between admin and participant
   * @param projectId - The project ID
   * @param adminId - The admin user ID
   * @param participantId - The participant user ID
   * @returns Promise<ChatResponseDto> Newly created chat response
   */
  async createChat(projectId: number, adminId: number, participantId: number): Promise<ChatResponseDto> {
    try {
      const chat = await this.chatRepository.createChat({
        projectId,
        adminId,
        participantId,
      });

      this.logger.log(`Chat ${chat.id} between admin ${adminId} and participant ${participantId} in project ${projectId} is ready for use`);
      
      return await this.mapChatToResponseDto(chat, adminId);
    } catch (error) {
      await this.errorHandler.handleError(error, {
        operation: 'createChat',
        projectId: projectId.toString(),
        adminId: adminId.toString(),
        participantId: participantId.toString(),
        timestamp: new Date(),
      });
      throw error;
    }
  }

  /**
   * Get or create chat between admin and participant
   * @param projectId - The project ID
   * @param adminId - The admin user ID
   * @param participantId - The participant user ID
   * @returns Promise<ChatResponseDto> Chat response
   */
  async getOrCreateChat(projectId: number, adminId: number, participantId: number): Promise<{ chat: ChatResponseDto; isNewChat: boolean }> {
    try {
      console.log(`🔍 ChatService.getOrCreateChat called:`, {
        projectId,
        adminId,
        participantId,
        timestamp: new Date().toISOString()
      });
      
      // Try to find existing chat
      const existingChat = await this.chatRepository.findChatByParticipants(projectId, adminId, participantId);
      
      console.log(`🔍 Existing chat search result:`, {
        found: !!existingChat,
        chatId: existingChat?.id,
        existingParticipantId: existingChat?.participant?.id,
        timestamp: new Date().toISOString()
      });
      
      if (existingChat) {
        const chatResponse = await this.mapChatToResponseDto(existingChat, adminId);
        return {
          chat: chatResponse,
          isNewChat: false,
        };
      }

      // Create new chat if it doesn't exist
      const newChat = await this.createChat(projectId, adminId, participantId);
      return {
        chat: newChat,
        isNewChat: true,
      };
    } catch (error) {
      await this.errorHandler.handleError(error, {
        operation: 'getOrCreateChat',
        projectId: projectId.toString(),
        adminId: adminId.toString(),
        participantId: participantId.toString(),
        timestamp: new Date(),
      });
      throw error;
    }
  }

  /**
   * Get messages for a specific chat with pagination
   * @param chatId - The chat ID
   * @param userId - The user ID requesting messages
   * @param limit - Maximum number of messages to return
   * @param offset - Number of messages to skip
   * @returns Promise<PaginatedMessagesResponseDto> Paginated messages response
   */
  async getMessagesByChatId(
    chatId: number, 
    userId: number, 
    limit: number = 20, 
    offset: number = 0
  ): Promise<PaginatedMessagesResponseDto> {
    try {
      // Verify user has access to this chat
      const chat = await this.chatRepository.findChatById(chatId);
      if (!chat) {
        throw new Error(`Chat not found: ${chatId}`);
      }

      if (chat.admin.id !== userId && chat.participant.id !== userId) {
        const error = new ChatAccessDeniedError(userId, chatId);
        await this.errorHandler.handleChatAccessDeniedError(error, {
          operation: 'getMessagesByChatId',
          userId: userId.toString(),
          chatId: chatId.toString(),
          timestamp: new Date(),
        });
        throw error;
      }

      const filters: MessageFilters = { chatId, limit, offset };
      const messages = await this.messageRepository.findMessagesByChatId(filters);
      const totalCount = await this.messageRepository.getMessagesCount(chatId);

      const messageResponses = messages.map(message => this.mapMessageToResponseDto(message));

      return {
        messages: messageResponses,
        totalCount,
        limit,
        offset,
      };
    } catch (error) {
      await this.errorHandler.handleError(error, {
        operation: 'getMessagesByChatId',
        userId: userId.toString(),
        chatId: chatId.toString(),
        timestamp: new Date(),
      });
      throw error;
    }
  }

  /**
   * Create a new message in a chat
   * @param createMessageDto - Message creation data
   * @param senderId - The sender user ID
   * @returns Promise<MessageResponseDto> Newly created message response
   */
  async createMessage(createMessageDto: CreateMessageDto, senderId: number): Promise<MessageResponseDto> {
    try {
      // Verify user has access to this chat
      const chat = await this.chatRepository.findChatById(createMessageDto.chatId);
      if (!chat) {
        throw new Error(`Chat not found: ${createMessageDto.chatId}`);
      }

      if (chat.admin.id !== senderId && chat.participant.id !== senderId) {
        const error = new ChatAccessDeniedError(senderId, createMessageDto.chatId);
        await this.errorHandler.handleChatAccessDeniedError(error, {
          operation: 'createMessage',
          userId: senderId.toString(),
          chatId: createMessageDto.chatId.toString(),
          timestamp: new Date(),
        });
        throw error;
      }

      // Check if chat is active
      if (!chat.isActive) {
        const error = new ChatInactiveError(createMessageDto.chatId);
        await this.errorHandler.handleError(error, {
          operation: 'createMessage',
          userId: senderId.toString(),
          chatId: createMessageDto.chatId.toString(),
          timestamp: new Date(),
        });
        throw error;
      }

      // Validate message content
      this.validateMessageContent(createMessageDto.content);

      // Check spam protection
      await this.checkSpamProtection(senderId);

      // Determine message type if not provided
      const messageType = createMessageDto.type || determineMessageType(createMessageDto.content, createMessageDto.metadata);

      // Validate image metadata if it's an image message
      if (messageType === MessageType.IMAGE && createMessageDto.metadata) {
        const validation = validateImageMetadata(createMessageDto.metadata);
        if (!validation.isValid) {
          throw new InvalidMessageContentError(validation.error || 'Invalid image metadata');
        }
      }

      // Create message
      const message = await this.messageRepository.createMessage({
        chatId: createMessageDto.chatId,
        senderId,
        content: createMessageDto.content,
        type: messageType,
        metadata: createMessageDto.metadata,
      });

      // Update chat's last message timestamp
      await this.chatRepository.updateChatLastMessage(createMessageDto.chatId, message.id);

      this.logger.log(`✅ Message ${message.id} created in chat ${createMessageDto.chatId} by user ${senderId}`);

      return this.mapMessageToResponseDto(message);
    } catch (error) {
      await this.errorHandler.handleError(error, {
        operation: 'createMessage',
        userId: senderId.toString(),
        chatId: createMessageDto.chatId.toString(),
        timestamp: new Date(),
      });
      throw error;
    }
  }

  /**
   * Broadcast a message from admin to all active participants of a project
   * - Creates chat if it does not exist
   * - Reuses standard validation/spam checks via createMessage
   */
  async sendBroadcastMessage(
    projectId: number,
    adminId: number,
    dto: BroadcastMessageDto,
  ): Promise<MessageResponseDto[]> {
    try {
      this.logger.log(`📢 Broadcasting message in project ${projectId} by admin ${adminId}`);

      // Get all participants (authorization/ownership verified inside service)
      const participants = await this.projectParticipantService.getProjectParticipants(
        projectId,
        adminId,
        10000,
        0,
      );

      if (!participants.length) {
        this.logger.warn(`No participants found for project ${projectId}`);
        return [];
      }

      const createdMessages: MessageResponseDto[] = [];

      for (const participant of participants) {
        // Skip if participant userId equals adminId (safety)
        if (participant.userId === adminId) {
          continue;
        }

        try {
          const { chat } = await this.getOrCreateChat(projectId, adminId, participant.userId);

          const createDto: CreateMessageDto = {
            chatId: chat.id,
            content: dto.content,
            type: dto.type,
            metadata: dto.metadata,
          };

          const message = await this.createMessage(createDto, adminId);
          createdMessages.push(message);
        } catch (participantError: any) {
          this.logger.error(
            `Failed to broadcast to participant ${participant.userId} in project ${projectId}: ${participantError?.message}`,
          );
          // continue with other participants
        }
      }

      this.logger.log(
        `📢 Broadcast finished for project ${projectId}: ${createdMessages.length}/${participants.length} messages created`,
      );

      return createdMessages;
    } catch (error) {
      await this.errorHandler.handleError(error, {
        operation: 'sendBroadcastMessage',
        projectId: projectId.toString(),
        userId: adminId.toString(),
        timestamp: new Date(),
      });
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
      // Verify user has access to this chat
      const chat = await this.chatRepository.findChatById(chatId);
      if (!chat) {
        throw new Error(`Chat not found: ${chatId}`);
      }

      if (chat.admin.id !== userId && chat.participant.id !== userId) {
        const error = new ChatAccessDeniedError(userId, chatId);
        await this.errorHandler.handleChatAccessDeniedError(error, {
          operation: 'markChatAsRead',
          userId: userId.toString(),
          chatId: chatId.toString(),
          timestamp: new Date(),
        });
        throw error;
      }

      await this.chatRepository.markChatAsRead(chatId, userId);
      this.logger.log(`✅ Chat ${chatId} marked as read by user ${userId}`);
    } catch (error) {
      await this.errorHandler.handleError(error, {
        operation: 'markChatAsRead',
        userId: userId.toString(),
        chatId: chatId.toString(),
        timestamp: new Date(),
      });
      throw error;
    }
  }

  /**
   * Deactivate a chat
   * @param chatId - The chat ID
   * @param userId - The user ID requesting deactivation
   * @returns Promise<void>
   */
  async deactivateChat(chatId: number, userId: number): Promise<void> {
    try {
      // Verify user has access to this chat
      const chat = await this.chatRepository.findChatById(chatId);
      if (!chat) {
        throw new Error(`Chat not found: ${chatId}`);
      }

      if (chat.admin.id !== userId && chat.participant.id !== userId) {
        const error = new ChatAccessDeniedError(userId, chatId);
        await this.errorHandler.handleChatAccessDeniedError(error, {
          operation: 'deactivateChat',
          userId: userId.toString(),
          chatId: chatId.toString(),
          timestamp: new Date(),
        });
        throw error;
      }

      await this.chatRepository.deactivateChat(chatId);
      this.logger.log(`✅ Chat ${chatId} deactivated by user ${userId}`);
    } catch (error) {
      await this.errorHandler.handleError(error, {
        operation: 'deactivateChat',
        userId: userId.toString(),
        chatId: chatId.toString(),
        timestamp: new Date(),
      });
      throw error;
    }
  }

  /**
   * Validate message content
   * @param content - The message content to validate
   * @private
   */
  private validateMessageContent(content: string): void {
    if (!content || content.trim().length === 0) {
      throw new InvalidMessageContentError('Message content cannot be empty');
    }

    if (content.length > 1000) {
      throw new InvalidMessageContentError('Message content cannot exceed 1000 characters');
    }
  }

  /**
   * Check spam protection for a user
   * @param userId - The user ID to check
   * @private
   */
  private async checkSpamProtection(userId: number): Promise<void> {
    try {
      const recentMessages = await this.messageRepository.findRecentMessagesByUser(userId, 30, 60);
      
      if (recentMessages.length >= 30) {
        const error = new MessageSpamError(userId);
        await this.errorHandler.handleMessageSpamError(error, {
          operation: 'checkSpamProtection',
          userId: userId.toString(),
          timestamp: new Date(),
        });
        throw error;
      }
    } catch (error) {
      if (error instanceof MessageSpamError) {
        throw error;
      }
      this.logger.error(`Failed to check spam protection: ${error.message}`, error.stack);
    }
  }

  /**
   * Map chat entity to response DTO
   * @param chat - Chat entity with participants and project
   * @param userId - The user ID requesting the chat
   * @returns Promise<ChatResponseDto>
   * @private
   */
  private async mapChatToResponseDto(chat: any, userId: number): Promise<ChatResponseDto> {
    // Get unread count for the requesting user
    const unreadCount = await this.messageRepository.getUnreadCount(chat.id, userId);

    return {
      id: chat.id,
      projectId: chat.projectId,
      project: {
        id: chat.project.id,
        name: chat.project.name,
        uniqueId: chat.project.uniqueId,
      },
      admin: {
        id: chat.admin.id,
        email: chat.admin.email,
        firstName: chat.admin.firstName,
        lastName: chat.admin.lastName,
        uniqueId: chat.admin.uniqueId,
        isOnline: chat.admin.isOnline,
        lastSeen: chat.admin.lastSeen,
      },
      participant: {
        id: chat.participant.id,
        email: chat.participant.email,
        firstName: chat.participant.firstName,
        lastName: chat.participant.lastName,
        uniqueId: chat.participant.uniqueId,
        isOnline: chat.participant.isOnline,
        lastSeen: chat.participant.lastSeen,
      },
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      isActive: chat.isActive,
      lastMessage: chat.messages?.[0] ? {
        id: chat.messages[0].id,
        content: chat.messages[0].content,
        createdAt: chat.messages[0].createdAt,
        senderId: chat.messages[0].senderId,
      } : undefined,
      unreadCount,
      lastMessageAt: chat.messages?.[0]?.createdAt,
    };
  }

  /**
   * Map message entity to response DTO
   * @param message - Message entity with sender
   * @returns MessageResponseDto
   * @private
   */
  private mapMessageToResponseDto(message: any): MessageResponseDto {
    return {
      id: message.id,
      chatId: message.chatId,
      senderId: message.senderId,
      content: message.content,
      type: message.type,
      metadata: message.metadata,
      read: message.read,
      readAt: message.readAt,
      createdAt: message.createdAt,
      sender: {
        id: message.sender.id,
        email: message.sender.email,
        firstName: message.sender.firstName,
        lastName: message.sender.lastName,
        uniqueId: message.sender.uniqueId,
        isOnline: message.sender.isOnline,
        lastSeen: message.sender.lastSeen,
      },
    };
  }
} 
