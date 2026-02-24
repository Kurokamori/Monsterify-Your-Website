export interface ChatProfile {
  id: number;
  trainerId: number;
  nickname: string;
  status: string | null;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatRoomMemberInfo {
  trainerId: number;
  nickname: string;
  avatarUrl: string | null;
  role: 'owner' | 'admin' | 'member';
}

export interface ChatRoom {
  id: number;
  name: string | null;
  iconUrl: string | null;
  type: 'group' | 'dm' | 'faction';
  createdByTrainerId: number | null;
  factionName: string | null;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  createdAt: string;
  updatedAt: string;
  unreadCount: number;
  members: ChatRoomMemberInfo[];
}

export interface ChatMessage {
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

export interface DmRequest {
  id: number;
  fromTrainerId: number;
  toTrainerId: number;
  status: 'pending' | 'accepted' | 'declined';
  message: string | null;
  fromNickname: string;
  fromAvatarUrl: string | null;
  toNickname: string;
  toAvatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrainerOption {
  id: number;
  name: string;
  image?: string;
  userId: number;
  isAdmin?: boolean;
}

export interface TypingUser {
  trainer_id: number;
  nickname: string;
}
