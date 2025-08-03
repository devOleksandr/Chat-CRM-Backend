/**
 * Frontend Integration Examples
 * 
 * This file contains examples of how to integrate with the enhanced chat API
 * from various frontend frameworks and libraries.
 */

// ============================================================================
// TypeScript Interfaces
// ============================================================================

interface ChatParticipant {
  id: number;
  email: string | null;
  firstName: string;
  lastName: string;
  uniqueId?: string;
  isOnline: boolean;
  lastSeen: Date | null;
}

interface Project {
  id: number;
  name: string;
  uniqueId: string;
}

interface LastMessage {
  id: number;
  content: string;
  createdAt: Date;
  senderId: number;
}

interface ChatResponse {
  id: number;
  projectId: number;
  project: Project;
  admin: ChatParticipant;
  participant: ChatParticipant;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  lastMessage?: LastMessage;
  unreadCount: number;
  lastMessageAt?: Date;
}

interface ChatMetadata {
  isNewChat: boolean;
  message: string;
  createdAt: Date;
  accessedAt: Date;
}

interface ChatWithMetadata {
  chat: ChatResponse;
  metadata: ChatMetadata;
}

// ============================================================================
// React/TypeScript Example
// ============================================================================

class ChatService {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  async createOrGetChat(projectId: number, participantId: number): Promise<ChatWithMetadata> {
    const response = await fetch(`${this.baseUrl}/chat/project/${projectId}/participant/${participantId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async createOrGetChatMobile(projectUniqueId: string, participantId: string): Promise<ChatWithMetadata> {
    const response = await fetch(`${this.baseUrl}/chat/mobile/project/${projectUniqueId}/participant/${participantId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
}

// React Hook Example
function useChatCreation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chat, setChat] = useState<ChatWithMetadata | null>(null);

