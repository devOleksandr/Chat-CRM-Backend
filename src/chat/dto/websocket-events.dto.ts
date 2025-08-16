/**
 * DTOs for WebSocket events
 * Defines the structure of data sent between client and server via WebSocket
 */

// Client → Server events
export class JoinProjectChatsDto {
  projectId: number;
}

export class JoinAllChatsDto {
  // No additional data needed
}

export class ChatUpdateDto {
  chatId: number;
  chat: any;
}

export class MessageUpdateDto {
  chatId: number;
  message: any;
}

export class ParticipantStatusUpdateDto {
  participantId: number;
  isOnline: boolean;
  chatIds?: number[];
}

// Server → Client events
export class ProjectChatsJoinedDto {
  projectId: number;
  chatCount: number;
  chatIds: number[];
  timestamp: Date;
}

export class AllChatsJoinedDto {
  chatCount: number;
  chatIds: number[];
  timestamp: Date;
}

export class ChatUpdatedDto {
  chatId: number;
  chat: any;
  updatedBy: number;
  timestamp: Date;
}

export class MessageUpdateResponseDto {
  chatId: number;
  message: any;
  updatedBy: number;
  timestamp: Date;
}

export class ParticipantOnlineDto {
  participantId: number;
  isOnline: boolean;
  timestamp: Date;
}
