import api from './api';
import type {
  ChatProfile,
  ChatRoom,
  ChatRoomMemberInfo,
  ChatMessage,
  DmRequest,
} from '../pages/toys/group-chats/types';

// ============================================================================
// Profiles
// ============================================================================

async function getProfile(trainerId: number): Promise<ChatProfile> {
  const res = await api.get(`/chats/profiles/${trainerId}`);
  return res.data.data;
}

async function updateProfile(
  trainerId: number,
  data: { nickname?: string; status?: string | null; bio?: string | null; avatar_url?: string | null },
): Promise<ChatProfile> {
  const res = await api.patch(`/chats/profiles/${trainerId}`, data);
  return res.data.data;
}

// ============================================================================
// Rooms
// ============================================================================

async function getTotalUnread(): Promise<number> {
  const res = await api.get('/chats/total-unread');
  return res.data.data.totalUnread;
}

async function getUnreadCounts(trainerIds: number[]): Promise<Record<number, number>> {
  const res = await api.get('/chats/unread-counts', { params: { trainerIds: trainerIds.join(',') } });
  return res.data.data;
}

async function getRooms(trainerId: number): Promise<ChatRoom[]> {
  const res = await api.get(`/chats/rooms/trainer/${trainerId}`);
  return res.data.data;
}

async function getRoomDetails(roomId: number): Promise<ChatRoom> {
  const res = await api.get(`/chats/rooms/${roomId}`);
  return res.data.data;
}

async function createGroupChat(data: {
  name: string;
  creatorTrainerId: number;
  memberTrainerIds: number[];
}): Promise<ChatRoom> {
  const res = await api.post('/chats/rooms', data);
  return res.data.data;
}

async function markRead(roomId: number, trainerId: number): Promise<void> {
  await api.post(`/chats/rooms/${roomId}/read`, { trainerId });
}

// ============================================================================
// Messages
// ============================================================================

async function getMessages(roomId: number, limit = 50): Promise<ChatMessage[]> {
  const res = await api.get(`/chats/rooms/${roomId}/messages`, { params: { limit } });
  return res.data.data;
}

async function getOlderMessages(roomId: number, before: string, limit = 50): Promise<ChatMessage[]> {
  const res = await api.get(`/chats/rooms/${roomId}/messages/older`, { params: { before, limit } });
  return res.data.data;
}

// ============================================================================
// DM Requests
// ============================================================================

async function getDmRequests(trainerId: number): Promise<DmRequest[]> {
  const res = await api.get(`/chats/dm-requests/${trainerId}`);
  return res.data.data;
}

async function sendDmRequest(data: {
  fromTrainerId: number;
  toTrainerId: number;
  message?: string;
}): Promise<DmRequest> {
  const res = await api.post('/chats/dm-requests', data);
  return res.data.data;
}

async function respondDmRequest(
  requestId: number,
  trainerId: number,
  action: 'accept' | 'decline',
): Promise<DmRequest> {
  const res = await api.post(`/chats/dm-requests/${requestId}/respond`, { trainerId, action });
  return res.data.data;
}

// ============================================================================
// Image Upload
// ============================================================================

async function uploadChatImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);
  const res = await api.post('/chats/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data.url;
}

// ============================================================================
// Room Icon
// ============================================================================

async function updateRoomIcon(roomId: number, file: File): Promise<ChatRoom> {
  const formData = new FormData();
  formData.append('icon', file);
  const res = await api.patch(`/chats/rooms/${roomId}/icon`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
}

// ============================================================================
// Admin
// ============================================================================

async function adminGetAllRooms(): Promise<ChatRoom[]> {
  const res = await api.get('/admin/chats/rooms');
  return res.data.data;
}

async function adminGetRoomMembers(roomId: number): Promise<ChatRoomMemberInfo[]> {
  const res = await api.get(`/admin/chats/rooms/${roomId}/members`);
  return res.data.data;
}

async function adminGetMessages(roomId: number, limit = 50): Promise<ChatMessage[]> {
  const res = await api.get(`/admin/chats/rooms/${roomId}/messages`, { params: { limit } });
  return res.data.data;
}

async function adminCreateRoom(data: { name: string; type: string; memberIds: number[] }): Promise<ChatRoom> {
  const res = await api.post('/admin/chats/rooms', data);
  return res.data.data;
}

async function adminDeleteRoom(roomId: number): Promise<void> {
  await api.delete(`/admin/chats/rooms/${roomId}`);
}

async function adminAddMember(roomId: number, trainerId: number, role = 'member'): Promise<void> {
  await api.post(`/admin/chats/rooms/${roomId}/members`, { trainerId, role });
}

async function adminRemoveMember(roomId: number, trainerId: number): Promise<void> {
  await api.delete(`/admin/chats/rooms/${roomId}/members/${trainerId}`);
}

async function adminSendMessage(roomId: number, content: string, senderName?: string): Promise<ChatMessage> {
  const res = await api.post(`/admin/chats/rooms/${roomId}/messages`, { content, senderName });
  return res.data.data;
}

// ============================================================================
// Export
// ============================================================================

const chatService = {
  getProfile,
  updateProfile,
  getTotalUnread,
  getUnreadCounts,
  getRooms,
  getRoomDetails,
  createGroupChat,
  markRead,
  getMessages,
  getOlderMessages,
  getDmRequests,
  sendDmRequest,
  respondDmRequest,
  uploadChatImage,
  updateRoomIcon,
  adminGetAllRooms,
  adminGetRoomMembers,
  adminGetMessages,
  adminCreateRoom,
  adminDeleteRoom,
  adminAddMember,
  adminRemoveMember,
  adminSendMessage,
};

export default chatService;
