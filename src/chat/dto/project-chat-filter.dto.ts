import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, IsPositive, IsBooleanString } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Data Transfer Object for filtering chats by project
 */
export class ProjectChatFilterDto {
  @ApiPropertyOptional({
    description: 'ID of the project to filter chats by',
    example: 1,
  })
  @IsOptional()
  @IsInt({ message: 'Project ID must be an integer' })
  @IsPositive({ message: 'Project ID must be a positive number' })
  @Transform(({ value }) => parseInt(value))
  readonly projectId?: number;

  @ApiPropertyOptional({
    description: 'Maximum number of chats to return (default: 20)',
    example: 20,
  })
  @IsOptional()
  @IsInt({ message: 'Limit must be an integer' })
  @IsPositive({ message: 'Limit must be a positive number' })
  @Transform(({ value }) => parseInt(value))
  readonly limit?: number;

  @ApiPropertyOptional({
    description: 'Number of chats to skip (default: 0)',
    example: 0,
  })
  @IsOptional()
  @IsInt({ message: 'Offset must be an integer' })
  @Transform(({ value }) => parseInt(value))
  readonly offset?: number;

  @ApiPropertyOptional({
    description: 'Filter by active status (default: true)',
    example: 'true',
  })
  @IsOptional()
  @IsBooleanString({ message: 'isActive must be a boolean string' })
  @Transform(({ value }) => value === 'true')
  readonly isActive?: boolean;
} 