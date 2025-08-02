import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from './repositories/user.repository';
import { UserErrorHandler } from './handlers/user-error.handler';
import { PasswordChangeEmailService } from './services/password-change-email.service';
import { UserResponseDto } from './dto/user-response.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PaginateUserDto } from './dto/paginate-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ConfirmPasswordChangeDto } from './dto/confirm-password-change.dto';
import { 
  UserNotFoundError, 
  UserAlreadyExistsError,
  InvalidCurrentPasswordError,
  PasswordChangeTokenExpiredError,
  PasswordChangeTokenInvalidError,
  PasswordChangeRateLimitExceededError,
} from './errors/user.errors';
import { validatePassword, isPasswordCompromised } from '../auth/utils/password-validation.util';
import * as bcrypt from 'bcrypt';

/**
 * Service for user business logic
 */
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private readonly passwordChangeAttempts = new Map<number, { count: number; lastAttempt: Date }>();

  constructor(
    private readonly userRepository: UserRepository,
    private readonly errorHandler: UserErrorHandler,
    private readonly passwordChangeEmailService: PasswordChangeEmailService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Find user by ID
   */
  async findUserById(id: number): Promise<UserResponseDto> {
    try {
      const user = await this.userRepository.findById(id);
      
      if (!user) {
        throw new UserNotFoundError({ userId: id, operation: 'findById' });
      }

      return user;
    } catch (error) {
      this.errorHandler.handleWithUserId(error, id, 'findById');
    }
  }

  /**
   * Find user by email
   */
  async findUserByEmail(email: string): Promise<any> {
    try {
      return await this.userRepository.findByEmail(email);
    } catch (error) {
      this.errorHandler.handleWithEmail(error, email, 'findByEmail');
    }
  }



  /**
   * Update user data
   */
  async updateUser(id: number, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    try {
      // Check if user exists
      const existingUser = await this.userRepository.findById(id);
      if (!existingUser) {
        throw new UserNotFoundError({ userId: id, operation: 'update' });
      }

      // Check if email is being changed and new email doesn't exist
      if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
        const emailExists = await this.userRepository.existsByEmail(updateUserDto.email);
        if (emailExists) {
          throw new UserAlreadyExistsError({ 
            email: updateUserDto.email, 
            operation: 'update' 
          });
        }
      }

      return await this.userRepository.update(id, updateUserDto);
    } catch (error) {
      this.errorHandler.handleWithUserId(error, id, 'update');
    }
  }

  /**
   * Update user refresh token
   */
  async updateRefreshToken(userId: number, refreshToken: string | null): Promise<void> {
    try {
      await this.userRepository.updateRefreshToken(userId, refreshToken);
    } catch (error) {
      this.errorHandler.handleWithUserId(error, userId, 'updateRefreshToken');
    }
  }

  /**
   * Find user by refresh token
   */
  async findUserByRefreshToken(refreshToken: string): Promise<any> {
    try {
      return await this.userRepository.findByRefreshToken(refreshToken);
    } catch (error) {
      this.errorHandler.handle(error, { operation: 'findByRefreshToken' });
    }
  }

  /**
   * Get all users (paginated, for admin)
   */
  async getAllUsers(query: PaginateUserDto): Promise<UserResponseDto[]> {
    try {
      return await this.userRepository.findAll(query);
    } catch (error) {
      this.errorHandler.handle(error, { operation: 'getAllUsers' });
    }
  }

  /**
   * Update user by admin (all fields)
   */
  async updateUserByAdmin(id: number, dto: AdminUpdateUserDto): Promise<UserResponseDto> {
    try {
      // Check if user exists
      const existingUser = await this.userRepository.findById(id);
      if (!existingUser) {
        throw new UserNotFoundError({ userId: id, operation: 'updateByAdmin' });
      }

      // Email uniqueness check
      if (dto.email && dto.email !== existingUser.email) {
        const emailExists = await this.userRepository.existsByEmail(dto.email);
        if (emailExists) {
          throw new UserAlreadyExistsError({ 
            email: dto.email, 
            operation: 'updateByAdmin' 
          });
        }
      }

      return await this.userRepository.updateByAdmin(id, dto);
    } catch (error) {
      this.errorHandler.handleWithUserId(error, id, 'updateByAdmin');
    }
  }

  /**
   * Update own profile (firstName, lastName only)
   */
  async updateOwnProfile(id: number, dto: UpdateProfileDto): Promise<UserResponseDto> {
    try {
      // Check if user exists
      const existingUser = await this.userRepository.findById(id);
      if (!existingUser) {
        throw new UserNotFoundError({ userId: id, operation: 'updateProfile' });
      }

      return await this.userRepository.updateProfile(id, dto);
    } catch (error) {
      this.errorHandler.handleWithUserId(error, id, 'updateProfile');
    }
  }

  /**
   * Delete user with cascade deletion of all related data
   */
  async deleteUser(userId: number): Promise<void> {
    try {
      this.logger.log(`Initiating user deletion for user ID: ${userId}`);

      // Check if user exists
      const existingUser = await this.userRepository.findById(userId);
      if (!existingUser) {
        throw new UserNotFoundError({ userId, operation: 'deleteUser' });
      }

      // Log user information before deletion for audit purposes
      this.logger.log(`Deleting user: ${existingUser.email} (ID: ${userId})`);

      // Delete user with cascade deletion
      await this.userRepository.deleteUser(userId);

      this.logger.log(`✅ User deleted successfully: ${existingUser.email} (ID: ${userId})`);
    } catch (error) {
      this.errorHandler.handleWithUserId(error, userId, 'deleteUser');
    }
  }

  /**
   * Initiate password change process
   */
  async initiatePasswordChange(userId: number, dto: ChangePasswordDto): Promise<void> {
    try {
      this.logger.log(`Initiating password change for user: ${userId}`);

      // Check rate limiting (3 attempts per day)
      this.checkPasswordChangeRateLimit(userId);

      // Get user with password for verification
      const user = await this.userRepository.findByEmail(await this.getUserEmail(userId));
      if (!user) {
        throw new UserNotFoundError({ userId, operation: 'initiatePasswordChange' });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(dto.currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        this.incrementPasswordChangeAttempts(userId);
        throw new InvalidCurrentPasswordError({ userId, operation: 'initiatePasswordChange' });
      }

      // Validate new password using auth module logic
      const passwordValidation = validatePassword(dto.newPassword);
      if (!passwordValidation.isValid) {
        throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
      }

      // Check if password is compromised
      if (isPasswordCompromised(dto.newPassword)) {
        throw new Error('Password is compromised and cannot be used');
      }

      // Generate password change token
      const token = await this.generatePasswordChangeToken(userId, dto.newPassword);

      // Save token to database
      await this.userRepository.updatePasswordChangeToken(userId, token);

      // Send confirmation email
      await this.passwordChangeEmailService.sendPasswordChangeConfirmation(
        user.email,
        user.firstName,
        token,
      );

      this.logger.log(`✅ Password change initiated for user: ${userId}`);
    } catch (error) {
      this.errorHandler.handleWithUserId(error, userId, 'initiatePasswordChange');
    }
  }

  /**
   * Confirm password change with token
   */
  async confirmPasswordChange(dto: ConfirmPasswordChangeDto): Promise<void> {
    try {
      this.logger.log('Confirming password change with token');

      // Verify and decode token
      const payload = await this.verifyPasswordChangeToken(dto.token);
      if (!payload) {
        throw new PasswordChangeTokenInvalidError({ operation: 'confirmPasswordChange' });
      }

      // Check if token is expired
      if (Date.now() > payload.exp * 1000) {
        throw new PasswordChangeTokenExpiredError({ operation: 'confirmPasswordChange' });
      }

      // Find user by token
      const user = await this.userRepository.findByPasswordChangeToken(dto.token);
      if (!user) {
        throw new PasswordChangeTokenInvalidError({ operation: 'confirmPasswordChange' });
      }

      // Update password
      const hashedPassword = await bcrypt.hash(payload.newPassword, 10);
      await this.userRepository.updatePassword(user.id, hashedPassword);

      // Invalidate all refresh tokens
      await this.userRepository.invalidateAllRefreshTokens(user.id);

      // Send success email
      await this.passwordChangeEmailService.sendPasswordChangeSuccess(
        user.email,
        user.firstName,
      );

      // Clear rate limiting for this user
      this.passwordChangeAttempts.delete(user.id);

      this.logger.log(`✅ Password changed successfully for user: ${user.id}`);
    } catch (error) {
      this.errorHandler.handle(error, { operation: 'confirmPasswordChange' });
    }
  }

  /**
   * Check password change rate limit
   */
  private checkPasswordChangeRateLimit(userId: number): void {
    const now = new Date();
    const userAttempts = this.passwordChangeAttempts.get(userId);

    if (userAttempts) {
      const timeDiff = now.getTime() - userAttempts.lastAttempt.getTime();
      const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

      // Reset counter if more than 24 hours have passed
      if (timeDiff > oneDay) {
        this.passwordChangeAttempts.set(userId, { count: 1, lastAttempt: now });
        return;
      }

      // Check if limit exceeded (3 attempts per day)
      if (userAttempts.count >= 3) {
        throw new PasswordChangeRateLimitExceededError({ userId, operation: 'checkPasswordChangeRateLimit' });
      }
    }
  }

  /**
   * Increment password change attempts
   */
  private incrementPasswordChangeAttempts(userId: number): void {
    const now = new Date();
    const userAttempts = this.passwordChangeAttempts.get(userId);

    if (userAttempts) {
      userAttempts.count++;
      userAttempts.lastAttempt = now;
    } else {
      this.passwordChangeAttempts.set(userId, { count: 1, lastAttempt: now });
    }
  }

  /**
   * Generate password change token
   */
  private async generatePasswordChangeToken(userId: number, newPassword: string): Promise<string> {
    const payload = {
      sub: userId,
      newPassword,
      type: 'password-change',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour expiration
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_SECRET'),
    });
  }

  /**
   * Verify password change token
   */
  private async verifyPasswordChangeToken(token: string): Promise<any> {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      if (payload.type !== 'password-change') {
        return null;
      }

      return payload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get user email by ID
   */
  private async getUserEmail(userId: number): Promise<string> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError({ userId, operation: 'getUserEmail' });
    }
    return user.email;
  }
}
