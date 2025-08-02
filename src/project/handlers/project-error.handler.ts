import { Injectable, Logger } from '@nestjs/common';
import { ProjectError } from '../errors/project.errors';
import { ProjectErrorContext } from '../strategies/project-error.strategies';
import {
  ProjectNotFoundStrategy,
  ProjectAlreadyExistsStrategy,
  InsufficientPermissionsStrategy,
  GeneralProjectErrorStrategy,
} from '../strategies/project-error.strategies';

/**
 * Handler for project-related errors
 * Uses strategy pattern to handle different types of errors appropriately
 */
@Injectable()
export class ProjectErrorHandler {
  private readonly logger = new Logger(ProjectErrorHandler.name);

  constructor(
    private readonly projectNotFoundStrategy: ProjectNotFoundStrategy,
    private readonly projectAlreadyExistsStrategy: ProjectAlreadyExistsStrategy,
    private readonly insufficientPermissionsStrategy: InsufficientPermissionsStrategy,
    private readonly generalProjectErrorStrategy: GeneralProjectErrorStrategy,
  ) {}

  /**
   * Handle project error using appropriate strategy
   * @param error - The error to handle
   * @param context - Error context information
   */
  async handle(error: ProjectError, context: ProjectErrorContext): Promise<void> {
    try {
      this.logger.debug(`Handling project error: ${error.constructor.name}`, {
        errorCode: error.code,
        statusCode: error.statusCode,
        context,
      });

      // Route error to appropriate strategy based on error type
      switch (error.constructor.name) {
        case 'ProjectNotFoundError':
          await this.projectNotFoundStrategy.handle(error, context);
          break;

        case 'ProjectAlreadyExistsError':
          await this.projectAlreadyExistsStrategy.handle(error, context);
          break;

        case 'ProjectAccessDeniedError':
          await this.insufficientPermissionsStrategy.handle(error, context);
          break;

        default:
          await this.generalProjectErrorStrategy.handle(error, context);
          break;
      }
    } catch (strategyError) {
      this.logger.error('Error in project error handler strategy:', strategyError);
      
      // Fallback to general error strategy if specific strategy fails
      try {
        await this.generalProjectErrorStrategy.handle(error, context);
      } catch (fallbackError) {
        this.logger.error('Fallback error strategy also failed:', fallbackError);
      }
    }
  }
} 