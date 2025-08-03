import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MaxLength, MinLength } from 'class-validator';

/**
 * Data Transfer Object for creating a new project participant
 * Used for mobile app without authentication - participantId is provided externally
 */
export class CreateProjectParticipantDto {
  @ApiProperty({
    description: 'Unique ID of the project where the participant will be added',
    example: 'PROJ-001',
    minLength: 3,
    maxLength: 50,
  })
  @IsString({ message: 'Project unique ID must be a string' })
  @IsNotEmpty({ message: 'Project unique ID is required' })
  @MinLength(3, { message: 'Project unique ID must be at least 3 characters long' })
  @MaxLength(50, { message: 'Project unique ID must not exceed 50 characters' })
  readonly projectUniqueId: string;

  @ApiProperty({
    description: 'External participant ID provided by mobile app',
    example: 'mobile_user_123',
    minLength: 3,
    maxLength: 50,
  })
  @IsString({ message: 'Participant ID must be a string' })
  @IsNotEmpty({ message: 'Participant ID is required' })
  @MinLength(3, { message: 'Participant ID must be at least 3 characters long' })
  @MaxLength(50, { message: 'Participant ID must not exceed 50 characters' })
  readonly participantId: string;

  @ApiPropertyOptional({
    description: 'First name of the participant (optional for mobile app)',
    example: 'John',
    maxLength: 50,
  })
  @IsOptional()
  @IsString({ message: 'First name must be a string' })
  @MaxLength(50, { message: 'First name must not exceed 50 characters' })
  readonly firstName?: string;

  @ApiPropertyOptional({
    description: 'Last name of the participant (optional for mobile app)',
    example: 'Doe',
    maxLength: 50,
  })
  @IsOptional()
  @IsString({ message: 'Last name must be a string' })
  @MaxLength(50, { message: 'Last name must not exceed 50 characters' })
  readonly lastName?: string;

  @ApiPropertyOptional({
    description: 'Email address of the participant (optional for mobile app)',
    example: 'john.doe@example.com',
  })
  @IsOptional()
  @IsString({ message: 'Email must be a string' })
  readonly email?: string;
} 