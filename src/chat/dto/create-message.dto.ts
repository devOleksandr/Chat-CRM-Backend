import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsPositive, IsNotEmpty, IsString, IsOptional, IsEnum, MaxLength, IsObject } from 'class-validator';
import { MessageType } from '../ports/message-repository.port';

/**
 * Data Transfer Object for creating a new message
 */
export class CreateMessageDto {
  @ApiProperty({
    description: 'ID of the chat where the message will be sent',
    example: 1,
    minimum: 1,
  })
  @IsInt({ message: 'Chat ID must be an integer' })
  @IsPositive({ message: 'Chat ID must be a positive number' })
  @IsNotEmpty({ message: 'Chat ID is required' })
  readonly chatId: number;

  @ApiProperty({
    description: 'Content of the message',
    example: 'Hello! How can I help you today?',
    maxLength: 1000,
  })
  @IsString({ message: 'Content must be a string' })
  @IsNotEmpty({ message: 'Content is required' })
  @MaxLength(1000, { message: 'Content must not exceed 1000 characters' })
  readonly content: string;

  @ApiPropertyOptional({
    description: 'Type of the message. Use IMAGE for image files, FILE for other files, TEXT for text messages',
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
      originalName: 'photo.jpg'
    },
  })
  @IsOptional()
  @IsObject({ message: 'Metadata must be an object' })
  readonly metadata?: Record<string, any>;
}

/**
 * Data Transfer Object for creating a new message via REST API
 * chatId is taken from URL parameter, so it's not required in body
 */
export class CreateMessageViaApiDto {
  @ApiProperty({
    description: 'Content of the message',
    example: 'Hello! How can I help you today?',
    maxLength: 1000,
  })
  @IsString({ message: 'Content must be a string' })
  @IsNotEmpty({ message: 'Content is required' })
  @MaxLength(1000, { message: 'Content must not exceed 1000 characters' })
  readonly content: string;

  @ApiPropertyOptional({
    description: 'Type of the message. Use IMAGE for image files, FILE for other files, TEXT for text messages',
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
      originalName: 'photo.jpg'
    },
  })
  @IsOptional()
  @IsObject({ message: 'Metadata must be an object' })
  readonly metadata?: Record<string, any>;
} 
