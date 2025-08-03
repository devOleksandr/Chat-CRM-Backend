/**
 * Injection token for ProjectParticipantRepositoryPort
 */
export const PROJECT_PARTICIPANT_REPOSITORY_PORT = 'ProjectParticipantRepositoryPort';

/**
 * Port interface for project participant repository
 * Defines the contract for project participant data access operations
 */
export interface ProjectParticipantRepositoryPort {
  /**
   * Create a new project participant
   * @param data - Participant creation data
   * @returns Promise<any> Created participant with user information
   */
  createParticipant(data: {
    projectId: number;
    participantId: string;
    firstName: string;
    lastName: string;
    email?: string;
  }): Promise<any>;

  /**
   * Find participants by project ID with pagination
   * @param projectId - The project ID
   * @param options - Pagination and filter options
   * @returns Promise<any[]> Array of participants with user information
   */
  findParticipantsByProjectId(
    projectId: number,
    options: {
      projectId: number;
      adminId: number;
      limit: number;
      offset: number;
    }
  ): Promise<any[]>;

  /**
   * Find participant by ID
   * @param participantId - The participant ID
   * @returns Promise<any> Participant with user information
   */
  findParticipantById(participantId: number): Promise<any>;

  /**
   * Find participant by participant ID within a project
   * @param participantId - The participant identifier
   * @param projectId - The project ID
   * @returns Promise<any> Participant with user information
   */
  findParticipantByParticipantId(participantId: string, projectId: number): Promise<any>;

  /**
   * Delete a project participant
   * @param participantId - The participant ID to delete
   * @returns Promise<void>
   */
  deleteParticipant(participantId: number): Promise<void>;

  /**
   * Get the count of participants in a project
   * @param projectId - The project ID
   * @returns Promise<number> Count of participants
   */
  getParticipantsCount(projectId: number): Promise<number>;

  /**
   * Check if participant ID is available in a project
   * @param participantId - The participant ID to check
   * @param projectId - The project ID
   * @returns Promise<boolean> True if available, false if taken
   */
  isParticipantIdAvailable(participantId: string, projectId: number): Promise<boolean>;
} 