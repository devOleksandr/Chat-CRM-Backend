import { Body, Controller, Delete, HttpCode, HttpStatus, Post, UseGuards, Request, Inject } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PushNotificationsService } from './services/push-notifications.service';
import { NotificationRepositoryPort, NOTIFICATION_REPOSITORY_PORT } from 'src/notifications/ports/notification-repository.port';
import { ProjectParticipantService } from '../project/services/project-participant.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '#db';

class RegisterMobileDeviceDto {
  participantId!: string;
  projectUniqueId!: string;
  token!: string;
  platform!: 'ios' | 'android' | 'web';
  deviceId?: string;
  appVersion?: string;
  locale?: string;
}

class UnregisterDeviceDto {
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

  @ApiOperation({ summary: 'Register device token for mobile (no auth)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Token registered' })
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

  @ApiOperation({ summary: 'Unregister device token (no auth)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Token deactivated' })
  @Delete('device/unregister')
  @HttpCode(HttpStatus.OK)
  async unregister(@Body() dto: UnregisterDeviceDto): Promise<{ status: 'ok' }> {
    await this.repo.deactivateToken(dto.token);
    return { status: 'ok' };
  }

  @ApiOperation({ summary: 'Admin test push to self' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Test push queued' })
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


