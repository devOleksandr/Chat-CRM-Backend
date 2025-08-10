export type RegisterDeviceInput = {
  userId: number;
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceId?: string;
  appVersion?: string;
  locale?: string;
};

export const NOTIFICATION_REPOSITORY_PORT = 'NOTIFICATION_REPOSITORY_PORT';

export abstract class NotificationRepositoryPort {
  abstract registerOrUpdateDevice(input: RegisterDeviceInput): Promise<void>;
  abstract deactivateToken(token: string): Promise<void>;
  abstract getActiveTokensByUserId(userId: number): Promise<string[]>;
}


