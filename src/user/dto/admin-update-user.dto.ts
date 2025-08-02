import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEmail, IsEnum, MinLength } from 'class-validator';
import { Role } from '#db';

export class AdminUpdateUserDto {
  @ApiPropertyOptional({
    description: 'User first name',
    example: 'Admin',
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({
    description: 'User last name',
    example: 'User',
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({
    description: 'User email address',
    example: 'admin@chat-crm.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'User password',
    example: 'admin123',
    minLength: 6,
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({
    description: 'User role (always Admin)',
    enum: Role,
    example: 'Admin',
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
} 