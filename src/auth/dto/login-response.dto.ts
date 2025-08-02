import { ApiProperty } from '@nestjs/swagger';
import { Role } from '#db';

export class LoginUserDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({ example: 'Admin', enum: Role })
  role: Role;
}

export class LoginResponseDto {
  @ApiProperty({ example: 'access.jwt.token' })
  accessToken: string;

  @ApiProperty({ example: 'refresh.jwt.token' })
  refreshToken: string;

  @ApiProperty({ type: LoginUserDto })
  user: LoginUserDto;
}
