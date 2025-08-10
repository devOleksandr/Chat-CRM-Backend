export abstract class PushProviderPort {
  abstract sendToTokens(params: {
    tokens: string[];
    notification: { title: string; body: string };
    data?: Record<string, string>;
  }): Promise<{ success: string[]; invalid: string[]; failed: string[] }>;
}


