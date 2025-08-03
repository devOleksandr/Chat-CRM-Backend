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
import { Logger } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ProjectService } from '../project/project.service';
import { ProjectParticipantService } from './services/project-participant.service';
import { ChatErrorHandler } from './handlers/chat-error.handler';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessageType } from './ports/message-repository.port';
import { OnlineStatusService } from './services/online-status.service';

/**
 * WebSocket Gateway for mobile app real-time chat functionality
 * Handles WebSocket connections, message broadcasting, and user status updates
 * No authentication required for mobile app usage
 */
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/mobile-chat',
})
export class MobileChatGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MobileChatGateway.name);
  private readonly connectedParticipants = new Map<string, { 
    socket: Socket; 
    participantId: string; 
    projectId: number; 
    userId: number;
  }>();

  constructor(
    private readonly chatService: ChatService,
    private readonly projectService: ProjectService,
    private readonly projectParticipantService: ProjectParticipantService,
    private readonly errorHandler: ChatErrorHandler,
    private readonly onlineStatusService: OnlineStatusService,
  ) {}

  /**
   * Initialize gateway and mark all users as offline
   * Called when the gateway starts up
   */
  afterInit() {
    this.logger.log('🚀 MobileChatGateway initialized, marking all users as offline...');
    this.onlineStatusService.markAllUsersOffline().catch(error => {
      this.logger.error('Failed to mark users offline on startup:', error);
    });
  }

  /**
   * Handle new WebSocket connections for mobile app
   * @param client - The connected socket client
   */
  async handleConnection(client: Socket) {
    try {
      this.logger.log(`🔌 New mobile WebSocket connection attempt from ${client.id}`);
      
      // Get participant info from handshake
      const participantId = client.handshake.auth.participantId;
      const projectId = client.handshake.auth.projectId;
      
      if (!participantId || !projectId) {
        this.logger.warn(`❌ Invalid mobile connection attempt from ${client.id} - missing participantId or projectId`);
        client.emit('error', { 
          message: 'participantId and projectId are required',
          code: 'MISSING_PARAMS'
        });
        client.disconnect();
        return;
      }

      // Get participant user ID
      const userId = await this.projectParticipantService.getParticipantUserId(participantId, projectId);

      // Store connected participant
      this.connectedParticipants.set(client.id, { 
        socket: client, 
        participantId, 
        projectId, 
        userId 
      });

      // Update user online status in database
      await this.onlineStatusService.updateUserOnlineStatus(userId, true);

      // Join participant's personal room for status updates
      client.join(`user_${userId}`);

      this.logger.log(`✅ Mobile participant connected: ${participantId} (user: ${userId}) in project: ${projectId}`);
      
      // Send connection confirmation
      client.emit('connected', { 
        participantId, 
        projectId, 
        userId,
        message: 'Successfully connected to mobile chat'
      });
    } catch (error) {
      this.logger.error(`Failed to handle mobile connection: ${error.message}`, error.stack);
      client.emit('error', { 
        message: 'Failed to authenticate participant',
        code: 'AUTH_FAILED'
      });
      client.disconnect();
    }
  }

  /**
   * Handle WebSocket disconnections for mobile app
   * @param client - The disconnected socket client
   */
  async handleDisconnect(client: Socket) {
    try {
      const participantInfo = this.connectedParticipants.get(client.id);
      if (participantInfo) {
        const { participantId, userId } = participantInfo;
        
        // Update user online status in database
        await this.onlineStatusService.updateUserOnlineStatus(userId, false);
        
        // Remove from connected participants
        this.connectedParticipants.delete(client.id);
        
        this.logger.log(`🔌 Mobile participant disconnected: ${participantId} (user: ${userId})`);
      }
    } catch (error) {
      this.logger.error(`Failed to handle mobile disconnection: ${error.message}`, error.stack);
    }
  }

  /**
   * Handle sending messages from mobile app
   * @param client - The socket client
   * @param data - Message data
   */
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
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
      const participantInfo = this.connectedParticipants.get(client.id);
      if (!participantInfo) {
        client.emit('error', { message: 'Not authenticated', code: 'NOT_AUTHENTICATED' });
        return;
      }

      // Verify participant ID matches
      if (participantInfo.participantId !== data.participantId) {
        client.emit('error', { message: 'Participant ID mismatch', code: 'PARTICIPANT_MISMATCH' });
        return;
      }

      // Get participant user ID
      const participantUserId = await this.projectParticipantService.getParticipantUserId(data.participantId, data.projectId);

      // Create message
      const message = await this.chatService.createMessage({
        chatId: data.chatId,
        content: data.content,
        type: data.type || MessageType.TEXT,
        metadata: data.metadata,
      }, participantUserId);

      // Get chat info for broadcasting
      const chat = await this.chatService.getChatById(data.chatId, participantUserId);
      
      // Broadcast message to chat room
      this.server.to(`chat_${data.chatId}`).emit('newMessage', {
        message,
        chatId: data.chatId,
        senderId: participantUserId,
      });

      // Send confirmation to sender
      client.emit('messageSent', {
        messageId: message.id,
        chatId: data.chatId,
        timestamp: message.createdAt,
      });

      this.logger.log(`📨 Mobile message sent: ${message.id} by participant ${data.participantId} in chat ${data.chatId}`);
    } catch (error) {
      this.logger.error(`Failed to send mobile message: ${error.message}`, error.stack);
      client.emit('error', { 
        message: 'Failed to send message',
        code: 'SEND_FAILED',
        details: error.message
      });
    }
  }

  /**
   * Handle joining chat room for mobile app
   * @param client - The socket client
   * @param data - Join data
   */
  @SubscribeMessage('joinChat')
  async handleJoinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { 
      chatId: number; 
      participantId: string; 
      projectId: number;
    },
  ) {
    try {
      const participantInfo = this.connectedParticipants.get(client.id);
      if (!participantInfo) {
        client.emit('error', { message: 'Not authenticated', code: 'NOT_AUTHENTICATED' });
        return;
      }

      // Verify participant ID matches
      if (participantInfo.participantId !== data.participantId) {
        client.emit('error', { message: 'Participant ID mismatch', code: 'PARTICIPANT_MISMATCH' });
        return;
      }

      // Get participant user ID
      const participantUserId = await this.projectParticipantService.getParticipantUserId(data.participantId, data.projectId);

      // Verify user has access to this chat
      const chat = await this.chatService.getChatById(data.chatId, participantUserId);

      // Join chat room
      client.join(`chat_${data.chatId}`);

      // Send confirmation
      client.emit('joinedChat', {
        chatId: data.chatId,
        participantId: data.participantId,
        message: `Joined chat ${data.chatId}`,
      });

      this.logger.log(`👥 Mobile participant ${data.participantId} joined chat ${data.chatId}`);
    } catch (error) {
      this.logger.error(`Failed to join mobile chat: ${error.message}`, error.stack);
      client.emit('error', { 
        message: 'Failed to join chat',
        code: 'JOIN_FAILED',
        details: error.message
      });
    }
  }

  /**
   * Handle leaving chat room for mobile app
   * @param client - The socket client
   * @param data - Leave data
   */
  @SubscribeMessage('leaveChat')
  async handleLeaveChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { 
      chatId: number; 
      participantId: string;
    },
  ) {
    try {
      const participantInfo = this.connectedParticipants.get(client.id);
      if (!participantInfo) {
        client.emit('error', { message: 'Not authenticated', code: 'NOT_AUTHENTICATED' });
        return;
      }

      // Verify participant ID matches
      if (participantInfo.participantId !== data.participantId) {
        client.emit('error', { message: 'Participant ID mismatch', code: 'PARTICIPANT_MISMATCH' });
        return;
      }

      // Leave chat room
      client.leave(`chat_${data.chatId}`);

      // Send confirmation
      client.emit('leftChat', {
        chatId: data.chatId,
        participantId: data.participantId,
        message: `Left chat ${data.chatId}`,
      });

      this.logger.log(`👋 Mobile participant ${data.participantId} left chat ${data.chatId}`);
    } catch (error) {
      this.logger.error(`Failed to leave mobile chat: ${error.message}`, error.stack);
      client.emit('error', { 
        message: 'Failed to leave chat',
        code: 'LEAVE_FAILED',
        details: error.message
      });
    }
  }

  /**
   * Get connected participants info
   * @returns Map of connected participants
   */
  getConnectedParticipants(): Map<string, { socket: Socket; participantId: string; projectId: number; userId: number }> {
    return this.connectedParticipants;
  }

  /**
   * Check if participant is online
   * @param participantId - The participant ID
   * @returns boolean
   */
  isParticipantOnline(participantId: string): boolean {
    for (const [_, info] of this.connectedParticipants) {
      if (info.participantId === participantId) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get participant online status
   * @param participantId - The participant ID
   * @param projectId - The project ID
   * @returns Promise<{ isOnline: boolean; lastSeen: Date | null }>
   */
  async getParticipantOnlineStatus(participantId: string, projectId: number): Promise<{ isOnline: boolean; lastSeen: Date | null }> {
    try {
      const userId = await this.projectParticipantService.getParticipantUserId(participantId, projectId);
      return await this.onlineStatusService.getUserOnlineStatus(userId);
    } catch (error) {
      this.logger.error(`Failed to get participant online status: ${error.message}`, error.stack);
      return { isOnline: false, lastSeen: null };
    }
  }
} 