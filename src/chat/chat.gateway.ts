import { 
  WebSocketGateway, 
  WebSocketServer, 
  SubscribeMessage, 
  OnGatewayConnection, 
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { ProjectService } from '../project/project.service';
import { ProjectParticipantService } from '../project/services/project-participant.service';
import { ChatErrorHandler } from './handlers/chat-error.handler';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessageType } from './ports/message-repository.port';
import { WebSocketConnectionError } from './errors/chat.errors';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';
import { OnlineStatusService } from './services/online-status.service';
import { getCorsOrigins } from '../config/cors';
import { 
  JoinProjectChatsDto, 
  JoinAllChatsDto, 
  ChatUpdateDto, 
  MessageUpdateDto, 
  ParticipantStatusUpdateDto 
} from './dto/websocket-events.dto';

/**
 * WebSocket Gateway for real-time chat functionality
 * Handles WebSocket connections, message broadcasting, and user status updates
 */
@WebSocketGateway({
  cors: {
    origin: getCorsOrigins(),
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private readonly connectedUsers = new Map<string, { socket: Socket; userId: number }>();

  constructor(
    private readonly chatService: ChatService,
    private readonly projectService: ProjectService,
    private readonly projectParticipantService: ProjectParticipantService,
    private readonly errorHandler: ChatErrorHandler,
    private readonly jwtService: JwtService,
    private readonly onlineStatusService: OnlineStatusService,
  ) {}

  /**
   * Initialize gateway and mark all users as offline
   * Called when the gateway starts up
   */
  afterInit() {
    this.logger.log('🚀 ChatGateway initialized, marking all users as offline...');
    this.onlineStatusService.markAllUsersOffline().catch(error => {
      this.logger.error('Failed to mark users offline on startup:', error);
    });
  }

  /**
   * Handle new WebSocket connections
   * Authenticates user and sets up basic connection
   * @param client - The connected socket client
   */
  async handleConnection(client: Socket) {
    try {
      this.logger.log(`🔌 New WebSocket connection attempt from ${client.id}`);
      
      // Log connection details for debugging
      const authToken = client.handshake.auth.token;
      const authHeader = client.handshake.headers.authorization;
      const hasToken = !!(authToken || authHeader);
      
      this.logger.log(`🔍 Connection details:`, {
        socketId: client.id,
        hasToken,
        authToken: authToken ? 'present' : 'missing',
        authHeader: authHeader ? 'present' : 'missing',
        origin: client.handshake.headers.origin,
        userAgent: client.handshake.headers['user-agent']?.substring(0, 50),
      });

      const user = await this.authenticateUser(client);
      if (!user) {
        const { participantId, projectId } = client.handshake.auth || {};
        const hasMobileHandshake = Boolean(participantId && projectId);

        if (hasMobileHandshake) {
          await this.handleMobileConnection(client);
          return;
        }

        this.logger.warn(`❌ Unauthenticated connection attempt from ${client.id} - no valid token or mobile handshake`);
        client.emit('error', { 
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
        client.disconnect();
        return;
      }

      // Store connected user
      this.connectedUsers.set(client.id, { socket: client, userId: user.id });

      // Update user online status in database
      await this.onlineStatusService.updateUserOnlineStatus(user.id, true);

      // Join user's personal room for status updates ONLY
      client.join(`user_${user.id}`);

      // Notify other users about online status
      this.server.to(`user_${user.id}`).emit('userOnline', { 
        userId: user.id,
        timestamp: new Date(),
      });

      // Send connection success event to client
      client.emit('connected', {
        userId: user.id,
        timestamp: new Date(),
      });

      this.logger.log(`✅ User ${user.id} successfully connected to chat (socket: ${client.id})`);
    } catch (error) {
      this.logger.error(`💥 Error during WebSocket connection: ${error.message}`, error.stack);
      
      const wsError = new WebSocketConnectionError(0); // userId unknown at this point
      await this.errorHandler.handleWebSocketConnectionError(wsError, {
        operation: 'handleConnection',
        socketId: client.id,
        timestamp: new Date(),
      });
      
      client.emit('error', { 
        message: 'Connection failed',
        code: 'CONNECTION_ERROR'
      });
      client.disconnect();
    }
  }

  /**
   * Handle WebSocket disconnections
   * Removes user from connected users and notifies others
   * @param client - The disconnected socket client
   */
  async handleDisconnect(client: Socket) {
    try {
      this.logger.log(`🔌 WebSocket disconnection: ${client.id}`);
      
      const userInfo = this.connectedUsers.get(client.id);
      if (userInfo) {
        const { userId } = userInfo;
        
        // Remove from connected users
        this.connectedUsers.delete(client.id);

        // Update user online status in database
        await this.onlineStatusService.updateUserOnlineStatus(userId, false);

        // Notify other users about offline status
        this.server.to(`user_${userId}`).emit('userOffline', { 
          userId,
          timestamp: new Date(),
        });

        this.logger.log(`👋 User ${userId} disconnected from chat (socket: ${client.id})`);
      } else {
        this.logger.log(`❓ Unknown socket disconnected: ${client.id}`);
      }
    } catch (error) {
      this.logger.error(`💥 Error in handleDisconnect: ${error.message}`, error.stack);
    }
  }

  /**
   * Handle sending a new message
   * Creates message in database and broadcasts to all connected clients
   * @param client - The socket client
   * @param data - Message data containing chatId, content, and optional type/metadata
   */
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: number; content: string; type?: MessageType; metadata?: Record<string, any> },
  ) {
    try {
      this.logger.log(`📤 SendMessage request received:`, {
        socketId: client.id,
        chatId: data.chatId,
        content: data.content.substring(0, 50) + '...',
        timestamp: new Date().toISOString()
      });

      const user = await this.authenticateUser(client);
      if (!user) {
        this.logger.warn(`❌ Authentication failed for socket ${client.id}`);
        client.emit('error', { message: 'Authentication failed' });
        return;
      }

      this.logger.log(`✅ User authenticated: ${user.id} for socket ${client.id}`);

      // Create message DTO
      const createMessageDto = {
        chatId: data.chatId,
        content: data.content,
        type: data.type || MessageType.TEXT,
        metadata: data.metadata,
      } as CreateMessageDto;

      // Create message through service
      const message = await this.chatService.createMessage(createMessageDto, user.id);
      
      this.logger.log(`💾 Message created in database:`, {
        messageId: message.id,
        chatId: message.chatId,
        senderId: message.sender.id,
        timestamp: new Date().toISOString()
      });

      // Prepare message payload
      const messagePayload = {
        id: message.id,
        chatId: message.chatId,
        senderId: message.sender.id,
        content: message.content,
        type: message.type,
        metadata: message.metadata,
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

      this.logger.log(`📡 Broadcasting message to all clients:`, {
        messageId: message.id,
        chatId: message.chatId,
        connectedUsersCount: this.connectedUsers.size,
        timestamp: new Date().toISOString()
      });

      // Broadcast to chat room only (more efficient)
      this.server.to(`chat_${data.chatId}`).emit('newMessage', messagePayload);

      // Send confirmation to sender
      client.emit('messageSent', { 
        messageId: message.id,
        timestamp: new Date(),
      });

      this.logger.log(`✅ Message ${message.id} successfully broadcasted in chat ${data.chatId} by user ${user.id}`);
    } catch (error) {
      this.logger.error(`💥 Error in handleSendMessage:`, {
        error: error.message,
        stack: error.stack,
        socketId: client.id,
        chatId: data.chatId,
        timestamp: new Date().toISOString()
      });

      await this.errorHandler.handleError(error, {
        operation: 'sendMessage',
        socketId: client.id,
        chatId: data.chatId?.toString(),
        timestamp: new Date(),
      });
      
      client.emit('error', { 
        message: error.message,
        code: error.code || 'UNKNOWN_ERROR',
        timestamp: new Date(),
      });
    }
  }

  /**
   * Handle marking messages as read
   * Updates read status and notifies other participants
   * @param client - The socket client
   * @param data - Data containing chatId
   */
  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: number },
  ) {
    try {
      const user = await this.authenticateUser(client);
      if (!user) {
        client.emit('error', { message: 'Authentication failed' });
        return;
      }

      // Mark messages as read through service
      await this.chatService.markChatAsRead(data.chatId, user.id);

      // Notify chat room participants about read status
      this.server.to(`chat_${data.chatId}`).emit('messagesRead', {
        chatId: data.chatId,
        readBy: user.id,
        timestamp: new Date(),
      });

      this.logger.log(`Messages marked as read in chat ${data.chatId} by user ${user.id}`);
    } catch (error) {
      await this.errorHandler.handleError(error, {
        operation: 'markAsRead',
        socketId: client.id,
        chatId: data.chatId?.toString(),
        timestamp: new Date(),
      });
      
      client.emit('error', { 
        message: error.message,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Handle typing indicator
   * Broadcasts typing status to other chat participants
   * @param client - The socket client
   * @param data - Data containing chatId and typing status
   */
  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: number; isTyping: boolean },
  ) {
    try {
      const user = await this.authenticateUser(client);
      if (!user) {
        return;
      }

      // Broadcast typing status to chat room participants
      this.server.to(`chat_${data.chatId}`).emit('userTyping', {
        chatId: data.chatId,
        userId: user.id,
        isTyping: data.isTyping,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error(`Error in handleTyping: ${error.message}`, error.stack);
    }
  }

  /**
   * Handle joining a chat room
   * Adds user to specific chat room for real-time updates
   * @param client - The socket client
   * @param data - Data containing chatId
   */
  @SubscribeMessage('joinChat')
  async handleJoinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: number },
  ) {
    try {
      this.logger.log(`👥 JoinChat request received:`, {
        socketId: client.id,
        chatId: data.chatId,
        timestamp: new Date().toISOString()
      });

      const user = await this.authenticateUser(client);
      if (!user) {
        this.logger.warn(`❌ Authentication failed for joinChat socket ${client.id}`);
        client.emit('error', { message: 'Authentication failed' });
        return;
      }

      this.logger.log(`✅ User ${user.id} authenticated for joinChat`);

      // Verify user has access to this chat
      const chat = await this.chatService.getChatById(data.chatId, user.id);
      
      this.logger.log(`✅ Chat access verified for user ${user.id} to chat ${data.chatId}`);

      // Join the chat room
      client.join(`chat_${data.chatId}`);

      // Notify other participants
      client.to(`chat_${data.chatId}`).emit('userJoinedChat', {
        chatId: data.chatId,
        userId: user.id,
        timestamp: new Date(),
      });

      this.logger.log(`✅ User ${user.id} successfully joined chat ${data.chatId}`);
    } catch (error) {
      this.logger.error(`💥 Error in handleJoinChat:`, {
        error: error.message,
        stack: error.stack,
        socketId: client.id,
        chatId: data.chatId,
        timestamp: new Date().toISOString()
      });

      await this.errorHandler.handleError(error, {
        operation: 'joinChat',
        socketId: client.id,
        chatId: data.chatId?.toString(),
        timestamp: new Date(),
      });
      
      client.emit('error', { 
        message: error.message,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Handle leaving a chat room
   * Removes user from specific chat room
   * @param client - The socket client
   * @param data - Data containing chatId
   */
  @SubscribeMessage('leaveChat')
  async handleLeaveChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: number },
  ) {
    try {
      const user = await this.authenticateUser(client);
      if (!user) {
        return;
      }

      // Leave the chat room
      client.leave(`chat_${data.chatId}`);

      // Notify other participants
      client.to(`chat_${data.chatId}`).emit('userLeftChat', {
        chatId: data.chatId,
        userId: user.id,
        timestamp: new Date(),
      });

      this.logger.log(`User ${user.id} left chat ${data.chatId}`);
    } catch (error) {
      this.logger.error(`Error in handleLeaveChat: ${error.message}`, error.stack);
    }
  }

  /**
   * Handle joining all project chats for a specific project
   * Adds user to all chat rooms for a specific project
   * @param client - The socket client
   * @param data - Data containing projectId
   */
  @SubscribeMessage('joinProjectChats')
  async handleJoinProjectChats(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinProjectChatsDto,
  ) {
    try {
      this.logger.log(`👥 JoinProjectChats request received:`, {
        socketId: client.id,
        projectId: data.projectId,
        timestamp: new Date().toISOString()
      });

      const user = await this.authenticateUser(client);
      if (!user) {
        this.logger.warn(`❌ Authentication failed for joinProjectChats socket ${client.id}`);
        client.emit('error', { message: 'Authentication failed' });
        return;
      }

      this.logger.log(`✅ User ${user.id} authenticated for joinProjectChats`);

      // Get all chats for the specific project
      const projectChats = await this.chatService.getChatsForProject(data.projectId, user.id);
      
      this.logger.log(`✅ Found ${projectChats.length} chats for project ${data.projectId}`);

      // Join all project chat rooms
      projectChats.forEach(chat => {
        client.join(`chat_${chat.id}`);
        this.logger.log(`✅ User ${user.id} joined chat ${chat.id} for project ${data.projectId}`);
      });

      // Notify client about successful join
      client.emit('projectChatsJoined', {
        projectId: data.projectId,
        chatCount: projectChats.length,
        chatIds: projectChats.map(chat => chat.id),
        timestamp: new Date(),
      });

      this.logger.log(`✅ User ${user.id} successfully joined ${projectChats.length} chats for project ${data.projectId}`);
    } catch (error) {
      this.logger.error(`💥 Error in handleJoinProjectChats:`, {
        error: error.message,
        stack: error.stack,
        socketId: client.id,
        projectId: data.projectId,
        timestamp: new Date().toISOString()
      });

      await this.errorHandler.handleError(error, {
        operation: 'joinProjectChats',
        socketId: client.id,
        projectId: data.projectId?.toString(),
        timestamp: new Date(),
      });
      
      client.emit('error', { 
        message: error.message,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Handle joining all chats for the authenticated user
   * Adds user to all chat rooms they have access to
   * @param client - The socket client
   */
  @SubscribeMessage('joinAllChats')
  async handleJoinAllChats(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinAllChatsDto,
  ) {
    try {
      this.logger.log(`👥 JoinAllChats request received:`, {
        socketId: client.id,
        timestamp: new Date().toISOString()
      });

      const user = await this.authenticateUser(client);
      if (!user) {
        this.logger.warn(`❌ Authentication failed for joinAllChats socket ${client.id}`);
        client.emit('error', { message: 'Authentication failed' });
        return;
      }

      this.logger.log(`✅ User ${user.id} authenticated for joinAllChats`);

      // Get all chats for the user
      const userChats = await this.chatService.getChatsForUser(user.id);
      
      this.logger.log(`✅ Found ${userChats.length} chats for user ${user.id}`);

      // Join all user chat rooms
      userChats.forEach(chat => {
        client.join(`chat_${chat.id}`);
        this.logger.log(`✅ User ${user.id} joined chat ${chat.id}`);
      });

      // Notify client about successful join
      client.emit('allChatsJoined', {
        chatCount: userChats.length,
        chatIds: userChats.map(chat => chat.id),
        timestamp: new Date(),
      });

      this.logger.log(`✅ User ${user.id} successfully joined ${userChats.length} chats`);
    } catch (error) {
      this.logger.error(`💥 Error in handleJoinAllChats:`, {
        error: error.message,
        stack: error.stack,
        socketId: client.id,
        timestamp: new Date().toISOString()
      });

      await this.errorHandler.handleError(error, {
        operation: 'joinAllChats',
        socketId: client.id,
        timestamp: new Date(),
      });
      
      client.emit('error', { 
        message: error.message,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Handle chat update notification
   * Broadcasts chat updates to all participants
   * @param client - The socket client
   * @param data - Data containing chatId and chat updates
   */
  @SubscribeMessage('chatUpdate')
  async handleChatUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: ChatUpdateDto,
  ) {
    try {
      const user = await this.authenticateUser(client);
      if (!user) {
        client.emit('error', { message: 'Authentication failed' });
        return;
      }

      // Verify user has access to this chat
      const chat = await this.chatService.getChatById(data.chatId, user.id);
      
      // Broadcast chat update to chat room participants
      this.server.to(`chat_${data.chatId}`).emit('chatUpdated', {
        chatId: data.chatId,
        chat: data.chat,
        updatedBy: user.id,
        timestamp: new Date(),
      });

      this.logger.log(`Chat ${data.chatId} updated by user ${user.id}`);
    } catch (error) {
      await this.errorHandler.handleError(error, {
        operation: 'chatUpdate',
        socketId: client.id,
        chatId: data.chatId?.toString(),
        timestamp: new Date(),
      });
      
      client.emit('error', { 
        message: error.message,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Handle message update notification
   * Broadcasts message updates to chat participants
   * @param client - The socket client
   * @param data - Data containing chatId and updated message
   */
  @SubscribeMessage('messageUpdate')
  async handleMessageUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: MessageUpdateDto,
  ) {
    try {
      const user = await this.authenticateUser(client);
      if (!user) {
        client.emit('error', { message: 'Authentication failed' });
        return;
      }

      // Verify user has access to this chat
      const chat = await this.chatService.getChatById(data.chatId, user.id);
      
      // Broadcast message update to chat room participants
      this.server.to(`chat_${data.chatId}`).emit('messageUpdate', {
        chatId: data.chatId,
        message: data.message,
        updatedBy: user.id,
        timestamp: new Date(),
      });

      this.logger.log(`Message updated in chat ${data.chatId} by user ${user.id}`);
    } catch (error) {
      await this.errorHandler.handleError(error, {
        operation: 'messageUpdate',
        socketId: client.id,
        chatId: data.chatId?.toString(),
        timestamp: new Date(),
      });
      
      client.emit('error', { 
        message: error.message,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Handle participant online status update
   * Broadcasts participant online status to relevant chat rooms
   * @param client - The socket client
   * @param data - Data containing participantId and online status
   */
  @SubscribeMessage('participantStatusUpdate')
  async handleParticipantStatusUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: ParticipantStatusUpdateDto,
  ) {
    try {
      const user = await this.authenticateUser(client);
      if (!user) {
        client.emit('error', { message: 'Authentication failed' });
        return;
      }

      // If specific chat IDs provided, broadcast to those chats only
      if (data.chatIds && data.chatIds.length > 0) {
        data.chatIds.forEach(chatId => {
          this.server.to(`chat_${chatId}`).emit('participantOnline', {
            participantId: data.participantId,
            isOnline: data.isOnline,
            timestamp: new Date(),
          });
        });
      } else {
        // Broadcast to all chats where this participant is present
        const userChats = await this.chatService.getChatsForUser(user.id);
        userChats.forEach(chat => {
          this.server.to(`chat_${chat.id}`).emit('participantOnline', {
            participantId: data.participantId,
            isOnline: data.isOnline,
            timestamp: new Date(),
          });
        });
      }

      this.logger.log(`Participant ${data.participantId} status updated to ${data.isOnline ? 'online' : 'offline'} by user ${user.id}`);
    } catch (error) {
      await this.errorHandler.handleError(error, {
        operation: 'participantStatusUpdate',
        socketId: client.id,
        timestamp: new Date(),
      });
      
      client.emit('error', { 
        message: error.message,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Authenticate user from WebSocket connection
   * Extracts and validates JWT token from socket handshake
   * @param client - The socket client
   * @returns Promise<User | null> Authenticated user or null
   * @private
   */
  private async authenticateUser(client: Socket): Promise<any | null> {
    try {
      const token = client.handshake.auth.token || 
                   client.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        this.logger.warn(`🔑 No token provided for socket ${client.id}`);
        return null;
      }

      this.logger.log(`🔐 Attempting to verify token for socket ${client.id}`);
      
      const payload = await this.jwtService.verifyAsync(token);
      
      this.logger.log(`✅ Token verified successfully for user ${payload.sub}`);
      
      return { id: payload.sub, email: payload.email };
    } catch (error) {
      this.logger.warn(`❌ JWT verification failed for socket ${client.id}: ${error.message}`);
      return null;
    }
  }

  /**
   * Get user ID from socket connection
   * @param client - The socket client
   * @returns string | null User ID or null if not found
   * @private
   */
  private getUserIdFromSocket(client: Socket): string | null {
    const userInfo = this.connectedUsers.get(client.id);
    return userInfo ? userInfo.userId.toString() : null;
  }

  /**
   * Get all connected users
   * @returns Map<string, { socket: Socket; userId: number }> Map of connected users
   */
  getConnectedUsers(): Map<string, { socket: Socket; userId: number }> {
    return this.connectedUsers;
  }

  /**
   * Check if a user is online
   * @param userId - The user ID to check
   * @returns boolean True if user is online
   */
  isUserOnline(userId: number): boolean {
    for (const [, userInfo] of this.connectedUsers) {
      if (userInfo.userId === userId) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get user online status from database
   * @param userId - The user ID to check
   * @returns Promise<{ isOnline: boolean; lastSeen: Date | null }>
   */
  async getUserOnlineStatus(userId: number): Promise<{ isOnline: boolean; lastSeen: Date | null }> {
    return await this.onlineStatusService.getUserOnlineStatus(userId);
  }

  // ==================== MOBILE APP ENDPOINTS (No Authentication) ====================

  /**
   * Handle mobile app connection (no authentication required)
   * @param client - The connected socket client
   */
  async handleMobileConnection(client: Socket) {
    try {
      this.logger.log(`📱 Mobile WebSocket connection attempt from ${client.id}`);
      
      const { participantId, projectId } = client.handshake.auth;
      
      if (!participantId || !projectId) {
        this.logger.warn(`❌ Mobile connection missing required data: participantId=${participantId}, projectId=${projectId}`);
        client.emit('error', { 
          message: 'Missing participantId or projectId',
          code: 'MISSING_DATA'
        });
        client.disconnect();
        return;
      }

      // Get the participant user ID from the participant ID string
      const participantUserId = await this.projectParticipantService.getParticipantUserId(participantId, projectId);
      
      // Store connected mobile user
      this.connectedUsers.set(client.id, { socket: client, userId: participantUserId });

      // Update user online status in database
      await this.onlineStatusService.updateUserOnlineStatus(participantUserId, true);

      // Join user's personal room for status updates
      client.join(`user_${participantUserId}`);

      this.logger.log(`✅ Mobile user ${participantUserId} (participantId: ${participantId}) connected successfully`);
      
      // Emit connection success
      client.emit('connected', {
        userId: participantUserId,
        participantId,
        projectId,
        timestamp: new Date(),
      });

    } catch (error) {
      this.logger.error(`❌ Mobile connection error: ${error.message}`, error.stack);
      client.emit('error', { 
        message: 'Connection failed',
        code: 'CONNECTION_ERROR'
      });
      client.disconnect();
    }
  }

  /**
   * Send message from mobile app (no authentication required)
   * @param client - The socket client
   * @param data - Message data including participantId and projectId
   */
  @SubscribeMessage('mobileSendMessage')
  async handleMobileSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { 
      chatId: number; 
      content: string; 
      type?: MessageType; 
      metadata?: Record<string, any>;
      participantId: string;
      projectId: number;
    },
  ) {
    try {
      // Verify participantId matches the connected user
      const connectedUser = this.connectedUsers.get(client.id);
      if (!connectedUser) {
        client.emit('error', { message: 'Not connected', code: 'NOT_CONNECTED' });
        return;
      }

      // Get the participant user ID from the participant ID string
      const participantUserId = await this.projectParticipantService.getParticipantUserId(data.participantId, data.projectId);
      
      // Verify the participant ID matches the connected user
      if (connectedUser.userId !== participantUserId) {
        client.emit('error', { message: 'Participant ID mismatch', code: 'ID_MISMATCH' });
        return;
      }

      // Create message DTO
      const messageDto: CreateMessageDto = {
        chatId: data.chatId,
        content: data.content,
        type: data.type || MessageType.TEXT,
        metadata: data.metadata,
      };

      // Create message
      const message = await this.chatService.createMessage(messageDto, participantUserId);

      // Broadcast message to chat room
      this.server.to(`chat_${data.chatId}`).emit('newMessage', {
        message,
        chatId: data.chatId,
        timestamp: new Date(),
      });

      this.logger.log(`📱 Mobile message sent: ${message.id} in chat ${data.chatId} by participant ${data.participantId}`);

    } catch (error) {
      this.logger.error(`❌ Mobile send message error: ${error.message}`, error.stack);
      client.emit('error', { 
        message: 'Failed to send message',
        code: 'SEND_ERROR'
      });
    }
  }

  /**
   * Join chat from mobile app (no authentication required)
   * @param client - The socket client
   * @param data - Chat data including participantId and projectId
   */
  @SubscribeMessage('mobileJoinChat')
  async handleMobileJoinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { 
      chatId: number;
      participantId: string;
      projectId: number;
    },
  ) {
    try {
      // Verify participantId matches the connected user
      const connectedUser = this.connectedUsers.get(client.id);
      if (!connectedUser) {
        client.emit('error', { message: 'Not connected', code: 'NOT_CONNECTED' });
        return;
      }

      // Get the participant user ID from the participant ID string
      const participantUserId = await this.projectParticipantService.getParticipantUserId(data.participantId, data.projectId);
      
      // Verify the participant ID matches the connected user
      if (connectedUser.userId !== participantUserId) {
        client.emit('error', { message: 'Participant ID mismatch', code: 'ID_MISMATCH' });
        return;
      }

      // Join the chat room
      client.join(`chat_${data.chatId}`);

      // Notify other participants
      client.to(`chat_${data.chatId}`).emit('userJoinedChat', {
        chatId: data.chatId,
        userId: participantUserId,
        participantId: data.participantId,
        timestamp: new Date(),
      });

      this.logger.log(`📱 Mobile user ${data.participantId} joined chat ${data.chatId}`);

    } catch (error) {
      this.logger.error(`❌ Mobile join chat error: ${error.message}`, error.stack);
      client.emit('error', { 
        message: 'Failed to join chat',
        code: 'JOIN_ERROR'
      });
    }
  }

  /**
   * Leave chat from mobile app (no authentication required)
   * @param client - The socket client
   * @param data - Chat data including participantId and projectId
   */
  @SubscribeMessage('mobileLeaveChat')
  async handleMobileLeaveChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { 
      chatId: number;
      participantId: string;
      projectId: number;
    },
  ) {
    try {
      // Verify participantId matches the connected user
      const connectedUser = this.connectedUsers.get(client.id);
      if (!connectedUser) {
        client.emit('error', { message: 'Not connected', code: 'NOT_CONNECTED' });
        return;
      }

      // Get the participant user ID from the participant ID string
      const participantUserId = await this.projectParticipantService.getParticipantUserId(data.participantId, data.projectId);
      
      // Verify the participant ID matches the connected user
      if (connectedUser.userId !== participantUserId) {
        client.emit('error', { message: 'Participant ID mismatch', code: 'ID_MISMATCH' });
        return;
      }

      // Leave the chat room
      client.leave(`chat_${data.chatId}`);

      // Notify other participants
      client.to(`chat_${data.chatId}`).emit('userLeftChat', {
        chatId: data.chatId,
        userId: participantUserId,
        participantId: data.participantId,
        timestamp: new Date(),
      });

      this.logger.log(`📱 Mobile user ${data.participantId} left chat ${data.chatId}`);

    } catch (error) {
      this.logger.error(`❌ Mobile leave chat error: ${error.message}`, error.stack);
      client.emit('error', { 
        message: 'Failed to leave chat',
        code: 'LEAVE_ERROR'
      });
    }
  }
} 
