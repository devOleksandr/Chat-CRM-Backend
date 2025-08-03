# Admin CRM Interface Guide

Complete guide for building an administrative CRM interface for Chat CRM system using React, TanStack Router, React Socket.IO, and Shadcn UI.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                         │
├─────────────────────────────────────────────────────────────┤
│  TanStack Router (Navigation & Routing)                     │
│  TanStack Auth (Authentication & Authorization)             │
│  React Socket.IO (Real-time Communication)                  │
│  Shadcn UI (Component Library)                              │
│  Axios (HTTP Client)                                        │
└─────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (NestJS)                         │
├─────────────────────────────────────────────────────────────┤
│  REST API (Project & User Management)                       │
│  WebSocket Gateway (Real-time Chat)                         │
│  JWT Authentication                                         │
│  PostgreSQL Database                                        │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Backend API running on `http://localhost:5000`

### Installation
```bash
# Create new React project
npx create-react-app admin-crm --template typescript

# Install dependencies
npm install @tanstack/react-router @tanstack/react-query
npm install @tanstack/react-auth @tanstack/react-auth-query
npm install socket.io-client react-socket-io
npm install axios
npm install @radix-ui/react-* lucide-react
npm install tailwindcss @tailwindcss/forms
npm install class-variance-authority clsx tailwind-merge

# Install Shadcn UI
npx shadcn@latest init
```

## 🔐 Authentication Setup

### TanStack Auth Configuration
```typescript
// src/lib/auth.ts
import { createAuth } from '@tanstack/react-auth'
import { createQueryClient } from '@tanstack/react-query'

const queryClient = createQueryClient()

export const auth = createAuth({
  queryClient,
  loginFn: async (credentials: { email: string; password: string }) => {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    })
    
    if (!response.ok) {
      throw new Error('Login failed')
    }
    
    const data = await response.json()
    return data
  },
  registerFn: async (userData: { email: string; password: string; firstName: string; lastName: string }) => {
    const response = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    })
    
    if (!response.ok) {
      throw new Error('Registration failed')
    }
    
    const data = await response.json()
    return data
  },
  logoutFn: async () => {
    const token = localStorage.getItem('accessToken')
    await fetch('http://localhost:5000/api/auth/logout', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    })
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  },
})
```

### HTTP Client Setup
```typescript
// src/lib/api.ts
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
})

// Request interceptor to add JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        try {
          const response = await axios.post('http://localhost:5000/api/auth/refresh', {
            refreshToken,
          })
          localStorage.setItem('accessToken', response.data.accessToken)
          error.config.headers.Authorization = `Bearer ${response.data.accessToken}`
          return api.request(error.config)
        } catch (refreshError) {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api
```

## 📊 API Endpoints Reference

### Authentication Endpoints

#### Login
```typescript
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "SecurePassword123!"
}

Response:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "Admin"
  }
}
```

#### Register
```typescript
POST /api/auth/register
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe"
}

Response: Same as login
```

#### Logout
```typescript
POST /api/auth/logout
Authorization: Bearer <access-token>

Response: 200 OK
```

### Project Management Endpoints

#### Create Project
```typescript
POST /api/projects
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "name": "My Awesome Project",
  "uniqueId": "PROJ-001"
}

Response:
{
  "id": 1,
  "name": "My Awesome Project",
  "uniqueId": "PROJ-001",
  "createdBy": {
    "id": 1,
    "email": "admin@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### Get All Projects
```typescript
GET /api/projects?limit=20&offset=0
Authorization: Bearer <access-token>

