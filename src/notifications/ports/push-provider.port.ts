export abstract class PushProviderPort {
  abstract sendToTokens(params: {
    tokens: string[];
    notification: { title: string; body: string };
    data?: Record<string, string>;
  }): Promise<{ success: string[]; invalid: string[]; failed: string[] }>;

  /**
   * Відправка push-повідомлення конкретному користувачу
   */
  abstract sendToUser(userId: number, notification: { title: string; body: string }, data?: Record<string, string>): Promise<void>;

  /**
   * Відправка push-повідомлення в чат
   */
  abstract sendChatNotification(params: {
    recipientUserId: number;
    chatId: number;
    messageId: number;
    projectId: number;
    preview: string;
    senderName: string;
    senderId: number;
  }): Promise<void>;
}


