# Chat API Improvements

## Overview

The chat API has been enhanced to provide better information about chat creation and retrieval operations. The `createOrGetChat` endpoints now return metadata indicating whether a chat was created or retrieved.

## API Response Formats

### 1. Basic Enhanced Response (Recommended)

**Endpoint:** `POST /chat/project/:projectId/participant/:participantId`

**Response Format:**
```json
{
  "chat": {
    "id": 1,
    "projectId": 1,
    "project": {
      "id": 1,
      "name": "My Project",
      "uniqueId": "PROJ-001"
    },
    "admin": {
      "id": 1,
      "email": "admin@example.com",
      "firstName": "John",
      "lastName": "Admin",
      "isOnline": true,
      "lastSeen": null
    },
    "participant": {
      "id": 2,
      "email": null,
      "firstName": "Jane",
      "lastName": "Participant",
      "uniqueId": "user123",
      "isOnline": false,
      "lastSeen": "2025-01-15T10:00:00.000Z"
    },
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z",
    "isActive": true,
    "lastMessage": {
      "id": 1,
      "content": "Hello! How can I help you?",
      "createdAt": "2025-01-15T10:30:00.000Z",
      "senderId": 1
    },
    "unreadCount": 0,
    "lastMessageAt": "2025-01-15T10:30:00.000Z"
  },
  "metadata": {
    "isNewChat": true,
    "message": "Chat created successfully",
    "createdAt": "2025-01-15T10:00:00.000Z",
    "accessedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

### 2. For Existing Chat

When retrieving an existing chat:

```json
{
  "chat": {
    // ... same chat data structure
  },
  "metadata": {
    "isNewChat": false,
    "message": "Chat already exists (created 2 hours ago)",
    "createdAt": "2025-01-15T08:00:00.000Z",
    "accessedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

## Mobile App Endpoint

**Endpoint:** `POST /chat/mobile/project/:projectUniqueId/participant/:participantId`

Returns the same response format as the main endpoint.

## Metadata Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `isNewChat` | boolean | Whether the chat was created in this request | `true` |
| `message` | string | Human-readable description of the operation | `"Chat created successfully"` |
| `createdAt` | Date | When the chat was originally created | `"2025-01-15T10:00:00.000Z"` |
| `accessedAt` | Date | When the chat was last accessed (current request) | `"2025-01-15T10:30:00.000Z"` |

## Frontend Integration

### React/TypeScript Example

```typescript
interface ChatWithMetadata {
  chat: ChatResponse;
  metadata: {
    isNewChat: boolean;
    message: string;
    createdAt: Date;
    accessedAt: Date;
  };
}

const createOrGetChat = async (projectId: number, participantId: number): Promise<ChatWithMetadata> => {
  const response = await fetch(`/api/chat/project/${projectId}/participant/${participantId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  return response.json();
};

// Usage
const handleChatCreation = async () => {
  try {
    const result = await createOrGetChat(projectId, participantId);
    
    if (result.metadata.isNewChat) {
      // Show success message for new chat
      showNotification(result.metadata.message, 'success');
    } else {
      // Show info message for existing chat
      showNotification(result.metadata.message, 'info');
    }
    
    // Navigate to chat
    navigateToChat(result.chat.id);
  } catch (error) {
    console.error('Error creating/retrieving chat:', error);
  }
};
```

### Vue.js Example

```javascript
const createOrGetChat = async (projectId, participantId) => {
  try {
    const response = await fetch(`/api/chat/project/${projectId}/participant/${participantId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    const result = await response.json();
    
    // Show appropriate message
    if (result.metadata.isNewChat) {
      this.$toast.success(result.metadata.message);
    } else {
      this.$toast.info(result.metadata.message);
    }
    
    return result.chat;
  } catch (error) {
    console.error('Error:', error);
    this.$toast.error('Failed to create/retrieve chat');
  }
};
```

## Benefits

1. **Better UX**: Frontend can show appropriate messages based on whether chat was created or retrieved
2. **Debugging**: Developers can easily see when chats were created vs retrieved
3. **Analytics**: Can track chat creation patterns
4. **Consistent API**: Both web and mobile endpoints return the same enhanced format
5. **Backward Compatibility**: Existing chat data structure remains unchanged

## Migration Guide

### For Existing Frontend Code

If you're currently using the old API format, you can easily migrate:

**Before:**
```typescript
const chat = await createOrGetChat(projectId, participantId);
// chat is directly the ChatResponseDto
```

**After:**
```typescript
const result = await createOrGetChat(projectId, participantId);
const chat = result.chat; // Extract chat from result
const metadata = result.metadata; // Access metadata if needed
```

Or if you only need the chat data:
```typescript
const { chat } = await createOrGetChat(projectId, participantId);
``` 