import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationRepositoryPort, RegisterDeviceInput } from '../ports/notification-repository.port';

@Injectable()
export class NotificationRepository implements NotificationRepositoryPort {
  private readonly logger = new Logger(NotificationRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async registerOrUpdateDevice(input: RegisterDeviceInput): Promise<void> {
    const { userId, token, platform, deviceId, appVersion, locale } = input;
    await this.prisma.deviceToken.upsert({
      where: { token },
      create: {
        userId,
        token,
        platform: platform as any,
        deviceId,
        appVersion,
        locale,
        isActive: true,
        lastUsedAt: new Date(),
      },
      update: {
        userId,
        platform: platform as any,
        deviceId,
        appVersion,
        locale,
        isActive: true,
        lastUsedAt: new Date(),
      },
    });
    this.logger.log(`Registered/updated device token for user ${userId}`);
  }

  async deactivateToken(token: string): Promise<void> {
    await this.prisma.deviceToken.updateMany({
      where: { token },
      data: { isActive: false },
    });
  }

  async getActiveTokensByUserId(userId: number): Promise<string[]> {
    const tokens = await this.prisma.deviceToken.findMany({
      where: { userId, isActive: true },
      select: { token: true },
    });
    return tokens.map(t => t.token);
  }
}


