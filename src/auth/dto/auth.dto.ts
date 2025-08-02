import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Admin email address',
    example: 'admin@chat-crm.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Admin password',
    example: 'admin123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  refreshToken: string;
}

// DTO for requesting password reset via email
export class ResetPasswordRequestDto {
  @ApiProperty({
    description: 'Admin email for password reset',
    example: 'admin@chat-crm.com',
  })
  @IsEmail()
  email: string;
}

// DTO for performing password reset with token and new password
export class ResetPasswordDto {
  @ApiProperty({ description: 'Password reset token' })
  @IsString()
  token: string;

  @ApiProperty({
    description: 'New password',
    minLength: 6,
    example: 'newpass123',
  })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
