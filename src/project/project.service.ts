import { Injectable, Logger } from '@nestjs/common';
import { 
  ProjectRepositoryPort, 
  ProjectWithUser, 
  CreateProjectData, 
  UpdateProjectData, 
  ProjectFilters 
} from './ports/project-repository.port';
import { 
  ProjectNotFoundError, 
  ProjectAlreadyExistsError, 
  ProjectAccessDeniedError,
  InvalidProjectNameError,
  InvalidProjectUniqueIdError
} from './errors/project.errors';
import { ProjectErrorHandler } from './handlers/project-error.handler';
import { ProjectResponseDto, ProjectListResponseDto } from './dto/project-response.dto';

/**
 * Service for managing projects
 * Implements business logic for project operations with proper validation and error handling
 */
@Injectable()
export class ProjectService {
  private readonly logger = new Logger(ProjectService.name);

  constructor(
    private readonly projectRepository: ProjectRepositoryPort,
    private readonly projectErrorHandler: ProjectErrorHandler,
  ) {}

  /**
   * Create a new project
   * @param createProjectData - Project creation data
   * @param userId - ID of the user creating the project
   * @returns Promise<ProjectResponseDto> Created project response
   */
  async createProject(createProjectData: CreateProjectData, userId: number): Promise<ProjectResponseDto> {
    try {
      // Validate project name
      this.validateProjectName(createProjectData.name);

      // Validate unique ID format
      this.validateProjectUniqueId(createProjectData.uniqueId);

      // Check if user is creating project for themselves
      if (createProjectData.userId !== userId) {
        throw new ProjectAccessDeniedError(0, userId);
      }

      const project = await this.projectRepository.createProject(createProjectData);
      
      this.logger.log(`Project created by user ${userId}: ${project.id} (${project.uniqueId})`);
      
      return this.mapToProjectResponse(project);
    } catch (error) {
      await this.projectErrorHandler.handle(error, {
        operation: 'create_project',
        userId,
        uniqueId: createProjectData.uniqueId,
        timestamp: new Date(),
      });
      throw error;
    }
  }

  /**
   * Get project by ID
   * @param projectId - Project ID
   * @param userId - ID of the user requesting the project
   * @returns Promise<ProjectResponseDto> Project response
   */
  async getProjectById(projectId: number, userId: number): Promise<ProjectResponseDto> {
    try {
      const project = await this.projectRepository.findProjectById(projectId);
      
      if (!project) {
        throw new ProjectNotFoundError(projectId);
      }

      // Check if user has access to this project
      if (project.userId !== userId) {
        throw new ProjectAccessDeniedError(projectId, userId);
      }

      return this.mapToProjectResponse(project);
    } catch (error) {
      await this.projectErrorHandler.handle(error, {
        operation: 'get_project_by_id',
        projectId,
        userId,
        timestamp: new Date(),
      });
      throw error;
    }
  }

  /**
   * Get project by unique ID
   * @param uniqueId - Project unique ID
   * @param userId - ID of the user requesting the project
   * @returns Promise<ProjectResponseDto> Project response
   */
  async getProjectByUniqueId(uniqueId: string, userId: number): Promise<ProjectResponseDto> {
    try {
      const project = await this.projectRepository.findProjectByUniqueId(uniqueId);
      
      if (!project) {
        throw new ProjectNotFoundError(uniqueId);
      }

      // Check if user has access to this project
      if (project.userId !== userId) {
        throw new ProjectAccessDeniedError(project.id, userId);
      }

      return this.mapToProjectResponse(project);
    } catch (error) {
      await this.projectErrorHandler.handle(error, {
        operation: 'get_project_by_unique_id',
        uniqueId,
        userId,
        timestamp: new Date(),
      });
      throw error;
    }
  }

  /**
   * Get all projects for a user
   * @param userId - ID of the user
   * @param filters - Optional filters
   * @returns Promise<ProjectListResponseDto> List of projects
   */
  async getUserProjects(userId: number, filters?: ProjectFilters): Promise<ProjectListResponseDto> {
    try {
      const projectFilters: ProjectFilters = {
        ...filters,
        userId, // Ensure user can only see their own projects
      };

      const [projects, total] = await Promise.all([
        this.projectRepository.findProjects(projectFilters),
        this.projectRepository.getProjectsCount(projectFilters),
      ]);

      const projectResponses = projects.map(project => this.mapToProjectResponse(project));

      return {
        projects: projectResponses,
        total,
        page: 1, // For now, we don't implement pagination
        limit: total,
      };
    } catch (error) {
      await this.projectErrorHandler.handle(error, {
        operation: 'get_user_projects',
        userId,
        timestamp: new Date(),
      });
      throw error;
    }
  }