Response:
{
  "projects": [
    {
      "id": 1,
      "name": "My Awesome Project",
      "uniqueId": "PROJ-001",
      "createdBy": { ... },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

#### Get Project by ID
```typescript
GET /api/projects/{id}
Authorization: Bearer <access-token>

Response: Single project object
```

#### Update Project
```typescript
PUT /api/projects/{id}
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "name": "Updated Project Name",
  "uniqueId": "PROJ-001-UPDATED"
}

Response: Updated project object
```

#### Delete Project
```typescript
DELETE /api/projects/{id}
Authorization: Bearer <access-token>

Response: 200 OK
```

#### Check Unique ID Availability
```typescript
GET /api/projects/check-availability/{uniqueId}

Response:
{
  "available": true,
  "uniqueId": "PROJ-001"
}
```

### Participant Management Endpoints

#### Create Participant
```typescript
POST /api/project-participants
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "projectId": 1,
  "participantId": "user_123",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com"
}

Response:
{
  "id": 1,
  "projectId": 1,
  "userId": 2,
  "participantId": "user_123",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "isOnline": false,
  "lastSeen": null,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

#### Get Project Participants
```typescript
GET /api/project-participants/project/{projectId}?limit=20&offset=0
Authorization: Bearer <access-token>

Response:
[
  {
    "id": 1,
    "projectId": 1,
    "userId": 2,
    "participantId": "user_123",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "isOnline": false,
    "lastSeen": null,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### Get Participant by ID
```typescript
GET /api/project-participants/{participantId}
Authorization: Bearer <access-token>

Response: Single participant object
```

#### Delete Participant
```typescript
DELETE /api/project-participants/{participantId}
Authorization: Bearer <access-token>

Response: 200 OK
```

### Chat Management Endpoints

#### Get Chat List
```typescript
GET /api/chat?limit=20&offset=0&role=CUSTOMER
Authorization: Bearer <access-token>

Response:
{
  "chats": [
    {
      "id": 1,
      "projectId": 1,
      "adminId": 1,
      "participantId": 2,
      "isActive": true,
      "unreadCount": 5,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "project": {
        "id": 1,
        "name": "My Awesome Project",
        "uniqueId": "PROJ-001"
      },
      "admin": {
        "id": 1,
        "firstName": "John",
        "lastName": "Doe"
      },
      "participant": {
        "id": 2,
        "firstName": "Jane",
        "lastName": "Smith",
        "participantId": "user_123"
      }
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

#### Get Project Chats
```typescript
GET /api/chat/project/{projectId}?limit=20&offset=0
Authorization: Bearer <access-token>

Response: Same as chat list but filtered by project
```

#### Get Chat by ID
```typescript
GET /api/chat/{chatId}
Authorization: Bearer <access-token>

Response: Single chat object with project, admin, and participant details
```

#### Create/Get Chat with Participant
```typescript
POST /api/chat/project/{projectId}/participant/{participantId}
Authorization: Bearer <access-token>

Response: Chat object (creates new chat if doesn't exist)
```

#### Get Chat Messages
```typescript
GET /api/chat/{chatId}/messages?limit=20&offset=0
Authorization: Bearer <access-token>

Response:
{
  "messages": [
    {
      "id": 1,
      "chatId": 1,
      "senderId": 1,
      "content": "Hello!",
      "type": "TEXT",
      "metadata": null,
      "read": false,
      "readAt": null,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "sender": {
        "id": 1,
        "firstName": "John",
        "lastName": "Doe"
      }
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

#### Send Message
```typescript
POST /api/chat/{chatId}/messages
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "content": "Hello, how can I help you?",
  "type": "TEXT"
}

Response: Created message object
```

#### Mark Chat as Read
```typescript
PUT /api/chat/{chatId}/read
Authorization: Bearer <access-token>

Response: 200 OK
```

#### Deactivate Chat
```typescript
DELETE /api/chat/{chatId}
Authorization: Bearer <access-token>

Response: 200 OK
```

#### User Online Status
```typescript
GET /api/chat/status
Authorization: Bearer <access-token>

Response:
{
  "isOnline": true,
  "lastSeen": "2024-01-01T00:00:00.000Z"
}
```

## 🔌 WebSocket Integration

### Socket.IO Setup
```typescript
// src/lib/socket.ts
import { io, Socket } from 'socket.io-client'

class SocketService {
  private socket: Socket | null = null

  connect(token: string) {
    this.socket = io('http://localhost:5000/chat', {
      auth: { token }
    })

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server')
    })

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server')
    })

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  getSocket() {
    return this.socket
  }
}

export const socketService = new SocketService()
```

### React Socket.IO Hook
```typescript
// src/hooks/useSocket.ts
import { useEffect, useState } from 'react'
import { useSocket } from 'react-socket-io'
import { socketService } from '../lib/socket'

export const useChatSocket = () => {
  const [socket, setSocket] = useState(socketService.getSocket())

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (token && !socket) {
      const newSocket = socketService.connect(token)
      setSocket(newSocket)
    }

    return () => {
      socketService.disconnect()
    }
  }, [])

  return socket
}
```

### WebSocket Events

#### Join Chat
```typescript
socket.emit('joinChat', { chatId: 1 })
```

#### Send Message
```typescript
socket.emit('sendMessage', {
  chatId: 1,
  content: 'Hello!',
  type: 'TEXT'
})
```

#### Mark as Read
```typescript
socket.emit('markAsRead', { chatId: 1 })
```

#### Typing Indicator
```typescript
socket.emit('typing', { chatId: 1, isTyping: true })
```

#### Listen for New Messages
```typescript
socket.on('newMessage', (message) => {
  console.log('New message received:', message)
})
```

#### Listen for Typing
```typescript
socket.on('userTyping', (data) => {
  console.log('User typing:', data)
})
```

## 🎨 UI Components with Shadcn

### Project Management Components

#### Project List
```typescript
// src/components/ProjectList.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Users, MessageSquare } from 'lucide-react'

interface Project {
  id: number
  name: string
  uniqueId: string
  createdAt: string
  participantsCount?: number
  chatsCount?: number
}

export const ProjectList = ({ projects }: { projects: Project[] }) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <Card key={project.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {project.name}
              <Badge variant="secondary">{project.uniqueId}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {project.participantsCount || 0} participants
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                {project.chatsCount || 0} chats
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="outline">
                View Details
              </Button>
              <Button size="sm">
                Open Chat
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
```

#### Create Project Form
```typescript
// src/components/CreateProjectForm.tsx
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import api from '@/lib/api'

export const CreateProjectForm = () => {
  const [name, setName] = useState('')
  const [uniqueId, setUniqueId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await api.post('/projects', { name, uniqueId })
      toast({
        title: 'Success',
        description: 'Project created successfully',
      })
      setName('')
      setUniqueId('')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create project',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Project</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name"
              required
            />
          </div>
          <div>
            <Label htmlFor="uniqueId">Unique ID</Label>
            <Input
              id="uniqueId"
              value={uniqueId}
              onChange={(e) => setUniqueId(e.target.value)}
              placeholder="PROJ-001"
              required
            />
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Project'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
```

### Chat Components

#### Chat List
```typescript
// src/components/ChatList.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MessageSquare, Circle } from 'lucide-react'

interface Chat {
  id: number
  project: { name: string; uniqueId: string }
  participant: { firstName: string; lastName: string; isOnline: boolean }
  unreadCount: number
  updatedAt: string
}

export const ChatList = ({ chats, onChatSelect }: { 
  chats: Chat[]
  onChatSelect: (chatId: number) => void 
}) => {
  return (
    <div className="space-y-2">
      {chats.map((chat) => (
        <Card 
          key={chat.id} 
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => onChatSelect(chat.id)}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src="" />
                <AvatarFallback>
                  {chat.participant.firstName[0]}{chat.participant.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">
                    {chat.participant.firstName} {chat.participant.lastName}
                  </p>
                  {chat.participant.isOnline && (
                    <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {chat.project.name} ({chat.project.uniqueId})
                </p>
              </div>
              <div className="flex items-center gap-2">
                {chat.unreadCount > 0 && (
                  <Badge variant="destructive">{chat.unreadCount}</Badge>
                )}
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
```

#### Chat Interface
```typescript
// src/components/ChatInterface.tsx
import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Send, Paperclip, Smile } from 'lucide-react'
import { useChatSocket } from '@/hooks/useSocket'

interface Message {
  id: number
  content: string
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'EMOJI' | 'SYSTEM'
  sender: { firstName: string; lastName: string }
  createdAt: string
  isOwn: boolean
}

export const ChatInterface = ({ chatId, messages }: { 
  chatId: number
  messages: Message[] 
}) => {
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const socket = useChatSocket()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = () => {
    if (!newMessage.trim() || !socket) return

    socket.emit('sendMessage', {
      chatId,
      content: newMessage,
      type: 'TEXT'
    })

    setNewMessage('')
  }

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value)
    
    if (!socket) return

    if (!isTyping) {
      setIsTyping(true)
      socket.emit('typing', { chatId, isTyping: true })
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Chat #{chatId}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.isOwn ? 'justify-end' : 'justify-start'}`}
            >
              {!message.isOwn && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {message.sender.firstName[0]}{message.sender.lastName[0]}
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={`max-w-xs px-3 py-2 rounded-lg ${
                  message.isOwn
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {new Date(message.createdAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Smile className="h-4 w-4" />
          </Button>
          <Input
            value={newMessage}
            onChange={handleTyping}
            placeholder="Type a message..."
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1"
          />
          <Button onClick={handleSendMessage}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

## 🛣️ Routing with TanStack Router

### Route Configuration
```typescript
// src/routes.tsx
import { createRouter, createRoute, createRootRoute } from '@tanstack/react-router'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { ProjectDetailPage } from './pages/ProjectDetailPage'
import { ChatPage } from './pages/ChatPage'
import { ParticipantsPage } from './pages/ParticipantsPage'

const rootRoute = createRootRoute({
  component: () => <RootComponent />,
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
})

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardPage,
})

const projectsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/projects',
  component: ProjectsPage,
})

const projectDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/projects/$projectId',
  component: ProjectDetailPage,
})

const chatRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/chat/$chatId',
  component: ChatPage,
})

const participantsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/projects/$projectId/participants',
  component: ParticipantsPage,
})

