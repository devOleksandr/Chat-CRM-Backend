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
import { ProjectService } from '../../project/project.service';
import { ProjectParticipantService } from '../services/project-participant.service';
import { CreateMessageViaApiDto } from '../dto/create-message.dto';
import { ChatResponseDto } from '../dto/chat-response.dto';
import { MessageResponseDto, PaginatedMessagesResponseDto } from '../dto/message-response.dto';

/**
 * Controller for handling mobile app chat-related HTTP requests
 * Provides REST API endpoints for chat operations without authentication
 * Used by mobile applications that don't require user authentication
 */
@ApiTags('mobile-chat')
@Controller('mobile-chat')
export class MobileChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly projectService: ProjectService,
    private readonly projectParticipantService: ProjectParticipantService,
  ) {}

  /**
   * Get or create chat between admin and participant (Mobile App - No Authentication)
   * @param projectId - The project ID
   * @param participantId - The participant ID
   * @returns Promise<ChatResponseDto> Chat response
   */
  @ApiOperation({
    summary: 'Get or create chat (Mobile App)',
    description: 'Gets or creates a chat between admin and participant. No authentication required for mobile app usage.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved or created chat',
    type: ChatResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid project or participant data',
  })
  @ApiParam({
    name: 'projectId',
    description: 'ID of the project',
    example: 1,
  })
  @ApiParam({
    name: 'participantId',
    description: 'External participant ID (string) provided by mobile app',
    example: 'mobile_user_123',
  })
  @Post('project/:projectId/participant/:participantId')
  async getOrCreateChat(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('participantId') participantId: string,
  ): Promise<ChatResponseDto> {
    // Get the admin ID of the project
    const adminId = await this.projectService.getProjectAdminId(projectId);
    
    // Get the participant user ID from the participant ID string
    const participantUserId = await this.projectParticipantService.getParticipantUserId(participantId, projectId);
    
    return await this.chatService.getOrCreateChat(projectId, adminId, participantUserId);
  }

  /**
   * Get messages for a specific chat (Mobile App - No Authentication)
   * @param chatId - The chat ID
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
    name: 'projectId',
    required: true,
    description: 'ID of the project',
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
    @Query('participantId') participantId: string,
    @Query('projectId', ParseIntPipe) projectId: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
    @Query('offset', new ParseIntPipe({ optional: true })) offset: number = 0,
  ): Promise<PaginatedMessagesResponseDto> {
    // Get the participant user ID from the participant ID string
    const participantUserId = await this.projectParticipantService.getParticipantUserId(participantId, projectId);
    
    return await this.chatService.getMessagesByChatId(chatId, participantUserId, limit, offset);
  }

  /**
   * Send a message to a chat (Mobile App - No Authentication)
   * @param chatId - The chat ID
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
    name: 'projectId',
    required: true,
    description: 'ID of the project',
    example: 1,
  })
  @Post(':chatId/messages')
  @HttpCode(HttpStatus.CREATED)
  async createMessage(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Query('participantId') participantId: string,
    @Query('projectId', ParseIntPipe) projectId: number,
    @Body(ValidationPipe) createMessageDto: CreateMessageViaApiDto,
  ): Promise<MessageResponseDto> {
    // Get the participant user ID from the participant ID string
    const participantUserId = await this.projectParticipantService.getParticipantUserId(participantId, projectId);
    
    // Add chatId to the DTO to match CreateMessageDto interface
    const fullMessageDto = {
      ...createMessageDto,
      chatId,
    };
    
    return await this.chatService.createMessage(fullMessageDto, participantUserId);
  }
} 