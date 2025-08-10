import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength, IsEnum, IsObject } from 'class-validator';
import { MessageType } from '../ports/message-repository.port';

/**
 * DTO for broadcasting a message to all project participants
 */
export class BroadcastMessageDto {
  @ApiProperty({
    description: 'Content of the message to broadcast',
    example: 'Hello everyone! Please check the latest updates.',
    maxLength: 1000,
  })
  @IsString({ message: 'Content must be a string' })
  @IsNotEmpty({ message: 'Content is required' })
  @MaxLength(1000, { message: 'Content must not exceed 1000 characters' })
  readonly content!: string;

  @ApiPropertyOptional({
    description: 'Type of the message. IMAGE for image files, FILE for other files, TEXT for text messages',
    enum: MessageType,
    example: MessageType.TEXT,
    default: MessageType.TEXT,
  })
  @IsOptional()
  @IsEnum(MessageType, { message: 'Type must be a valid message type' })
  readonly type?: MessageType;

  @ApiPropertyOptional({
    description: 'Additional metadata for the message (e.g., file info, emoji data)',
    example: {
      fileUrl: 'https://storage.googleapis.com/bucket/chat/1/uuid.jpg',
      fileName: 'image.jpg',
      fileSize: 1024000,
      mimeType: 'image/jpeg',
      originalName: 'photo.jpg',
    },
  })
  @IsOptional()
  @IsObject({ message: 'Metadata must be an object' })
  readonly metadata?: Record<string, any>;
}


