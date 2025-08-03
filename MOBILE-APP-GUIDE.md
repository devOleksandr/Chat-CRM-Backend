# Mobile App Guide

Complete guide for building a React Native mobile app for Chat CRM system participants. The app allows participants to communicate with project administrators without authentication.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Mobile App (React Native)                │
├─────────────────────────────────────────────────────────────┤
│  React Navigation (Navigation & Routing)                    │
│  React Native Socket.IO (Real-time Communication)           │
│  AsyncStorage (Local Data Storage)                          │
│  React Native Elements (UI Components)                      │
│  Axios (HTTP Client)                                        │
└─────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (NestJS)                         │
├─────────────────────────────────────────────────────────────┤
│  REST API (Mobile Endpoints - No Authentication)            │
│  WebSocket Gateway (Real-time Chat)                         │
│  Project-based Access Control                               │
│  PostgreSQL Database                                        │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- React Native CLI or Expo CLI
- Backend API running on `http://localhost:5000`
- Android Studio / Xcode (for native development)

### Installation
```bash
# Create new React Native project with Expo
npx create-expo-app mobile-chat-app --template blank-typescript

# Or with React Native CLI
npx react-native@latest init MobileChatApp --template react-native-template-typescript

# Install dependencies
npm install @react-navigation/native @react-navigation/stack
npm install react-native-screens react-native-safe-area-context
npm install socket.io-client react-native-socket-io
npm install axios
npm install @react-native-async-storage/async-storage
npm install react-native-elements
npm install react-native-vector-icons
npm install react-native-image-picker
npm install react-native-file-access
npm install react-native-gesture-handler
npm install react-native-reanimated

# For Expo
npx expo install expo-image-picker expo-file-system expo-device
```

## 🔧 Environment Configuration

### Environment Variables
```typescript
// src/config/env.ts
export const ENV = {
  API_URL: 'http://localhost:5000/api',
  WS_URL: 'http://localhost:5000',
  PROJECT_ID: 'PROJ-001', // Set by admin, unique for each project
  APP_NAME: 'Chat App',
  VERSION: '1.0.0',
}

// For production, use actual server URLs
// export const ENV = {
//   API_URL: 'https://your-api.com/api',
//   WS_URL: 'https://your-api.com',
//   PROJECT_ID: 'PROJ-001',
//   APP_NAME: 'Chat App',
//   VERSION: '1.0.0',
// }
```

### Device ID Generation
```typescript
// src/utils/deviceId.ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'
import DeviceInfo from 'react-native-device-info'

export const generateParticipantId = async (): Promise<string> => {
  const storedId = await AsyncStorage.getItem('participantId')
  
  if (storedId) {
    return storedId
  }

  // Generate unique ID based on device info
  const deviceId = await DeviceInfo.getUniqueId()
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  
  const participantId = `mobile_${deviceId}_${timestamp}_${randomSuffix}`
  
  // Store for future use
  await AsyncStorage.setItem('participantId', participantId)
  
  return participantId
}

export const getParticipantId = async (): Promise<string> => {
  return await AsyncStorage.getItem('participantId') || ''
}
```

## 📊 API Endpoints Reference

### Mobile App Endpoints (No Authentication Required)

#### Create Project Participant
```typescript
POST /api/project-participants/mobile
Content-Type: application/json

{
  "projectUniqueId": "PROJ-001",
  "participantId": "mobile_device_123_1234567890_abc123",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com"
}

Response:
{
  "id": 1,
  "projectId": 1,
  "userId": 2,
  "participantId": "mobile_device_123_1234567890_abc123",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "isOnline": false,
  "lastSeen": null,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

#### Create/Get Chat
```typescript
POST /api/chat/mobile/project/{projectUniqueId}/participant/{participantId}

