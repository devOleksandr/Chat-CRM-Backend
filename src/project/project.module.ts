import { Module, forwardRef } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';

import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { ProjectRepositoryPort } from './ports/project-repository.port';
import { ProjectRepository } from './repositories/project.repository';
import { ProjectErrorHandler } from './handlers/project-error.handler';
import { ProjectExceptionFilter } from './filters/project-exception.filter';
import {
  ProjectNotFoundStrategy,
  ProjectAlreadyExistsStrategy,
  InsufficientPermissionsStrategy,
  GeneralProjectErrorStrategy,
} from './strategies/project-error.strategies';
import { PrismaModule } from '../prisma/prisma.module';
import { UserModule } from '../user/user.module';

/**
 * Project module implementing Clean Architecture principles
 * Uses dependency inversion principle with repository ports and strategy pattern for error handling
 * Includes project management operations and comprehensive error handling
 */
@Module({
  imports: [
    forwardRef(() => PrismaModule),
    forwardRef(() => UserModule),
  ],
  controllers: [ProjectController],
  providers: [
    ProjectService,
    ProjectErrorHandler,
    
    // Repository port implementation
    {
      provide: ProjectRepositoryPort,
      useClass: ProjectRepository,
    },
    
    // Exception Filter for HTTP responses
    {
      provide: APP_FILTER,
      useClass: ProjectExceptionFilter,
    },
    
    // Error handling strategies
    ProjectNotFoundStrategy,
    ProjectAlreadyExistsStrategy,
    InsufficientPermissionsStrategy,
    GeneralProjectErrorStrategy,
  ],
  exports: [
    ProjectService,
    ProjectRepositoryPort,
  ],
})
export class ProjectModule {} 