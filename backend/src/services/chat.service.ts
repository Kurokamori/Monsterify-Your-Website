import { v4 as uuidv4 } from 'uuid';
import {
  ChatProfileRepository,
  ChatRoomRepository,
  ChatRoomMemberRepository,
  DmRequestRepository,
  TrainerRepository,
} from '../repositories/index.js';
import { ChatStorageService } from './chat-storage.service.js';
import { ChatRealtimeService } from './chat-realtime.service.js';
import { normalizeFactionForChat } from '../utils/constants/index.js';
import type {
  ChatProfile,
  ChatProfileUpdateInput,
  ChatRoom,
  ChatRoomWithUnread,
  ChatRoomMemberInfo,
  DmRequest,
  DmRequestWithProfiles,
  StoredMessage,
  ChatMemberRole,
} from '../utils/types';

// ============================================================================
// Types
// ============================================================================

export interface SendMessageInput {
  roomId: number;
  trainerId: number;
  content?: string;
  imageUrl?: string;
  replyToId?: string;
}

export interface CreateGroupInput {
  name: string;
  creatorTrainerId: number;
  memberTrainerIds: number[];
}

export interface SendAdminMessageInput {
  roomId: number;
  content: string;
  senderName?: string;
}

// ============================================================================
// Service
// ============================================================================

export class ChatService {
  private profileRepo: ChatProfileRepository;
  private roomRepo: ChatRoomRepository;
  private memberRepo: ChatRoomMemberRepository;
  private dmRequestRepo: DmRequestRepository;
  private trainerRepo: TrainerRepository;
  private storageService: ChatStorageService;
  private realtimeService: ChatRealtimeService;

  constructor() {
    this.profileRepo = new ChatProfileRepository();
    this.roomRepo = new ChatRoomRepository();
    this.memberRepo = new ChatRoomMemberRepository();
    this.dmRequestRepo = new DmRequestRepository();
    this.trainerRepo = new TrainerRepository();
    this.storageService = new ChatStorageService();
    this.realtimeService = new ChatRealtimeService();
  }

  // ---------------------------------------------------------------------------
  // Profile
  // ---------------------------------------------------------------------------

  async getOrCreateProfile(trainerId: number): Promise<ChatProfile> {
    const existing = await this.profileRepo.findByTrainerId(trainerId);
    if (existing) {return existing;}

    const trainer = await this.trainerRepo.findById(trainerId);
    if (!trainer) {throw new Error('Trainer not found');}

    return this.profileRepo.upsert(trainerId, trainer.name);
  }

  async getProfile(trainerId: number): Promise<ChatProfile | null> {
    return this.profileRepo.findByTrainerId(trainerId);
  }

  async updateProfile(trainerId: number, input: ChatProfileUpdateInput): Promise<ChatProfile> {
    const profile = await this.profileRepo.findByTrainerId(trainerId);
    if (!profile) {throw new Error('Chat profile not found. Open chats to create one.');}
    return this.profileRepo.update(profile.id, input);
  }

  // ---------------------------------------------------------------------------
  // Rooms
  // ---------------------------------------------------------------------------

  async getRoomsForTrainer(trainerId: number): Promise<ChatRoomWithUnread[]> {
    await this.ensureFactionMembership(trainerId);
    return this.roomRepo.findByTrainerId(trainerId);
  }

  async getRoomById(roomId: number): Promise<ChatRoom | null> {
    return this.roomRepo.findById(roomId);
  }

  async updateRoomIcon(roomId: number, iconUrl: string): Promise<ChatRoom> {
    return this.roomRepo.update(roomId, { icon_url: iconUrl });
  }

  async getRoomMembers(roomId: number): Promise<ChatRoomMemberInfo[]> {
    const members = await this.memberRepo.getMembers(roomId);
    const infos: ChatRoomMemberInfo[] = [];

    for (const m of members) {
      const profile = await this.profileRepo.findByTrainerId(m.trainerId);
      const trainer = await this.trainerRepo.findById(m.trainerId);
      infos.push({
        trainerId: m.trainerId,
        nickname: profile?.nickname ?? trainer?.name ?? 'Unknown',
        avatarUrl: profile?.avatarUrl ?? null,
        role: m.role,
      });
    }

    return infos;
  }