const routeTree = rootRoute.addChildren([
  loginRoute,
  dashboardRoute,
  projectsRoute,
  projectDetailRoute,
  chatRoute,
  participantsRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
```

### Protected Route Component
```typescript
// src/components/ProtectedRoute.tsx
import { useAuth } from '@tanstack/react-auth'
import { Navigate } from '@tanstack/react-router'

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }

  return <>{children}</>
}
```

## 📱 Page Components

### Dashboard Page
```typescript
// src/pages/DashboardPage.tsx
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProjectList } from '@/components/ProjectList'
import { ChatList } from '@/components/ChatList'
import { CreateProjectForm } from '@/components/CreateProjectForm'
import api from '@/lib/api'

export const DashboardPage = () => {
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects').then(res => res.data.projects),
  })

  const { data: chats } = useQuery({
    queryKey: ['chats'],
    queryFn: () => api.get('/chat').then(res => res.data.chats),
  })

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectList projects={projects || []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Chats</CardTitle>
          </CardHeader>
          <CardContent>
            <ChatList 
              chats={chats || []} 
              onChatSelect={(chatId) => {
                // Navigate to chat
              }} 
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateProjectForm />
        </CardContent>
      </Card>
    </div>
  )
}
```

### Chat Page
```typescript
// src/pages/ChatPage.tsx
import { useParams } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ChatInterface } from '@/components/ChatInterface'
import { ChatList } from '@/components/ChatList'
import api from '@/lib/api'

