import { User, Role } from '#db';

export type UserWithProfiles = User;

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: Role; // Defaults to Admin in schema
}

export interface UpdateUserData {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: Role;
  refreshToken?: string | null;
}

export interface AuthFilters {
  email?: string;
  role?: Role; // Only Admin role exists in schema
}

/**
 * Abstract port for authentication repository operations
 * This interface defines the contract for user storage operations
 * following the dependency inversion principle
 */
export abstract class AuthRepositoryPort {
  /**
   * Find user by email address
   * @param email - The email address to search for
   * @returns Promise<UserWithProfiles | null> User or null if not found
   */
  abstract findUserByEmail(email: string): Promise<UserWithProfiles | null>;

  /**
   * Find user by ID
   * @param userId - The unique identifier of the user
   * @returns Promise<UserWithProfiles | null> User or null if not found
   */
  abstract findUserById(userId: number): Promise<UserWithProfiles | null>;

  /**
   * Find user by refresh token
   * @param refreshToken - The refresh token to search for
   * @returns Promise<UserWithProfiles | null> User or null if not found
   */
  abstract findUserByRefreshToken(refreshToken: string): Promise<UserWithProfiles | null>;

  /**
   * Create a new user
   * @param data - User creation data
   * @returns Promise<UserWithProfiles> Created user
   */
  abstract createUser(data: CreateUserData): Promise<UserWithProfiles>;

  /**
   * Update user information
   * @param userId - The unique identifier of the user
   * @param data - User update data
   * @returns Promise<UserWithProfiles> Updated user
   */
  abstract updateUser(userId: number, data: UpdateUserData): Promise<UserWithProfiles>;

  /**
   * Update user's refresh token
   * @param userId - The unique identifier of the user
   * @param refreshToken - The new refresh token or null to clear
   * @returns Promise<void>
   */
  abstract updateRefreshToken(userId: number, refreshToken: string | null): Promise<void>;

  /**
   * Check if email already exists
   * @param email - The email address to check
   * @returns Promise<boolean> True if email exists, false otherwise
   */
  abstract isEmailExists(email: string): Promise<boolean>;

  /**
   * Find users with filters
   * @param filters - Filtering options
   * @returns Promise<UserWithProfiles[]> Array of users
   */
  abstract findUsers(filters: AuthFilters): Promise<UserWithProfiles[]>;

  /**
   * Delete user by ID
   * @param userId - The unique identifier of the user
   * @returns Promise<void>
   */
  abstract deleteUser(userId: number): Promise<void>;

  /**
   * Get users count with filters
   * @param filters - Filtering options
   * @returns Promise<number> Number of users matching filters
   */
  abstract getUsersCount(filters: AuthFilters): Promise<number>;
} 