  async createGroupChat(input: CreateGroupInput): Promise<ChatRoom> {
    // Create the room
    const room = await this.roomRepo.create({
      name: input.name,
      type: 'group',
      created_by_trainer_id: input.creatorTrainerId,
    });

    // Add creator as owner
    await this.memberRepo.create({
      chat_room_id: room.id,
      trainer_id: input.creatorTrainerId,
      role: 'owner',
    });

    // Add other members
    for (const tid of input.memberTrainerIds) {
      if (tid !== input.creatorTrainerId) {
        await this.memberRepo.create({
          chat_room_id: room.id,
          trainer_id: tid,
          role: 'member',
        });
      }
    }

    return room;
  }

  async addMember(roomId: number, trainerId: number, role: ChatMemberRole = 'member'): Promise<void> {
    await this.memberRepo.create({ chat_room_id: roomId, trainer_id: trainerId, role });
  }

  async removeMember(roomId: number, trainerId: number, isAdmin = false): Promise<boolean> {
    if (!isAdmin) {
      const room = await this.roomRepo.findById(roomId);
      if (room?.type === 'faction') {
        throw new Error('Cannot leave a faction chat room');
      }
    }
    return this.memberRepo.removeFromRoom(roomId, trainerId);
  }

  async isMember(roomId: number, trainerId: number): Promise<boolean> {
    return this.memberRepo.isMember(roomId, trainerId);
  }

  async markRead(roomId: number, trainerId: number): Promise<void> {
    await this.memberRepo.updateLastRead(roomId, trainerId);
  }

  // ---------------------------------------------------------------------------
  // Faction Chat Auto-Join
  // ---------------------------------------------------------------------------

  /**
   * Lazy auto-join: look up trainer's faction, normalize it, find-or-create
   * the faction chat room, and add the trainer as a member if not already.
   */
  private async ensureFactionMembership(trainerId: number): Promise<void> {
    try {
      const trainer = await this.trainerRepo.findById(trainerId);
      if (!trainer) { return; }

      const canonical = normalizeFactionForChat(trainer.faction);
      if (!canonical) { return; }

      // Find existing faction room or create one
      let room = await this.roomRepo.findByFactionName(canonical);
      if (!room) {
        try {
          room = await this.roomRepo.create({
            name: canonical,
            type: 'faction',
            faction_name: canonical,
          });
        } catch (createErr) {
          // Unique constraint violation = race condition, re-fetch
          const pgCode = (createErr as { code?: string }).code;
          if (pgCode === '23505') {
            room = await this.roomRepo.findByFactionName(canonical);
            if (!room) { return; }
          } else {
            throw createErr;
          }
        }
      }

      // Add trainer as member if not already
      const isMember = await this.memberRepo.isMember(room.id, trainerId);
      if (!isMember) {
        await this.memberRepo.create({
          chat_room_id: room.id,
          trainer_id: trainerId,
          role: 'member',
        });
      }
    } catch (err) {
      console.warn('[ChatService] Failed to ensure faction membership:', (err as Error).message);
    }
  }

  // ---------------------------------------------------------------------------
  // DM Requests
  // ---------------------------------------------------------------------------

  async sendDmRequest(fromTrainerId: number, toTrainerId: number, message?: string): Promise<DmRequest> {
    // Check if already have a DM room
    const existingRoom = await this.roomRepo.findDmBetween(fromTrainerId, toTrainerId);
    if (existingRoom) {throw new Error('DM room already exists');}

    // Check for pending request in either direction
    const pendingFrom = await this.dmRequestRepo.findPendingBetween(fromTrainerId, toTrainerId);
    if (pendingFrom) {throw new Error('Request already sent');}

    const pendingTo = await this.dmRequestRepo.findPendingBetween(toTrainerId, fromTrainerId);
    if (pendingTo) {
      // Auto-accept: they already requested us, so just accept
      return this.acceptDmRequest(pendingTo.id, toTrainerId);
    }

    return this.dmRequestRepo.create({
      from_trainer_id: fromTrainerId,
      to_trainer_id: toTrainerId,
      message,
    });
  }