export const ChatPage = () => {
  const { chatId } = useParams({ from: '/chat/$chatId' })

  const { data: chat } = useQuery({
    queryKey: ['chat', chatId],
    queryFn: () => api.get(`/chat/${chatId}`).then(res => res.data),
  })

  const { data: messages } = useQuery({
    queryKey: ['messages', chatId],
    queryFn: () => api.get(`/chat/${chatId}/messages`).then(res => res.data.messages),
  })

  return (
    <div className="h-screen flex">
      <div className="w-80 border-r p-4">
        <ChatList 
          chats={[]} // Get all chats
          onChatSelect={(id) => {
            // Navigate to chat
          }} 
        />
      </div>
      <div className="flex-1">
        <ChatInterface chatId={parseInt(chatId)} messages={messages || []} />
      </div>
    </div>
  )
}
```

## 🎯 Key Features Implementation

### Real-time Chat Updates
```typescript
// src/hooks/useChatMessages.ts
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useChatSocket } from './useSocket'

export const useChatMessages = (chatId: number) => {
  const queryClient = useQueryClient()
  const socket = useChatSocket()

  const { data: messages } = useQuery({
    queryKey: ['messages', chatId],
    queryFn: () => api.get(`/chat/${chatId}/messages`).then(res => res.data.messages),
  })

  useEffect(() => {
    if (!socket) return

    const handleNewMessage = (message: any) => {
      if (message.chatId === chatId) {
        queryClient.setQueryData(['messages', chatId], (old: any) => [
          ...old,
          message
        ])
      }
    }

    socket.on('newMessage', handleNewMessage)

    return () => {
      socket.off('newMessage', handleNewMessage)
    }
  }, [socket, chatId, queryClient])

  return messages
}
```

### Project Statistics
```typescript
// src/components/ProjectStats.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, MessageSquare, TrendingUp } from 'lucide-react'

export const ProjectStats = ({ projectId }: { projectId: number }) => {
  const { data: stats } = useQuery({
    queryKey: ['project-stats', projectId],
    queryFn: () => api.get(`/projects/${projectId}/stats`).then(res => res.data),
  })

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Participants</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.participantsCount || 0}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Chats</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.activeChatsCount || 0}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Messages Today</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.messagesToday || 0}</div>
        </CardContent>
      </Card>
    </div>
  )
}
```

## 🚀 Deployment

### Environment Variables
```env
# .env
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=http://localhost:5000
VITE_APP_NAME=Admin CRM
```

### Build and Deploy
```bash
# Build for production
npm run build

# Deploy to Vercel/Netlify
npm run deploy
```

## 📋 Checklist

### Core Features
- [x] Authentication with JWT
- [x] Project management (CRUD)
- [x] Participant management
- [x] Real-time chat
- [x] Message history
- [x] Online status
- [x] Typing indicators
- [x] File uploads
- [x] Responsive design

### Advanced Features
- [ ] Message search
- [ ] Chat analytics
- [ ] Export conversations
- [ ] Bulk operations
- [ ] Advanced filtering
- [ ] Notifications
- [ ] Dark mode
- [ ] Multi-language support

This guide provides a complete foundation for building a professional admin CRM interface with all necessary endpoints, components, and integrations. 