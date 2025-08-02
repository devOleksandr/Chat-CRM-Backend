import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthRepositoryPort, UserWithProfiles, CreateUserData, UpdateUserData, AuthFilters } from '../ports/auth-repository.port';
import { UserRepository } from '../../user/repositories/user.repository';
import { Role } from '#db';
import * as bcrypt from 'bcrypt';

/**
 * Concrete implementation of AuthRepositoryPort using Prisma
 * Handles all database operations for authentication and user management
 */
@Injectable()
export class AuthRepository implements AuthRepositoryPort {
  private readonly logger = new Logger(AuthRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly userRepository: UserRepository,
  ) {}

  /**
   * Find user by email address
   * @param email - The email address to search for
   * @returns Promise<UserWithProfiles | null> User or null if not found
   */
  async findUserByEmail(email: string): Promise<UserWithProfiles | null> {
    try {
      this.logger.log(`Finding user by email: ${email}`);

      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      this.logger.log(`User found: ${user ? 'yes' : 'no'}`);
      return user;
    } catch (error) {
      this.logger.error(`Failed to find user by email ${email}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find user by ID
   * @param userId - The unique identifier of the user
   * @returns Promise<UserWithProfiles | null> User or null if not found
   */
  async findUserById(userId: number): Promise<UserWithProfiles | null> {
    try {
      this.logger.log(`Finding user by ID: ${userId}`);

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      this.logger.log(`User found: ${user ? 'yes' : 'no'}`);
      return user;
    } catch (error) {
      this.logger.error(`Failed to find user by ID ${userId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find user by refresh token
   * @param refreshToken - The refresh token to search for
   * @returns Promise<UserWithProfiles | null> User or null if not found
   */
  async findUserByRefreshToken(refreshToken: string): Promise<UserWithProfiles | null> {
    try {
      this.logger.log('Finding user by refresh token');

      const user = await this.prisma.user.findFirst({
        where: { refreshToken },
      });

      this.logger.log(`User found: ${user ? 'yes' : 'no'}`);
      return user;
    } catch (error) {
      this.logger.error(`Failed to find user by refresh token: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create a new user with hashed password
   * @param data - User creation data
   * @returns Promise<UserWithProfiles> Created user
   */
  async createUser(data: CreateUserData): Promise<UserWithProfiles> {
    try {
      this.logger.log(`Creating new user with email: ${data.email}`);

      // Use UserRepository to create user
      const userResponse = await this.userRepository.create({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        role: data.role || Role.Admin,
      });

      // Get full user data from Prisma for auth purposes
      const user = await this.prisma.user.findUnique({
        where: { id: userResponse.id },
      });

      if (!user) {
        throw new Error('User was created but could not be retrieved');
      }

      this.logger.log(`✅ User created successfully: ${user.id}`);
      return user;
    } catch (error) {
      this.logger.error(`Failed to create user with email ${data.email}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update user data
   * @param userId - The unique identifier of the user
   * @param data - User update data
   * @returns Promise<UserWithProfiles> Updated user
   */
  async updateUser(userId: number, data: UpdateUserData): Promise<UserWithProfiles> {
    try {
      this.logger.log(`Updating user: ${userId}`);

      const updateData: any = { ...data };
      
      // Hash password if provided
      if (data.password) {
        updateData.password = await bcrypt.hash(data.password, 10);
      }

      const user = await this.prisma.user.update({
        where: { id: userId },
        data: updateData,
      });

      this.logger.log(`✅ User updated successfully: ${userId}`);
      return user;
    } catch (error) {
      this.logger.error(`Failed to update user ${userId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update user's refresh token
   * @param userId - The unique identifier of the user
   * @param refreshToken - The new refresh token (or null to clear)
   */
  async updateRefreshToken(userId: number, refreshToken: string | null): Promise<void> {
    try {
      this.logger.log(`Updating refresh token for user: ${userId}`);

      await this.userRepository.updateRefreshToken(userId, refreshToken);

      this.logger.log(`✅ Refresh token updated for user: ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to update refresh token for user ${userId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Check if email already exists
   * @param email - The email address to check
   * @returns Promise<boolean> True if email exists, false otherwise
   */
  async isEmailExists(email: string): Promise<boolean> {
    try {
      this.logger.log(`Checking if email exists: ${email}`);

      const exists = await this.userRepository.existsByEmail(email);

      this.logger.log(`Email exists: ${exists}`);
      return exists;
    } catch (error) {
      this.logger.error(`Failed to check email existence for ${email}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find users with filters
   * @param filters - Filter criteria
   * @returns Promise<UserWithProfiles[]> Array of users
   */
  async findUsers(filters: AuthFilters): Promise<UserWithProfiles[]> {
    try {
      this.logger.log('Finding users with filters');

      const users = await this.prisma.user.findMany({
        where: {
          ...(filters.role && { role: filters.role }),
          ...(filters.email && { email: { contains: filters.email, mode: 'insensitive' } }),
        },
        orderBy: { createdAt: 'desc' },
      });

      this.logger.log(`Found ${users.length} users`);
      return users;
    } catch (error) {
      this.logger.error(`Failed to find users: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete user by ID
   * @param userId - The unique identifier of the user to delete
   */
  async deleteUser(userId: number): Promise<void> {
    try {
      this.logger.log(`Deleting user: ${userId}`);

      await this.prisma.user.delete({
        where: { id: userId },
      });

      this.logger.log(`✅ User deleted successfully: ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to delete user ${userId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get count of users with filters
   * @param filters - Filter criteria
   * @returns Promise<number> Count of users
   */
  async getUsersCount(filters: AuthFilters): Promise<number> {
    try {
      this.logger.log('Getting users count with filters');

      const count = await this.prisma.user.count({
        where: {
          ...(filters.role && { role: filters.role }),
          ...(filters.email && { email: { contains: filters.email, mode: 'insensitive' } }),
        },
      });

      this.logger.log(`Users count: ${count}`);
      return count;
    } catch (error) {
      this.logger.error(`Failed to get users count: ${error.message}`, error.stack);
      throw error;
    }
  }
} 