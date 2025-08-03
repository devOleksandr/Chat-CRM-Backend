import { Injectable, Logger, BadRequestException, NotFoundException, ForbiddenException, Inject } from '@nestjs/common';
import { ProjectParticipantRepositoryPort, PROJECT_PARTICIPANT_REPOSITORY_PORT } from '../ports/project-participant-repository.port';
import { CreateProjectParticipantDto } from '../dto/create-project-participant.dto';
import { ProjectParticipantResponseDto } from '../dto/project-participant-response.dto';
import { ProjectService } from '../project.service';

/**
 * Service for managing project participants
 * Handles business logic for participant creation, retrieval, and validation
 */
@Injectable()
export class ProjectParticipantService {
  private readonly logger = new Logger(ProjectParticipantService.name);

  constructor(
    @Inject(PROJECT_PARTICIPANT_REPOSITORY_PORT)
    private readonly projectParticipantRepository: ProjectParticipantRepositoryPort,
    private readonly projectService: ProjectService,
  ) {}

  /**
   * Create a new project participant
   * @param createParticipantDto - Participant creation data
   * @param adminId - Optional admin ID for authorization (for mobile app, this is not provided)
   * @returns Promise<ProjectParticipantResponseDto> Newly created participant
   */
  async createParticipant(createParticipantDto: CreateProjectParticipantDto, adminId?: number): Promise<ProjectParticipantResponseDto> {
    try {
      this.logger.log(`Creating participant with participantId: ${createParticipantDto.participantId} for project: ${createParticipantDto.projectUniqueId}`);

      // Get project ID from unique ID
      const project = await this.projectService.getProjectByUniqueIdPublic(createParticipantDto.projectUniqueId);
      const projectId = project.id;

      // If adminId is provided, verify project ownership
      if (adminId) {
        await this.verifyProjectOwnership(projectId, adminId);
      }

      // Validate participant ID availability (check if it already exists in this project)
      const isAvailable = await this.projectParticipantRepository.isParticipantIdAvailable(
        createParticipantDto.participantId,
        projectId
      );

      if (!isAvailable) {
        throw new BadRequestException(`Participant with ID '${createParticipantDto.participantId}' already exists in this project`);
      }

      // Create participant
      const participant = await this.projectParticipantRepository.createParticipant({
        projectId: projectId,
        participantId: createParticipantDto.participantId,
        firstName: createParticipantDto.firstName || 'Anonymous',
        lastName: createParticipantDto.lastName || 'User',
        email: createParticipantDto.email,
      });

      // Map to response DTO
      const responseDto = this.mapParticipantToResponseDto(participant);

      this.logger.log(`✅ Successfully created participant: ${responseDto.id} with participantId: ${responseDto.participantId}`);
      return responseDto;
    } catch (error) {
      this.logger.error(`Failed to create participant: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get all participants for a specific project
   * @param projectId - The project ID
   * @param adminId - The admin ID (for authorization)
   * @param limit - Maximum number of participants to return
   * @param offset - Number of participants to skip
   * @returns Promise<ProjectParticipantResponseDto[]> Array of participants
   */
  async getProjectParticipants(
    projectId: number,
    adminId: number,
    limit: number = 20,
    offset: number = 0
  ): Promise<ProjectParticipantResponseDto[]> {
    try {
      this.logger.log(`Getting participants for project: ${projectId} (admin: ${adminId})`);

      // Verify project ownership
      await this.verifyProjectOwnership(projectId, adminId);

      const participants = await this.projectParticipantRepository.findParticipantsByProjectId(projectId, {
        projectId,
        adminId,
        limit,
        offset,
      });

      const responseDtos = participants.map(participant => this.mapParticipantToResponseDto(participant));

      this.logger.log(`✅ Found ${responseDtos.length} participants for project: ${projectId}`);
      return responseDtos;
    } catch (error) {
      this.logger.error(`Failed to get project participants: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get a specific participant by ID
   * @param participantId - The participant ID
   * @param adminId - The admin ID (for authorization)
   * @returns Promise<ProjectParticipantResponseDto> Participant information
   */
  async getParticipantById(participantId: number, adminId: number): Promise<ProjectParticipantResponseDto> {
    try {
      this.logger.log(`Getting participant: ${participantId} (admin: ${adminId})`);

      const participant = await this.projectParticipantRepository.findParticipantById(participantId);

      if (!participant) {
        throw new NotFoundException(`Participant with ID ${participantId} not found`);
      }

      // Verify project ownership
      await this.verifyProjectOwnership(participant.projectId, adminId);

      const responseDto = this.mapParticipantToResponseDto(participant);

      this.logger.log(`✅ Found participant: ${responseDto.id} with participantId: ${responseDto.participantId}`);
      return responseDto;
    } catch (error) {
      this.logger.error(`Failed to get participant by ID: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get a participant by participant ID within a project
   * @param participantId - The participant identifier
   * @param projectId - The project ID
   * @param adminId - The admin ID (for authorization)
   * @returns Promise<ProjectParticipantResponseDto> Participant information
   */
  async getParticipantByParticipantId(participantId: string, projectId: number, adminId: number): Promise<ProjectParticipantResponseDto> {
    try {
      this.logger.log(`Getting participant with participantId: ${participantId} in project: ${projectId} (admin: ${adminId})`);

      // Verify project ownership
      await this.verifyProjectOwnership(projectId, adminId);

      const participant = await this.projectParticipantRepository.findParticipantByParticipantId(participantId, projectId);

      if (!participant) {
        throw new NotFoundException(`Participant with ID '${participantId}' not found in project ${projectId}`);
      }

      const responseDto = this.mapParticipantToResponseDto(participant);

      this.logger.log(`✅ Found participant: ${responseDto.id} with participantId: ${responseDto.participantId}`);
      return responseDto;
    } catch (error) {
      this.logger.error(`Failed to get participant by participant ID: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete a project participant
   * @param participantId - The participant ID to delete
   * @param adminId - The admin ID (for authorization)
   * @returns Promise<void>
   */
  async deleteParticipant(participantId: number, adminId: number): Promise<void> {
    try {
      this.logger.log(`Deleting participant: ${participantId} (admin: ${adminId})`);

      // Verify participant exists
      const participant = await this.projectParticipantRepository.findParticipantById(participantId);

      if (!participant) {
        throw new NotFoundException(`Participant with ID ${participantId} not found`);
      }

      // Verify project ownership
      await this.verifyProjectOwnership(participant.projectId, adminId);

      await this.projectParticipantRepository.deleteParticipant(participantId);

      this.logger.log(`✅ Successfully deleted participant: ${participantId}`);
    } catch (error) {
      this.logger.error(`Failed to delete participant: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get the count of participants in a project
   * @param projectId - The project ID
   * @param adminId - The admin ID (for authorization)
   * @returns Promise<number> Count of participants
   */
  async getParticipantsCount(projectId: number, adminId: number): Promise<number> {
    try {
      // Verify project ownership
      await this.verifyProjectOwnership(projectId, adminId);

      const count = await this.projectParticipantRepository.getParticipantsCount(projectId);

      this.logger.log(`Project ${projectId} has ${count} participants`);
      return count;
    } catch (error) {
      this.logger.error(`Failed to get participants count: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get participant user ID by participant ID string
   * @param participantId - The participant ID string (external ID)
   * @param projectId - The project ID
   * @returns Promise<number> User ID of the participant
   */
  async getParticipantUserId(participantId: string, projectId: number): Promise<number> {
    try {
      this.logger.log(`Getting user ID for participant: ${participantId} in project: ${projectId}`);

      const participant = await this.projectParticipantRepository.findParticipantByParticipantId(participantId, projectId);

      if (!participant) {
        throw new NotFoundException(`Participant with ID '${participantId}' not found in project ${projectId}`);
      }

      const userId = participant.userId;
      this.logger.log(`✅ Found user ID: ${userId} for participant: ${participantId}`);
      return userId;
    } catch (error) {
      this.logger.error(`Failed to get participant user ID: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get participant user ID by participant ID string and project unique ID
   * @param participantId - The participant ID string (external ID)
   * @param projectUniqueId - The project unique ID
   * @returns Promise<number> User ID of the participant
   */
  async getParticipantUserIdByProjectUniqueId(participantId: string, projectUniqueId: string): Promise<number> {
    try {
      this.logger.log(`Getting user ID for participant: ${participantId} in project: ${projectUniqueId}`);

      // Get project ID from unique ID
      const project = await this.projectService.getProjectByUniqueIdPublic(projectUniqueId);
      const projectId = project.id;

      const participant = await this.projectParticipantRepository.findParticipantByParticipantId(participantId, projectId);

      if (!participant) {
        throw new NotFoundException(`Participant with ID '${participantId}' not found in project ${projectUniqueId}`);
      }

      const userId = participant.userId;
      this.logger.log(`✅ Found user ID: ${userId} for participant: ${participantId}`);
      return userId;
    } catch (error) {
      this.logger.error(`Failed to get participant user ID: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Verify that the user owns the project
   * @param projectId - The project ID
   * @param adminId - The admin ID to verify
   * @private
   */
  private async verifyProjectOwnership(projectId: number, adminId: number): Promise<void> {
    try {
      const projectAdminId = await this.projectService.getProjectAdminId(projectId);
      
      if (projectAdminId !== adminId) {
        throw new ForbiddenException(`Access denied to project ${projectId}`);
      }
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error(`Failed to verify project ownership: ${error.message}`, error.stack);
      throw new ForbiddenException(`Access denied to project ${projectId}`);
    }
  }

  /**
   * Map participant entity to response DTO
   * @param participant - Participant entity with user information
   * @returns ProjectParticipantResponseDto
   * @private
   */
  private mapParticipantToResponseDto(participant: any): ProjectParticipantResponseDto {
    return {
      id: participant.id,
      projectId: participant.projectId,
      userId: participant.userId,
      participantId: participant.user.uniqueId, // participantId is stored as uniqueId in User table
      firstName: participant.user.firstName,
      lastName: participant.user.lastName,
      email: participant.user.email,
      isOnline: participant.user.isOnline,
      lastSeen: participant.user.lastSeen?.toISOString() || null,
      createdAt: participant.createdAt.toISOString(),
    };
  }
} 