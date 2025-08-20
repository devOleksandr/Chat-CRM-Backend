import { registerAs } from '@nestjs/config';

export default registerAs('expo', () => ({
  projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
  accessToken: process.env.EXPO_ACCESS_TOKEN,
  pushSettings: {
    rateLimit: parseInt(process.env.EXPO_PUSH_RATE_LIMIT || '100', 10),
    batchSize: parseInt(process.env.EXPO_PUSH_BATCH_SIZE || '100', 10),
  },
}));
