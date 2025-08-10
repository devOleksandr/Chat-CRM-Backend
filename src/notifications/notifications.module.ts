import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ProjectModule } from '../project/project.module';
import { NotificationsController } from 'src/notifications/notifications.controller';
import { PushNotificationsService } from 'src/notifications/services/push-notifications.service';
import { PushProviderPort } from 'src/notifications/ports/push-provider.port';
import { FcmProvider } from 'src/notifications/providers/fcm.provider';
import { NotificationRepositoryPort, NOTIFICATION_REPOSITORY_PORT } from 'src/notifications/ports/notification-repository.port';
import { NotificationRepository } from 'src/notifications/repositories/notification.repository';

@Module({
  imports: [ConfigModule, PrismaModule, AuthModule, ProjectModule],
  controllers: [NotificationsController],
  providers: [
    PushNotificationsService,
    { provide: PushProviderPort, useClass: FcmProvider },
    { provide: NOTIFICATION_REPOSITORY_PORT, useClass: NotificationRepository },
  ],
  exports: [PushNotificationsService],
})
export class NotificationsModule {}


