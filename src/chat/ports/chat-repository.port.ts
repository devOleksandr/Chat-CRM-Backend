import { Chat, User, Project } from '../../prisma/generated/client';

export interface ChatWithParticipants extends Chat {
  admin: User;
  participant: User;
  project: Project;
}

export interface ChatWithLastMessage extends ChatWithParticipants {
  messages: Array<{
    id: number;
    content: string;
    createdAt: Date;
    senderId: number;
  }>;
}

export interface CreateChatData {
  projectId: number;
  adminId: number;
  participantId: number;
}

export interface ChatFilters {
  userId?: number;
  projectId?: number;
  limit?: number;
  offset?: number;
  isActive?: boolean;
}

export interface ProjectChatFilters {
  projectId: number;
  adminId?: number;
  participantId?: number;
  limit?: number;
  offset?: number;
  isActive?: boolean;
}

/**
 * Abstract port for chat repository operations
 * This interface defines the contract for chat storage operations
 * following the dependency inversion principle
 */
export abstract class ChatRepositoryPort {
  /**
   * Find all chats for a specific user (as admin or participant)
   * @param filters - Filtering options including userId, projectId, pagination, and active status
   * @returns Promise<ChatWithLastMessage[]> Array of chats with last message
   */
  abstract findChatsForUser(filters: ChatFilters): Promise<ChatWithLastMessage[]>;

  /**
   * Find all chats for a specific project
   * @param filters - Filtering options including projectId, adminId, participantId, pagination
   * @returns Promise<ChatWithLastMessage[]> Array of chats with last message
   */
  abstract findChatsForProject(filters: ProjectChatFilters): Promise<ChatWithLastMessage[]>;

  /**
   * Find a specific chat by its ID
   * @param chatId - The unique identifier of the chat
   * @returns Promise<ChatWithParticipants | null> Chat with participants or null if not found
   */
  abstract findChatById(chatId: number): Promise<ChatWithParticipants | null>;

  /**
   * Find a chat between specific admin and participant in a project
   * @param projectId - The project ID
   * @param adminId - The admin user ID
   * @param participantId - The participant user ID
   * @returns Promise<ChatWithParticipants | null> Chat with participants or null if not found
   */
  abstract findChatByParticipants(projectId: number, adminId: number, participantId: number): Promise<ChatWithParticipants | null>;

  /**
   * Create a new chat or return existing one
   * @param data - Chat creation data
   * @returns Promise<ChatWithParticipants> Newly created or existing chat with participants
   */
  abstract createChat(data: CreateChatData): Promise<ChatWithParticipants>;

  /**
   * Update chat's last message timestamp
   * @param chatId - The chat ID
   * @param messageId - The message ID
   * @returns Promise<void>
   */
  abstract updateChatLastMessage(chatId: number, messageId: number): Promise<void>;

  /**
   * Mark all messages in a chat as read for a specific user
   * @param chatId - The chat ID
   * @param userId - The user ID who read the messages
   * @returns Promise<void>
   */
  abstract markChatAsRead(chatId: number, userId: number): Promise<void>;

  /**
   * Deactivate a chat
   * @param chatId - The chat ID to deactivate
   * @returns Promise<void>
   */
  abstract deactivateChat(chatId: number): Promise<void>;

  /**
   * Get the count of chats for a specific user
   * @param userId - The user ID
   * @param filters - Optional filtering options
   * @returns Promise<number> Count of chats
   */
  abstract getChatsCount(userId: number, filters?: ChatFilters): Promise<number>;

  /**
   * Get the count of chats for a specific project
   * @param projectId - The project ID
   * @param filters - Optional filtering options
   * @returns Promise<number> Count of chats
   */
  abstract getProjectChatsCount(projectId: number, filters?: ProjectChatFilters): Promise<number>;
} 
