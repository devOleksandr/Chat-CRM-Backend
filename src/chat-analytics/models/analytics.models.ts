export type TimePoint = { x: string; y: number };

export type OverviewStats = {
  totalParticipants: number;
  newParticipantsLast30d: number;
  activeParticipantsLast30d: number;
  onlineNow: number;
  totalChats: number;
  activeChats: number;
  inactiveChats: number;
  avgUnread: number;
};

export type LatestParticipant = {
  id: number;
  userId: number;
  participantId: string;
  firstName: string;
  lastName: string;
  createdAt: string;
};

export type ParticipantsNewResponse = {
  timeseries: TimePoint[];
  latest: LatestParticipant[];
};

export type ParticipantsActivityResponse = {
  activeCount: number;
  silentShare: number;
  avgMessagesPerParticipant: number;
};

export type OnlineResponse = {
  onlineNow: number;
  lastSeenDistribution: { label: string; value: number }[];
};

export type ChatsResponse = {
  newChatsTimeseries: TimePoint[];
  activeChats: number;
  inactiveChats: number;
  avgUnread: number;
};


