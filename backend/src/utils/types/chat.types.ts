/**
 * Chat System Types
 * Types for the group chat / DM messaging feature
 */

// ============================================================================
// Chat Profile Types
// ============================================================================

export interface ChatProfileRow {
  id: number;
  trainer_id: number;
  nickname: string;
  status: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ChatProfile {
  id: number;
  trainerId: number;
  nickname: string;
  status: string | null;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatProfileCreateInput {
  trainer_id: number;
  nickname: string;
  status?: string;
  bio?: string;
  avatar_url?: string;
}

export interface ChatProfileUpdateInput {
  nickname?: string;
  status?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
}

// ============================================================================
// Chat Room Types
// ============================================================================

export type ChatRoomType = 'group' | 'dm' | 'faction';

export interface ChatRoomRow {
  id: number;
  name: string | null;
  icon_url: string | null;
  type: ChatRoomType;
  created_by_trainer_id: number | null;
  faction_name: string | null;
  last_message_at: Date | null;
  last_message_preview: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ChatRoom {
  id: number;
  name: string | null;
  iconUrl: string | null;
  type: ChatRoomType;
  createdByTrainerId: number | null;
  factionName: string | null;
  lastMessageAt: Date | null;
  lastMessagePreview: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatRoomWithUnread extends ChatRoom {
  unreadCount: number;
  members: ChatRoomMemberInfo[];
}

export interface ChatRoomMemberInfo {
  trainerId: number;
  nickname: string;
  avatarUrl: string | null;
  role: ChatMemberRole;
}

export interface ChatRoomCreateInput {
  name?: string;
  type: ChatRoomType;
  created_by_trainer_id?: number;
  faction_name?: string;
}

export interface ChatRoomUpdateInput {
  name?: string;
  icon_url?: string | null;
  last_message_at?: Date;
  last_message_preview?: string;
}

// ============================================================================
// Chat Room Member Types
// ============================================================================

export type ChatMemberRole = 'owner' | 'admin' | 'member';

export interface ChatRoomMemberRow {
  id: number;
  chat_room_id: number;
  trainer_id: number;
  role: ChatMemberRole;
  joined_at: Date;
  last_read_at: Date | null;
}

export interface ChatRoomMember {
  id: number;
  chatRoomId: number;
  trainerId: number;
  role: ChatMemberRole;
  joinedAt: Date;
  lastReadAt: Date | null;
}

export interface ChatRoomMemberCreateInput {
  chat_room_id: number;
  trainer_id: number;
  role?: ChatMemberRole;
}

export interface ChatRoomMemberUpdateInput {
  role?: ChatMemberRole;
  last_read_at?: Date;
}

// ============================================================================
// DM Request Types
// ============================================================================

export type DmRequestStatus = 'pending' | 'accepted' | 'declined';

export interface DmRequestRow {
  id: number;
  from_trainer_id: number;
  to_trainer_id: number;
  status: DmRequestStatus;
  message: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface DmRequest {
  id: number;
  fromTrainerId: number;
  toTrainerId: number;
  status: DmRequestStatus;
  message: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DmRequestWithProfiles extends DmRequest {
  fromNickname: string;
  fromAvatarUrl: string | null;
  toNickname: string;
  toAvatarUrl: string | null;
}

export interface DmRequestCreateInput {
  from_trainer_id: number;
  to_trainer_id: number;
  message?: string;
}

// ============================================================================
// S3 Message Types
// ============================================================================

/** Full message format used in Redis cache, Socket.IO, and API responses. */
export interface StoredMessage {
  id: string;
  room_id: number;
  sender_trainer_id: number;
  sender_nickname: string;
  sender_avatar_url: string | null;
  content: string | null;
  image_url: string | null;
  reply_to: {
    message_id: string;
    sender_nickname: string;
    content_preview: string;
  } | null;
  timestamp: string;
  edited_at: string | null;
  deleted: boolean;
}

/**
 * Compact message format stored in S3 (Bucketeer).
 * Uses short keys and omits null/false fields to minimize storage.
 * room_id is omitted because it's implicit in the S3 key path.
 */
export interface CompactMessage {
  i: string;        // id
  s: number;        // sender_trainer_id
  n: string;        // sender_nickname
  a?: string;       // sender_avatar_url (omitted if null)
  c?: string;       // content (omitted if null)
  m?: string;       // image_url (omitted if null)
  r?: {             // reply_to (omitted if null)
    i: string;      //   message_id
    n: string;      //   sender_nickname
    p: string;      //   content_preview
  };
  t: string;        // timestamp
  e?: string;       // edited_at (omitted if null)
  d?: true;         // deleted (omitted if false)
}

export interface RoomIndex {
  room_id: number;
  days: string[]; // Array of 'YYYY/MM/DD' strings, sorted newest first
  total_messages: number;
  last_updated: string;
}

// ============================================================================
// Socket Event Types
// ============================================================================

export interface SocketMessageSend {
  room_id: number;
  trainer_id: number;
  content?: string;
  image_url?: string;
  reply_to_id?: string;
}

export interface SocketTypingEvent {
  room_id: number;
  trainer_id: number;
}

export interface SocketTyperInfo {
  trainer_id: number;
  nickname: string;
}

export interface SocketTypingUpdate {
  room_id: number;
  typers: SocketTyperInfo[];
}

export interface SocketPresenceUpdate {
  room_id: number;
  online: number[];
}

export interface SocketRoomUpdate {
  room_id: number;
  last_message_at: string;
  last_message_preview: string;
}