  async acceptDmRequest(requestId: number, toTrainerId: number): Promise<DmRequest> {
    const req = await this.dmRequestRepo.findById(requestId);
    if (!req) {throw new Error('DM request not found');}
    if (req.toTrainerId !== toTrainerId) {throw new Error('Not authorized to accept this request');}
    if (req.status !== 'pending') {throw new Error('Request is no longer pending');}

    // Update status
    const updated = await this.dmRequestRepo.update(requestId, { status: 'accepted' });

    // Create DM room
    const room = await this.roomRepo.create({ type: 'dm' });
    await this.memberRepo.create({
      chat_room_id: room.id,
      trainer_id: req.fromTrainerId,
      role: 'member',
    });
    await this.memberRepo.create({
      chat_room_id: room.id,
      trainer_id: req.toTrainerId,
      role: 'member',
    });

    return updated;
  }

  async declineDmRequest(requestId: number, toTrainerId: number): Promise<DmRequest> {
    const req = await this.dmRequestRepo.findById(requestId);
    if (!req) {throw new Error('DM request not found');}
    if (req.toTrainerId !== toTrainerId) {throw new Error('Not authorized to decline this request');}
    if (req.status !== 'pending') {throw new Error('Request is no longer pending');}

    return this.dmRequestRepo.update(requestId, { status: 'declined' });
  }

  async getDmRequestsForTrainer(trainerId: number): Promise<DmRequestWithProfiles[]> {
    return this.dmRequestRepo.findForTrainer(trainerId);
  }

  // ---------------------------------------------------------------------------
  // Messages
  // ---------------------------------------------------------------------------

  /**
   * Send a message. Returns the StoredMessage.
   * The caller (socket handler) is responsible for broadcasting & caching.
   */
  async sendMessage(input: SendMessageInput): Promise<StoredMessage> {
    if (!input.content && !input.imageUrl) {
      throw new Error('Message must have content or an image');
    }

    // Verify membership
    const member = await this.memberRepo.isMember(input.roomId, input.trainerId);
    if (!member) {throw new Error('Not a member of this room');}

    // Get sender profile
    const profile = await this.getOrCreateProfile(input.trainerId);

    // Build reply_to if replying
    let replyTo: StoredMessage['reply_to'] = null;
    if (input.replyToId) {
      try {
        const recent = await this.realtimeService.getRecentMessages(input.roomId, 100);
        const original = recent.find((m) => m.id === input.replyToId);
        if (original) {
          replyTo = {
            message_id: original.id,
            sender_nickname: original.sender_nickname,
            content_preview: (original.content ?? '[Image]').slice(0, 100),
          };
        }
      } catch {
        // Redis unavailable – skip reply context
      }
    }

    const message: StoredMessage = {
      id: uuidv4(),
      room_id: input.roomId,
      sender_trainer_id: input.trainerId,
      sender_nickname: profile.nickname,
      sender_avatar_url: profile.avatarUrl,
      content: input.content ?? null,
      image_url: input.imageUrl ?? null,
      reply_to: replyTo,
      timestamp: new Date().toISOString(),
      edited_at: null,
      deleted: false,
    };

    // Queue for S3 flush + cache in Redis (non-fatal if Redis/S3 unavailable)
    try {
      await this.realtimeService.queuePending(input.roomId, message);
      await this.realtimeService.cacheMessage(input.roomId, message);
    } catch (err) {
      console.warn('[ChatService] Redis unavailable – message not cached:', (err as Error).message);
    }

    // Update room metadata
    const preview = message.content
      ? `${profile.nickname}: ${message.content.slice(0, 150)}`
      : `${profile.nickname} sent an image`;
    await this.roomRepo.update(input.roomId, {
      last_message_at: new Date(),
      last_message_preview: preview.slice(0, 200),
    });

    return message;
  }

