import { Injectable, Logger } from '@nestjs/common';
import { 
  ProjectError, 
  ProjectNotFoundError, 
  ProjectAlreadyExistsError, 
  ProjectAccessDeniedError,
  ProjectCreationError,
  ProjectUpdateError,
  ProjectDeletionError
} from '../errors/project.errors';

export interface ProjectErrorContext {
  operation: string;
  projectId?: number;
  uniqueId?: string;
  userId?: number;
  timestamp: Date;
  ip?: string;
  userAgent?: string;
}

export abstract class ProjectErrorHandlingStrategy {
  abstract handle(error: ProjectError, context: ProjectErrorContext): Promise<void>;
}

/**
 * Strategy for handling project not found errors
 * Logs the attempt and tracks missing project access
 */
@Injectable()
export class ProjectNotFoundStrategy extends ProjectErrorHandlingStrategy {
  private readonly logger = new Logger(ProjectNotFoundStrategy.name);

  async handle(error: ProjectNotFoundError, context: ProjectErrorContext): Promise<void> {
    this.logger.warn(`Project not found: ${error.message}`, {
      error: error.message,
      context,
      projectId: context.projectId,
      uniqueId: context.uniqueId,
    });

    // Here you could add metrics tracking
    // this.metricsService.incrementCounter('project_not_found', {
    //   projectId: context.projectId,
    //   uniqueId: context.uniqueId,
    //   operation: context.operation,
    // });
  }
}

/**
 * Strategy for handling project already exists errors
 * Logs the attempt and tracks duplicate project creation
 */
@Injectable()
export class ProjectAlreadyExistsStrategy extends ProjectErrorHandlingStrategy {
  private readonly logger = new Logger(ProjectAlreadyExistsStrategy.name);

  async handle(error: ProjectAlreadyExistsError, context: ProjectErrorContext): Promise<void> {
    this.logger.warn(`Project already exists: ${error.message}`, {
      error: error.message,
      context,
      uniqueId: context.uniqueId,
      userId: context.userId,
    });

    // Here you could add metrics tracking
    // this.metricsService.incrementCounter('project_already_exists', {
    //   uniqueId: context.uniqueId,
    //   userId: context.userId,
    //   operation: context.operation,
    // });
  }
}

/**
 * Strategy for handling insufficient permissions errors
 * Logs the attempt and tracks unauthorized access
 */
@Injectable()
export class InsufficientPermissionsStrategy extends ProjectErrorHandlingStrategy {
  private readonly logger = new Logger(InsufficientPermissionsStrategy.name);

  async handle(error: ProjectAccessDeniedError, context: ProjectErrorContext): Promise<void> {
    this.logger.warn(`Project access denied: ${error.message}`, {
      error: error.message,
      context,
      projectId: context.projectId,
      userId: context.userId,
    });

    // Here you could add security monitoring
    // this.securityService.flagSuspiciousActivity({
    //   type: 'PROJECT_ACCESS_DENIED',
    //   projectId: context.projectId,
    //   userId: context.userId,
    //   context,
    // });
  }
}

/**
 * Strategy for handling general project errors
 * Logs all other project-related errors
 */
@Injectable()
export class GeneralProjectErrorStrategy extends ProjectErrorHandlingStrategy {
  private readonly logger = new Logger(GeneralProjectErrorStrategy.name);

  async handle(error: ProjectError, context: ProjectErrorContext): Promise<void> {
    this.logger.error(`Project error: ${error.message}`, {
      error: error.message,
      errorCode: error.code,
      statusCode: error.statusCode,
      context,
      projectId: context.projectId,
      uniqueId: context.uniqueId,
      userId: context.userId,
    });

    // Here you could add error reporting
    // this.errorReportingService.reportError({
    //   error,
    //   context,
    //   severity: 'error',
    // });
  }
} 