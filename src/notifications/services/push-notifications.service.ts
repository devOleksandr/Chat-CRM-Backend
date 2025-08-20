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

  /**
   * Відправка push-повідомлення конкретному користувачу
   */
  async sendToUser(params: {
    userId: number;
    title: string;
    body: string;
    data?: Record<string, string>;
  }): Promise<void> {
    this.logger.log(`📱 Sending push notification to user ${params.userId}: ${params.title}`);
    
    const tokens = await this.repo.getActiveTokensByUserId(params.userId);
    if (!tokens.length) {
      this.logger.warn(`No active Expo push tokens found for user ${params.userId}`);
      return;
    }

    this.logger.log(`Found ${tokens.length} active Expo push tokens for user ${params.userId}`);

    const result = await this.provider.sendToTokens({
      tokens,
      notification: { title: params.title, body: params.body },
      data: params.data,
    });

    // Обробляємо результати
    if (result.invalid.length) {
      this.logger.warn(`Found ${result.invalid.length} invalid Expo push tokens for user ${params.userId}`);
      // Деактивуємо недійсні токени
      await Promise.all(result.invalid.map(token => this.repo.deactivateToken(token)));
    }

    if (result.failed.length) {
      this.logger.error(`Failed to send ${result.failed.length} push notifications to user ${params.userId}`);
    }

    this.logger.log(`✅ Push notification sent to user ${params.userId}: ${result.success.length} success, ${result.failed.length} failed`);
  }

  /**
   * Відправка push-повідомлення для чату
   */
  async sendChatMessagePush(input: ChatPushParams): Promise<void> {
    const { recipientUserId, chatId, messageId, projectId, preview, senderName, senderId } = input;
    
    this.logger.log(`📱 Sending chat push notification to user ${recipientUserId} in chat ${chatId}`);
    
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
        // Додаткові дані для Expo
        _displayInForeground: 'true', // Показувати навіть коли додаток відкритий
        sound: 'default',
        priority: 'high',
      },
    });
  }

  /**
   * Відправка тестового push-повідомлення
   */
  async sendTestNotification(userId: number, message: string = 'This is a test push notification'): Promise<void> {
    this.logger.log(`🧪 Sending test push notification to user ${userId}`);
    
    await this.sendToUser({
      userId,
      title: 'Test Notification',
      body: message,
      data: {
        type: 'test',
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Отримання статистики push-повідомлень
   */
  async getPushStats(): Promise<{
    totalUsers: number;
    activeTokens: number;
    expoTokens: number;
    byPlatform: Record<string, number>;
  }> {
    const stats = await this.repo.getTokenStats();
    
    return {
      totalUsers: stats.total,
      activeTokens: stats.active,
      expoTokens: stats.expo,
      byPlatform: stats.byPlatform,
    };
  }
}


