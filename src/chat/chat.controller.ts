import { 
  Controller, 
  Get, 
  Post, 
  Put,
  Delete,
  Body, 
  Param, 
  Query, 
  UseGuards, 
  Request, 
  HttpCode, 
  HttpStatus,
  ParseIntPipe,
  ValidationPipe,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiParam, 
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ProjectService } from '../project/project.service';
import { ProjectParticipantService } from '../project/services/project-participant.service';
import { OnlineStatusService } from './services/online-status.service';
import { CreateMessageDto, CreateMessageViaApiDto } from './dto/create-message.dto';
import { ChatResponseDto, ChatWithMetadataResponseDto } from './dto/chat-response.dto';
import { MessageResponseDto, PaginatedMessagesResponseDto } from './dto/message-response.dto';
import { ProjectChatFilterDto } from './dto/project-chat-filter.dto';
import { calculateChatAge, generateChatMessage } from './utils/chat-utils';

/**
 * Controller for handling chat-related HTTP requests
 * Provides REST API endpoints for chat management and messaging
 */
@ApiTags('chat')
@ApiBearerAuth()
@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly projectService: ProjectService,
    private readonly projectParticipantService: ProjectParticipantService,
    private readonly onlineStatusService: OnlineStatusService,
    private readonly chatGateway: ChatGateway,
  ) {}

  /**
   * Get all chats for the authenticated user
   * @param req - The request object containing user information
   * @param filters - Filter parameters including projectId, limit, offset
   * @returns Promise<ChatResponseDto[]> Array of chat responses
   */
  @ApiOperation({
    summary: 'Get all chats for the authenticated user',
    description: 'Retrieves a paginated list of all chats where the user is either admin or participant. User ID is automatically extracted from JWT token.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved chats',
    type: [ChatResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User is not authenticated',
  })
  @ApiQuery({
    name: 'projectId',
    required: false,
    type: Number,
    description: 'Filter chats by project ID',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of chats to return (default: 20)',
    example: 20,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of chats to skip (default: 0)',
    example: 0,
  })
  @Get()
  async getChats(
    @Request() req: any,
    @Query() filters: ProjectChatFilterDto,
  ): Promise<ChatResponseDto[]> {
    return await this.chatService.getChatsForUser(
      req.user.id,
      filters.projectId,
      filters.limit,
      filters.offset
    );
  }

  /**
   * Get all chats for a specific project
   * @param projectId - The project ID
   * @param req - The request object containing user information
   * @param filters - Filter parameters including participantId, limit, offset
   * @returns Promise<ChatResponseDto[]> Array of chat responses
   */
  @ApiOperation({
    summary: 'Get all chats for a specific project',
    description: 'Retrieves a paginated list of all chats in a specific project. Admin ID is automatically extracted from JWT token.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved project chats',
    type: [ChatResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User is not authenticated',
  })
  @ApiParam({
    name: 'projectId',
    description: 'ID of the project',
    example: 1,
  })

  @ApiQuery({
    name: 'participantId',
    required: false,
    type: Number,
    description: 'Filter chats by participant ID',
    example: 2,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of chats to return (default: 20)',
    example: 20,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of chats to skip (default: 0)',
    example: 0,
  })
  @Get('project/:projectId')
  async getProjectChats(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Request() req: any,
    @Query('participantId', new ParseIntPipe({ optional: true })) participantId?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
    @Query('offset', new ParseIntPipe({ optional: true })) offset: number = 0,
  ): Promise<ChatResponseDto[]> {
    // Use adminId from JWT token instead of query parameter for security
    const adminId = req.user.id;
    
    return await this.chatService.getChatsForProject(
      projectId,
      adminId,
      participantId,
      limit,
      offset
    );
  }

  /**
   * Get a specific chat by ID
   * @param chatId - The chat ID
   * @param req - The request object containing user information
   * @returns Promise<ChatResponseDto> Chat response
   */
  @ApiOperation({
    summary: 'Get a specific chat by ID',
    description: 'Retrieves information about a specific chat. User ID is automatically extracted from JWT token for access control.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved chat',
    type: ChatResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Chat not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have access to this chat',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User is not authenticated',
  })
  @ApiParam({
    name: 'chatId',
    description: 'ID of the chat',
    example: 1,
  })
  @Get(':chatId')
  async getChatById(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Request() req: any,
  ): Promise<ChatResponseDto> {
    return await this.chatService.getChatById(chatId, req.user.id);
  }

  /**
   * Create or get chat between admin and participant
   * @param projectId - The project ID
   * @param participantId - The participant ID
   * @param req - The request object containing user information
   * @returns Promise<ChatWithMetadataResponseDto> Chat response with metadata
   */
  @ApiOperation({
    summary: 'Create or get chat with participant',
    description: 'Creates a new chat or returns existing one between admin and participant. Admin ID is automatically extracted from JWT token. Returns metadata indicating whether chat was created or retrieved.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved or created chat',
    type: ChatWithMetadataResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User is not authenticated',
  })
  @ApiParam({
    name: 'projectId',
    description: 'ID of the project',
    example: 1,
  })
  @ApiParam({
    name: 'participantId',
    description: 'ID of the participant',
    example: 2,
  })
  @Post('project/:projectId/participant/:participantId')
  async createOrGetChat(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('participantId', ParseIntPipe) participantId: number,
    @Request() req: any,
  ): Promise<ChatWithMetadataResponseDto> {
    // TODO: Add authorization check - verify that req.user.id is admin and owns the project
    // This should be implemented when project ownership validation is available
    
    console.log(`🔍 Admin createOrGetChat called:`, {
      projectId,
      adminId: req.user.id,
      participantId,
      timestamp: new Date().toISOString()
    });
    
    const result = await this.chatService.getOrCreateChat(projectId, req.user.id, participantId);
    const chatAge = calculateChatAge(result.chat.createdAt);
    const message = generateChatMessage(result.isNewChat, chatAge);
    
    return {
      chat: result.chat,
      metadata: {
        isNewChat: result.isNewChat,
        message,
        createdAt: result.chat.createdAt,
        accessedAt: new Date(),
      },
    };
  }

  /**
   * Get messages for a specific chat
   * @param chatId - The chat ID
   * @param req - The request object containing user information
   * @param limit - Maximum number of messages to return
   * @param offset - Number of messages to skip
   * @returns Promise<PaginatedMessagesResponseDto> Paginated messages response
   */
  @ApiOperation({
    summary: 'Get messages for a chat',
    description: 'Retrieves a paginated list of messages for a specific chat. User ID is automatically extracted from JWT token for access control.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved messages',
    type: PaginatedMessagesResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Chat not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have access to this chat',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User is not authenticated',
  })
  @ApiParam({
    name: 'chatId',
    description: 'ID of the chat',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of messages to return (default: 20)',
    example: 20,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of messages to skip (default: 0)',
    example: 0,
  })
  @Get(':chatId/messages')
  async getMessages(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Request() req: any,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
    @Query('offset', new ParseIntPipe({ optional: true })) offset: number = 0,
  ): Promise<PaginatedMessagesResponseDto> {
    return await this.chatService.getMessagesByChatId(chatId, req.user.id, limit, offset);
  }



  /**
   * Send a message to a chat
   * @param chatId - The chat ID
   * @param createMessageDto - Message creation data
   * @param req - The request object containing user information
   * @returns Promise<MessageResponseDto> Newly created message response
   */
  @ApiOperation({
    summary: 'Send a message to a chat',
    description: 'Creates a new message in a specific chat. User ID is automatically extracted from JWT token.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Successfully created message',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Chat not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have access to this chat',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid message content or spam protection triggered',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User is not authenticated',
  })
  @ApiParam({
    name: 'chatId',
    description: 'ID of the chat',
    example: 1,
  })
  @Post(':chatId/messages')
  @HttpCode(HttpStatus.CREATED)
  async createMessage(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Body(ValidationPipe) createMessageDto: CreateMessageViaApiDto,
    @Request() req: any,
  ): Promise<MessageResponseDto> {
    const messageDto = {
      ...createMessageDto,
      chatId,
    };
    
    const message = await this.chatService.createMessage(messageDto, req.user.id);
    
    const payload = { chatId, message };
    // Emit to the chat room so clients receive updates immediately
    this.chatGateway.server.to(`chat_${chatId}`).emit('newMessage', payload);
    this.chatGateway.server.to(`chat_${chatId}`).emit('messageCreated', payload);
    this.chatGateway.server.to(`chat_${chatId}`).emit('message', payload);
    
    return message;
  }



  /**
   * Mark a chat as read
   * @param chatId - The chat ID
   * @param req - The request object containing user information
   * @returns Promise<void>
   */
  @ApiOperation({
    summary: 'Mark chat as read',
    description: 'Marks all messages in a chat as read for the authenticated user. User ID is automatically extracted from JWT token.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully marked chat as read',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Chat not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have access to this chat',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User is not authenticated',
  })
  @ApiParam({
    name: 'chatId',
    description: 'ID of the chat',
    example: 1,
  })
  @Put(':chatId/read')
  async markChatAsRead(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Request() req: any,
  ): Promise<void> {
    await this.chatService.markChatAsRead(chatId, req.user.id);
  }

  /**
   * Deactivate a chat
   * @param chatId - The chat ID
   * @param req - The request object containing user information
   * @returns Promise<void>
   */
  @ApiOperation({
    summary: 'Deactivate a chat',
    description: 'Deactivates a chat (soft delete). User ID is automatically extracted from JWT token for access control.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully deactivated chat',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Chat not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have access to this chat',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User is not authenticated',
  })
  @ApiParam({
    name: 'chatId',
    description: 'ID of the chat',
    example: 1,
  })
  @Delete(':chatId')
  async deactivateChat(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Request() req: any,
  ): Promise<void> {
    await this.chatService.deactivateChat(chatId, req.user.id);
  }



  /**
   * Get current user online status
   * @param req - The request object containing user information
   * @returns Promise<{ isOnline: boolean; lastSeen: Date | null }> Online status
   */
  @ApiOperation({
    summary: 'Get current user online status',
    description: 'Retrieves the online status of the authenticated user',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved online status',
    schema: {
      type: 'object',
      properties: {
        isOnline: {
          type: 'boolean',
          example: true,
        },
        lastSeen: {
          type: 'string',
          format: 'date-time',
          example: '2025-01-15T10:00:00.000Z',
          nullable: true,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User is not authenticated',
  })
  @Get('status')
  async getCurrentUserOnlineStatus(
    @Request() req: any,
  ): Promise<{ isOnline: boolean; lastSeen: Date | null }> {
    return await this.onlineStatusService.getUserOnlineStatus(req.user.id);
  }

} 
