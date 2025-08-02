import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'User first name',
    example: 'Admin',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  firstName?: string;

  @ApiPropertyOptional({
    description: 'User last name',
    example: 'User',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  lastName?: string;
} 