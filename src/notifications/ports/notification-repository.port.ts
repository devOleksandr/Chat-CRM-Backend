export type RegisterDeviceInput = {
  userId: number;
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceId?: string;
  appVersion?: string;
  locale?: string;
  expoAppId?: string; // Додаємо Expo app ID
};

export const NOTIFICATION_REPOSITORY_PORT = 'NOTIFICATION_REPOSITORY_PORT';

export abstract class NotificationRepositoryPort {
  abstract registerOrUpdateDevice(input: RegisterDeviceInput): Promise<void>;
  abstract deactivateToken(token: string): Promise<void>;
  abstract getActiveTokensByUserId(userId: number): Promise<string[]>;
  
  // Додаємо нові методи для Expo
  abstract getActiveExpoTokensByUserId(userId: number): Promise<Array<{
    token: string;
    platform: string;
    deviceId?: string;
    expoAppId?: string;
  }>>;
  
  abstract getTokenStats(): Promise<{
    total: number;
    active: number;
    expo: number;
    byPlatform: Record<string, number>;
  }>;
}


