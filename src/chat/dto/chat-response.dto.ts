import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Data Transfer Object for chat participant information
 */
export class ChatParticipantDto {
  @ApiProperty({
    description: 'User ID',
    example: 1,
  })
  readonly id: number;

  @ApiProperty({
    description: 'User email (optional for participants)',
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
    description: 'User unique ID (for participants)',
    example: 'user123',
  })
  readonly uniqueId?: string;

  @ApiProperty({
    description: 'Whether the user is online',
    example: false,
  })
  readonly isOnline: boolean;

  @ApiProperty({
    description: 'Last seen timestamp',
    example: '2025-01-15T10:00:00.000Z',
    nullable: true,
  })
  readonly lastSeen: Date | null;
}

/**
 * Data Transfer Object for project information
 */
export class ProjectDto {
  @ApiProperty({
    description: 'Project ID',
    example: 1,
  })
  readonly id: number;

  @ApiProperty({
    description: 'Project name',
    example: 'My Project',
  })
  readonly name: string;

  @ApiProperty({
    description: 'Project unique ID',
    example: 'proj123',
  })
  readonly uniqueId: string;
}

/**
 * Data Transfer Object for last message in chat
 */
export class LastMessageDto {
  @ApiProperty({
    description: 'Message ID',
    example: 1,
  })
  readonly id: number;

  @ApiProperty({
    description: 'Message content',
    example: 'Hello! How can I help you?',
  })
  readonly content: string;

  @ApiProperty({
    description: 'Message creation timestamp',
    example: '2025-01-15T10:30:00.000Z',
  })
  readonly createdAt: Date;

  @ApiProperty({
    description: 'ID of the user who sent the message',
    example: 1,
  })
  readonly senderId: number;
}

/**
 * Data Transfer Object for chat response (admin-participant chat)
 * @property id - chat ID
 * @property projectId - project ID
 * @property project - project information
 * @property admin - admin user information
 * @property participant - participant user information
 * @property createdAt - creation date
 * @property updatedAt - update date
 * @property isActive - whether chat is active
 * @property lastMessage - last message
 * @property unreadCount - number of unread messages
 * @property lastMessageAt - last message date
 */
export class ChatResponseDto {
  @ApiProperty({
    description: 'Chat ID',
    example: 1,
  })
  readonly id: number;

  @ApiProperty({
    description: 'Project ID',
    example: 1,
  })
  readonly projectId: number;

  @ApiProperty({
    description: 'Project information',
    type: ProjectDto,
  })
  readonly project: ProjectDto;

  @ApiProperty({
    description: 'Admin user information',
    type: ChatParticipantDto,
  })
  readonly admin: ChatParticipantDto;

  @ApiProperty({
    description: 'Participant user information',
    type: ChatParticipantDto,
  })
  readonly participant: ChatParticipantDto;

  @ApiProperty({
    description: 'Chat creation timestamp',
    example: '2025-01-15T10:00:00.000Z',
  })
  readonly createdAt: Date;

  @ApiProperty({
    description: 'Chat last update timestamp',
    example: '2025-01-15T10:30:00.000Z',
  })
  readonly updatedAt: Date;

  @ApiProperty({
    description: 'Whether the chat is active',
    example: true,
  })
  readonly isActive: boolean;

  @ApiPropertyOptional({
    description: 'Last message in the chat',
    type: LastMessageDto,
  })
  readonly lastMessage?: LastMessageDto;

  @ApiProperty({
    description: 'Number of unread messages for the requesting user',
    example: 3,
  })
  readonly unreadCount: number;

  @ApiPropertyOptional({
    description: 'Timestamp of the last message',
    example: '2025-01-15T10:30:00.000Z',
  })
  readonly lastMessageAt?: Date;
} 
