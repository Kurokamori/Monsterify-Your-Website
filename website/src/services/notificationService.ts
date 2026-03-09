import api from './api';

export interface NotificationSummary {
  chatUnread: number;
  pendingDesignApprovals: number;
  unclaimedGiftRewards: number;
  pendingBossRewards: number;
  pendingMissionRewards: number;
}

export interface MissedChatItem {
  trainerId: number;
  trainerName: string;
  roomId: number;
  roomName: string | null;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  senderTrainerName: string | null;
}

export interface DesignApproval {
  id: number;
  submissionId: number;
  submitterUserId: number;
  ownerUserId: number;
  trainerId: number;
  referenceType: string;
  referenceUrl: string;
  rewardLevels: number;
  rewardCoins: number;
  metadata: Record<string, unknown> | null;
  status: string;
  giftRewardsClaimed: boolean;
  createdAt: string;
  reviewedAt: string | null;
  trainerName: string;
  submitterUsername: string | null;
  submitterDisplayName: string | null;
  monsterName: string | null;
}

export interface RewardsSummary {
  totalGiftLevels: number;
  pendingBossRewards: number;
  pendingMissionRewards: number;
  approvalIds: number[];
}

async function getSummary(): Promise<NotificationSummary> {
  const res = await api.get('/notifications/summary');
  return res.data.data;
}

async function getMissedChats(): Promise<MissedChatItem[]> {
  const res = await api.get('/notifications/chats');
  return res.data.data;
}

async function getPendingApprovals(): Promise<DesignApproval[]> {
  const res = await api.get('/notifications/design-approvals');
  return res.data.data;
}

async function acceptApproval(id: number): Promise<void> {
  await api.post(`/notifications/design-approvals/${id}/accept`);
}

async function rejectApproval(id: number): Promise<void> {
  await api.post(`/notifications/design-approvals/${id}/reject`);
}

async function acceptAll(): Promise<void> {
  await api.post('/notifications/design-approvals/accept-all');
}

async function rejectAll(): Promise<void> {
  await api.post('/notifications/design-approvals/reject-all');
}

async function getRewardsSummary(): Promise<RewardsSummary> {
  const res = await api.get('/notifications/rewards/summary');
  return res.data.data;
}

async function claimGiftRewards(): Promise<{ giftLevels: number }> {
  const res = await api.post('/notifications/rewards/gift/claim');
  return res.data.data;
}

async function getUnclaimedBossRewards(): Promise<unknown[]> {
  const res = await api.get('/notifications/rewards/boss');
  return res.data.data;
}

async function getUnclaimedMissions(): Promise<unknown[]> {
  const res = await api.get('/notifications/rewards/missions');
  return res.data.data;
}

const notificationService = {
  getSummary,
  getMissedChats,
  getPendingApprovals,
  acceptApproval,
  rejectApproval,
  acceptAll,
  rejectAll,
  getRewardsSummary,
  claimGiftRewards,
  getUnclaimedBossRewards,
  getUnclaimedMissions,
};

export default notificationService;
