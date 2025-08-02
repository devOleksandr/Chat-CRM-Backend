import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { 
  ProjectRepositoryPort, 
  ProjectWithUser, 
  CreateProjectData, 
  UpdateProjectData, 
  ProjectFilters 
} from '../ports/project-repository.port';
import { 
  ProjectNotFoundError, 
  ProjectAlreadyExistsError, 
  ProjectCreationError, 
  ProjectUpdateError, 
  ProjectDeletionError 
} from '../errors/project.errors';

/**
 * Implementation of ProjectRepositoryPort using Prisma
 * Handles all database operations for projects with proper error handling
 */
@Injectable()
export class ProjectRepository implements ProjectRepositoryPort {
  private readonly logger = new Logger(ProjectRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find project by ID with user information
   * @param projectId - The unique identifier of the project
   * @returns Promise<ProjectWithUser | null> Project with user or null if not found
   */
  async findProjectById(projectId: number): Promise<ProjectWithUser | null> {
    try {
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        include: {
          createdBy: true,
        },
      });

      return project;
    } catch (error) {
      this.logger.error(`Error finding project by ID ${projectId}:`, error);
      throw new ProjectNotFoundError(projectId);
    }
  }

  /**
   * Find project by unique ID with user information
   * @param uniqueId - The unique identifier assigned by admin
   * @returns Promise<ProjectWithUser | null> Project with user or null if not found
   */
  async findProjectByUniqueId(uniqueId: string): Promise<ProjectWithUser | null> {
    try {
      const project = await this.prisma.project.findUnique({
        where: { uniqueId },
        include: {
          createdBy: true,
        },
      });

      return project;
    } catch (error) {
      this.logger.error(`Error finding project by unique ID ${uniqueId}:`, error);
      throw new ProjectNotFoundError(uniqueId);
    }
  }

  /**
   * Find projects by user ID with user information
   * @param userId - The unique identifier of the user
   * @returns Promise<ProjectWithUser[]> Array of projects with user information
   */
  async findProjectsByUserId(userId: number): Promise<ProjectWithUser[]> {
    try {
      const projects = await this.prisma.project.findMany({
        where: { userId },
        include: {
          createdBy: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return projects;
    } catch (error) {
      this.logger.error(`Error finding projects by user ID ${userId}:`, error);
      throw new ProjectNotFoundError();
    }
  }

  /**
   * Create a new project
   * @param data - Project creation data
   * @returns Promise<ProjectWithUser> Created project with user information
   */
  async createProject(data: CreateProjectData): Promise<ProjectWithUser> {
    try {
      // Check if unique ID already exists
      const existingProject = await this.prisma.project.findUnique({
        where: { uniqueId: data.uniqueId },
      });

      if (existingProject) {
        throw new ProjectAlreadyExistsError(data.uniqueId);
      }

      const project = await this.prisma.project.create({
        data: {
          name: data.name,
          uniqueId: data.uniqueId,
          userId: data.userId,
        },
        include: {
          createdBy: true,
        },
      });

      this.logger.log(`Project created successfully: ${project.id} (${project.uniqueId})`);
      return project;
    } catch (error) {
      if (error instanceof ProjectAlreadyExistsError) {
        throw error;
      }
      this.logger.error(`Error creating project:`, error);
      throw new ProjectCreationError(`Failed to create project: ${error.message}`);
    }
  }

  /**
   * Update project information
   * @param projectId - The unique identifier of the project
   * @param data - Project update data
   * @returns Promise<ProjectWithUser> Updated project with user information
   */
  async updateProject(projectId: number, data: UpdateProjectData): Promise<ProjectWithUser> {
    try {
      // Check if project exists
      const existingProject = await this.prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!existingProject) {
        throw new ProjectNotFoundError(projectId);
      }

      // Check if unique ID is being updated and if it already exists
      if (data.uniqueId && data.uniqueId !== existingProject.uniqueId) {
        const duplicateProject = await this.prisma.project.findUnique({
          where: { uniqueId: data.uniqueId },
        });

        if (duplicateProject) {
          throw new ProjectAlreadyExistsError(data.uniqueId);
        }
      }

      const project = await this.prisma.project.update({
        where: { id: projectId },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.uniqueId && { uniqueId: data.uniqueId }),
        },
        include: {
          createdBy: true,
        },
      });

      this.logger.log(`Project updated successfully: ${project.id} (${project.uniqueId})`);
      return project;
    } catch (error) {
      if (error instanceof ProjectNotFoundError || error instanceof ProjectAlreadyExistsError) {
        throw error;
      }
      this.logger.error(`Error updating project ${projectId}:`, error);
      throw new ProjectUpdateError(`Failed to update project: ${error.message}`);
    }
  }

  /**
   * Delete project by ID
   * @param projectId - The unique identifier of the project
   * @returns Promise<void>
   */
  async deleteProject(projectId: number): Promise<void> {
    try {
      // Check if project exists
      const existingProject = await this.prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!existingProject) {
        throw new ProjectNotFoundError(projectId);
      }

      await this.prisma.project.delete({
        where: { id: projectId },
      });

      this.logger.log(`Project deleted successfully: ${projectId}`);
    } catch (error) {
      if (error instanceof ProjectNotFoundError) {
        throw error;
      }
      this.logger.error(`Error deleting project ${projectId}:`, error);
      throw new ProjectDeletionError(`Failed to delete project: ${error.message}`);
    }
  }

  /**
   * Check if unique ID already exists
   * @param uniqueId - The unique ID to check
   * @returns Promise<boolean> True if unique ID exists, false otherwise
   */
  async isUniqueIdExists(uniqueId: string): Promise<boolean> {
    try {
      const project = await this.prisma.project.findUnique({
        where: { uniqueId },
        select: { id: true },
      });

      return !!project;
    } catch (error) {
      this.logger.error(`Error checking unique ID existence ${uniqueId}:`, error);
      return false;
    }
  }

  /**
   * Find projects with filters
   * @param filters - Filtering options
   * @returns Promise<ProjectWithUser[]> Array of projects with user information
   */
  async findProjects(filters: ProjectFilters): Promise<ProjectWithUser[]> {
    try {
      const where: any = {};

      if (filters.userId) {
        where.userId = filters.userId;
      }

      if (filters.uniqueId) {
        where.uniqueId = filters.uniqueId;
      }

      if (filters.name) {
        where.name = {
          contains: filters.name,
          mode: 'insensitive',
        };
      }

      const projects = await this.prisma.project.findMany({
        where,
        include: {
          createdBy: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return projects;
    } catch (error) {
      this.logger.error(`Error finding projects with filters:`, error);
      throw new ProjectNotFoundError();
    }
  }

  /**
   * Get projects count with filters
   * @param filters - Filtering options
   * @returns Promise<number> Number of projects matching filters
   */
  async getProjectsCount(filters: ProjectFilters): Promise<number> {
    try {
      const where: any = {};

      if (filters.userId) {
        where.userId = filters.userId;
      }

      if (filters.uniqueId) {
        where.uniqueId = filters.uniqueId;
      }

      if (filters.name) {
        where.name = {
          contains: filters.name,
          mode: 'insensitive',
        };
      }

      const count = await this.prisma.project.count({ where });
      return count;
    } catch (error) {
      this.logger.error(`Error getting projects count:`, error);
      return 0;
    }
  }
} 