import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

import { AuthRepositoryPort } from '../ports/auth-repository.port';
import { JwtPayload } from '../interfaces/tokens.interface';
import { InvalidJwtTokenError } from '../errors/auth.errors';

/**
 * JWT Strategy for Passport authentication
 * Validates JWT tokens and retrieves user information from database
 * Implements the Strategy pattern for Passport.js authentication
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly authRepository: AuthRepositoryPort,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
      ignoreExpiration: false,
    });

    this.logger.log('✅ JWT Strategy initialized successfully');
  }

  /**
   * Validate JWT payload and return user information
   * @param payload - JWT payload containing user information
   * @returns Promise<any> User object with profile information
   * @throws {InvalidJwtTokenError} When user is not found or token is invalid
   */
  async validate(payload: JwtPayload): Promise<any> {
    try {
      this.logger.log(`Validating JWT token for user: ${payload.sub}`);

      // Find user by email from JWT payload
      const user = await this.authRepository.findUserByEmail(payload.email);

      if (!user) {
        this.logger.warn(`User not found for JWT token: ${payload.email}`);
        throw new InvalidJwtTokenError();
      }

      // Return user object with id field properly set
      const userWithId = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        sub: payload.sub,
      };

      this.logger.log(`✅ JWT token validated successfully for user: ${user.id}`);
      return userWithId;
    } catch (error) {
      this.logger.error(`❌ JWT token validation failed: ${error.message}`, error.stack);
      throw error;
    }
  }
}
