import { UserResponseDto } from '../dto/user-response.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { AdminUpdateUserDto } from '../dto/admin-update-user.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { PaginateUserDto } from '../dto/paginate-user.dto';

/**
 * Port for user repository operations
 */
export interface UserRepositoryPort {
  /**
   * Find user by ID
   */
  findById(id: number): Promise<UserResponseDto | null>;

  /**
   * Find user by email
   */
  findByEmail(email: string): Promise<any>;

  /**
   * Find user by refresh token
   */
  findByRefreshToken(refreshToken: string): Promise<any>;

  /**
   * Check if user exists by email
   */
  existsByEmail(email: string): Promise<boolean>;

  /**
   * Create new user
   */
  create(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: string;
  }): Promise<UserResponseDto>;

  /**
   * Update user
   */
  update(id: number, updateData: UpdateUserDto): Promise<UserResponseDto>;

  /**
   * Update user by admin
   */
  updateByAdmin(id: number, updateData: AdminUpdateUserDto): Promise<UserResponseDto>;

  /**
   * Update own profile
   */
  updateProfile(id: number, updateData: UpdateProfileDto): Promise<UserResponseDto>;

  /**
   * Update refresh token
   */
  updateRefreshToken(userId: number, refreshToken: string | null): Promise<void>;

  /**
   * Get all users with pagination
   */
  findAll(query: PaginateUserDto): Promise<UserResponseDto[]>;

  /**
   * Update password change token
   */
  updatePasswordChangeToken(userId: number, token: string | null): Promise<void>;

  /**
   * Find user by password change token
   */
  findByPasswordChangeToken(token: string): Promise<any>;

  /**
   * Update password
   */
  updatePassword(userId: number, hashedPassword: string): Promise<void>;

  /**
   * Invalidate all refresh tokens for user
   */
  invalidateAllRefreshTokens(userId: number): Promise<void>;

  /**
   * Delete user with cascade deletion of all related data
   */
  deleteUser(userId: number): Promise<void>;
} 