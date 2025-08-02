/**
 * Base error class for project-related errors
 */
export class ProjectError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
  ) {
    super(message);
    this.name = 'ProjectError';
  }
}

/**
 * Error thrown when project is not found
 */
export class ProjectNotFoundError extends ProjectError {
  constructor(projectId?: number | string) {
    const message = projectId 
      ? `Project with ID ${projectId} not found`
      : 'Project not found';
    super(message, 'PROJECT_NOT_FOUND', 404);
    this.name = 'ProjectNotFoundError';
  }
}

/**
 * Error thrown when project with unique ID already exists
 */
export class ProjectAlreadyExistsError extends ProjectError {
  constructor(uniqueId: string) {
    super(
      `Project with unique ID '${uniqueId}' already exists`,
      'PROJECT_ALREADY_EXISTS',
      409,
    );
    this.name = 'ProjectAlreadyExistsError';
  }
}

/**
 * Error thrown when user doesn't have permission to access project
 */
export class ProjectAccessDeniedError extends ProjectError {
  constructor(projectId: number, userId: number) {
    super(
      `User ${userId} doesn't have access to project ${projectId}`,
      'PROJECT_ACCESS_DENIED',
      403,
    );
    this.name = 'ProjectAccessDeniedError';
  }
}

/**
 * Error thrown when project name is invalid
 */
export class InvalidProjectNameError extends ProjectError {
  constructor(message: string) {
    super(message, 'INVALID_PROJECT_NAME', 400);
    this.name = 'InvalidProjectNameError';
  }
}

/**
 * Error thrown when project unique ID is invalid
 */
export class InvalidProjectUniqueIdError extends ProjectError {
  constructor(message: string) {
    super(message, 'INVALID_PROJECT_UNIQUE_ID', 400);
    this.name = 'InvalidProjectUniqueIdError';
  }
}

/**
 * Error thrown when project creation fails
 */
export class ProjectCreationError extends ProjectError {
  constructor(message: string) {
    super(message, 'PROJECT_CREATION_ERROR', 500);
    this.name = 'ProjectCreationError';
  }
}

/**
 * Error thrown when project update fails
 */
export class ProjectUpdateError extends ProjectError {
  constructor(message: string) {
    super(message, 'PROJECT_UPDATE_ERROR', 500);
    this.name = 'ProjectUpdateError';
  }
}

/**
 * Error thrown when project deletion fails
 */
export class ProjectDeletionError extends ProjectError {
  constructor(message: string) {
    super(message, 'PROJECT_DELETION_ERROR', 500);
    this.name = 'ProjectDeletionError';
  }
} 