import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { 
  ProjectParticipantRepositoryPort, 
  ProjectParticipantWithUser, 
  CreateProjectParticipantData, 
  ProjectParticipantFilters 
} from '../ports/project-participant-repository.port';
import { User } from '../../prisma/generated/client';

/**
 * Concrete implementation of ProjectParticipantRepositoryPort using Prisma
 * Handles all database interactions for project participant operations
 */
@Injectable()
export class ProjectParticipantRepository extends ProjectParticipantRepositoryPort {
  private readonly logger = new Logger(ProjectParticipantRepository.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  /**
   * Create a new project participant
   * @param data - Project participant creation data
   * @returns Promise<ProjectParticipantWithUser> Newly created participant with user information
   */
  async createParticipant(data: CreateProjectParticipantData): Promise<ProjectParticipantWithUser> {
    try {
      // Check if participant ID is available
      const isAvailable = await this.isParticipantIdAvailable(data.participantId, data.projectId);
      if (!isAvailable) {
        throw new Error(`Participant ID '${data.participantId}' is already taken in project ${data.projectId}`);
      }

      // Create user first
      const user = await this.prisma.user.create({
        data: {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          uniqueId: data.participantId, // Use participantId as uniqueId in User table
          role: 'Participant',
          isOnline: false,
        },
      });

      // Create project participant
      const participant = await this.prisma.projectParticipant.create({
        data: {
          projectId: data.projectId,
          userId: user.id,
        },
        include: {
          user: true,
        },
      });

      this.logger.log(`✅ Created project participant: ${participant.id} for user ${user.id} in project ${data.projectId}`);
      return participant as unknown as ProjectParticipantWithUser;
    } catch (error) {
      this.logger.error(`Failed to create project participant: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find project participants by project ID
   * @param projectId - The project ID
   * @param filters - Filtering options including pagination
   * @returns Promise<ProjectParticipantWithUser[]> Array of participants with user information
   */
  async findParticipantsByProjectId(projectId: number, filters: ProjectParticipantFilters): Promise<ProjectParticipantWithUser[]> {
    try {
      const { limit = 20, offset = 0 } = filters;

      const participants = await this.prisma.projectParticipant.findMany({
        where: { projectId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              uniqueId: true,
              isOnline: true,
              lastSeen: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      return participants as unknown as ProjectParticipantWithUser[];
    } catch (error) {
      this.logger.error(`Failed to find participants by project ID: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find a specific project participant by ID
   * @param participantId - The participant ID
   * @returns Promise<ProjectParticipantWithUser | null> Participant with user or null if not found
   */
  async findParticipantById(participantId: number): Promise<ProjectParticipantWithUser | null> {
    try {
      const participant = await this.prisma.projectParticipant.findUnique({
        where: { id: participantId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              uniqueId: true,
              isOnline: true,
              lastSeen: true,
            },
          },
        },
      });

      return participant as unknown as ProjectParticipantWithUser;
    } catch (error) {
      this.logger.error(`Failed to find participant by ID: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find a participant by unique ID within a project
   * @param uniqueId - The unique identifier
   * @param projectId - The project ID
   * @returns Promise<ProjectParticipantWithUser | null> Participant with user or null if not found
   */
  async findParticipantByParticipantId(participantId: string, projectId: number): Promise<ProjectParticipantWithUser | null> {
    try {
      const participant = await this.prisma.projectParticipant.findFirst({
        where: {
          projectId,
          user: {
            uniqueId: participantId, // participantId is stored as uniqueId in User table
          },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              uniqueId: true,
              isOnline: true,
              lastSeen: true,
            },
          },
        },
      });

      return participant as unknown as ProjectParticipantWithUser;
    } catch (error) {
      this.logger.error(`Failed to find participant by participant ID: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find a user by participant ID
   * @param participantId - The participant identifier
   * @returns Promise<User | null> User or null if not found
   */
  async findUserByParticipantId(participantId: string): Promise<User | null> {
    try {
      return await this.prisma.user.findUnique({
        where: { uniqueId: participantId }, // participantId is stored as uniqueId in User table
      });
    } catch (error) {
      this.logger.error(`Failed to find user by participant ID: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Check if participant ID is available within a project
   * @param participantId - The participant identifier to check
   * @param projectId - The project ID
   * @returns Promise<boolean> True if participant ID is available
   */
  async isParticipantIdAvailable(participantId: string, projectId: number): Promise<boolean> {
    try {
      const existingParticipant = await this.prisma.projectParticipant.findFirst({
        where: {
          projectId,
          user: {
            uniqueId: participantId, // participantId is stored as uniqueId in User table
          },
        },
      });

      return !existingParticipant;
    } catch (error) {
      this.logger.error(`Failed to check participant ID availability: ${error.message}`, error.stack);
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
      // Get participant info before deletion
      const participant = await this.prisma.projectParticipant.findUnique({
        where: { id: participantId },
        include: { user: true },
      });

      if (!participant) {
        throw new Error(`Project participant ${participantId} not found`);
      }

      // Delete project participant
      await this.prisma.projectParticipant.delete({
        where: { id: participantId },
      });

      // Delete associated user
      await this.prisma.user.delete({
        where: { id: participant.userId },
      });

      this.logger.log(`✅ Deleted project participant: ${participantId} and associated user: ${participant.userId}`);
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
      return await this.prisma.projectParticipant.count({
        where: { projectId },
      });
    } catch (error) {
      this.logger.error(`Failed to get participants count: ${error.message}`, error.stack);
      throw error;
    }
  }
} 