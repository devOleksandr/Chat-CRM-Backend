import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectService } from '../project/project.service';
import { ChatsResponse, OnlineResponse, OverviewStats, ParticipantsActivityResponse, ParticipantsNewResponse, TimePoint } from './models/analytics.models';

function parseIsoOrDefault(value: string | undefined, def: Date): Date {
  if (!value) return def;
  const d = new Date(value);
  return isNaN(d.getTime()) ? def : d;
}

function startOfDayUTC(d: Date): Date { const x = new Date(d); x.setUTCHours(0,0,0,0); return x; }
function endOfDayUTC(d: Date): Date { const x = new Date(d); x.setUTCHours(23,59,59,999); return x; }

@Injectable()
export class ChatAnalyticsService {
  constructor(private readonly prisma: PrismaService, private readonly projectService: ProjectService) {}

  private async ensureOwnership(projectId: number, adminId: number): Promise<void> {
    const ownerId = await this.projectService.getProjectAdminId(projectId);
    if (ownerId !== adminId) throw new ForbiddenException('Access denied');
  }

  async getOverview(projectId: number, adminId: number, from?: string, to?: string): Promise<OverviewStats> {
    await this.ensureOwnership(projectId, adminId);
    const toD = parseIsoOrDefault(to, new Date());
    const fromD = parseIsoOrDefault(from, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

    const [totalParticipants, newParticipantsLast30d, activeParticipantsLast30d, onlineNow, totalChats, activeChats, inactiveChats, unreadAgg] = await Promise.all([
      this.prisma.projectParticipant.count({ where: { projectId } }),
      this.prisma.projectParticipant.count({ where: { projectId, createdAt: { gte: fromD, lte: toD } } }),
      this.prisma.message.groupBy({
        by: ['senderId'],
        where: { chat: { projectId }, createdAt: { gte: fromD, lte: toD } },
      }).then(g => g.length),
      this.prisma.user.count({ where: { projectParticipants: { some: { projectId } }, isOnline: true } }),
      this.prisma.chat.count({ where: { projectId } }),
      this.prisma.chat.count({ where: { projectId, isActive: true } }),
      this.prisma.chat.count({ where: { projectId, isActive: false } }),
      this.prisma.chat.aggregate({ _avg: { unreadCount: true }, where: { projectId } }),
    ]);

    return {
      totalParticipants,
      newParticipantsLast30d,
      activeParticipantsLast30d,
      onlineNow,
      totalChats,
      activeChats,
      inactiveChats,
      avgUnread: unreadAgg._avg.unreadCount ?? 0,
    };
  }

  async getNewParticipants(projectId: number, adminId: number, from?: string, to?: string, granularity: 'day'|'week'|'month'='day', limit = 10): Promise<ParticipantsNewResponse> {
    await this.ensureOwnership(projectId, adminId);
    const toD = endOfDayUTC(parseIsoOrDefault(to, new Date()));
    const fromD = startOfDayUTC(parseIsoOrDefault(from, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)));

    // naive JS aggregation by day/week/month
    const participants = await this.prisma.projectParticipant.findMany({ where: { projectId, createdAt: { gte: fromD, lte: toD } }, include: { user: true } });

    const bucket = (d: Date): string => {
      const dt = new Date(d);
      if (granularity === 'day') return dt.toISOString().slice(0,10);
      if (granularity === 'week') {
        const copy = new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate()));
        const day = copy.getUTCDay() || 7; copy.setUTCDate(copy.getUTCDate() - day + 1);
        return copy.toISOString().slice(0,10);
      }
      // month
      return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth()+1).padStart(2,'0')}`;
    };

    const map = new Map<string, number>();
    participants.forEach(p => { const b = bucket(p.createdAt); map.set(b, (map.get(b)||0)+1); });
    const timeseries: TimePoint[] = Array.from(map.entries()).sort(([a],[b]) => a.localeCompare(b)).map(([x,y]) => ({ x, y }));

    const latest = participants
      .sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, Math.min(100, Math.max(1, limit)))
      .map(p => ({
        id: p.id,
        userId: p.userId,
        participantId: p.user.uniqueId ?? String(p.userId),
        firstName: p.user.firstName,
        lastName: p.user.lastName,
        createdAt: p.createdAt.toISOString(),
      }));

    return { timeseries, latest };
  }

  async getParticipantsActivity(projectId: number, adminId: number, from?: string, to?: string): Promise<ParticipantsActivityResponse> {
    await this.ensureOwnership(projectId, adminId);
    const toD = parseIsoOrDefault(to, new Date());
    const fromD = parseIsoOrDefault(from, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

    const [participantsTotal, activeDistinct, totalMessages] = await Promise.all([
      this.prisma.projectParticipant.count({ where: { projectId } }),
      this.prisma.message.groupBy({ by: ['senderId'], where: { chat: { projectId }, createdAt: { gte: fromD, lte: toD } } }).then(g => g.length),
      this.prisma.message.count({ where: { chat: { projectId }, createdAt: { gte: fromD, lte: toD } } }),
    ]);

    const silent = Math.max(0, participantsTotal - activeDistinct);
    const silentShare = participantsTotal ? silent / participantsTotal : 0;
    const avgMessagesPerParticipant = participantsTotal ? totalMessages / participantsTotal : 0;

    return { activeCount: activeDistinct, silentShare, avgMessagesPerParticipant };
  }

  async getOnline(projectId: number, adminId: number, buckets: number[] = [15,60,1440]): Promise<OnlineResponse> {
    await this.ensureOwnership(projectId, adminId);
    const participants = await this.prisma.projectParticipant.findMany({ where: { projectId }, include: { user: true } });
    const now = Date.now();
    const onlineNow = participants.filter(p => p.user.isOnline).length;

    const counters = { b15: 0, b60: 0, b1440: 0, bMore: 0 };
    for (const p of participants) {
      const ls = p.user.lastSeen?.getTime();
      if (!ls) { counters.bMore++; continue; }
      const minutes = (now - ls) / 60000;
      if (minutes <= (buckets[0] ?? 15)) counters.b15++;
      else if (minutes <= (buckets[1] ?? 60)) counters.b60++;
      else if (minutes <= (buckets[2] ?? 1440)) counters.b1440++;
      else counters.bMore++;
    }

    return {
      onlineNow,
      lastSeenDistribution: [
        { label: `0-${buckets[0] ?? 15}m`, value: counters.b15 },
        { label: `${buckets[0] ?? 15}-${buckets[1] ?? 60}m`, value: counters.b60 },
        { label: `${buckets[1] ?? 60}-${buckets[2] ?? 1440}m`, value: counters.b1440 },
        { label: `>${buckets[2] ?? 1440}m`, value: counters.bMore },
      ],
    };
  }

  async getChats(projectId: number, adminId: number, from?: string, to?: string, granularity: 'day'|'week'|'month'='day'): Promise<ChatsResponse> {
    await this.ensureOwnership(projectId, adminId);
    const toD = endOfDayUTC(parseIsoOrDefault(to, new Date()));
    const fromD = startOfDayUTC(parseIsoOrDefault(from, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)));

    const chats = await this.prisma.chat.findMany({ where: { projectId, createdAt: { gte: fromD, lte: toD } } });

    const bucket = (d: Date): string => {
      const dt = new Date(d);
      if (granularity === 'day') return dt.toISOString().slice(0,10);
      if (granularity === 'week') {
        const copy = new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate()));
        const day = copy.getUTCDay() || 7; copy.setUTCDate(copy.getUTCDate() - day + 1);
        return copy.toISOString().slice(0,10);
      }
      return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth()+1).padStart(2,'0')}`;
    };

    const map = new Map<string, number>();
    chats.forEach(c => { const b = bucket(c.createdAt); map.set(b, (map.get(b)||0)+1); });
    const newChatsTimeseries: TimePoint[] = Array.from(map.entries()).sort(([a],[b]) => a.localeCompare(b)).map(([x,y]) => ({ x, y }));

    const [activeChats, inactiveChats, unreadAgg] = await Promise.all([
      this.prisma.chat.count({ where: { projectId, isActive: true } }),
      this.prisma.chat.count({ where: { projectId, isActive: false } }),
      this.prisma.chat.aggregate({ _avg: { unreadCount: true }, where: { projectId } }),
    ]);

    return { newChatsTimeseries, activeChats, inactiveChats, avgUnread: unreadAgg._avg.unreadCount ?? 0 };
  }
}


