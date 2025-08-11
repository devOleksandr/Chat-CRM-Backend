/*
  Minimal WS smoke test:
  - Login as admin, create participant via REST (if not exists), create/get chat via mobile REST
  - Connect admin socket with JWT
  - Connect participant socket with handshake { participantId, projectId }
  - Join chat room on both, send message from participant, assert admin receives
*/

import axios from 'axios';
import { io, Socket } from 'socket.io-client';

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: { id: number; email: string };
};

const API_BASE = process.env.API_BASE || 'http://localhost:5000';
const WS_BASE = process.env.WS_BASE || 'ws://localhost:5000';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@chat-crm.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const PROJECT_UNIQUE_ID = process.env.PROJECT_UNIQUE_ID || 'DEMO-001';
const PARTICIPANT_ID = process.env.PARTICIPANT_ID || 'mobile_user_123';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function loginAdmin(): Promise<LoginResponse> {
  const { data } = await axios.post<LoginResponse>(`${API_BASE}/auth/login`, {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  return data;
}

async function ensureParticipant(token: string): Promise<void> {
  try {
    await axios.post(
      `${API_BASE}/project-participants`,
      { participantId: PARTICIPANT_ID, projectUniqueId: PROJECT_UNIQUE_ID },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  } catch (err: any) {
    // ignore if already exists
    if (err?.response?.status && err.response.status !== 400 && err.response.status !== 409) {
      throw err;
    }
  }
}

async function createOrGetChat(): Promise<{ chat: { id: number }; metadata: any }> {
  const { data } = await axios.post(
    `${API_BASE}/mobile-chat/project/${PROJECT_UNIQUE_ID}/participant/${PARTICIPANT_ID}`
  );
  return data;
}

async function getProjectId(token: string): Promise<number> {
  const { data } = await axios.get(`${API_BASE}/projects/unique/${PROJECT_UNIQUE_ID}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data.id;
}

async function main() {
  console.log('Logging in admin...');
  const login = await loginAdmin();
  const token = login.accessToken;

  console.log('Ensuring participant exists...');
  await ensureParticipant(token);

  console.log('Creating/Getting chat via mobile endpoint...');
  const { chat } = await createOrGetChat();
  console.log('Chat ID:', chat.id);

  console.log('Resolving projectId for handshake...');
  const projectId = await getProjectId(token);

  console.log('Connecting admin socket...');
  const adminSocket: Socket = io(`${WS_BASE}/chat`, {
    transports: ['websocket'],
    extraHeaders: { Authorization: `Bearer ${token}` },
  });

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Admin connect timeout')), 5000);
    adminSocket.on('connect', () => {
      clearTimeout(timer);
      resolve();
    });
    adminSocket.on('error', (e: any) => reject(e));
    adminSocket.on('connect_error', (e: any) => reject(e));
  });
  console.log('Admin socket connected:', adminSocket.id);

  // Admin listens for mobile messages
  let received = false;
  adminSocket.on('newMessage', (payload: any) => {
    if (payload?.chatId === chat.id) {
      console.log('Admin received newMessage:', payload.id);
      received = true;
    }
  });

  console.log('Admin joining chat room...');
  adminSocket.emit('joinChat', { chatId: chat.id });
  await sleep(300);

  console.log('Connecting participant socket...');
  const participantSocket: Socket = io(`${WS_BASE}/chat`, {
    transports: ['websocket'],
    auth: { participantId: PARTICIPANT_ID, projectId },
  });

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Participant connect timeout')), 5000);
    participantSocket.on('connect', () => {
      clearTimeout(timer);
      resolve();
    });
    participantSocket.on('error', (e: any) => reject(e));
    participantSocket.on('connect_error', (e: any) => reject(e));
  });
  console.log('Participant socket connected:', participantSocket.id);

  console.log('Participant joining chat room...');
  participantSocket.emit('mobileJoinChat', { chatId: chat.id, participantId: PARTICIPANT_ID, projectId });
  await sleep(300);

  console.log('Participant sending message...');
  participantSocket.emit('mobileSendMessage', {
    chatId: chat.id,
    content: 'Hello from participant smoke test',
    participantId: PARTICIPANT_ID,
    projectId,
  });

  await sleep(1500);

  if (!received) {
    throw new Error('Admin did not receive newMessage from participant');
  }

  console.log('✅ Smoke test passed');
  adminSocket.close();
  participantSocket.close();
}

main().catch((err) => {
  console.error('❌ Smoke test failed:', err);
  process.exit(1);
});


