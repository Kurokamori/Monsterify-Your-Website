import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { UserService } from '../services/user.service.js';
import { ChatService } from '../services/chat.service.js';
import { connectRedis, redisSub, redisAvailable } from '../utils/redis.js';
import type {
  SocketMessageSend,
  SocketTypingEvent,
  StoredMessage,
} from '../utils/types';

const userService = new UserService();
const chatService = new ChatService();

let io: Server;

/**
 * Initialize Socket.IO on the given HTTP server.
 * Sets up authentication, event handlers, and background workers.
 */
export function initializeSocketIO(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL ?? 'http://localhost:4888',
      credentials: true,
    },
    path: '/socket.io',
  });

  // =========================================================================
  // Authentication middleware
  // =========================================================================
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token as string | undefined;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const payload = userService.verifyToken(token);
      if (!payload) {
        return next(new Error('Invalid token'));
      }

      const user = await userService.findById(payload.id);
      if (!user) {
        return next(new Error('User not found'));
      }

      // Attach user data to socket
      (socket as Socket & { userId: number; user: typeof user }).userId = user.id;
      (socket as Socket & { user: typeof user }).user = user;
      next();
    } catch {
      next(new Error('Authentication failed'));
    }
  });

  // =========================================================================
  // Connection handler
  // =========================================================================
  io.on('connection', (socket: Socket) => {
    const userId = (socket as Socket & { userId: number }).userId;
    console.log(`[Socket.IO] User ${userId} connected (${socket.id})`);

    // ----- room:join -----
    socket.on('room:join', async (data: { room_id: number; trainer_id: number }) => {
      try {
        const isMember = await chatService.isMember(data.room_id, data.trainer_id);
        if (!isMember) {
          socket.emit('error', { message: 'Not a member of this room' });
          return;
        }
        const roomKey = `room:${data.room_id}`;
        await socket.join(roomKey);
        await chatService.markRead(data.room_id, data.trainer_id);
      } catch (err) {
        console.error('[Socket.IO] room:join error:', err);
      }
    });

    // ----- room:leave -----
    socket.on('room:leave', (data: { room_id: number }) => {
      socket.leave(`room:${data.room_id}`);
    });

    // ----- message:send -----
    socket.on('message:send', async (data: SocketMessageSend) => {
      try {
        const message = await chatService.sendMessage({
          roomId: data.room_id,
          trainerId: data.trainer_id,
          content: data.content,
          imageUrl: data.image_url,
          replyToId: data.reply_to_id,
        });

        // Broadcast to everyone in the room (including sender)
        io.to(`room:${data.room_id}`).emit('message:new', message);

        // Clear typing for sender
        await chatService.realtime.clearTyping(data.room_id, data.trainer_id);

        // Broadcast room update for sidebar
        io.emit('room:updated', {
          room_id: data.room_id,
          last_message_at: message.timestamp,
          last_message_preview: message.content
            ? `${message.sender_nickname}: ${message.content.slice(0, 150)}`
            : `${message.sender_nickname} sent an image`,
        });
      } catch (err) {
        console.error('[Socket.IO] message:send error:', err);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // ----- typing:start -----
    socket.on('typing:start', async (data: SocketTypingEvent) => {
      try {
        const profile = await chatService.getProfile(data.trainer_id);
        const nickname = profile?.nickname ?? 'Someone';
        await chatService.realtime.setTyping(data.room_id, data.trainer_id, nickname);

        const typers = await chatService.realtime.getTypers(data.room_id);
        socket.to(`room:${data.room_id}`).emit('typing:update', {
          room_id: data.room_id,
          typers: typers.map((t) => ({ trainer_id: t.trainer_id, nickname: t.nickname })),
        });
      } catch (err) {
        console.error('[Socket.IO] typing:start error:', err);
      }
    });

    // ----- typing:stop -----
    socket.on('typing:stop', async (data: SocketTypingEvent) => {
      try {
        await chatService.realtime.clearTyping(data.room_id, data.trainer_id);

        const typers = await chatService.realtime.getTypers(data.room_id);
        socket.to(`room:${data.room_id}`).emit('typing:update', {
          room_id: data.room_id,
          typers: typers.map((t) => ({ trainer_id: t.trainer_id, nickname: t.nickname })),
        });
      } catch (err) {
        console.error('[Socket.IO] typing:stop error:', err);
      }
    });

    // ----- presence:heartbeat -----
    socket.on('presence:heartbeat', async (data: { trainer_id: number }) => {
      try {
        await chatService.realtime.setOnline(String(userId), data.trainer_id);
      } catch (err) {
        console.error('[Socket.IO] presence:heartbeat error:', err);
      }
    });

    // ----- disconnect -----
    socket.on('disconnect', () => {
      console.log(`[Socket.IO] User ${userId} disconnected (${socket.id})`);
    });
  });

  // =========================================================================
  // Redis Pub/Sub subscriber (for multi-process scaling)
  // =========================================================================
  startRedisPubSub();

  // =========================================================================
  // Background workers
  // =========================================================================
  chatService.realtime.startFlushWorker();

  // Typing cleanup every 10s
  setInterval(() => {
    chatService.realtime.cleanupStaleTyping().catch((err) =>
      console.error('[Socket.IO] Typing cleanup error:', err),
    );
  }, 10_000);

  console.log('[Socket.IO] Initialized');
  return io;
}

async function startRedisPubSub(): Promise<void> {
  try {
    await connectRedis();
    if (!redisAvailable) {
      console.warn('[Socket.IO] Redis not available — Pub/Sub disabled');
      return;
    }
    await redisSub.subscribe('chat:messages');
    redisSub.on('message', (_channel: string, data: string) => {
      try {
        const parsed = JSON.parse(data) as { room_id: number; message: StoredMessage };
        io.to(`room:${parsed.room_id}`).emit('message:new', parsed.message);
      } catch {
        // ignore malformed messages
      }
    });
  } catch (err) {
    console.error('[Socket.IO] Redis Pub/Sub setup failed:', err);
  }
}

export { io };