  /**
   * Update project
   * @param projectId - Project ID
   * @param updateProjectData - Project update data
   * @param userId - ID of the user updating the project
   * @returns Promise<ProjectResponseDto> Updated project response
   */
  async updateProject(projectId: number, updateProjectData: UpdateProjectData, userId: number): Promise<ProjectResponseDto> {
    try {
      // Check if project exists and user has access
      const existingProject = await this.projectRepository.findProjectById(projectId);
      
      if (!existingProject) {
        throw new ProjectNotFoundError(projectId);
      }

      if (existingProject.userId !== userId) {
        throw new ProjectAccessDeniedError(projectId, userId);
      }

      // Validate project name if provided
      if (updateProjectData.name) {
        this.validateProjectName(updateProjectData.name);
      }

      // Validate unique ID format if provided
      if (updateProjectData.uniqueId) {
        this.validateProjectUniqueId(updateProjectData.uniqueId);
      }

      const project = await this.projectRepository.updateProject(projectId, updateProjectData);
      
      this.logger.log(`Project updated by user ${userId}: ${project.id} (${project.uniqueId})`);
      
      return this.mapToProjectResponse(project);
    } catch (error) {
      await this.projectErrorHandler.handle(error, {
        operation: 'update_project',
        projectId,
        userId,
        uniqueId: updateProjectData.uniqueId,
        timestamp: new Date(),
      });
      throw error;
    }
  }

  /**
   * Delete project
   * @param projectId - Project ID
   * @param userId - ID of the user deleting the project
   * @returns Promise<void>
   */
  async deleteProject(projectId: number, userId: number): Promise<void> {
    try {
      // Check if project exists and user has access
      const existingProject = await this.projectRepository.findProjectById(projectId);
      
      if (!existingProject) {
        throw new ProjectNotFoundError(projectId);
      }

      if (existingProject.userId !== userId) {
        throw new ProjectAccessDeniedError(projectId, userId);
      }

      await this.projectRepository.deleteProject(projectId);
      
      this.logger.log(`Project deleted by user ${userId}: ${projectId}`);
    } catch (error) {
      await this.projectErrorHandler.handle(error, {
        operation: 'delete_project',
        projectId,
        userId,
        timestamp: new Date(),
      });
      throw error;
    }
  }

  /**
   * Check if unique ID is available
   * @param uniqueId - Unique ID to check
   * @returns Promise<boolean> True if available, false if taken
   */
  async isUniqueIdAvailable(uniqueId: string): Promise<boolean> {
    try {
      this.validateProjectUniqueId(uniqueId);
      const exists = await this.projectRepository.isUniqueIdExists(uniqueId);
      return !exists;
    } catch (error) {
      await this.projectErrorHandler.handle(error, {
        operation: 'check_unique_id_availability',
        uniqueId,
        timestamp: new Date(),
      });
      throw error;
    }
  }

  /**
   * Get project admin ID by project ID
   * @param projectId - Project ID
   * @returns Promise<number> Admin user ID
   */
  async getProjectAdminId(projectId: number): Promise<number> {
    try {
      const project = await this.projectRepository.findProjectById(projectId);
      
      if (!project) {
        throw new ProjectNotFoundError(projectId);
      }

      return project.userId; // userId is the admin who created the project
    } catch (error) {
      await this.projectErrorHandler.handle(error, {
        operation: 'get_project_admin_id',
        projectId,
        timestamp: new Date(),
      });
      throw error;
    }
  }

  /**
   * Validate project name
   * @param name - Project name to validate
   * @private
   */
  private validateProjectName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new InvalidProjectNameError('Project name cannot be empty');
    }

    if (name.trim().length > 255) {
      throw new InvalidProjectNameError('Project name cannot exceed 255 characters');
    }
  }

  /**
   * Validate project unique ID format
   * @param uniqueId - Unique ID to validate
   * @private
   */
  private validateProjectUniqueId(uniqueId: string): void {
    if (!uniqueId || uniqueId.trim().length === 0) {
      throw new InvalidProjectUniqueIdError('Unique ID cannot be empty');
    }

    if (uniqueId.trim().length < 3 || uniqueId.trim().length > 50) {
      throw new InvalidProjectUniqueIdError('Unique ID must be between 3 and 50 characters');
    }

    const uniqueIdRegex = /^[A-Z0-9-]+$/;
    if (!uniqueIdRegex.test(uniqueId)) {
      throw new InvalidProjectUniqueIdError('Unique ID must contain only uppercase letters, numbers, and hyphens');
    }
  }

  /**
   * Map project with user to response DTO
   * @param project - Project with user information
   * @returns ProjectResponseDto
   * @private
   */
  private mapToProjectResponse(project: ProjectWithUser): ProjectResponseDto {
    return {
      id: project.id,
      name: project.name,
      uniqueId: project.uniqueId,
      createdBy: {
        id: project.createdBy.id,
        firstName: project.createdBy.firstName,
        lastName: project.createdBy.lastName,
        email: project.createdBy.email ?? '',
        role: project.createdBy.role,
        createdAt: project.createdBy.createdAt.toISOString(),
        updatedAt: project.createdBy.updatedAt.toISOString(),
      },
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    };
  }
} 