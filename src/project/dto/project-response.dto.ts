import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../user/dto/user-response.dto';

export class ProjectResponseDto {
  @ApiProperty({
    description: 'Project ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Project name',
    example: 'My Awesome Project',
  })
  name: string;

  @ApiProperty({
    description: 'Unique project ID assigned by admin',
    example: 'PROJ-001',
  })
  uniqueId: string;

  @ApiProperty({
    description: 'User who created the project',
    type: UserResponseDto,
  })
  createdBy: UserResponseDto;

  @ApiProperty({
    description: 'Project creation date',
    example: '2023-01-01T00:00:00.000Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Project last update date',
    example: '2023-01-01T00:00:00.000Z',
  })
  updatedAt: string;
}

export class ProjectListResponseDto {
  @ApiProperty({
    description: 'Array of projects',
    type: [ProjectResponseDto],
  })
  projects: ProjectResponseDto[];

  @ApiProperty({
    description: 'Total number of projects',
    example: 10,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of projects per page',
    example: 10,
  })
  limit: number;
} 