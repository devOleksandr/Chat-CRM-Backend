import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ProjectModule } from './project/project.module';
import { ChatModule } from './chat/chat.module';
import { PrismaModule } from './prisma/prisma.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ConfigModule } from '@nestjs/config';
import { ChatAnalyticsModule } from './chat-analytics/chat-analytics.module';
import expoConfig from './config/expo.config';

@Module({
  imports: [
    AuthModule,
    UserModule,
    ProjectModule,
    ChatModule,
    NotificationsModule,
    ChatAnalyticsModule,
    PrismaModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [expoConfig], // Додаємо Expo конфігурацію
    }),
  ],
})
export class AppModule {}
