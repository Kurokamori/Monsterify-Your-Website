import { io, Socket } from 'socket.io-client';
import type { ChatMessage, TypingUser } from '../pages/toys/group-chats/types';

type MessageHandler = (message: ChatMessage) => void;
type TypingHandler = (data: { room_id: number; typers: TypingUser[] }) => void;
type RoomUpdateHandler = (data: { room_id: number; last_message_at: string; last_message_preview: string }) => void;

class ChatSocketService {
  private socket: Socket | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private joinedRooms: Map<number, number> = new Map(); // roomId → trainerId
  private reconnectHandlers: Set<() => void> = new Set();

  /**
   * Connect to the Socket.IO server with the user's JWT token.
   */
  connect(): void {
    if (this.socket?.connected) return;

    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('[ChatSocket] No token found, cannot connect');
      return;
    }

    const baseUrl = import.meta.env.VITE_API_URL
      ? new URL(import.meta.env.VITE_API_URL).origin
      : 'http://localhost:4000';

    this.socket = io(baseUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    let initialConnect = true;

    this.socket.on('connect', () => {
      console.log('[ChatSocket] Connected');

      if (!initialConnect) {
        // Rejoin all tracked rooms after reconnection
        for (const [roomId, trainerId] of this.joinedRooms) {
          this.socket?.emit('room:join', { room_id: roomId, trainer_id: trainerId });
        }
        // Notify listeners so they can refetch missed messages
        for (const handler of this.reconnectHandlers) {
          handler();
        }
      }
      initialConnect = false;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[ChatSocket] Disconnected:', reason);
    });

    this.socket.on('connect_error', (err) => {
      console.error('[ChatSocket] Connection error:', err.message);
    });
  }

  disconnect(): void {
    this.stopHeartbeat();
    this.joinedRooms.clear();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // ---------------------------------------------------------------------------
  // Room management
  // ---------------------------------------------------------------------------

  joinRoom(roomId: number, trainerId: number): void {
    this.joinedRooms.set(roomId, trainerId);
    this.socket?.emit('room:join', { room_id: roomId, trainer_id: trainerId });
  }

  leaveRoom(roomId: number): void {
    this.joinedRooms.delete(roomId);
    this.socket?.emit('room:leave', { room_id: roomId });
  }

  // ---------------------------------------------------------------------------
  // Messages
  // ---------------------------------------------------------------------------

  sendMessage(data: {
    room_id: number;
    trainer_id: number;
    content?: string;
    image_url?: string;
    reply_to_id?: string;
  }): void {
    this.socket?.emit('message:send', data);
  }

  onMessage(handler: MessageHandler): void {
    this.socket?.on('message:new', handler);
  }

  offMessage(handler: MessageHandler): void {
    this.socket?.off('message:new', handler);
  }

  // ---------------------------------------------------------------------------
  // Typing
  // ---------------------------------------------------------------------------

  startTyping(roomId: number, trainerId: number): void {
    this.socket?.emit('typing:start', { room_id: roomId, trainer_id: trainerId });
  }

  stopTyping(roomId: number, trainerId: number): void {
    this.socket?.emit('typing:stop', { room_id: roomId, trainer_id: trainerId });
  }

  onTypingUpdate(handler: TypingHandler): void {
    this.socket?.on('typing:update', handler);
  }

  offTypingUpdate(handler: TypingHandler): void {
    this.socket?.off('typing:update', handler);
  }

  // ---------------------------------------------------------------------------
  // Room updates (sidebar refresh)
  // ---------------------------------------------------------------------------

  onRoomUpdate(handler: RoomUpdateHandler): void {
    this.socket?.on('room:updated', handler);
  }

  offRoomUpdate(handler: RoomUpdateHandler): void {
    this.socket?.off('room:updated', handler);
  }

  // ---------------------------------------------------------------------------
  // Reconnection
  // ---------------------------------------------------------------------------

  onReconnect(handler: () => void): void {
    this.reconnectHandlers.add(handler);
  }

  offReconnect(handler: () => void): void {
    this.reconnectHandlers.delete(handler);
  }

  // ---------------------------------------------------------------------------
  // Presence heartbeat
  // ---------------------------------------------------------------------------

  startHeartbeat(trainerId: number): void {
    this.stopHeartbeat();
    this.socket?.emit('presence:heartbeat', { trainer_id: trainerId });
    this.heartbeatInterval = setInterval(() => {
      this.socket?.emit('presence:heartbeat', { trainer_id: trainerId });
    }, 30_000);
  }

  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

const chatSocketService = new ChatSocketService();
export default chatSocketService;
