import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UnregisterDeviceDto {
  @ApiProperty({ 
    description: 'Push token to deactivate', 
    example: 'fcm:AAAA...token' 
  })
  @IsString()
  token!: string;
}
