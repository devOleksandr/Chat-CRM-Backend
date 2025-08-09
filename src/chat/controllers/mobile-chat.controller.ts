import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query, 
  HttpCode, 
  HttpStatus,
  ParseIntPipe,
  ValidationPipe,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiQuery,
} from '@nestjs/swagger';

import { ChatService } from '../chat.service';
import { ChatGateway } from '../chat.gateway';
import { ProjectService } from '../../project/project.service';
import { ProjectParticipantService } from '../../project/services/project-participant.service';
import { CreateMessageViaApiDto } from '../dto/create-message.dto';
import { ChatWithMetadataResponseDto } from '../dto/chat-response.dto';
import { MessageResponseDto, PaginatedMessagesResponseDto } from '../dto/message-response.dto';
import { calculateChatAge, generateChatMessage } from '../utils/chat-utils';

/**
 * Controller for handling mobile chat-related HTTP requests (No Authentication Required)
 * Provides REST API endpoints for mobile app chat functionality without JWT authentication
 */
@ApiTags('mobile-chat')
@Controller('mobile-chat')
export class MobileChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly projectService: ProjectService,
    private readonly projectParticipantService: ProjectParticipantService,
    private readonly chatGateway: ChatGateway,
  ) {}

  /**
   * Get or create chat between admin and participant (Mobile App - No Authentication)
   * @param projectUniqueId - The project unique ID
   * @param participantId - The participant ID string
   * @returns Promise<ChatWithMetadataResponseDto> Chat response with metadata
   */
  @ApiOperation({
    summary: 'Get or create chat (Mobile App)',
    description: 'Gets or creates a chat between admin and participant. No authentication required for mobile app usage. Returns metadata indicating whether chat was created or retrieved.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved or created chat',
    type: ChatWithMetadataResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid project or participant data',
  })
  @ApiParam({
    name: 'projectUniqueId',
    description: 'Unique ID of the project',
    example: 'PROJ-001',
  })
  @ApiParam({
    name: 'participantId',
    description: 'External participant ID (string) provided by mobile app',
    example: 'mobile_user_123',
  })
  @Post('project/:projectUniqueId/participant/:participantId')
  async createOrGetChatMobile(
    @Param('projectUniqueId') projectUniqueId: string,
    @Param('participantId') participantId: string,
  ): Promise<ChatWithMetadataResponseDto> {
    // Get the project and admin ID
    const project = await this.projectService.getProjectByUniqueIdPublic(projectUniqueId);
    const projectId = project.id;
    const adminId = project.createdBy.id;
    
    // Get the participant user ID from the participant ID string
    const participantUserId = await this.projectParticipantService.getParticipantUserIdByProjectUniqueId(participantId, projectUniqueId);
    
    const result = await this.chatService.getOrCreateChat(projectId, adminId, participantUserId);
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
   * Get messages for a chat (Mobile App - No Authentication)
   * @param chatId - The chat ID
   * @param participantId - The participant ID string
   * @param projectUniqueId - The project unique ID
   * @param limit - Maximum number of messages to return
   * @param offset - Number of messages to skip
   * @returns Promise<PaginatedMessagesResponseDto> Paginated messages response
   */
  @ApiOperation({
    summary: 'Get messages for a chat (Mobile App)',
    description: 'Retrieves a paginated list of messages for a specific chat. No authentication required for mobile app usage.',
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
  @ApiParam({
    name: 'chatId',
    description: 'ID of the chat',
    example: 1,
  })
  @ApiQuery({
    name: 'participantId',
    required: true,
    description: 'External participant ID (string) provided by mobile app',
    example: 'mobile_user_123',
  })
  @ApiQuery({
    name: 'projectUniqueId',
    required: true,
    description: 'Unique ID of the project',
    example: 'PROJ-001',
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
  async getMessagesMobile(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Query('participantId') participantId: string,
    @Query('projectUniqueId') projectUniqueId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
    @Query('offset', new ParseIntPipe({ optional: true })) offset: number = 0,
  ): Promise<PaginatedMessagesResponseDto> {
    // Get the participant user ID from the participant ID string
    const participantUserId = await this.projectParticipantService.getParticipantUserIdByProjectUniqueId(participantId, projectUniqueId);
    
    return await this.chatService.getMessagesByChatId(chatId, participantUserId, limit, offset);
  }

  /**
   * Send a message to a chat (Mobile App - No Authentication)
   * @param chatId - The chat ID
   * @param participantId - The participant ID string
   * @param projectUniqueId - The project unique ID
   * @param createMessageDto - Message creation data
   * @returns Promise<MessageResponseDto> Newly created message response
   */
  @ApiOperation({
    summary: 'Send a message to a chat (Mobile App)',
    description: 'Creates a new message in a specific chat. No authentication required for mobile app usage.',
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
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid message content or spam protection triggered',
  })
  @ApiParam({
    name: 'chatId',
    description: 'ID of the chat',
    example: 1,
  })
  @ApiQuery({
    name: 'participantId',
    required: true,
    description: 'External participant ID (string) provided by mobile app',
    example: 'mobile_user_123',
  })
  @ApiQuery({
    name: 'projectUniqueId',
    required: true,
    description: 'Unique ID of the project',
    example: 'PROJ-001',
  })
  @Post(':chatId/messages')
  @HttpCode(HttpStatus.CREATED)
  async createMessageMobile(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Query('participantId') participantId: string,
    @Query('projectUniqueId') projectUniqueId: string,
    @Body(ValidationPipe) createMessageDto: CreateMessageViaApiDto,
  ): Promise<MessageResponseDto> {
    // Get the participant user ID from the participant ID string
    const participantUserId = await this.projectParticipantService.getParticipantUserIdByProjectUniqueId(participantId, projectUniqueId);
    
    // Add chatId to the DTO to match CreateMessageDto interface
    const fullMessageDto = {
      ...createMessageDto,
      chatId,
    };
    
    const message = await this.chatService.createMessage(fullMessageDto, participantUserId);
    
    const payload = { chatId, message };
    // Emit to the chat room so admin clients in `chat_{chatId}` receive updates immediately
    this.chatGateway.server.to(`chat_${chatId}`).emit('newMessage', payload);
    this.chatGateway.server.to(`chat_${chatId}`).emit('messageCreated', payload);
    this.chatGateway.server.to(`chat_${chatId}`).emit('message', payload);
    
    return message;
  }
}