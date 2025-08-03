import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageType } from '../ports/message-repository.port';

/**
 * Data Transfer Object for message sender information
 */
export class MessageSenderDto {
  @ApiProperty({
    description: 'User ID',
    example: 1,
  })
  readonly id: number;

  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
    nullable: true,
  })
  readonly email: string | null;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  readonly firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  readonly lastName: string;

  @ApiPropertyOptional({
    description: 'User unique identifier (for participants)',
    example: 'user123',
  })
  readonly uniqueId?: string;

  @ApiProperty({
    description: 'Whether the user is currently online',
    example: true,
  })
  readonly isOnline: boolean;

  @ApiPropertyOptional({
    description: 'Last time the user was seen',
    example: '2025-01-15T10:30:00.000Z',
    nullable: true,
  })
  readonly lastSeen?: Date | null;
}

/**
 * Data Transfer Object for message response
 */
export class MessageResponseDto {
  @ApiProperty({
    description: 'Message ID',
    example: 1,
  })
  readonly id: number;

  @ApiProperty({
    description: 'Chat ID where the message belongs',
    example: 1,
  })
  readonly chatId: number;

  @ApiProperty({
    description: 'ID of the user who sent the message',
    example: 1,
  })
  readonly senderId: number;

  @ApiProperty({
    description: 'Message content',
    example: 'Hello! How can I help you today?',
  })
  readonly content: string;

  @ApiProperty({
    description: 'Type of the message. IMAGE for image files, FILE for other files, TEXT for text messages',
    enum: MessageType,
    example: MessageType.TEXT,
  })
  readonly type: MessageType;

  @ApiPropertyOptional({
    description: 'Additional metadata for the message',
    example: { 
      fileUrl: 'https://storage.googleapis.com/bucket/chat/1/uuid.jpg', 
      fileName: 'image.jpg',
      fileSize: 1024000,
      mimeType: 'image/jpeg',
      originalName: 'photo.jpg'
    },
  })
  readonly metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Whether the message has been read',
    example: false,
  })
  readonly read: boolean;

  @ApiPropertyOptional({
    description: 'Timestamp when the message was read',
    example: '2025-01-15T10:35:00.000Z',
    nullable: true,
  })
  readonly readAt?: Date | null;

  @ApiProperty({
    description: 'Message creation timestamp',
    example: '2025-01-15T10:30:00.000Z',
  })
  readonly createdAt: Date;

  @ApiProperty({
    description: 'Information about the message sender',
    type: MessageSenderDto,
  })
  readonly sender: MessageSenderDto;
}

/**
 * Data Transfer Object for paginated messages response
 */
export class PaginatedMessagesResponseDto {
  @ApiProperty({
    description: 'Array of messages',
    type: [MessageResponseDto],
  })
  readonly messages: MessageResponseDto[];

  @ApiProperty({
    description: 'Total number of messages in the chat',
    example: 50,
  })
  readonly totalCount: number;

  @ApiProperty({
    description: 'Number of messages per page',
    example: 20,
  })
  readonly limit: number;

  @ApiProperty({
    description: 'Number of messages skipped',
    example: 0,
  })
  readonly offset: number;
} 
