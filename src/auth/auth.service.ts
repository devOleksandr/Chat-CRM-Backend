import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { AuthRepositoryPort } from './ports/auth-repository.port';
import { AuthErrorHandler } from './handlers/auth-error.handler';
import { EmailService } from './services/email.service';
import { LoginDto, RefreshTokenDto, ResetPasswordRequestDto, ResetPasswordDto } from './dto/auth.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { TokensDto } from './dto/tokens.dto';
import { Tokens, JwtPayload } from './interfaces/tokens.interface';
import { 
  InvalidCredentialsError, 
  InvalidRefreshTokenError, 
  InvalidResetTokenError, 
  EmailNotFoundError, 
  WeakPasswordError,
  UserNotFoundError, 
  EmailAlreadyExistsError
} from './errors/auth.errors';
import { validatePassword, isPasswordCompromised } from './utils/password-validation.util';
import { Role } from '#db';
import { AuthError, GeneralAuthError } from './errors/auth.errors';

/**
 * Authentication service containing business logic for user authentication and authorization
 * Uses dependency injection with repository port interfaces and implements error handling strategy pattern
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly authRepository: AuthRepositoryPort,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly errorHandler: AuthErrorHandler,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Authenticate user and generate access tokens
   * @param loginDto - Login credentials (email and password)
   * @returns Promise<LoginResponseDto> User authentication response with tokens and user info
   * @throws {InvalidCredentialsError} When email or password is incorrect
   * @throws {UserNotFoundError} When user with specified email doesn't exist
   */
  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    try {
      this.logger.log(`Login attempt for email: ${loginDto.email}`);

      // Find user by email
      const user = await this.authRepository.findUserByEmail(loginDto.email);
      
      if (!user) {
        const error = new UserNotFoundError(loginDto.email);
        await this.errorHandler.handleError(error, {
          operation: 'login',
          email: loginDto.email,
          timestamp: new Date(),
        });
        throw error;
      }

      // Verify password
      const passwordMatches = await bcrypt.compare(loginDto.password, user.password ?? '');
      if (!passwordMatches) {
        const error = new InvalidCredentialsError(loginDto.email);
        await this.errorHandler.handleError(error, {
          operation: 'login',
          email: loginDto.email,
          timestamp: new Date(),
        });
        throw error;
      }

      // Generate tokens
      const tokens = await this.generateTokens(user.id, user.email ?? '', user.role);
      
      // Update refresh token in database
      await this.authRepository.updateRefreshToken(user.id, tokens.refreshToken);

      this.logger.log(`✅ Successful login for user: ${user.id}`);

      return {
        ...tokens,
        user: {
          id: user.id,
          email: user.email ?? '',
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      };
    } catch (error) {
      // If it's already an AuthError, just re-throw it
      if (error instanceof AuthError) {
        throw error;
      }
      
      // For unexpected errors, log and throw as general auth error
      this.logger.error(`❌ Unexpected error during login: ${error.message}`, error.stack);
      const authError = new GeneralAuthError('Unexpected error during login');
      await this.errorHandler.handleError(authError, {
        operation: 'login',
        email: loginDto.email,
        timestamp: new Date(),
      });
      throw authError;
    }
  }

  /**
   * Refresh access token using valid refresh token
   * @param refreshTokenDto - Refresh token data
   * @returns Promise<TokensDto> New access and refresh tokens
   * @throws {InvalidRefreshTokenError} When refresh token is invalid or expired
   */
  async refreshTokens(refreshTokenDto: RefreshTokenDto): Promise<TokensDto> {
    try {
      this.logger.log('Token refresh attempt');

      // Find user by refresh token
      const user = await this.authRepository.findUserByRefreshToken(refreshTokenDto.refreshToken);
      
      if (!user) {
        const error = new InvalidRefreshTokenError();
        await this.errorHandler.handleError(error, {
          operation: 'refreshTokens',
          timestamp: new Date(),
        });
        throw error;
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user.id, user.email ?? '', user.role);
      
      // Update refresh token in database
      await this.authRepository.updateRefreshToken(user.id, tokens.refreshToken);

      this.logger.log(`✅ Tokens refreshed successfully for user: ${user.id}`);

      return tokens;
    } catch (error) {
      this.logger.error(`❌ Token refresh failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Logout user by clearing refresh token
   * @param userId - The unique identifier of the user
   * @returns Promise<void>
   */
  async logout(userId: number): Promise<void> {
    try {
      this.logger.log(`Logout attempt for user: ${userId}`);

      await this.authRepository.updateRefreshToken(userId, null);

      this.logger.log(`✅ User logged out successfully: ${userId}`);
    } catch (error) {
      this.logger.error(`❌ Logout failed for user ${userId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Send password reset email to user
   * @param resetPasswordRequestDto - Password reset request data
   * @returns Promise<void>
   * @throws {EmailNotFoundError} When email doesn't exist in the system
   */
  async sendResetPasswordEmail(resetPasswordRequestDto: ResetPasswordRequestDto): Promise<void> {
    try {
      this.logger.log(`Password reset request for email: ${resetPasswordRequestDto.email}`);

      // Check if user exists
      const user = await this.authRepository.findUserByEmail(resetPasswordRequestDto.email);
      
      if (!user) {
        const error = new EmailNotFoundError(resetPasswordRequestDto.email);
        await this.errorHandler.handleError(error, {
          operation: 'sendResetPasswordEmail',
          email: resetPasswordRequestDto.email,
          timestamp: new Date(),
        });
        throw error;
      }

      // Generate reset token
      const resetToken = await this.jwtService.signAsync(
        { sub: user.id },
        {
          secret: this.configService.get('JWT_RESET_SECRET'),
          expiresIn: '24h',
        },
      );

      // Send reset email
      await this.emailService.sendPasswordResetEmail(resetPasswordRequestDto.email, resetToken);

      this.logger.log(`✅ Password reset email sent successfully to: ${resetPasswordRequestDto.email}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send password reset email: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Reset user password using valid reset token
   * @param resetPasswordDto - Password reset data with token and new password
   * @returns Promise<void>
   * @throws {InvalidResetTokenError} When reset token is invalid or expired
   * @throws {WeakPasswordError} When new password doesn't meet security requirements
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    try {
      this.logger.log('Password reset attempt');

      // Validate new password
      const passwordValidation = validatePassword(resetPasswordDto.newPassword);
      if (!passwordValidation.isValid) {
        const error = new WeakPasswordError();
        await this.errorHandler.handleError(error, {
          operation: 'resetPassword',
          timestamp: new Date(),
        });
        throw error;
      }

      // Check if password is compromised
      if (isPasswordCompromised(resetPasswordDto.newPassword)) {
        const error = new WeakPasswordError();
        await this.errorHandler.handleError(error, {
          operation: 'resetPassword',
          timestamp: new Date(),
        });
        throw error;
      }

      // Verify reset token
      let payload: any;
      try {
        payload = await this.jwtService.verifyAsync(resetPasswordDto.token, {
          secret: this.configService.get('JWT_RESET_SECRET'),
        });
      } catch {
        const error = new InvalidResetTokenError();
        await this.errorHandler.handleError(error, {
          operation: 'resetPassword',
          timestamp: new Date(),
        });
        throw error;
      }

      // Check if user exists
      const user = await this.authRepository.findUserById(payload.sub);
      if (!user) {
        const error = new UserNotFoundError('unknown');
        await this.errorHandler.handleError(error, {
          operation: 'resetPassword',
          timestamp: new Date(),
        });
        throw error;
      }

      // Update password
      await this.authRepository.updateUser(user.id, { password: resetPasswordDto.newPassword });

      this.logger.log(`✅ Password reset successfully for user: ${user.id}`);
    } catch (error) {
      this.logger.error(`❌ Password reset failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Register new user with validation
   * @param registerData - User registration data
   * @returns Promise<LoginResponseDto> Registration response with tokens and user info
   * @throws {EmailAlreadyExistsError} When email is already registered
   * @throws {WeakPasswordError} When password doesn't meet security requirements
   */
  async register(registerData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<LoginResponseDto> {
    try {
      this.logger.log(`Registration attempt for email: ${registerData.email}`);

      // Check if email already exists
      const emailExists = await this.authRepository.isEmailExists(registerData.email);
      if (emailExists) {
        const error = new EmailAlreadyExistsError(registerData.email);
        await this.errorHandler.handleError(error, {
          operation: 'register',
          email: registerData.email,
          timestamp: new Date(),
        });
        throw error;
      }

      // Validate password
      const passwordValidation = validatePassword(registerData.password);
      if (!passwordValidation.isValid) {
        const error = new WeakPasswordError();
        await this.errorHandler.handleError(error, {
          operation: 'register',
          email: registerData.email,
          timestamp: new Date(),
        });
        throw error;
      }

      // Check if password is compromised
      if (isPasswordCompromised(registerData.password)) {
        const error = new WeakPasswordError();
        await this.errorHandler.handleError(error, {
          operation: 'register',
          email: registerData.email,
          timestamp: new Date(),
        });
        throw error;
      }

      // Create user with Admin role (only admins exist in this system)
      const user = await this.authRepository.createUser({
        ...registerData,
        role: Role.Admin, // Always create as Admin
      });

      // Generate tokens
      const tokens = await this.generateTokens(user.id, user.email ?? '', user.role);
      
      // Update refresh token
      await this.authRepository.updateRefreshToken(user.id, tokens.refreshToken);

      // Send welcome email
      try {
        await this.emailService.sendWelcomeEmail(user.email ?? '', user.firstName);
      } catch (emailError) {
        this.logger.warn(`Failed to send welcome email to ${user.email}: ${emailError.message}`);
      }

      this.logger.log(`✅ User registered successfully: ${user.id}`);

      return {
        ...tokens,
        user: {
          id: user.id,
          email: user.email ?? '',
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      };
    } catch (error) {
      this.logger.error(`❌ Registration failed for email ${registerData.email}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Generate JWT access and refresh tokens
   * @param userId - The unique identifier of the user
   * @param email - User's email address
   * @param role - User's role
   * @returns Promise<TokensDto> Generated access and refresh tokens
   */
  private async generateTokens(userId: number, email: string, role: Role): Promise<TokensDto> {
    const jwtPayload: JwtPayload = {
      sub: userId,
      email: email,
      role: role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(jwtPayload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(jwtPayload, {
        secret: this.configService.get('JWT_SECRET'), // Use same secret for both tokens
        expiresIn: '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
