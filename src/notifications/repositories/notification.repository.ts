import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationRepositoryPort, RegisterDeviceInput } from '../ports/notification-repository.port';

@Injectable()
export class NotificationRepository implements NotificationRepositoryPort {
  private readonly logger = new Logger(NotificationRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async registerOrUpdateDevice(input: RegisterDeviceInput): Promise<void> {
    const { userId, token, platform, deviceId, appVersion, locale, expoAppId } = input;
    
    // Валідуємо Expo push token
    if (!this.isValidExpoToken(token)) {
      this.logger.warn(`Invalid Expo push token format: ${token.substring(0, 20)}...`);
      throw new Error('Invalid Expo push token format');
    }

    await this.prisma.deviceToken.upsert({
      where: { token },
      create: {
        userId,
        token,
        platform: platform as any,
        deviceId,
        appVersion,
        locale,
        // expoAppId та tokenType поки не додаємо, оскільки їх немає в схемі
        isActive: true,
        lastUsedAt: new Date(),
      },
      update: {
        userId,
        platform: platform as any,
        deviceId,
        appVersion,
        locale,
        // expoAppId та tokenType поки не додаємо, оскільки їх немає в схемі
        isActive: true,
        lastUsedAt: new Date(),
      },
    });
    
    this.logger.log(`✅ Expo device token registered/updated for user ${userId}`);
  }

  async deactivateToken(token: string): Promise<void> {
    await this.prisma.deviceToken.updateMany({
      where: { token },
      data: { isActive: false },
    });
    
    this.logger.log(`✅ Expo device token deactivated: ${token.substring(0, 20)}...`);
  }

  async getActiveTokensByUserId(userId: number): Promise<string[]> {
    const tokens = await this.prisma.deviceToken.findMany({
      where: { 
        userId, 
        isActive: true,
        // tokenType поки не додаємо, оскільки його немає в схемі
      },
      select: { token: true },
    });
    
    return tokens.map(t => t.token);
  }

  /**
   * Валідація Expo push token формату
   */
  private isValidExpoToken(token: string): boolean {
    return /^(ExponentPushToken|ExpoPushToken)\[.+\]$/.test(token);
  }

  /**
   * Отримання всіх активних Expo токенів для користувача з додатковою інформацією
   */
  async getActiveExpoTokensByUserId(userId: number): Promise<Array<{
    token: string;
    platform: string;
    deviceId?: string;
    expoAppId?: string;
  }>> {
    const tokens = await this.prisma.deviceToken.findMany({
      where: { 
        userId, 
        isActive: true,
        // tokenType поки не додаємо, оскільки його немає в схемі
      },
      select: { 
        token: true,
        platform: true,
        deviceId: true,
        // expoAppId поки не додаємо, оскільки його немає в схемі
      },
    });
    
    return tokens.map(t => ({
      token: t.token,
      platform: t.platform,
      deviceId: t.deviceId || undefined,
      expoAppId: undefined, // Поки не додаємо в схему
    }));
  }

  /**
   * Отримання статистики по токенам
   */
  async getTokenStats(): Promise<{
    total: number;
    active: number;
    expo: number;
    byPlatform: Record<string, number>;
  }> {
    const [total, active] = await Promise.all([
      this.prisma.deviceToken.count(),
      this.prisma.deviceToken.count({ where: { isActive: true } }),
      // expo count поки не додаємо, оскільки tokenType немає в схемі
    ]);

    const byPlatform = await this.prisma.deviceToken.groupBy({
      by: ['platform'],
      where: { isActive: true },
      _count: { platform: true },
    });

    const platformStats: Record<string, number> = {};
    byPlatform.forEach(item => {
      if (item._count && typeof item._count === 'object' && 'platform' in item._count) {
        platformStats[item.platform] = (item._count as any).platform || 0;
      }
    });

    return { 
      total, 
      active, 
      expo: active, // Поки всі активні токени вважаємо Expo
      byPlatform: platformStats 
    };
  }
}


