import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PushProviderPort } from '../ports/push-provider.port';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

@Injectable()
export class ExpoPushProvider extends PushProviderPort {
  private readonly logger = new Logger(ExpoPushProvider.name);
  private readonly expo: Expo;
  private readonly projectId: string | undefined;

  constructor(private readonly configService: ConfigService) {
    super();
    
    // Отримуємо Expo конфігурацію
    const accessToken = this.configService.get<string>('expo.accessToken');
    this.projectId = this.configService.get<string>('expo.projectId');
    
    // Створюємо Expo клієнт з access token якщо він є
    if (accessToken) {
      this.expo = new Expo({ accessToken });
      this.logger.log('✅ Expo Push Provider initialized with access token');
    } else {
      this.expo = new Expo();
      this.logger.warn('⚠️ Expo Push Provider initialized without access token (public project)');
    }
    
    if (!this.projectId) {
      this.logger.warn('⚠️ EXPO_PUBLIC_PROJECT_ID not configured');
    } else {
      this.logger.log(`✅ Expo Project ID: ${this.projectId}`);
    }
  }

  async sendToTokens(params: {
    tokens: string[];
    notification: { title: string; body: string };
    data?: Record<string, string>;
  }): Promise<{ success: string[]; invalid: string[]; failed: string[] }> {
    const { tokens, notification, data } = params;
    
    if (!tokens.length) {
      return { success: [], invalid: [], failed: [] };
    }

    // Фільтруємо валідні Expo push tokens
    const validTokens = tokens.filter(token => Expo.isExpoPushToken(token));
    const invalidTokens = tokens.filter(token => !Expo.isExpoPushToken(token));

    if (invalidTokens.length > 0) {
      this.logger.warn(`Found ${invalidTokens.length} invalid Expo push tokens`);
    }

    if (!validTokens.length) {
      return { 
        success: [], 
        invalid: invalidTokens, 
        failed: [] 
      };
    }

    // Створюємо повідомлення для кожного токена
    const messages: ExpoPushMessage[] = validTokens.map(token => ({
      to: token,
      sound: 'default',
      title: notification.title,
      body: notification.body,
      data: {
        ...data,
        projectId: this.projectId, // Додаємо project ID до даних
        timestamp: new Date().toISOString(),
      },
      priority: 'high',
    }));

    // Отримуємо налаштування batch size
    const batchSize = this.configService.get<number>('expo.pushSettings.batchSize') || 100;
    
    // Розбиваємо на чанки (Expo SDK автоматично обробляє batch size)
    const chunks = this.expo.chunkPushNotifications(messages);
    const success: string[] = [];
    const failed: string[] = [];

    this.logger.log(`📱 Sending ${validTokens.length} push notifications in ${chunks.length} chunks`);

    // Відправляємо кожен чанк
    for (const chunk of chunks) {
      try {
        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
        
        // Обробляємо результати
        ticketChunk.forEach((ticket, index) => {
          const chunkIndex = chunks.indexOf(chunk);
          const tokenIndex = chunkIndex * batchSize + index;
          const token = validTokens[tokenIndex];
          
          if (ticket.status === 'ok') {
            success.push(token);
            this.logger.log(`✅ Push notification sent successfully to token: ${token.substring(0, 20)}...`);
          } else {
            failed.push(token);
            this.logger.error(`❌ Failed to send push notification to token: ${token.substring(0, 20)}...`, ticket);
          }
        });
      } catch (error) {
        this.logger.error(`❌ Error sending push notifications chunk: ${error.message}`);
        // Додаємо всі токени з цього чанку до failed
        const chunkTokens = chunk.map(msg => msg.to as string);
        failed.push(...chunkTokens);
      }
    }

    this.logger.log(`📱 Push notifications sent: ${success.length} success, ${failed.length} failed, ${invalidTokens.length} invalid`);

    return {
      success,
      invalid: invalidTokens,
      failed,
    };
  }

  /**
   * Відправка push-повідомлення конкретному користувачу
   */
  async sendToUser(userId: number, notification: { title: string; body: string }, data?: Record<string, string>): Promise<void> {
    this.logger.log(`📱 Sending push notification to user ${userId}: ${notification.title}`);
    // Цей метод буде реалізований через NotificationRepository
  }

  /**
   * Відправка push-повідомлення в чат
   */
  async sendChatNotification(params: {
    recipientUserId: number;
    chatId: number;
    messageId: number;
    projectId: number;
    preview: string;
    senderName: string;
    senderId: number;
  }): Promise<void> {
    const { recipientUserId, chatId, messageId, projectId, preview, senderName, senderId } = params;
    
    this.logger.log(`📱 Sending chat push notification to user ${recipientUserId} in chat ${chatId}`);
    
    // Цей метод буде викликатися через PushNotificationsService
  }

  /**
   * Перевірка конфігурації
   */
  getConfigStatus(): { projectId: string | undefined; hasAccessToken: boolean; isConfigured: boolean } {
    const accessToken = this.configService.get<string>('expo.accessToken');
    
    return {
      projectId: this.projectId,
      hasAccessToken: !!accessToken,
      isConfigured: !!this.projectId,
    };
  }
}
