/**
 * Context for user-related errors
 */
export interface UserErrorContext {
  userId?: number;
  email?: string;
  operation?: string;
  additionalData?: Record<string, any>;
} 