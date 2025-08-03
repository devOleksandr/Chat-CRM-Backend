import { MessageType } from '../ports/message-repository.port';

/**
 * Utility functions for message validation and type checking
 */

export const IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/svg+xml',
] as const;

export const IMAGE_EXTENSIONS = [
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'bmp',
  'svg',
] as const;

/**
 * Check if a MIME type is an image type
 * @param mimeType - The MIME type to check
 * @returns boolean - True if the MIME type is an image
 */
export function isImageMimeType(mimeType: string): boolean {
  return IMAGE_MIME_TYPES.includes(mimeType as any);
}

/**
 * Check if a file extension is an image extension
 * @param extension - The file extension to check (without dot)
 * @returns boolean - True if the extension is an image
 */
export function isImageExtension(extension: string): boolean {
  return IMAGE_EXTENSIONS.includes(extension.toLowerCase() as any);
}

/**
 * Determine message type based on content and metadata
 * @param content - The message content (URL for files)
 * @param metadata - Optional metadata containing file information
 * @returns MessageType - The appropriate message type
 */
export function determineMessageType(content: string, metadata?: Record<string, any>): MessageType {
  // If metadata contains file information, determine type based on MIME type or extension
  if (metadata?.mimeType) {
    if (isImageMimeType(metadata.mimeType)) {
      return MessageType.IMAGE;
    }
    return MessageType.FILE;
  }

  // If metadata contains file extension
  if (metadata?.extension) {
    if (isImageExtension(metadata.extension)) {
      return MessageType.IMAGE;
    }
    return MessageType.FILE;
  }

  // If content looks like a URL and has image extension
  if (content.startsWith('http') && metadata?.fileName) {
    const extension = metadata.fileName.split('.').pop()?.toLowerCase();
    if (extension && isImageExtension(extension)) {
      return MessageType.IMAGE;
    }
    if (extension) {
      return MessageType.FILE;
    }
  }

  // Default to TEXT
  return MessageType.TEXT;
}

/**
 * Validate image file metadata
 * @param metadata - The metadata to validate
 * @returns object - Validation result with isValid boolean and error message
 */
export function validateImageMetadata(metadata: Record<string, any>): { isValid: boolean; error?: string } {
  if (!metadata.fileUrl) {
    return { isValid: false, error: 'fileUrl is required for image messages' };
  }

  if (!metadata.fileName) {
    return { isValid: false, error: 'fileName is required for image messages' };
  }

  // Check if it's actually an image
  const extension = metadata.fileName.split('.').pop()?.toLowerCase();
  if (extension && !isImageExtension(extension)) {
    return { isValid: false, error: `File extension .${extension} is not a supported image format` };
  }

  if (metadata.mimeType && !isImageMimeType(metadata.mimeType)) {
    return { isValid: false, error: `MIME type ${metadata.mimeType} is not a supported image format` };
  }

  return { isValid: true };
} 