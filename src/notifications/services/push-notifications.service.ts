import { Inject, Injectable, Logger } from '@nestjs/common';
import { PushProviderPort } from '../ports/push-provider.port';
import { NotificationRepositoryPort, NOTIFICATION_REPOSITORY_PORT } from '../ports/notification-repository.port';

export type ChatPushParams = {
  recipientUserId: number;
  chatId: number;
  messageId: number;
  projectId: number;
  preview: string;
  senderName: string;
  senderId: number;
};

@Injectable()
export class PushNotificationsService {
  private readonly logger = new Logger(PushNotificationsService.name);

  constructor(
    private readonly provider: PushProviderPort,
    @Inject(NOTIFICATION_REPOSITORY_PORT) private readonly repo: NotificationRepositoryPort,
  ) {}

  async sendToUser(params: {
    userId: number;
    title: string;
    body: string;
    data?: Record<string, string>;
  }): Promise<void> {
    const tokens = await this.repo.getActiveTokensByUserId(params.userId);
    if (!tokens.length) {
      return;
    }
    const result = await this.provider.sendToTokens({
      tokens,
      notification: { title: params.title, body: params.body },
      data: params.data,
    });
    if (result.invalid.length) {
      await Promise.all(result.invalid.map(t => this.repo.deactivateToken(t)));
      this.logger.warn(`Deactivated ${result.invalid.length} invalid tokens for user ${params.userId}`);
    }
  }

  async sendChatMessagePush(input: ChatPushParams): Promise<void> {
    const { recipientUserId, chatId, messageId, projectId, preview, senderName, senderId } = input;
    const title = senderName || 'New message';
    const body = preview || 'You have a new message';
    await this.sendToUser({
      userId: recipientUserId,
      title,
      body,
      data: {
        type: 'chat_message',
        chatId: String(chatId),
        messageId: String(messageId),
        projectId: String(projectId),
        senderId: String(senderId),
        deeplink: `app://chat/${chatId}`,
      },
    });
  }
}


