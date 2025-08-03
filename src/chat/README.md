# Chat Module

Chat module for "The Little Black Book" system with support for text messages, images, and files. Supports both admin interface (with authentication) and mobile app (without authentication).

## Features

- ✅ Text messages
- ✅ Images
- ✅ Files
- ✅ Emojis
- ✅ System messages
- ✅ WebSocket for real-time communication
- ✅ REST API for administrators
- ✅ REST API for mobile app (no authentication required)
- ✅ Automatic message type detection
- ✅ Image file validation
- ✅ Project participant management

## Message Types

### TEXT
Regular text messages (maximum 1000 characters).

### IMAGE
Images with support for the following formats:
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)
- BMP (.bmp)
- SVG (.svg)

### FILE
Other file types (documents, video, audio, etc.).

### EMOJI
Emoji messages.

### SYSTEM
System messages.

## API Endpoints

### REST API for Administrators (with authentication)

#### Get Chat List
```bash
GET /api/chat?limit=20&offset=0&role=CUSTOMER
Authorization: Bearer <jwt-token>
```

#### Get Project Chats
```bash
GET /api/chat/project/{projectId}?limit=20&offset=0
Authorization: Bearer <jwt-token>
```

#### Get Chat by ID
```bash
GET /api/chat/{chatId}
Authorization: Bearer <jwt-token>
```

#### Create/Get Chat with Participant
```bash
POST /api/chat/project/{projectId}/participant/{participantId}
Authorization: Bearer <jwt-token>
```

#### Get Chat Messages
```bash
GET /api/chat/{chatId}/messages?limit=20&offset=0
Authorization: Bearer <jwt-token>
```

#### Send Message
```bash
POST /api/chat/{chatId}/messages
Authorization: Bearer <jwt-token>
{
  "content": "Message text",
  "type": "TEXT"
}
```

#### Mark Chat as Read
```bash
PUT /api/chat/{chatId}/read
Authorization: Bearer <jwt-token>
```

#### Deactivate Chat
```bash
DELETE /api/chat/{chatId}
Authorization: Bearer <jwt-token>
```

#### User Online Status
```bash
GET /api/chat/status
Authorization: Bearer <jwt-token>
```

### REST API for Mobile App (no authentication required)

#### Create Project Participant
```bash
POST /api/project-participants/mobile
{
  "participantId": "mobile_user_123",
  "projectId": 1,
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com"
}
```

#### Create/Get Chat
```bash
POST /api/chat/mobile/project/{projectId}/participant/{participantId}
```

#### Get Chat Messages
```bash
GET /api/chat/mobile/{chatId}/messages?participantId=mobile_user_123&projectId=1&limit=20&offset=0
```

#### Send Message
```bash
POST /api/chat/mobile/{chatId}/messages?participantId=mobile_user_123&projectId=1
{
  "content": "Message text",
  "type": "TEXT"
}
```

### WebSocket API

#### Connect for Administrators
```javascript
const socket = io('http://localhost:5000/chat', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

#### Connect for Mobile App
```javascript
const socket = io('http://localhost:5000/chat', {
  auth: {
    participantId: 'mobile_user_123',
    projectId: 1
  }
});
```

#### Send Message (Admin)
```javascript
socket.emit('sendMessage', {
  chatId: 1,
  content: 'Message text',
  type: 'TEXT'
});
```

#### Send Message (Mobile)
```javascript
socket.emit('mobileSendMessage', {
  chatId: 1,
  content: 'Message text',
  type: 'TEXT',
  participantId: 'mobile_user_123',
  projectId: 1
});
```

#### Join Chat (Admin)
```javascript
socket.emit('joinChat', { chatId: 1 });
```

#### Join Chat (Mobile)
```javascript
socket.emit('mobileJoinChat', {
  chatId: 1,
  participantId: 'mobile_user_123',
  projectId: 1
});
```

#### Mark as Read
```javascript
socket.emit('markAsRead', { chatId: 1 });
```

#### Typing Indicator
```javascript
socket.emit('typing', { chatId: 1, isTyping: true });
```

## Project Participant Management

### REST API for Administrators

#### Create Participant
```bash
POST /api/project-participants
Authorization: Bearer <jwt-token>
{
  "participantId": "user_123",
  "projectId": 1,
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com"
}
```

#### Get Project Participants
```bash
GET /api/project-participants/project/{projectId}?limit=20&offset=0
Authorization: Bearer <jwt-token>
```

#### Get Participant by ID
```bash
GET /api/project-participants/{participantId}
Authorization: Bearer <jwt-token>
```

#### Delete Participant
```bash
DELETE /api/project-participants/{participantId}
Authorization: Bearer <jwt-token>
```

## Architecture

### Controllers
- **ChatController** - main chat controller with admin and mobile endpoints
- **ProjectParticipantController** - project participant management

### Services
- **ChatService** - chat business logic
- **ProjectParticipantService** - participant management
- **OnlineStatusService** - online status tracking

### WebSocket Gateway
- **ChatGateway** - unified WebSocket gateway for administrators and mobile app

### Repositories
- **ChatRepository** - chat data operations
- **MessageRepository** - message data operations
- **ProjectParticipantRepository** - participant data operations

## Implementation Details

### Mobile App without Authentication
- Uses `participantId` (string) instead of internal `userId`
- Automatically retrieves `adminId` from project
- All mobile endpoints accessible without JWT token

### Security
- Admin endpoints protected with JWT authentication
- Mobile endpoints use `participantId` and `projectId` for validation
- WebSocket connections verify `participantId` matching

### Scalability
- Pagination support for all lists
- Optimized database queries
- Real-time updates via WebSocket

## Usage Examples

### Creating Chat from Mobile App
1. Create participant: `POST /api/project-participants/mobile`
2. Create chat: `POST /api/chat/mobile/project/1/participant/mobile_user_123`
3. Connect to WebSocket with `participantId` and `projectId`
4. Send messages via WebSocket or REST API

### Administrative Management
1. Authenticate as admin
2. Create participant: `POST /api/project-participants`
3. Create chat: `POST /api/chat/project/1/participant/2`
4. Connect to WebSocket with JWT token
5. Send messages and manage chats 