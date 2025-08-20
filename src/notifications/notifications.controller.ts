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
    summary: 'Register device for Expo Push Notifications', 
    description: 'Registers or updates an Expo push token for a participant identified by participantId and projectUniqueId. This endpoint is used by mobile apps to enable push notifications.' 
  })
  @ApiBody({
    type: RegisterMobileDeviceDto,
    examples: {
      expoToken: {
        summary: 'Expo Push Token Registration',
        description: 'Register device with Expo push token for iOS/Android',
        value: { 
          participantId: 'mobile_user_123', 
          projectUniqueId: 'DEMO-001', 
          token: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]', 
          platform: 'ios', 
          deviceId: 'iPhone14Pro-abc123', 
          appVersion: '1.2.3', 
          locale: 'en-US',
          expoAppId: 'com.yourcompany.yourapp'
        },
      },
      androidToken: {
        summary: 'Android Expo Token',
        description: 'Register Android device with Expo push token',
        value: { 
          participantId: 'android_user_456', 
          projectUniqueId: 'DEMO-001', 
          token: 'ExpoPushToken[yyyyyyyyyyyyyyyyyyyyyy]', 
          platform: 'android', 
          deviceId: 'Pixel7Pro-def456', 
          appVersion: '1.2.3', 
          locale: 'en-US'
        },
      },
    },
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Device registered successfully for Expo Push Notifications', 
    schema: { 
      type: 'object', 
      properties: { 
        status: { type: 'string', example: 'ok' },
        message: { type: 'string', example: 'Device registered successfully' },
        userId: { type: 'number', example: 123 }
      } 
    } 
  })
  @ApiBadRequestResponse({ 
    description: 'Invalid participant data, invalid Expo push token format, or validation failed' 
  })
  @ApiNotFoundResponse({ description: 'Participant not found in the specified project' })
  @Post('device/register-mobile')
  @HttpCode(HttpStatus.OK)
  async registerMobile(
    @Body() dto: RegisterMobileDeviceDto
  ): Promise<{ status: 'ok'; message: string; userId: number }> {
    this.logger.log(`🔍 Received Expo device registration request:`, {
      participantId: dto.participantId,
      projectUniqueId: dto.projectUniqueId,
      platform: dto.platform,
      hasToken: !!dto.token,
      tokenType: dto.token?.startsWith('ExponentPushToken') ? 'Expo' : 'Unknown',
      hasDeviceId: !!dto.deviceId,
      hasAppVersion: !!dto.appVersion,
      hasLocale: !!dto.locale,
      expoAppId: dto.expoAppId,
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
      expoAppId: dto.expoAppId,
    });
    
    this.logger.log(`✅ Expo device registered successfully for user ${userId}`);
    return { 
      status: 'ok', 
      message: 'Device registered successfully for Expo Push Notifications',
      userId 
    };
  }

  @ApiOperation({ 
    summary: 'Unregister Expo device', 
    description: 'Deactivates a previously registered Expo push token. Use this when the user logs out or uninstalls the app.' 
  })
  @ApiBody({
    type: UnregisterDeviceDto,
    examples: {
      expoToken: { 
        summary: 'Unregister Expo Device', 
        description: 'Deactivate Expo push token',
        value: { token: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]' } 
      },
    },
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Device unregistered successfully', 
    schema: { 
      type: 'object', 
      properties: { 
        status: { type: 'string', example: 'ok' },
        message: { type: 'string', example: 'Device unregistered successfully' }
      } 
    } 
  })
  @ApiBadRequestResponse({ description: 'Invalid token format' })
  @Post('device/unregister-mobile')
  @HttpCode(HttpStatus.OK)
  async unregisterMobile(
    @Body() dto: UnregisterDeviceDto
  ): Promise<{ status: 'ok'; message: string }> {
    this.logger.log(`🔍 Unregistering Expo device with token: ${dto.token.substring(0, 20)}...`);
    
    await this.repo.deactivateToken(dto.token);
    
    this.logger.log(`✅ Expo device unregistered successfully`);
    return { 
      status: 'ok', 
      message: 'Device unregistered successfully' 
    };
  }

  @ApiOperation({ 
    summary: 'Admin test push to self', 
    description: 'Sends a test Expo push notification to the currently authenticated admin user. Requires admin role.' 
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Test push notification sent successfully', 
    schema: { 
      type: 'object', 
      properties: { 
        status: { type: 'string', example: 'ok' },
        message: { type: 'string', example: 'Test push notification sent' }
      } 
    } 
  })
  @ApiUnauthorizedResponse({ description: 'User not authenticated' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Post('admin/test')
  @HttpCode(HttpStatus.OK)
  async adminTest(@Request() req: any): Promise<{ status: 'ok'; message: string }> {
    await this.pushService.sendToUser({
      userId: req.user.id,
      title: 'Test Notification',
      body: 'This is a test Expo push notification from admin endpoint',
      data: { type: 'test', source: 'admin' },
    });
    
    return { 
      status: 'ok', 
      message: 'Test Expo push notification sent successfully' 
    };
  }

  @ApiOperation({ 
    summary: 'Test Expo push notification', 
    description: 'Sends a test Expo push notification to a specific user by participantId and projectUniqueId. Useful for testing push notifications during development.' 
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        participantId: { 
          type: 'string', 
          example: 'PROJ-248F685D_dev_af_uid_12345',
          description: 'External participant ID provided by mobile app'
        },
        projectUniqueId: { 
          type: 'string', 
          example: 'PROJ-248F685D',
          description: 'Unique project identifier'
        },
        message: { 
          type: 'string', 
          example: 'This is a test Expo push notification',
          description: 'Custom test message (optional)'
        }
      },
      required: ['participantId', 'projectUniqueId']
    }
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Test Expo push notification sent successfully', 
    schema: { 
      type: 'object', 
      properties: { 
        status: { type: 'string', example: 'ok' },
        message: { type: 'string', example: 'Test push notification sent to user 123' },
        userId: { type: 'number', example: 123 },
        details: { 
          type: 'object',
          properties: {
            participantId: { type: 'string' },
            projectUniqueId: { type: 'string' },
            testMessage: { type: 'string' }
          }
        }
      } 
    } 
  })
  @ApiBadRequestResponse({ description: 'Invalid participant or project data' })
  @ApiNotFoundResponse({ description: 'Participant not found in the specified project' })
  @Post('test-expo-push')
  @HttpCode(HttpStatus.OK)
  async testExpoPush(@Body() body: { participantId: string; projectUniqueId: string; message?: string }): Promise<{ 
    status: string; 
    message: string; 
    userId: number;
    details: { participantId: string; projectUniqueId: string; testMessage: string };
  }> {
    const userId = await this.participantService.getParticipantUserIdByProjectUniqueId(
      body.participantId,
      body.projectUniqueId,
    );
    
    const testMessage = body.message || 'This is a test Expo push notification';
    
    await this.pushService.sendTestNotification(userId, testMessage);
    
    return { 
      status: 'ok',
      message: `Test Expo push notification sent to user ${userId}`,
      userId,
      details: {
        participantId: body.participantId,
        projectUniqueId: body.projectUniqueId,
        testMessage
      }
    };
  }

  @ApiOperation({ 
    summary: 'Get push notification statistics', 
    description: 'Returns comprehensive statistics about registered devices, Expo push tokens, and platform distribution. Useful for monitoring and analytics.' 
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Statistics retrieved successfully', 
    schema: { 
      type: 'object', 
      properties: { 
        totalUsers: { 
          type: 'number', 
          description: 'Total number of users with registered devices',
          example: 25
        },
        activeTokens: { 
          type: 'number', 
          description: 'Total number of active push tokens',
          example: 30
        },
        expoTokens: { 
          type: 'number', 
          description: 'Number of active Expo push tokens',
          example: 28
        },
        byPlatform: { 
          type: 'object', 
          description: 'Distribution of tokens by platform',
          example: { ios: 15, android: 13, web: 2 }
        },
        summary: {
          type: 'string',
          description: 'Human-readable summary of statistics',
          example: '25 users, 30 active tokens (28 Expo)'
        }
      } 
    } 
  })
  @Get('stats')
  @HttpCode(HttpStatus.OK)
  async getPushStats(): Promise<any> {
    const stats = await this.pushService.getPushStats();
    
    return {
      ...stats,
      summary: `${stats.totalUsers} users, ${stats.activeTokens} active tokens (${stats.expoTokens} Expo)`
    };
  }

  @ApiOperation({ 
    summary: 'Check Expo configuration status', 
    description: 'Returns the current configuration status of Expo Push Notifications. Use this to verify that your Expo project ID and access token are properly configured.' 
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Configuration status retrieved successfully', 
    schema: { 
      type: 'object', 
      properties: { 
        projectId: { 
          type: 'string', 
          nullable: true,
          description: 'Configured Expo project ID',
          example: 'your-expo-project-id'
        },
        hasAccessToken: { 
          type: 'boolean', 
          description: 'Whether Expo access token is configured',
          example: true
        },
        isConfigured: { 
          type: 'boolean', 
          description: 'Whether Expo is properly configured',
          example: true
        },
        status: { 
          type: 'string', 
          description: 'Configuration status',
          example: 'configured'
        },
        message: { 
          type: 'string', 
          description: 'Human-readable status message',
          example: 'Expo Push Notifications are properly configured'
        },
        recommendations: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of recommendations for configuration',
          example: ['Set EXPO_PUBLIC_PROJECT_ID in .env file']
        }
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
        status: 'provider_not_available',
        message: 'Push notification provider is not available',
        recommendations: ['Check if ExpoPushProvider is properly configured']
      };
    }

    const status = configStatus.isConfigured ? 'configured' : 'not_configured';
    const recommendations: string[] = [];
    
    if (!configStatus.projectId) {
      recommendations.push('Set EXPO_PUBLIC_PROJECT_ID in .env file');
    }
    
    if (!configStatus.hasAccessToken) {
      recommendations.push('Consider setting EXPO_ACCESS_TOKEN for private projects');
    }
    
    return {
      ...configStatus,
      status,
      message: configStatus.isConfigured 
        ? 'Expo Push Notifications are properly configured'
        : 'Expo Push Notifications are not configured. Please check recommendations below.',
      recommendations
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


