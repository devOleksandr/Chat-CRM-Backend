import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectParticipantRepositoryPort } from '../ports/project-participant-repository.port';
import { Role } from '#db';

/**
 * Repository for project participant data access
 * Implements the ProjectParticipantRepositoryPort interface
 */
@Injectable()
export class ProjectParticipantRepository implements ProjectParticipantRepositoryPort {
  private readonly logger = new Logger(ProjectParticipantRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new project participant
   * @param data - Participant creation data
   * @returns Promise<any> Created participant with user information
   */
  async createParticipant(data: {
    projectId: number;
    participantId: string;
    firstName: string;
    lastName: string;
    email?: string;
  }): Promise<any> {
    try {
      // First, create or find the user
      const user = await this.prisma.user.upsert({
        where: { uniqueId: data.participantId },
        update: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
        },
        create: {
          uniqueId: data.participantId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          role: Role.Participant,
        },
      });

      // Then create the project participant relationship
      const projectParticipant = await this.prisma.projectParticipant.create({
        data: {
          projectId: data.projectId,
          userId: user.id,
        },
        include: {
          user: true,
        },
      });

      this.logger.log(`Created project participant: ${projectParticipant.id} for user: ${user.id}`);
      return projectParticipant;
    } catch (error) {
      this.logger.error(`Failed to create project participant: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find participants by project ID with pagination
   * @param projectId - The project ID
   * @param options - Pagination and filter options
   * @returns Promise<any[]> Array of participants with user information
   */
  async findParticipantsByProjectId(
    projectId: number,
    options: {
      projectId: number;
      adminId: number;
      limit: number;
      offset: number;
    }
  ): Promise<any[]> {
    try {
      const participants = await this.prisma.projectParticipant.findMany({
        where: {
          projectId: projectId,
        },
        include: {
          user: true,
        },
        take: options.limit,
        skip: options.offset,
        orderBy: {
          createdAt: 'desc',
        },
      });

      this.logger.log(`Found ${participants.length} participants for project: ${projectId}`);
      return participants;
    } catch (error) {
      this.logger.error(`Failed to find project participants: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find participant by ID
   * @param participantId - The participant ID
   * @returns Promise<any> Participant with user information
   */
  async findParticipantById(participantId: number): Promise<any> {
    try {
      const participant = await this.prisma.projectParticipant.findUnique({
        where: {
          id: participantId,
        },
        include: {
          user: true,
        },
      });

      if (participant) {
        this.logger.log(`Found participant: ${participantId}`);
      } else {
        this.logger.log(`Participant not found: ${participantId}`);
      }

      return participant;
    } catch (error) {
      this.logger.error(`Failed to find participant by ID: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find participant by participant ID within a project
   * @param participantId - The participant identifier
   * @param projectId - The project ID
   * @returns Promise<any> Participant with user information
   */
  async findParticipantByParticipantId(participantId: string, projectId: number): Promise<any> {
    try {
      const participant = await this.prisma.projectParticipant.findFirst({
        where: {
          projectId: projectId,
          user: {
            uniqueId: participantId,
          },
        },
        include: {
          user: true,
        },
      });

      if (participant) {
        this.logger.log(`Found participant with participantId: ${participantId} in project: ${projectId}`);
      } else {
        this.logger.log(`Participant with participantId: ${participantId} not found in project: ${projectId}`);
      }

      return participant;
    } catch (error) {
      this.logger.error(`Failed to find participant by participant ID: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete a project participant
   * @param participantId - The participant ID to delete
   * @returns Promise<void>
   */
  async deleteParticipant(participantId: number): Promise<void> {
    try {
      await this.prisma.projectParticipant.delete({
        where: {
          id: participantId,
        },
      });

      this.logger.log(`Deleted project participant: ${participantId}`);
    } catch (error) {
      this.logger.error(`Failed to delete project participant: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get the count of participants in a project
   * @param projectId - The project ID
   * @returns Promise<number> Count of participants
   */
  async getParticipantsCount(projectId: number): Promise<number> {
    try {
      const count = await this.prisma.projectParticipant.count({
        where: {
          projectId: projectId,
        },
      });

      this.logger.log(`Project ${projectId} has ${count} participants`);
      return count;
    } catch (error) {
      this.logger.error(`Failed to get participants count: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Check if participant ID is available in a project
   * @param participantId - The participant ID to check
   * @param projectId - The project ID
   * @returns Promise<boolean> True if available, false if taken
   */
  async isParticipantIdAvailable(participantId: string, projectId: number): Promise<boolean> {
    try {
      const existingParticipant = await this.prisma.projectParticipant.findFirst({
        where: {
          projectId: projectId,
          user: {
            uniqueId: participantId,
          },
        },
      });

      const isAvailable = !existingParticipant;
      this.logger.log(`Participant ID '${participantId}' availability in project ${projectId}: ${isAvailable}`);
      return isAvailable;
    } catch (error) {
      this.logger.error(`Failed to check participant ID availability: ${error.message}`, error.stack);
      throw error;
    }
  }
} 