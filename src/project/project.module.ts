import { Module, forwardRef } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';

import { ProjectController } from './project.controller';
import { ProjectParticipantController } from './controllers/project-participant.controller';
import { MobileProjectParticipantController } from './controllers/mobile-project-participant.controller';
import { ProjectService } from './project.service';
import { ProjectParticipantService } from './services/project-participant.service';
import { ProjectRepositoryPort } from './ports/project-repository.port';
import { ProjectParticipantRepositoryPort, PROJECT_PARTICIPANT_REPOSITORY_PORT } from './ports/project-participant-repository.port';
import { ProjectRepository } from './repositories/project.repository';
import { ProjectParticipantRepository } from './repositories/project-participant.repository';
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
  controllers: [
    ProjectController,
    ProjectParticipantController,
    MobileProjectParticipantController,
  ],
  providers: [
    ProjectService,
    ProjectParticipantService,
    ProjectErrorHandler,
    
    // Repository port implementations
    {
      provide: ProjectRepositoryPort,
      useClass: ProjectRepository,
    },
    {
      provide: PROJECT_PARTICIPANT_REPOSITORY_PORT,
      useClass: ProjectParticipantRepository,
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
    ProjectParticipantService,
    ProjectRepositoryPort,
    PROJECT_PARTICIPANT_REPOSITORY_PORT,
  ],
})
export class ProjectModule {} 