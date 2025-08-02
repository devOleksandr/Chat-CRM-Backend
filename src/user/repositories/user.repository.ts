import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRepositoryPort } from '../ports/user-repository.port';
import { UserResponseDto } from '../dto/user-response.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { AdminUpdateUserDto } from '../dto/admin-update-user.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { PaginateUserDto } from '../dto/paginate-user.dto';
import { Role } from '#db';
import * as bcrypt from 'bcrypt';

/**
 * Implementation of UserRepositoryPort using Prisma
 * Handles all database operations for users with proper error handling
 */
@Injectable()
export class UserRepository implements UserRepositoryPort {
  private readonly logger = new Logger(UserRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find user by ID
   * @param id - User ID
   * @returns Promise<UserResponseDto | null> User or null if not found
   */
  async findById(id: number): Promise<UserResponseDto | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        pendingEmail: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return null;
    }

    return this.mapToUserResponse(user);
  }

  /**
   * Find user by email
   * @param email - User email
   * @returns Promise<any> User or null if not found
   */
  async findByEmail(email: string): Promise<any> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Find user by refresh token
   * @param refreshToken - Refresh token
   * @returns Promise<any> User or null if not found
   */
  async findByRefreshToken(refreshToken: string): Promise<any> {
    return this.prisma.user.findFirst({
      where: { refreshToken },
    });
  }

  /**
   * Check if user exists by email
   * @param email - User email
   * @returns Promise<boolean> True if user exists, false otherwise
   */
  async existsByEmail(email: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    return !!user;
  }

  /**
   * Create new user
   * @param userData - User creation data
   * @returns Promise<UserResponseDto> Created user
   */
  async create(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: string;
  }): Promise<UserResponseDto> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user = await this.prisma.user.create({
      data: {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: hashedPassword,
        role: userData.role as Role,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        pendingEmail: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return this.mapToUserResponse(user);
  }

  /**
   * Update user
   * @param id - User ID
   * @param updateData - Update data
   * @returns Promise<UserResponseDto> Updated user
   */
  async update(id: number, updateData: UpdateUserDto): Promise<UserResponseDto> {
    const updateDataWithHash: any = { ...updateData };
    
    // Remove password from updateData if it exists, as it should be handled separately
    delete updateDataWithHash.password;

    const user = await this.prisma.user.update({
      where: { id },
      data: updateDataWithHash,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        pendingEmail: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return this.mapToUserResponse(user);
  }

  /**
   * Update user by admin
   * @param id - User ID
   * @param updateData - Update data
   * @returns Promise<UserResponseDto> Updated user
   */
  async updateByAdmin(id: number, updateData: AdminUpdateUserDto): Promise<UserResponseDto> {
    const updateDataWithHash: any = { ...updateData };
    
    // Hash password if provided
    if (updateData.password) {
      updateDataWithHash.password = await bcrypt.hash(updateData.password, 10);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: updateDataWithHash,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        pendingEmail: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return this.mapToUserResponse(user);
  }

  /**
   * Update user profile
   * @param id - User ID
   * @param updateData - Profile update data
   * @returns Promise<UserResponseDto> Updated user
   */
  async updateProfile(id: number, updateData: UpdateProfileDto): Promise<UserResponseDto> {
    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        pendingEmail: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return this.mapToUserResponse(user);
  }

  /**
   * Update refresh token
   * @param userId - User ID
   * @param refreshToken - Refresh token or null
   * @returns Promise<void>
   */
  async updateRefreshToken(userId: number, refreshToken: string | null): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken },
    });
  }

  /**
   * Find all users with pagination
   * @param query - Pagination query
   * @returns Promise<UserResponseDto[]> Array of users
   */
  async findAll(query: PaginateUserDto): Promise<UserResponseDto[]> {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const users = await this.prisma.user.findMany({
      skip,
      take: limit,
      orderBy: { id: 'asc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        pendingEmail: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return users.map(user => this.mapToUserResponse(user));
  }

  /**
   * Update password change token
   * @param userId - User ID
   * @param token - Password change token or null
   * @returns Promise<void>
   */
  async updatePasswordChangeToken(userId: number, token: string | null): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordChangeToken: token },
    });
  }

  /**
   * Find user by password change token
   * @param token - Password change token
   * @returns Promise<any> User or null if not found
   */
  async findByPasswordChangeToken(token: string): Promise<any> {
    return this.prisma.user.findFirst({
      where: { passwordChangeToken: token },
    });
  }

  /**
   * Update password
   * @param userId - User ID
   * @param hashedPassword - Hashed password
   * @returns Promise<void>
   */
  async updatePassword(userId: number, hashedPassword: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { 
        password: hashedPassword,
        passwordChangeToken: null, // Clear the token after password change
      },
    });
  }

  /**
   * Invalidate all refresh tokens for user
   * @param userId - User ID
   * @returns Promise<void>
   */
  async invalidateAllRefreshTokens(userId: number): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  /**
   * Delete user
   * @param userId - User ID
   * @returns Promise<void>
   */
  async deleteUser(userId: number): Promise<void> {
    // Delete the user (this will cascade to any related data)
    await this.prisma.user.delete({
      where: { id: userId },
    });
  }

  /**
   * Map database user to response DTO
   * @param user - Database user object
   * @returns UserResponseDto
   * @private
   */
  private mapToUserResponse(user: any): UserResponseDto {
    return {
      ...user,
      pendingEmail: user.pendingEmail ?? undefined,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
} 