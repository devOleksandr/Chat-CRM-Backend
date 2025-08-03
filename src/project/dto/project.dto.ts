import { IsString, IsNotEmpty, MinLength, MaxLength, Matches, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({
    description: 'Project name',
    example: 'My Awesome Project',
    minLength: 1,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Unique project ID assigned by admin',
    example: 'PROJ-001',
    minLength: 3,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[A-Z0-9-]+$/, {
    message: 'Unique ID must contain only uppercase letters, numbers, and hyphens',
  })
  uniqueId: string;
}

export class UpdateProjectDto {
  @ApiProperty({
    description: 'Project name',
    example: 'Updated Project Name',
    minLength: 1,
    maxLength: 255,
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @ApiProperty({
    description: 'Unique project ID assigned by admin',
    example: 'PROJ-002',
    minLength: 3,
    maxLength: 50,
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[A-Z0-9-]+$/, {
    message: 'Unique ID must contain only uppercase letters, numbers, and hyphens',
  })
  uniqueId?: string;
}

export class ProjectFiltersDto {
  @ApiProperty({
    description: 'Filter by unique ID',
    example: 'PROJ-001',
    required: false,
  })
  @IsOptional()
  @IsString()
  uniqueId?: string;

  @ApiProperty({
    description: 'Filter by project name (partial match)',
    example: 'Project',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;
} 