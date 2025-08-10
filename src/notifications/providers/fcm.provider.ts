import { Injectable, Logger } from '@nestjs/common';
import { PushProviderPort } from '../ports/push-provider.port';
import * as admin from 'firebase-admin';

@Injectable()
export class FcmProvider extends PushProviderPort {
  private readonly logger = new Logger(FcmProvider.name);
  private initialized = false;

  private ensureInitialized(): void {
    if (this.initialized) {
      return;
    }
    const credsPath = process.env.FIREBASE_CREDENTIALS_PATH;
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

    if (!admin.apps.length) {
      if (credsPath) {
        admin.initializeApp({
          credential: admin.credential.cert(require(credsPath)),
        });
      } else {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          } as admin.ServiceAccount),
        });
      }
      this.logger.log('Firebase Admin initialized');
    }
    this.initialized = true;
  }

  async sendToTokens(params: {
    tokens: string[];
    notification: { title: string; body: string };
    data?: Record<string, string>;
  }): Promise<{ success: string[]; invalid: string[]; failed: string[] }> {
    this.ensureInitialized();
    const { tokens, notification, data } = params;
    if (!tokens.length) {
      return { success: [], invalid: [], failed: [] };
    }
    const chunks: string[][] = [];
    const CHUNK = 500;
    for (let i = 0; i < tokens.length; i += CHUNK) {
      chunks.push(tokens.slice(i, i + CHUNK));
    }
    const success: string[] = [];
    const invalid: string[] = [];
    const failed: string[] = [];

    for (const chunk of chunks) {
      try {
        const res = await admin.messaging().sendEachForMulticast({
          tokens: chunk,
          notification,
          data,
        });
        res.responses.forEach((r, idx) => {
          const t = chunk[idx];
          if (r.success) success.push(t);
          else if (r.error && this.isInvalidTokenError(r.error.code)) invalid.push(t);
          else failed.push(t);
        });
      } catch (e: any) {
        this.logger.error(`FCM batch send failed: ${e?.message}`);
        failed.push(...chunk);
      }
    }
    return { success, invalid, failed };
  }

  private isInvalidTokenError(code?: string): boolean {
    return (
      code === 'messaging/registration-token-not-registered' ||
      code === 'messaging/invalid-registration-token'
    );
  }
}


