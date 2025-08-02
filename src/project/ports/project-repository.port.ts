import { Project, User } from '#db';

export type ProjectWithUser = Project & {
  createdBy: User;
};

export interface CreateProjectData {
  name: string;
  uniqueId: string;
  userId: number;
}

export interface UpdateProjectData {
  name?: string;
  uniqueId?: string;
}

export interface ProjectFilters {
  userId?: number;
  uniqueId?: string;
  name?: string;
}

/**
 * Abstract port for project repository operations
 * This interface defines the contract for project storage operations
 * following the dependency inversion principle
 */
export abstract class ProjectRepositoryPort {
  /**
   * Find project by ID
   * @param projectId - The unique identifier of the project
   * @returns Promise<ProjectWithUser | null> Project or null if not found
   */
  abstract findProjectById(projectId: number): Promise<ProjectWithUser | null>;

  /**
   * Find project by unique ID
   * @param uniqueId - The unique identifier assigned by admin
   * @returns Promise<ProjectWithUser | null> Project or null if not found
   */
  abstract findProjectByUniqueId(uniqueId: string): Promise<ProjectWithUser | null>;

  /**
   * Find projects by user ID
   * @param userId - The unique identifier of the user
   * @returns Promise<ProjectWithUser[]> Array of projects
   */
  abstract findProjectsByUserId(userId: number): Promise<ProjectWithUser[]>;

  /**
   * Create a new project
   * @param data - Project creation data
   * @returns Promise<ProjectWithUser> Created project
   */
  abstract createProject(data: CreateProjectData): Promise<ProjectWithUser>;

  /**
   * Update project information
   * @param projectId - The unique identifier of the project
   * @param data - Project update data
   * @returns Promise<ProjectWithUser> Updated project
   */
  abstract updateProject(projectId: number, data: UpdateProjectData): Promise<ProjectWithUser>;

  /**
   * Delete project by ID
   * @param projectId - The unique identifier of the project
   * @returns Promise<void>
   */
  abstract deleteProject(projectId: number): Promise<void>;

  /**
   * Check if unique ID already exists
   * @param uniqueId - The unique ID to check
   * @returns Promise<boolean> True if unique ID exists, false otherwise
   */
  abstract isUniqueIdExists(uniqueId: string): Promise<boolean>;

  /**
   * Find projects with filters
   * @param filters - Filtering options
   * @returns Promise<ProjectWithUser[]> Array of projects
   */
  abstract findProjects(filters: ProjectFilters): Promise<ProjectWithUser[]>;

  /**
   * Get projects count with filters
   * @param filters - Filtering options
   * @returns Promise<number> Number of projects matching filters
   */
  abstract getProjectsCount(filters: ProjectFilters): Promise<number>;
} 