import { Module, forwardRef } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserRepository } from './repositories/user.repository';
import { UserErrorHandler } from './handlers/user-error.handler';
import { DefaultUserErrorStrategy } from './strategies/user-error.strategies';
import { UserExceptionFilter } from './filters/user-exception.filter';
import { PasswordChangeEmailService } from './services/password-change-email.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => AuthModule),
    PassportModule,
  ],
  controllers: [UserController],
  providers: [
    UserService,
    UserRepository,
    UserErrorHandler,
    DefaultUserErrorStrategy,
    UserExceptionFilter,
    PasswordChangeEmailService,
  ],
  exports: [UserService, UserRepository],
})
export class UserModule {}
