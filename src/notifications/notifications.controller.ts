import { Body, Controller, Delete, HttpCode, HttpStatus, Post, UseGuards, Request, Inject } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiNotFoundResponse, ApiProperty } from '@nestjs/swagger';
import { PushNotificationsService } from './services/push-notifications.service';
import { NotificationRepositoryPort, NOTIFICATION_REPOSITORY_PORT } from 'src/notifications/ports/notification-repository.port';
import { ProjectParticipantService } from '../project/services/project-participant.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '#db';

/**
 * DTO for registering a mobile device for push notifications
 */
class RegisterMobileDeviceDto {
  @ApiProperty({ description: 'External participant ID within the project', example: 'mobile_user_123' })
  participantId!: string;

  @ApiProperty({ description: 'Unique project identifier', example: 'DEMO-001' })
  projectUniqueId!: string;

  @ApiProperty({ description: 'Push token (FCM/APNs/Web Push)', example: 'fcm:AAAA...token' })
  token!: string;

  @ApiProperty({ description: 'Client platform', enum: ['ios', 'android', 'web'], example: 'android' })
  platform!: 'ios' | 'android' | 'web';

  @ApiProperty({ description: 'Optional device identifier', required: false, example: 'pixel7pro-abc123' })
  deviceId?: string;

  @ApiProperty({ description: 'App version on the device', required: false, example: '1.2.3' })
  appVersion?: string;

  @ApiProperty({ description: 'User locale', required: false, example: 'en-US' })
  locale?: string;
}

/**
 * DTO for unregistering a device by its push token
 */
class UnregisterDeviceDto {
  @ApiProperty({ description: 'Push token to deactivate', example: 'fcm:AAAA...token' })
  token!: string;
}

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly pushService: PushNotificationsService,
    @Inject(NOTIFICATION_REPOSITORY_PORT) private readonly repo: NotificationRepositoryPort,
    private readonly participantService: ProjectParticipantService,
  ) {}

  @ApiOperation({ summary: 'Register device token for mobile (no auth)', description: 'Registers or updates a push token for a participant identified by participantId and projectUniqueId.' })
  @ApiBody({
    type: RegisterMobileDeviceDto,
    examples: {
      example: {
        summary: 'Valid request',
        value: { participantId: 'mobile_user_123', projectUniqueId: 'DEMO-001', token: 'fcm:AAAA...token', platform: 'android', deviceId: 'pixel7pro-abc123', appVersion: '1.2.3', locale: 'en-US' },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Token registered', schema: { type: 'object', properties: { status: { type: 'string', example: 'ok' } } } })
  @ApiBadRequestResponse({ description: 'Invalid participant or payload' })
  @ApiNotFoundResponse({ description: 'Participant not found' })
  @Post('device/register-mobile')
  @HttpCode(HttpStatus.OK)
  async registerMobile(@Body() dto: RegisterMobileDeviceDto): Promise<{ status: 'ok' }> {
    const userId = await this.participantService.getParticipantUserIdByProjectUniqueId(
      dto.participantId,
      dto.projectUniqueId,
    );
    await this.repo.registerOrUpdateDevice({
      userId,
      token: dto.token,
      platform: dto.platform,
      deviceId: dto.deviceId,
      appVersion: dto.appVersion,
      locale: dto.locale,
    });
    return { status: 'ok' };
  }

  @ApiOperation({ summary: 'Unregister device token (no auth)', description: 'Deactivates a previously registered push token.' })
  @ApiBody({
    type: UnregisterDeviceDto,
    examples: {
      example: { summary: 'Valid request', value: { token: 'fcm:AAAA...token' } },
    },
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Token deactivated', schema: { type: 'object', properties: { status: { type: 'string', example: 'ok' } } } })
  @Post('device/unregister')
  @HttpCode(HttpStatus.OK)
  async unregister(@Body() dto: UnregisterDeviceDto): Promise<{ status: 'ok' }> {
    await this.repo.deactivateToken(dto.token);
    return { status: 'ok' };
  }

  @ApiOperation({ summary: 'Admin test push to self', description: 'Sends a test push notification to the currently authenticated admin user.' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Test push queued', schema: { type: 'object', properties: { status: { type: 'string', example: 'ok' } } } })
  @ApiUnauthorizedResponse({ description: 'User not authenticated' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Post('admin/test')
  @HttpCode(HttpStatus.OK)
  async adminTest(@Request() req: any): Promise<{ status: 'ok' }> {
    await this.pushService.sendToUser({
      userId: req.user.id,
      title: 'Test notification',
      body: 'This is a test push from admin endpoint',
      data: { type: 'test' },
    });
    return { status: 'ok' };
  }
}


