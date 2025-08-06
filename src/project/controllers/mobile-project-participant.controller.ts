import { 
  Controller, 
  Post, 
  Body, 
  HttpCode, 
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
} from '@nestjs/swagger';

import { ProjectParticipantService } from '../services/project-participant.service';
import { CreateProjectParticipantDto } from '../dto/create-project-participant.dto';
import { ProjectParticipantResponseDto } from '../dto/project-participant-response.dto';

/**
 * Controller for handling mobile project participant-related HTTP requests (No Authentication Required)
 * Provides REST API endpoints for mobile app participant creation without JWT authentication
 */
@ApiTags('mobile-project-participants')
@Controller('mobile-project-participants')
export class MobileProjectParticipantController {
  constructor(
    private readonly projectParticipantService: ProjectParticipantService,
  ) {}

  /**
   * Create a new project participant (Mobile App - No Authentication)
   * @param createParticipantDto - Participant creation data
   * @returns Promise<ProjectParticipantResponseDto> Newly created participant
   */
  @ApiOperation({
    summary: 'Create a new project participant (Mobile App)',
    description: 'Creates a new participant for a specific project with external participant ID. No authentication required for mobile app usage.',
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
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createParticipantMobile(
    @Body(ValidationPipe) createParticipantDto: CreateProjectParticipantDto,
  ): Promise<ProjectParticipantResponseDto> {
    return await this.projectParticipantService.createParticipant(createParticipantDto);
  }
}