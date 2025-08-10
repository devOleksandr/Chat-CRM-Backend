import { Controller, Get, Param, ParseIntPipe, Query, UseGuards, HttpStatus, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '#db';
import { ChatAnalyticsService } from './chat-analytics.service';
import { TimeRangeDto, LastItemsDto } from './dto/time-range.dto';

@ApiTags('chat-analytics')
@ApiBearerAuth()
@Controller('chat-analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
export class ChatAnalyticsController {
  constructor(private readonly analytics: ChatAnalyticsService) {}

  @ApiOperation({ 
    summary: 'Overview KPI for a project',
    description: 'Returns key performance indicators for the specified project over a date range. Admin is taken from JWT.'
  })
  @ApiParam({ name: 'projectId', example: 1 })
  @Get('project/:projectId/overview')
  @ApiResponse({ 
    status: HttpStatus.OK,
    description: 'Overview statistics',
    schema: {
      example: {
        totalParticipants: 42,
        newParticipantsLast30d: 12,
        activeParticipantsLast30d: 25,
        onlineNow: 7,
        totalChats: 58,
        activeChats: 50,
        inactiveChats: 8,
        avgUnread: 1.7
      }
    }
  })
  async getOverview(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Query() range: TimeRangeDto,
    @Request() req: any,
  ) {
    const adminId = req.user.id;
    return this.analytics.getOverview(projectId, adminId, range.from, range.to);
  }

  @ApiOperation({ 
    summary: 'New participants timeseries and latest list',
    description: 'Returns time series of new participants and a list of the latest participants. Admin is taken from JWT.'
  })
  @ApiParam({ name: 'projectId', example: 1 })
  @Get('project/:projectId/participants/new')
  @ApiResponse({ 
    status: HttpStatus.OK,
    description: 'Timeseries and latest participants',
    schema: {
      example: {
        timeseries: [
          { x: '2025-08-01', y: 3 },
          { x: '2025-08-02', y: 5 }
        ],
        latest: [
          { id: 10, userId: 101, participantId: 'U-1001', firstName: 'Ann', lastName: 'Lee', createdAt: '2025-08-02T10:00:00.000Z' }
        ]
      }
    }
  })
  async getNewParticipants(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Query() range: TimeRangeDto,
    @Query() last: LastItemsDto,
    @Request() req: any,
  ) {
    const adminId = req.user.id;
    return this.analytics.getNewParticipants(projectId, adminId, range.from, range.to, range.granularity ?? 'day', last.limit ?? 10);
  }

  @ApiOperation({ 
    summary: 'Participants activity stats',
    description: 'Returns counts of active participants, silent share and average messages per participant for the period.'
  })
  @ApiParam({ name: 'projectId', example: 1 })
  @Get('project/:projectId/participants/activity')
  @ApiResponse({ 
    status: HttpStatus.OK,
    description: 'Activity stats',
    schema: {
      example: {
        activeCount: 23,
        silentShare: 0.42,
        avgMessagesPerParticipant: 3.1
      }
    }
  })
  async getParticipantsActivity(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Query() range: TimeRangeDto,
    @Request() req: any,
  ) {
    const adminId = req.user.id;
    return this.analytics.getParticipantsActivity(projectId, adminId, range.from, range.to);
  }

  // Removed /online endpoint per requirements

  @ApiOperation({ 
    summary: 'Chats stats and timeseries',
    description: 'Returns new chats timeseries and chat status KPIs for the period. Admin is taken from JWT.'
  })
  @ApiParam({ name: 'projectId', example: 1 })
  @Get('project/:projectId/chats')
  @ApiResponse({ 
    status: HttpStatus.OK,
    description: 'Chats stats',
    schema: {
      example: {
        newChatsTimeseries: [
          { x: '2025-08-01', y: 2 },
          { x: '2025-08-02', y: 4 }
        ],
        activeChats: 50,
        inactiveChats: 8,
        avgUnread: 1.7
      }
    }
  })
  async getChats(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Query() range: TimeRangeDto,
    @Request() req: any,
  ) {
    const adminId = req.user.id;
    return this.analytics.getChats(projectId, adminId, range.from, range.to, range.granularity ?? 'day');
  }
}


