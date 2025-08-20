import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ProjectModule } from '../project/project.module';
import { NotificationsController } from 'src/notifications/notifications.controller';
import { PushNotificationsService } from 'src/notifications/services/push-notifications.service';
import { PushProviderPort } from 'src/notifications/ports/push-provider.port';
import { ExpoPushProvider } from 'src/notifications/providers/expo-push.provider';
import { NotificationRepositoryPort, NOTIFICATION_REPOSITORY_PORT } from 'src/notifications/ports/notification-repository.port';
import { NotificationRepository } from 'src/notifications/repositories/notification.repository';

@Module({
  imports: [ConfigModule, PrismaModule, AuthModule, ProjectModule],
  controllers: [NotificationsController],
  providers: [
    PushNotificationsService,
    // Використовуємо Expo Push Provider замість FCM
    { provide: PushProviderPort, useClass: ExpoPushProvider },
    { provide: NOTIFICATION_REPOSITORY_PORT, useClass: NotificationRepository },
  ],
  exports: [PushNotificationsService],
})
export class NotificationsModule {}


