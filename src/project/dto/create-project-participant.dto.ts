import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEmail, Length } from 'class-validator';

/**
 * DTO for creating a new project participant
 */
export class CreateProjectParticipantDto {
  @ApiProperty({
    description: 'Unique identifier for the participant within the project',
    example: 'user123',
    minLength: 1,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  participantId: string;

  @ApiProperty({
    description: 'Unique identifier of the project',
    example: 'PROJECT-ABC-123',
  })
  @IsString()
  @IsNotEmpty()
  projectUniqueId: string;

  @ApiProperty({
    description: 'First name of the participant',
    example: 'John',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  firstName?: string;

  @ApiProperty({
    description: 'Last name of the participant',
    example: 'Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  lastName?: string;

  @ApiProperty({
    description: 'Email address of the participant',
    example: 'john.doe@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;
} 