  /**
   * Get messages for initial load.
   * Tries Redis cache first, supplements from S3 if needed.
   * Returns empty array if neither service is available.
   */
  async getMessages(roomId: number, limit = 50): Promise<StoredMessage[]> {
    // Try cache
    let cached: StoredMessage[] = [];
    try {
      cached = await this.realtimeService.getRecentMessages(roomId, limit);
      if (cached.length >= limit) {return cached.slice(-limit);}
    } catch {
      // Redis unavailable – fall through to S3
    }

    // Supplement from S3
    try {
      const oldest = cached.length > 0 ? (cached[0] as StoredMessage).timestamp : new Date().toISOString();
      const needed = limit - cached.length;
      const fromS3 = await this.storageService.getMessagesBeforeTimestamp(roomId, oldest, needed);
      return [...fromS3, ...cached];
    } catch {
      // S3 unavailable – return whatever we have from cache
      return cached;
    }
  }

  /**
   * Get older messages for scroll-up pagination.
   */
  async getOlderMessages(roomId: number, beforeTimestamp: string, limit = 50): Promise<StoredMessage[]> {
    try {
      return await this.storageService.getMessagesBeforeTimestamp(roomId, beforeTimestamp, limit);
    } catch {
      // S3 unavailable
      return [];
    }
  }

  // ---------------------------------------------------------------------------
  // Admin
  // ---------------------------------------------------------------------------

  async getAllRooms(): Promise<ChatRoomWithUnread[]> {
    const rooms = await this.roomRepo.findAll();

    // Enrich with member info for admin view
    const enriched: ChatRoomWithUnread[] = [];
    for (const room of rooms) {
      const members = await this.getRoomMembers(room.id);
      enriched.push({
        ...room,
        members,
        unreadCount: 0,
      });
    }
    return enriched;
  }

  async adminCreateRoom(name: string, type: 'group' | 'dm', memberIds: number[]): Promise<ChatRoom> {
    const room = await this.roomRepo.create({ name, type });
    for (const tid of memberIds) {
      await this.memberRepo.create({ chat_room_id: room.id, trainer_id: tid, role: 'member' });
    }
    return room;
  }

  async adminDeleteRoom(roomId: number): Promise<boolean> {
    return this.roomRepo.delete(roomId);
  }

  async sendAdminMessage(input: SendAdminMessageInput): Promise<StoredMessage> {
    if (!input.content) {
      throw new Error('Message must have content');
    }

    const senderName = input.senderName?.trim() || 'Unknown'; // eslint-disable-line @typescript-eslint/prefer-nullish-coalescing -- intentionally treating empty string as absent

    const message: StoredMessage = {
      id: uuidv4(),
      room_id: input.roomId,
      sender_trainer_id: 0,
      sender_nickname: senderName,
      sender_avatar_url: null,
      content: input.content,
      image_url: null,
      reply_to: null,
      timestamp: new Date().toISOString(),
      edited_at: null,
      deleted: false,
    };

    // Queue for S3 flush + cache in Redis
    try {
      await this.realtimeService.queuePending(input.roomId, message);
      await this.realtimeService.cacheMessage(input.roomId, message);
    } catch (err) {
      console.warn('[ChatService] Redis unavailable – admin message not cached:', (err as Error).message);
    }

    // Update room metadata
    const preview = `${senderName}: ${input.content.slice(0, 150)}`;
    await this.roomRepo.update(input.roomId, {
      last_message_at: new Date(),
      last_message_preview: preview.slice(0, 200),
    });

    return message;
  }

  // ---------------------------------------------------------------------------
  // Realtime accessors (delegate for socket handler)
  // ---------------------------------------------------------------------------

  get realtime(): ChatRealtimeService {
    return this.realtimeService;
  }

  get storage(): ChatStorageService {
    return this.storageService;
  }
}
