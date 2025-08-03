import { 
  Controller, 
  Get, 
  Post, 
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
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

import { ProjectParticipantService } from '../services/project-participant.service';
import { CreateProjectParticipantDto } from '../dto/create-project-participant.dto';
import { ProjectParticipantResponseDto } from '../dto/project-participant-response.dto';

/**
 * Controller for handling project participant-related HTTP requests
 * Provides REST API endpoints for participant management
 */
@ApiTags('project-participants')
@ApiBearerAuth()
@Controller('project-participants')
@UseGuards(JwtAuthGuard)
export class ProjectParticipantController {
  constructor(
    private readonly projectParticipantService: ProjectParticipantService,
  ) {}

  /**
   * Create a new project participant (Admin only)
   * @param createParticipantDto - Participant creation data
   * @returns Promise<ProjectParticipantResponseDto> Newly created participant
   */
  @ApiOperation({
    summary: 'Create a new project participant (Admin)',
    description: 'Creates a new participant for a specific project. Admin authentication required.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Successfully created participant',
    type: ProjectParticipantResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid participant data or participant ID already exists',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User is not authenticated',
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createParticipant(
    @Body(ValidationPipe) createParticipantDto: CreateProjectParticipantDto,
    @Request() req: any,
  ): Promise<ProjectParticipantResponseDto> {
    // TODO: Add authorization check - verify that req.user.id owns the project
    // This should be implemented when project ownership validation is available
    
    return await this.projectParticipantService.createParticipant(createParticipantDto);
  }

  /**
   * Get all participants for a specific project
   * @param projectId - The project ID
   * @param limit - Maximum number of participants to return
   * @param offset - Number of participants to skip
   * @returns Promise<ProjectParticipantResponseDto[]> Array of participants
   */
  @ApiOperation({
    summary: 'Get all participants for a project',
    description: 'Retrieves a paginated list of all participants for a specific project',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved participants',
    type: [ProjectParticipantResponseDto],
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
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of participants to return (default: 20)',
    example: 20,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of participants to skip (default: 0)',
    example: 0,
  })
  @Get('project/:projectId')
  async getProjectParticipants(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
    @Query('offset', new ParseIntPipe({ optional: true })) offset: number = 0,
    @Request() req: any,
  ): Promise<ProjectParticipantResponseDto[]> {
    // TODO: Add authorization check - verify that req.user.id owns the project
    // This should be implemented when project ownership validation is available
    
    return await this.projectParticipantService.getProjectParticipants(
      projectId,
      req.user.id,
      limit,
      offset
    );
  }

  /**
   * Get a specific participant by ID
   * @param participantId - The participant ID
   * @returns Promise<ProjectParticipantResponseDto> Participant information
   */
  @ApiOperation({
    summary: 'Get participant by ID',
    description: 'Retrieves information about a specific project participant',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved participant',
    type: ProjectParticipantResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Participant not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User is not authenticated',
  })
  @ApiParam({
    name: 'participantId',
    description: 'ID of the participant',
    example: 1,
  })
  @Get(':participantId')
  async getParticipantById(
    @Param('participantId', ParseIntPipe) participantId: number,
    @Request() req: any,
  ): Promise<ProjectParticipantResponseDto> {
    // TODO: Add authorization check - verify that req.user.id owns the project
    // This should be implemented when project ownership validation is available
    
    return await this.projectParticipantService.getParticipantById(participantId, req.user.id);
  }

  /**
   * Get a participant by unique ID within a project
   * @param projectId - The project ID
   * @param uniqueId - The unique identifier
   * @returns Promise<ProjectParticipantResponseDto> Participant information
   */
  @ApiOperation({
    summary: 'Get participant by unique ID',
    description: 'Retrieves information about a participant using their unique identifier within a project',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved participant',
    type: ProjectParticipantResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Participant not found',
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
    name: 'uniqueId',
    description: 'Unique identifier of the participant',
    example: 'user123',
  })
  @Get('project/:projectId/unique/:uniqueId')
  async getParticipantByUniqueId(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('uniqueId') uniqueId: string,
    @Request() req: any,
  ): Promise<ProjectParticipantResponseDto> {
    // TODO: Add authorization check - verify that req.user.id owns the project
    // This should be implemented when project ownership validation is available
    
    return await this.projectParticipantService.getParticipantByParticipantId(uniqueId, projectId, req.user.id);
  }

  /**
   * Delete a project participant
   * @param participantId - The participant ID to delete
   * @returns Promise<void>
   */
  @ApiOperation({
    summary: 'Delete project participant',
    description: 'Removes a participant from a project',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Successfully deleted participant',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Participant not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User is not authenticated',
  })
  @ApiParam({
    name: 'participantId',
    description: 'ID of the participant to delete',
    example: 1,
  })
  @Delete(':participantId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteParticipant(
    @Param('participantId', ParseIntPipe) participantId: number,
    @Request() req: any,
  ): Promise<void> {
    // TODO: Add authorization check - verify that req.user.id owns the project
    // This should be implemented when project ownership validation is available
    
    await this.projectParticipantService.deleteParticipant(participantId, req.user.id);
  }

  /**
   * Get the count of participants in a project
   * @param projectId - The project ID
   * @returns Promise<{ count: number }> Count of participants
   */
  @ApiOperation({
    summary: 'Get participants count',
    description: 'Returns the total number of participants in a project',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved participants count',
    schema: {
      type: 'object',
      properties: {
        count: {
          type: 'number',
          example: 15,
        },
      },
    },
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
  @Get('project/:projectId/count')
  async getParticipantsCount(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Request() req: any,
  ): Promise<{ count: number }> {
    // TODO: Add authorization check - verify that req.user.id owns the project
    // This should be implemented when project ownership validation is available
    
    const count = await this.projectParticipantService.getParticipantsCount(projectId, req.user.id);
    return { count };
  }
} 