  const createOrGetChat = useCallback(async (projectId: number, participantId: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const chatService = new ChatService('/api', 'your-jwt-token');
      const result = await chatService.createOrGetChat(projectId, participantId);
      
      setChat(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { createOrGetChat, isLoading, error, chat };
}

// React Component Example
function ChatCreationComponent() {
  const { createOrGetChat, isLoading, error, chat } = useChatCreation();
  const [projectId, setProjectId] = useState<number>(0);
  const [participantId, setParticipantId] = useState<number>(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await createOrGetChat(projectId, participantId);
      
      // Show appropriate notification based on metadata
      if (result.metadata.isNewChat) {
        showSuccessNotification(result.metadata.message);
      } else {
        showInfoNotification(result.metadata.message);
      }
      
      // Navigate to chat or update UI
      navigateToChat(result.chat.id);
    } catch (err) {
      showErrorNotification('Failed to create/retrieve chat');
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="number"
          value={projectId}
          onChange={(e) => setProjectId(Number(e.target.value))}
          placeholder="Project ID"
        />
        <input
          type="number"
          value={participantId}
          onChange={(e) => setParticipantId(Number(e.target.value))}
          placeholder="Participant ID"
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create/Get Chat'}
        </button>
      </form>

      {error && <div className="error">{error}</div>}
      
      {chat && (
        <div className="chat-info">
          <h3>Chat Information</h3>
          <p>Chat ID: {chat.chat.id}</p>
          <p>Project: {chat.chat.project.name}</p>
          <p>Status: {chat.metadata.message}</p>
          <p>Created: {new Date(chat.metadata.createdAt).toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Vue.js Example
// ============================================================================

// Vue 3 Composition API
function useChatService() {
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const chat = ref<ChatWithMetadata | null>(null);

  const createOrGetChat = async (projectId: number, participantId: number) => {
    isLoading.value = true;
    error.value = null;

    try {
      const chatService = new ChatService('/api', 'your-jwt-token');
      const result = await chatService.createOrGetChat(projectId, participantId);
      
      chat.value = result;
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      error.value = errorMessage;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    createOrGetChat,
    isLoading: readonly(isLoading),
    error: readonly(error),
    chat: readonly(chat),
  };
}

// Vue Component Example
const ChatCreationVue = {
  setup() {
    const { createOrGetChat, isLoading, error, chat } = useChatService();
    const projectId = ref(0);
    const participantId = ref(0);

    const handleSubmit = async () => {
      try {
        const result = await createOrGetChat(projectId.value, participantId.value);
        
        // Show appropriate notification
        if (result.metadata.isNewChat) {
          showSuccessNotification(result.metadata.message);
        } else {
          showInfoNotification(result.metadata.message);
        }
        
        // Navigate to chat
        navigateToChat(result.chat.id);
      } catch (err) {
        showErrorNotification('Failed to create/retrieve chat');
      }
    };

    return {
      projectId,
      participantId,
      handleSubmit,
      isLoading,
      error,
      chat,
    };
  },

  template: `
    <div>
      <form @submit.prevent="handleSubmit">
        <input
          type="number"
          v-model="projectId"
          placeholder="Project ID"
        />
        <input
          type="number"
          v-model="participantId"
          placeholder="Participant ID"
        />
        <button type="submit" :disabled="isLoading">
          {{ isLoading ? 'Creating...' : 'Create/Get Chat' }}
        </button>
      </form>

      <div v-if="error" class="error">{{ error }}</div>
      
      <div v-if="chat" class="chat-info">
        <h3>Chat Information</h3>
        <p>Chat ID: {{ chat.chat.id }}</p>
        <p>Project: {{ chat.chat.project.name }}</p>
        <p>Status: {{ chat.metadata.message }}</p>
        <p>Created: {{ new Date(chat.metadata.createdAt).toLocaleString() }}</p>
      </div>
    </div>
  `,
};

// ============================================================================
// Angular Example
// ============================================================================

// Angular Service
@Injectable({
  providedIn: 'root'
})
class ChatServiceAngular {
  constructor(private http: HttpClient) {}

  createOrGetChat(projectId: number, participantId: number): Observable<ChatWithMetadata> {
    return this.http.post<ChatWithMetadata>(
      `/api/chat/project/${projectId}/participant/${participantId}`,
      {},
      {
        headers: new HttpHeaders({
          'Authorization': `Bearer ${this.getToken()}`,
          'Content-Type': 'application/json'
        })
      }
    );
  }

  private getToken(): string {
    // Get token from your auth service
    return localStorage.getItem('token') || '';
  }
}

// Angular Component
@Component({
  selector: 'app-chat-creation',
  template: `
    <div>
      <form (ngSubmit)="handleSubmit()">
        <input
          type="number"
          [(ngModel)]="projectId"
          name="projectId"
          placeholder="Project ID"
        />
        <input
          type="number"
          [(ngModel)]="participantId"
          name="participantId"
          placeholder="Participant ID"
        />
        <button type="submit" [disabled]="isLoading">
          {{ isLoading ? 'Creating...' : 'Create/Get Chat' }}
        </button>
      </form>

      <div *ngIf="error" class="error">{{ error }}</div>
      
      <div *ngIf="chat" class="chat-info">
        <h3>Chat Information</h3>
        <p>Chat ID: {{ chat.chat.id }}</p>
        <p>Project: {{ chat.chat.project.name }}</p>
        <p>Status: {{ chat.metadata.message }}</p>
        <p>Created: {{ chat.metadata.createdAt | date:'medium' }}</p>
      </div>
    </div>
  `
})
class ChatCreationComponentAngular {
  projectId = 0;
  participantId = 0;
  isLoading = false;
  error: string | null = null;
  chat: ChatWithMetadata | null = null;

  constructor(
    private chatService: ChatServiceAngular,
    private notificationService: NotificationService
  ) {}

  async handleSubmit() {
    this.isLoading = true;
    this.error = null;

    try {
      const result = await this.chatService.createOrGetChat(this.projectId, this.participantId).toPromise();
      
      if (result) {
        this.chat = result;
        
        // Show appropriate notification
        if (result.metadata.isNewChat) {
          this.notificationService.success(result.metadata.message);
        } else {
          this.notificationService.info(result.metadata.message);
        }
        
        // Navigate to chat
        this.router.navigate(['/chat', result.chat.id]);
      }
    } catch (err) {
      this.error = 'Failed to create/retrieve chat';
      this.notificationService.error(this.error);
    } finally {
      this.isLoading = false;
    }
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

// Notification helpers (implement based on your notification library)
function showSuccessNotification(message: string) {
  console.log('Success:', message);
  // Implement with your notification library (e.g., toastr, react-toastify, etc.)
}

function showInfoNotification(message: string) {
  console.log('Info:', message);
  // Implement with your notification library
}

function showErrorNotification(message: string) {
  console.log('Error:', message);
  // Implement with your notification library
}

function navigateToChat(chatId: number) {
  console.log('Navigating to chat:', chatId);
  // Implement with your routing library
}

// Mock React hooks for the example
function useState<T>(initial: T): [T, (value: T) => void] {
  return [initial, () => {}];
}

function useCallback<T extends (...args: any[]) => any>(fn: T, deps: any[]): T {
  return fn;
}

function ref<T>(value: T): { value: T } {
  return { value };
}

function readonly<T>(ref: { value: T }): { readonly value: T } {
  return ref;
} 