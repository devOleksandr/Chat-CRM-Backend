import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';

export class RegisterMobileDeviceDto {
  @ApiProperty({ 
    description: 'External participant ID within the project', 
    example: 'mobile_user_123' 
  })
  @IsString()
  participantId!: string;

  @ApiProperty({ 
    description: 'Unique project identifier', 
    example: 'DEMO-001' 
  })
  @IsString()
  projectUniqueId!: string;

  @ApiProperty({ 
    description: 'Push token (FCM/APNs/Web Push)', 
    example: 'fcm:AAAA...token' 
  })
  @IsString()
  token!: string;

  @ApiProperty({ 
    description: 'Client platform', 
    enum: ['ios', 'android', 'web'], 
    example: 'android' 
  })
  @IsEnum(['ios', 'android', 'web'])
  platform!: 'ios' | 'android' | 'web';

  @ApiProperty({ 
    description: 'Optional device identifier', 
    required: false, 
    example: 'pixel7pro-abc123' 
  })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiProperty({ 
    description: 'App version on the device', 
    required: false, 
    example: '1.2.3' 
  })
  @IsOptional()
  @IsString()
  appVersion?: string;

  @ApiProperty({ 
    description: 'User locale', 
    required: false, 
    example: 'en-US' 
  })
  @IsOptional()
  @IsString()
  locale?: string;
}
