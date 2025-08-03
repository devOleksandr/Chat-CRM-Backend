import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for project participant response
 */
export class ProjectParticipantResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the participant record',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'ID of the project',
    example: 1,
  })
  projectId: number;

  @ApiProperty({
    description: 'ID of the user (participant)',
    example: 2,
  })
  userId: number;

  @ApiProperty({
    description: 'Unique identifier for the participant within the project',
    example: 'user123',
  })
  participantId: string;

  @ApiProperty({
    description: 'First name of the participant',
    example: 'John',
  })
  firstName: string;

  @ApiProperty({
    description: 'Last name of the participant',
    example: 'Doe',
  })
  lastName: string;

  @ApiProperty({
    description: 'Email address of the participant',
    example: 'john.doe@example.com',
    nullable: true,
  })
  email: string | null;

  @ApiProperty({
    description: 'Whether the participant is currently online',
    example: false,
  })
  isOnline: boolean;

  @ApiProperty({
    description: 'Last time the participant was seen online',
    example: '2024-01-15T10:30:00Z',
    nullable: true,
  })
  lastSeen: string | null;

  @ApiProperty({
    description: 'When the participant was added to the project',
    example: '2024-01-15T10:00:00Z',
  })
  createdAt: string;
} 