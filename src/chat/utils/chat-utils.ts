/**
 * Utility functions for chat operations
 */

/**
 * Calculate human-readable age of a date
 * @param date - The date to calculate age for
 * @returns Human-readable age string
 */
export function calculateChatAge(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) {
    return 'just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  } else {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  }
}

/**
 * Generate a descriptive message based on chat creation status
 * @param isNewChat - Whether the chat was just created
 * @param chatAge - Age of the chat
 * @returns Descriptive message
 */
export function generateChatMessage(isNewChat: boolean, chatAge: string): string {
  if (isNewChat) {
    return 'Chat created successfully';
  } else {
    return `Chat already exists (created ${chatAge})`;
  }
}

/**
 * Format operation type for metadata
 * @param isNewChat - Whether the chat was just created
 * @returns Operation type
 */
export function getOperationType(isNewChat: boolean): 'created' | 'retrieved' {
  return isNewChat ? 'created' : 'retrieved';
} 