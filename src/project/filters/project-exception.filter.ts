import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ProjectError } from '../errors/project.errors';

/**
 * Global exception filter for project-related errors
 * Converts domain errors to appropriate HTTP responses
 */
@Catch(ProjectError)
export class ProjectExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProjectExceptionFilter.name);

  /**
   * Catch and handle project errors
   * @param exception - The project error
   * @param host - Arguments host containing request and response
   */
  catch(exception: ProjectError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;
    const message = exception.message;
    const errorCode = exception.code;

    this.logger.warn(`Project error occurred: ${errorCode} - ${message}`, {
      errorCode,
      statusCode: status,
      path: request.url,
      method: request.method,
      userAgent: request.get('User-Agent'),
      ip: request.ip,
    });

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      error: {
        code: errorCode,
        message: message,
      },
    };

    response.status(status).json(errorResponse);
  }
} 