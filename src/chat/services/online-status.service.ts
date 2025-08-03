import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Service for managing user online status
 * Handles updating user online/offline status and last seen timestamp
 */
@Injectable()
export class OnlineStatusService {
  private readonly logger = new Logger(OnlineStatusService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Update user online status
   * @param userId - The user ID
   * @param isOnline - Whether user is online
   * @returns Promise<void>
   */
  async updateUserOnlineStatus(userId: number, isOnline: boolean): Promise<void> {
    try {
      this.logger.log(`Updating online status for user ${userId}: ${isOnline}`);

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          isOnline,
          lastSeen: isOnline ? null : new Date(),
        },
      });

      this.logger.log(`✅ Successfully updated online status for user ${userId}`);
    } catch (error) {
      this.logger.error(`❌ Failed to update online status for user ${userId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get user online status
   * @param userId - The user ID
   * @returns Promise<{ isOnline: boolean; lastSeen: Date | null }>
   */
  async getUserOnlineStatus(userId: number): Promise<{ isOnline: boolean; lastSeen: Date | null }> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          isOnline: true,
          lastSeen: true,
        },
      });

      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      return {
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
      };
    } catch (error) {
      this.logger.error(`❌ Failed to get online status for user ${userId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Mark all users as offline (useful for server restart)
   * @returns Promise<void>
   */
  async markAllUsersOffline(): Promise<void> {
    try {
      this.logger.log('Marking all users as offline...');

      await this.prisma.user.updateMany({
        data: {
          isOnline: false,
          lastSeen: new Date(),
        },
      });

      this.logger.log('✅ Successfully marked all users as offline');
    } catch (error) {
      this.logger.error(`❌ Failed to mark all users offline: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get online users count
   * @returns Promise<number>
   */
  async getOnlineUsersCount(): Promise<number> {
    try {
      return await this.prisma.user.count({
        where: {
          isOnline: true,
        },
      });
    } catch (error) {
      this.logger.error(`❌ Failed to get online users count: ${error.message}`, error.stack);
      throw error;
    }
  }
} 