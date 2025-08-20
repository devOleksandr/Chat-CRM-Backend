import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, Matches } from 'class-validator';

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
    description: 'Expo push token (starts with ExponentPushToken[...] or ExpoPushToken[...])', 
    example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]' 
  })
  @IsString()
  @Matches(/^(ExponentPushToken|ExpoPushToken)\[.+\]$/, {
    message: 'Token must be a valid Expo push token starting with ExponentPushToken[...] or ExpoPushToken[...]'
  })
  token!: string;

  @ApiProperty({ 
    description: 'Client platform', 
    enum: ['ios', 'android', 'web'], 
    example: 'ios' 
  })
  @IsEnum(['ios', 'android', 'web'])
  platform!: 'ios' | 'android' | 'web';

  @ApiProperty({ 
    description: 'Optional device identifier', 
    required: false, 
    example: 'iPhone14Pro-abc123' 
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

  @ApiProperty({ 
    description: 'Expo app ID (optional)', 
    required: false, 
    example: 'com.yourcompany.yourapp' 
  })
  @IsOptional()
  @IsString()
  expoAppId?: string;
}