Response:
{
  "id": 1,
  "projectId": 1,
  "adminId": 1,
  "participantId": 2,
  "isActive": true,
  "unreadCount": 0,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "project": {
    "id": 1,
    "name": "My Awesome Project",
    "uniqueId": "PROJ-001"
  },
  "admin": {
    "id": 1,
    "firstName": "Admin",
    "lastName": "User"
  },
  "participant": {
    "id": 2,
    "firstName": "John",
    "lastName": "Doe",
    "participantId": "mobile_device_123_1234567890_abc123"
  }
}
```

#### Get Chat Messages
```typescript
GET /api/chat/mobile/{chatId}/messages?participantId=mobile_device_123_1234567890_abc123&projectUniqueId=PROJ-001&limit=20&offset=0

Response:
{
  "messages": [
    {
      "id": 1,
      "chatId": 1,
      "senderId": 1,
      "content": "Hello! How can I help you?",
      "type": "TEXT",
      "metadata": null,
      "read": false,
      "readAt": null,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "sender": {
        "id": 1,
        "firstName": "Admin",
        "lastName": "User"
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
POST /api/chat/mobile/{chatId}/messages?participantId=mobile_device_123_1234567890_abc123&projectUniqueId=PROJ-001
Content-Type: application/json

{
  "content": "Hello! I need help with my order.",
  "type": "TEXT"
}

Response:
{
  "id": 2,
  "chatId": 1,
  "senderId": 2,
  "content": "Hello! I need help with my order.",
  "type": "TEXT",
  "metadata": null,
  "read": false,
  "readAt": null,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "sender": {
    "id": 2,
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

## 🔌 WebSocket Integration

### Socket.IO Setup
```typescript
// src/lib/socket.ts
import { io, Socket } from 'socket.io-client'
import { ENV } from '../config/env'
import { getParticipantId } from '../utils/deviceId'

class SocketService {
  private socket: Socket | null = null
  private participantId: string = ''
  private projectUniqueId: string = ''

  async connect() {
    this.participantId = await getParticipantId()
    this.projectUniqueId = ENV.PROJECT_ID

    this.socket = io(ENV.WS_URL + '/chat', {
      auth: {
        participantId: this.participantId,
        projectId: this.projectUniqueId
      }
    })

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server')
    })

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server')
    })

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error)
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

  getParticipantId() {
    return this.participantId
  }

  getProjectUniqueId() {
    return this.projectUniqueId
  }
}

export const socketService = new SocketService()
```

### React Native Socket Hook
```typescript
// src/hooks/useSocket.ts
import { useEffect, useState } from 'react'
import { socketService } from '../lib/socket'

export const useChatSocket = () => {
  const [socket, setSocket] = useState(socketService.getSocket())
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const connectSocket = async () => {
      const newSocket = await socketService.connect()
      setSocket(newSocket)

      newSocket.on('connect', () => {
        setIsConnected(true)
      })

      newSocket.on('disconnect', () => {
        setIsConnected(false)
      })
    }

    connectSocket()

    return () => {
      socketService.disconnect()
    }
  }, [])

  return { socket, isConnected }
}
```

### WebSocket Events

#### Join Chat
```typescript
socket.emit('mobileJoinChat', {
  chatId: 1,
  participantId: 'mobile_device_123_1234567890_abc123',
  projectUniqueId: 'PROJ-001'
})
```

#### Send Message
```typescript
socket.emit('mobileSendMessage', {
  chatId: 1,
  content: 'Hello! I need help.',
  type: 'TEXT',
  participantId: 'mobile_device_123_1234567890_abc123',
  projectUniqueId: 'PROJ-001'
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
  // Update chat messages
})
```

#### Listen for Typing
```typescript
socket.on('userTyping', (data) => {
  console.log('Admin is typing:', data)
  // Show typing indicator
})
```

## 🎨 UI Components

### Chat Screen
```typescript
// src/screens/ChatScreen.tsx
import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native'
import { useChatSocket } from '../hooks/useSocket'
import { api } from '../lib/api'
import { getParticipantId } from '../utils/deviceId'
import { ENV } from '../config/env'

interface Message {
  id: number
  content: string
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'EMOJI' | 'SYSTEM'
  sender: { firstName: string; lastName: string }
  createdAt: string
  isOwn: boolean
}

export const ChatScreen = ({ route }: any) => {
  const { chatId } = route.params
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [participantId, setParticipantId] = useState('')
  const { socket, isConnected } = useChatSocket()
  const flatListRef = useRef<FlatList>(null)

  useEffect(() => {
    const initChat = async () => {
      const id = await getParticipantId()
      setParticipantId(id)
      loadMessages()
    }

    initChat()
  }, [])

  useEffect(() => {
    if (!socket) return

    socket.on('newMessage', (message: Message) => {
      setMessages(prev => [...prev, message])
    })

    socket.on('userTyping', (data) => {
      if (data.chatId === chatId) {
        setIsTyping(data.isTyping)
      }
    })

    socket.emit('mobileJoinChat', {
      chatId,
      participantId,
      projectUniqueId: ENV.PROJECT_ID
    })

    return () => {
      socket.off('newMessage')
      socket.off('userTyping')
    }
  }, [socket, chatId, participantId])

  const loadMessages = async () => {
    try {
      const response = await api.get(
        `/chat/mobile/${chatId}/messages?participantId=${participantId}&projectUniqueId=${ENV.PROJECT_ID}`
      )
      setMessages(response.data.messages)
    } catch (error) {
      Alert.alert('Error', 'Failed to load messages')
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !socket) return

    try {
      // Send via WebSocket for real-time
      socket.emit('mobileSendMessage', {
        chatId,
        content: newMessage,
        type: 'TEXT',
        participantId,
        projectUniqueId: ENV.PROJECT_ID
      })

      // Also send via REST API for persistence
      await api.post(
        `/chat/mobile/${chatId}/messages?participantId=${participantId}&projectUniqueId=${ENV.PROJECT_ID}`,
        {
          content: newMessage,
          type: 'TEXT'
        }
      )

      setNewMessage('')
    } catch (error) {
      Alert.alert('Error', 'Failed to send message')
    }
  }

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer,
      item.isOwn ? styles.ownMessage : styles.otherMessage
    ]}>
      <Text style={[
        styles.messageText,
        item.isOwn ? styles.ownMessageText : styles.otherMessageText
      ]}>
        {item.content}
      </Text>
      <Text style={styles.messageTime}>
        {new Date(item.createdAt).toLocaleTimeString()}
      </Text>
    </View>
  )

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chat with Admin</Text>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: isConnected ? '#4CAF50' : '#F44336' }]} />
          <Text style={styles.statusText}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id.toString()}
        style={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      {isTyping && (
        <View style={styles.typingContainer}>
          <Text style={styles.typingText}>Admin is typing...</Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          multiline
        />
        <TouchableOpacity 
          style={styles.sendButton}
          onPress={sendMessage}
          disabled={!newMessage.trim()}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  messagesList: {
    flex: 1,
    padding: 16,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
    borderRadius: 16,
    padding: 12,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  messageText: {
    fontSize: 16,
  },
  ownMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#000',
  },
  messageTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  typingContainer: {
    padding: 8,
    marginHorizontal: 16,
  },
  typingText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
})
```

### Welcome Screen
```typescript
// src/screens/WelcomeScreen.tsx
import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { api } from '../lib/api'
import { generateParticipantId } from '../utils/deviceId'
import { ENV } from '../config/env'

export const WelcomeScreen = ({ navigation }: any) => {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    checkExistingParticipant()
  }, [])

  const checkExistingParticipant = async () => {
    try {
      const participantId = await generateParticipantId()
      // Check if participant already exists
      const response = await api.get(
        `/project-participants/mobile/check?participantId=${participantId}&projectUniqueId=${ENV.PROJECT_ID}`
      )
      
      if (response.data.exists) {
        // Participant exists, go directly to chat
        navigation.replace('Chat', { 
          chatId: response.data.chatId,
          participantId: participantId
        })
      }
    } catch (error) {
      // Participant doesn't exist, show welcome form
    }
  }

  const createParticipant = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Error', 'Please enter your name')
      return
    }

    setIsLoading(true)

    try {
      const participantId = await generateParticipantId()

      // Create participant
      const participantResponse = await api.post('/project-participants/mobile', {
        projectUniqueId: ENV.PROJECT_ID,
        participantId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || undefined,
      })

      // Create or get chat
      const chatResponse = await api.post(
        `/chat/mobile/project/${ENV.PROJECT_ID}/participant/${participantId}`
      )

      navigation.replace('Chat', { 
        chatId: chatResponse.data.id,
        participantId: participantId
      })
    } catch (error) {
      Alert.alert('Error', 'Failed to create participant. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to {ENV.APP_NAME}</Text>
        <Text style={styles.subtitle}>
          Connect with our support team for assistance
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>First Name *</Text>
        <TextInput
          style={styles.input}
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Enter your first name"
          autoCapitalize="words"
        />

        <Text style={styles.label}>Last Name *</Text>
        <TextInput
          style={styles.input}
          value={lastName}
          onChangeText={setLastName}
          placeholder="Enter your last name"
          autoCapitalize="words"
        />

        <Text style={styles.label}>Email (Optional)</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={createParticipant}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Start Chat</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Project ID: {ENV.PROJECT_ID}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#999',
  },
})
```

## 🛣️ Navigation Setup

### React Navigation Configuration
```typescript
// src/navigation/AppNavigator.tsx
import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { WelcomeScreen } from '../screens/WelcomeScreen'
import { ChatScreen } from '../screens/ChatScreen'
import { LoadingScreen } from '../screens/LoadingScreen'

const Stack = createStackNavigator()

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Loading"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Loading" component={LoadingScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
```

### Loading Screen
```typescript
// src/screens/LoadingScreen.tsx
import React, { useEffect } from 'react'
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { getParticipantId } from '../utils/deviceId'
import { ENV } from '../config/env'

export const LoadingScreen = ({ navigation }: any) => {
  useEffect(() => {
    checkParticipantStatus()
  }, [])

  const checkParticipantStatus = async () => {
    try {
      const participantId = await getParticipantId()
      
      if (participantId) {
        // Check if participant exists and has active chat
        const response = await api.get(
          `/project-participants/mobile/check?participantId=${participantId}&projectUniqueId=${ENV.PROJECT_ID}`
        )
        
        if (response.data.exists) {
          navigation.replace('Chat', { 
            chatId: response.data.chatId,
            participantId: participantId
          })
        } else {
          navigation.replace('Welcome')
        }
      } else {
        navigation.replace('Welcome')
      }
    } catch (error) {
      navigation.replace('Welcome')
    }
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.text}>Loading...</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
})
```

## 📱 HTTP Client Setup

### API Configuration
```typescript
// src/lib/api.ts
import axios from 'axios'
import { ENV } from '../config/env'

const api = axios.create({
  baseURL: ENV.API_URL,
  timeout: 10000,
})

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url)
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message)
    
    if (error.response?.status === 404) {
      // Handle not found
    } else if (error.response?.status >= 500) {
      // Handle server errors
    }
    
    return Promise.reject(error)
  }
)

export { api }
```

## 🎯 Key Features Implementation

### Real-time Message Updates
```typescript
// src/hooks/useChatMessages.ts
import { useState, useEffect } from 'react'
import { useChatSocket } from './useSocket'
import { api } from '../lib/api'

export const useChatMessages = (chatId: number, participantId: string) => {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const { socket } = useChatSocket()

  const loadMessages = async () => {
    try {
      setIsLoading(true)
      const response = await api.get(
        `/chat/mobile/${chatId}/messages?participantId=${participantId}&projectUniqueId=${ENV.PROJECT_ID}`
      )
      setMessages(response.data.messages)
    } catch (error) {
      console.error('Failed to load messages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadMessages()
  }, [chatId])

  useEffect(() => {
    if (!socket) return

    const handleNewMessage = (message) => {
      setMessages(prev => [...prev, message])
    }

    socket.on('newMessage', handleNewMessage)

    return () => {
      socket.off('newMessage', handleNewMessage)
    }
  }, [socket])

  return { messages, isLoading, loadMessages }
}
```

### File Upload Support
```typescript
// src/utils/fileUpload.ts
import { launchImageLibrary, launchCamera } from 'react-native-image-picker'
import { api } from '../lib/api'

export const pickImage = async () => {
  const result = await launchImageLibrary({
    mediaType: 'photo',
    quality: 0.8,
    maxWidth: 1024,
    maxHeight: 1024,
  })

  if (result.assets && result.assets[0]) {
    return result.assets[0]
  }
  
  return null
}

export const takePhoto = async () => {
  const result = await launchCamera({
    mediaType: 'photo',
    quality: 0.8,
    maxWidth: 1024,
    maxHeight: 1024,
  })

  if (result.assets && result.assets[0]) {
    return result.assets[0]
  }
  
  return null
}

export const uploadFile = async (file, chatId, participantId) => {
  const formData = new FormData()
  formData.append('file', {
    uri: file.uri,
    type: file.type,
    name: file.fileName || 'image.jpg',
  })
  formData.append('chatId', chatId.toString())
  formData.append('participantId', participantId)
  formData.append('projectUniqueId', ENV.PROJECT_ID)

  const response = await api.post('/chat/mobile/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return response.data
}
```

### Push Notifications (Optional)
```typescript
// src/services/notifications.ts
import PushNotification from 'react-native-push-notification'

export const setupNotifications = () => {
  PushNotification.configure({
    onRegister: function (token) {
      console.log('TOKEN:', token)
    },
    onNotification: function (notification) {
      console.log('NOTIFICATION:', notification)
    },
    permissions: {
      alert: true,
      badge: true,
      sound: true,
    },
    popInitialNotification: true,
    requestPermissions: true,
  })
}

export const showLocalNotification = (title: string, message: string) => {
  PushNotification.localNotification({
    title,
    message,
    playSound: true,
    soundName: 'default',
  })
}
```

## 🚀 App Configuration

### App.tsx
```typescript
// App.tsx
import React, { useEffect } from 'react'
import { StatusBar } from 'react-native'
import { AppNavigator } from './src/navigation/AppNavigator'
import { setupNotifications } from './src/services/notifications'

export default function App() {
  useEffect(() => {
    setupNotifications()
  }, [])

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <AppNavigator />
    </>
  )
}
```

### Package.json Scripts
```json
{
  "scripts": {
    "android": "react-native run-android",
    "ios": "react-native run-ios",
    "start": "react-native start",
    "test": "jest",
    "lint": "eslint . --ext .js,.jsx,.ts,.tsx",
    "build:android": "cd android && ./gradlew assembleRelease",
    "build:ios": "cd ios && xcodebuild -workspace MobileChatApp.xcworkspace -scheme MobileChatApp -configuration Release archive"
  }
}
```

## 📱 Platform-specific Setup

### Android Configuration
```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
```

### iOS Configuration
```xml
<!-- ios/MobileChatApp/Info.plist -->
<key>NSCameraUsageDescription</key>
<string>This app needs access to camera to take photos for chat.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>This app needs access to photo library to select images for chat.</string>
<key>NSMicrophoneUsageDescription</key>
<string>This app needs access to microphone for voice messages.</string>
```

## 🚀 Deployment

### Environment Configuration
```env
# .env.production
API_URL=https://your-api.com/api
WS_URL=https://your-api.com
PROJECT_ID=PROJ-001
APP_NAME=Chat App
VERSION=1.0.0
```

### Build Commands
```bash
# Android Release Build
cd android && ./gradlew assembleRelease

# iOS Release Build
cd ios && xcodebuild -workspace MobileChatApp.xcworkspace -scheme MobileChatApp -configuration Release archive

# Expo Build (if using Expo)
eas build --platform all
```

## 📋 Checklist

### Core Features
- [x] Participant creation with unique device ID
- [x] Real-time chat with WebSocket
- [x] Message history
- [x] File/image upload
- [x] Typing indicators
- [x] Online status
- [x] Push notifications
- [x] Offline support
- [x] Auto-reconnection

### Advanced Features
- [ ] Voice messages
- [ ] Video calls
- [ ] Message reactions
- [ ] Message search
- [ ] Dark mode
- [ ] Multi-language support
- [ ] Message encryption
- [ ] File preview
- [ ] Message forwarding
- [ ] Chat backup

### Testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Performance testing
- [ ] Security testing

This guide provides a complete foundation for building a professional mobile chat app for participants with all necessary endpoints, components, and integrations. 