import { ProjectParticipant, User } from '../../prisma/generated/client';

export interface ProjectParticipantWithUser extends ProjectParticipant {
  user: User;
}

export interface CreateProjectParticipantData {
  projectId: number;
  participantId: string;
  firstName: string;
  lastName: string;
  email?: string;
}

export interface ProjectParticipantFilters {
  projectId?: number;
  adminId?: number;
  limit?: number;
  offset?: number;
}

/**
 * Abstract port for project participant repository operations
 * This interface defines the contract for project participant storage operations
 * following the dependency inversion principle
 */
export abstract class ProjectParticipantRepositoryPort {
  /**
   * Create a new project participant
   * @param data - Project participant creation data
   * @returns Promise<ProjectParticipantWithUser> Newly created participant with user information
   */
  abstract createParticipant(data: CreateProjectParticipantData): Promise<ProjectParticipantWithUser>;

  /**
   * Find project participants by project ID
   * @param projectId - The project ID
   * @param filters - Filtering options including pagination
   * @returns Promise<ProjectParticipantWithUser[]> Array of participants with user information
   */
  abstract findParticipantsByProjectId(projectId: number, filters: ProjectParticipantFilters): Promise<ProjectParticipantWithUser[]>;

  /**
   * Find a specific project participant by ID
   * @param participantId - The participant ID
   * @returns Promise<ProjectParticipantWithUser | null> Participant with user or null if not found
   */
  abstract findParticipantById(participantId: number): Promise<ProjectParticipantWithUser | null>;

  /**
   * Find a participant by participant ID within a project
   * @param participantId - The participant identifier
   * @param projectId - The project ID
   * @returns Promise<ProjectParticipantWithUser | null> Participant with user or null if not found
   */
  abstract findParticipantByParticipantId(participantId: string, projectId: number): Promise<ProjectParticipantWithUser | null>;

  /**
   * Find a user by participant ID
   * @param participantId - The participant identifier
   * @returns Promise<User | null> User or null if not found
   */
  abstract findUserByParticipantId(participantId: string): Promise<User | null>;

  /**
   * Check if participant ID is available within a project
   * @param participantId - The participant identifier to check
   * @param projectId - The project ID
   * @returns Promise<boolean> True if participant ID is available
   */
  abstract isParticipantIdAvailable(participantId: string, projectId: number): Promise<boolean>;

  /**
   * Delete a project participant
   * @param participantId - The participant ID to delete
   * @returns Promise<void>
   */
  abstract deleteParticipant(participantId: number): Promise<void>;

  /**
   * Get the count of participants in a project
   * @param projectId - The project ID
   * @returns Promise<number> Count of participants
   */
  abstract getParticipantsCount(projectId: number): Promise<number>;
} 