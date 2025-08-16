import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepositoryPort } from './ports/auth-repository.port';
import { AuthRepository } from './repositories/auth.repository';
import { AuthErrorHandler } from './handlers/auth-error.handler';
import { AuthExceptionFilter } from './filters/auth-exception.filter';
import { EmailService } from './services/email.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import {
  InvalidCredentialsStrategy,
  InvalidRefreshTokenStrategy,
  InvalidResetTokenStrategy,
  EmailNotFoundStrategy,
  WeakPasswordStrategy,
  EmailAlreadyExistsStrategy,
  InvalidJwtTokenStrategy,
  UnauthenticatedStrategy,
  InsufficientPermissionsStrategy,
  GeneralAuthErrorStrategy,
} from './strategies/auth-error.strategies';
import { PrismaModule } from '../prisma/prisma.module';
import { UserModule } from '../user/user.module';

/**
 * Authentication module implementing Clean Architecture principles
 * Uses dependency inversion principle with repository ports and strategy pattern for error handling
 * Includes JWT authentication, email services, and comprehensive error handling
 */
@Module({
  imports: [
    forwardRef(() => UserModule),
    forwardRef(() => PrismaModule),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '45m',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    EmailService,
    AuthErrorHandler,
    JwtStrategy,
    
    // Repository port implementation
    {
      provide: AuthRepositoryPort,
      useClass: AuthRepository,
    },
    
    // Exception Filter for HTTP responses
    {
      provide: APP_FILTER,
      useClass: AuthExceptionFilter,
    },
    
    // Error handling strategies
    InvalidCredentialsStrategy,
    InvalidRefreshTokenStrategy,
    InvalidResetTokenStrategy,
    EmailNotFoundStrategy,
    WeakPasswordStrategy,
    EmailAlreadyExistsStrategy,
    InvalidJwtTokenStrategy,
    UnauthenticatedStrategy,
    InsufficientPermissionsStrategy,
    GeneralAuthErrorStrategy,
  ],
  exports: [
    AuthService,
    EmailService,
    AuthRepositoryPort,
    JwtStrategy,
    JwtModule,
    PassportModule,
  ],
})
export class AuthModule {}
