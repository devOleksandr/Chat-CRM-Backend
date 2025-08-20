import { Body, Controller, Delete, HttpCode, HttpStatus, Post, UseGuards, Request, Inject, Logger, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiNotFoundResponse } from '@nestjs/swagger';
import { PushNotificationsService } from './services/push-notifications.service';
import { NotificationRepositoryPort, NOTIFICATION_REPOSITORY_PORT } from 'src/notifications/ports/notification-repository.port';
import { ProjectParticipantService } from '../project/services/project-participant.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '#db';
import { RegisterMobileDeviceDto, UnregisterDeviceDto } from './dto';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(
    private readonly pushService: PushNotificationsService,
    @Inject(NOTIFICATION_REPOSITORY_PORT) private readonly repo: NotificationRepositoryPort,
    private readonly participantService: ProjectParticipantService,
  ) {}

  @ApiOperation({ 
    summary: 'Register device token for mobile (no auth)', 
    description: 'Registers or updates a push token for a participant identified by participantId and projectUniqueId.' 
  })
  @ApiBody({
    type: RegisterMobileDeviceDto,
    examples: {
      example: {
        summary: 'Valid request',
        value: { 
          participantId: 'mobile_user_123', 
          projectUniqueId: 'DEMO-001', 
          token: 'fcm:AAAA...token', 
          platform: 'android', 
          deviceId: 'pixel7pro-abc123', 
          appVersion: '1.2.3', 
          locale: 'en-US' 
        },
      },
    },
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Token registered', 
    schema: { 
      type: 'object', 
      properties: { 
        status: { type: 'string', example: 'ok' } 
      } 
    } 
  })
  @ApiBadRequestResponse({ description: 'Invalid participant or payload' })
  @ApiNotFoundResponse({ description: 'Participant not found' })
  @Post('device/register-mobile')
  @HttpCode(HttpStatus.OK)
  async registerMobile(
    @Body() dto: RegisterMobileDeviceDto
  ): Promise<{ status: 'ok' }> {
    this.logger.log(`🔍 Received registration request:`, {
      participantId: dto.participantId,
      projectUniqueId: dto.projectUniqueId,
      platform: dto.platform,
      hasToken: !!dto.token,
      hasDeviceId: !!dto.deviceId,
      hasAppVersion: !!dto.appVersion,
      hasLocale: !!dto.locale,
    });

    const userId = await this.participantService.getParticipantUserIdByProjectUniqueId(
      dto.participantId,
      dto.projectUniqueId,
    );
    
    this.logger.log(`✅ Found user ID: ${userId} for participant ${dto.participantId}`);
    
    await this.repo.registerOrUpdateDevice({
      userId,
      token: dto.token,
      platform: dto.platform,
      deviceId: dto.deviceId,
      appVersion: dto.appVersion,
      locale: dto.locale,
    });
    
    this.logger.log(`✅ Device registered successfully for user ${userId}`);
    return { status: 'ok' };
  }

  @ApiOperation({ 
    summary: 'Unregister device token (no auth)', 
    description: 'Deactivates a previously registered push token.' 
  })
  @ApiBody({
    type: UnregisterDeviceDto,
    examples: {
      example: { 
        summary: 'Valid request', 
        value: { token: 'fcm:AAAA...token' } 
      },
    },
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Token deactivated', 
    schema: { 
      type: 'object', 
      properties: { 
        status: { type: 'string', example: 'ok' } 
      } 
    } 
  })
  @Post('device/unregister')
  @HttpCode(HttpStatus.OK)
  async unregister(
    @Body() dto: UnregisterDeviceDto
  ): Promise<{ status: 'ok' }> {
    await this.repo.deactivateToken(dto.token);
    return { status: 'ok' };
  }

  @ApiOperation({ 
    summary: 'Admin test push to self', 
    description: 'Sends a test push notification to the currently authenticated admin user.' 
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Test push queued', 
    schema: { 
      type: 'object', 
      properties: { 
        status: { type: 'string', example: 'ok' } 
      } 
    } 
  })
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

  @ApiOperation({ 
    summary: 'Test Expo push notification', 
    description: 'Sends a test Expo push notification to a specific user by participantId and projectUniqueId.' 
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        participantId: { type: 'string', example: 'PROJ-248F685D_dev_af_uid_12345' },
        projectUniqueId: { type: 'string', example: 'PROJ-248F685D' },
        message: { type: 'string', example: 'This is a test Expo push notification' }
      },
      required: ['participantId', 'projectUniqueId']
    }
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Test push sent', 
    schema: { 
      type: 'object', 
      properties: { 
        status: { type: 'string', example: 'ok' },
        message: { type: 'string', example: 'Test push notification sent' }
      } 
    } 
  })
  @Post('test-expo-push')
  @HttpCode(HttpStatus.OK)
  async testExpoPush(@Body() body: { participantId: string; projectUniqueId: string; message?: string }): Promise<{ status: string; message: string }> {
    const userId = await this.participantService.getParticipantUserIdByProjectUniqueId(
      body.participantId,
      body.projectUniqueId,
    );
    
    await this.pushService.sendTestNotification(userId, body.message || 'This is a test Expo push notification');
    
    return { 
      status: 'ok',
      message: `Test push notification sent to user ${userId}`
    };
  }

  @ApiOperation({ 
    summary: 'Get push notification statistics', 
    description: 'Returns statistics about registered devices and push tokens.' 
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Statistics retrieved', 
    schema: { 
      type: 'object', 
      properties: { 
        totalUsers: { type: 'number' },
        activeTokens: { type: 'number' },
        expoTokens: { type: 'number' },
        byPlatform: { type: 'object' }
      } 
    } 
  })
  @Get('stats')
  @HttpCode(HttpStatus.OK)
  async getPushStats(): Promise<any> {
    return await this.pushService.getPushStats();
  }

  @ApiOperation({ 
    summary: 'Check Expo configuration status', 
    description: 'Returns the current configuration status of Expo Push Notifications.' 
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Configuration status retrieved', 
    schema: { 
      type: 'object', 
      properties: { 
        projectId: { type: 'string', nullable: true },
        hasAccessToken: { type: 'boolean' },
        isConfigured: { type: 'boolean' },
        status: { type: 'string' }
      } 
    } 
  })
  @Get('config-status')
  @HttpCode(HttpStatus.OK)
  async getExpoConfigStatus(): Promise<any> {
    // Отримуємо статус конфігурації з провайдера
    const configStatus = (this.pushService as any).provider?.getConfigStatus?.();
    
    if (!configStatus) {
      return {
        projectId: null,
        hasAccessToken: false,
        isConfigured: false,
        status: 'provider_not_available'
      };
    }

    const status = configStatus.isConfigured ? 'configured' : 'not_configured';
    
    return {
      ...configStatus,
      status,
      message: configStatus.isConfigured 
        ? 'Expo Push Notifications are properly configured'
        : 'Expo Push Notifications are not configured. Please set EXPO_PUBLIC_PROJECT_ID'
    };
  }

  @ApiOperation({ 
    summary: 'Test endpoint for debugging validation', 
    description: 'Simple test endpoint to debug validation issues.' 
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Test successful', 
    schema: { 
      type: 'object', 
      properties: { 
        received: { type: 'object' },
        status: { type: 'string', example: 'ok' } 
      } 
    } 
  })
  @Post('test-validation')
  @HttpCode(HttpStatus.OK)
  async testValidation(@Body() body: any): Promise<{ received: any; status: string }> {
    console.log('Test validation endpoint received body:', body);
    return { 
      received: body,
      status: 'ok' 
    };
  }
}


