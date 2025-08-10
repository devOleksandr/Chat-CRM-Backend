import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Min, Max } from 'class-validator';

export class TimeRangeDto {
  @ApiPropertyOptional({ description: 'ISO start datetime', example: '2025-07-01T00:00:00.000Z' })
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional({ description: 'ISO end datetime', example: '2025-08-01T00:00:00.000Z' })
  @IsOptional()
  @IsString()
  to?: string;

  @ApiPropertyOptional({ description: 'Aggregation granularity', enum: ['day', 'week', 'month'], default: 'day' })
  @IsOptional()
  @IsIn(['day', 'week', 'month'])
  granularity?: 'day' | 'week' | 'month' = 'day';
}

export class LastItemsDto {
  @ApiPropertyOptional({ description: 'Limit for latest list', example: 10, default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}


