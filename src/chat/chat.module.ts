import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatRepositoryPort } from './ports/chat-repository.port';
import { MessageRepositoryPort } from './ports/message-repository.port';
import { ChatRepository } from './repositories/chat.repository';
import { MessageRepository } from './repositories/message.repository';
import { ChatErrorHandler } from './handlers/chat-error.handler';
import { ChatAccessDeniedStrategy, MessageSpamStrategy, WebSocketConnectionStrategy, GeneralChatErrorStrategy } from './strategies/chat-error.strategies';
import { OnlineStatusService } from './services/online-status.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ProjectModule } from '../project/project.module';

/**
 * Chat module implementing dependency inversion principle
 * Uses useClass to bind abstract ports to concrete implementations
 * Includes WebSocket gateway for real-time communication
 * Supports project-based chat system with participants
 */
@Module({
  imports: [ConfigModule, PrismaModule, AuthModule, ProjectModule],
  controllers: [ChatController],
  providers: [
    ChatService,
    ChatGateway,
    OnlineStatusService,
    ChatErrorHandler,
    // Repository ports
    {
      provide: ChatRepositoryPort,
      useClass: ChatRepository,
    },
    {
      provide: MessageRepositoryPort,
      useClass: MessageRepository,
    },
    // Error handling strategies
    ChatAccessDeniedStrategy,
    MessageSpamStrategy,
    WebSocketConnectionStrategy,
    GeneralChatErrorStrategy,
  ],
  exports: [ChatService],
})
export class ChatModule {} 
