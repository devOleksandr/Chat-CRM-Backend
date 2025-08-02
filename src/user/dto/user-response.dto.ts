import { ApiProperty } from '@nestjs/swagger';
import { Role } from '#db';

export class UserResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'User first name',
    example: 'Admin',
  })
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'User',
  })
  lastName: string;

  @ApiProperty({
    description: 'User email address',
    example: 'admin@chat-crm.com',
  })
  email: string;

  @ApiProperty({
    description: 'User role (always Admin)',
    enum: Role,
    example: 'Admin',
  })
  role: Role;

  @ApiProperty({
    description: 'User creation date',
    example: '2023-01-01T00:00:00.000Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'User last update date',
    example: '2023-01-01T00:00:00.000Z',
  })
  updatedAt: string;
}
