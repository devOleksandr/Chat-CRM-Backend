import { ApiProperty } from '@nestjs/swagger';

/**
 * Data Transfer Object for project participant response
 */
export class ProjectParticipantResponseDto {
  @ApiProperty({
    description: 'Participant ID',
    example: 1,
  })
  readonly id: number;

  @ApiProperty({
    description: 'Project ID',
    example: 1,
  })
  readonly projectId: number;

  @ApiProperty({
    description: 'User ID',
    example: 2,
  })
  readonly userId: number;

  @ApiProperty({
    description: 'External participant ID provided by mobile app',
    example: 'mobile_user_123',
  })
  readonly participantId: string;

  @ApiProperty({
    description: 'First name of the participant',
    example: 'John',
  })
  readonly firstName: string;

  @ApiProperty({
    description: 'Last name of the participant',
    example: 'Doe',
  })
  readonly lastName: string;

  @ApiProperty({
    description: 'Email address of the participant (optional)',
    example: 'john.doe@example.com',
    nullable: true,
  })
  readonly email: string | null;

  @ApiProperty({
    description: 'Whether the participant is online',
    example: false,
  })
  readonly isOnline: boolean;

  @ApiProperty({
    description: 'Last seen timestamp',
    example: '2025-01-15T10:00:00.000Z',
    nullable: true,
  })
  readonly lastSeen: Date | null;

  @ApiProperty({
    description: 'When the participant was added to the project',
    example: '2025-01-15T10:00:00.000Z',
  })
  readonly createdAt: Date;
} 