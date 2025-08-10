import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProjectModule } from '../project/project.module';
import { ChatAnalyticsService } from './chat-analytics.service';
import { ChatAnalyticsController } from './chat-analytics.controller';

@Module({
  imports: [PrismaModule, ProjectModule],
  controllers: [ChatAnalyticsController],
  providers: [ChatAnalyticsService],
  exports: [ChatAnalyticsService],
})
export class ChatAnalyticsModule {}


