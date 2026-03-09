import { Router } from 'express';
import { authenticate } from '../../middleware';
import {
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
} from '../../controllers/misc/notification.controller';

const router = Router();

router.use(authenticate);

// Summary
router.get('/summary', getSummary);

// Chat tab
router.get('/chats', getMissedChats);

// Design approval tab
router.get('/design-approvals', getPendingApprovals);
router.post('/design-approvals/:id/accept', acceptApproval);
router.post('/design-approvals/:id/reject', rejectApproval);
router.post('/design-approvals/accept-all', acceptAll);
router.post('/design-approvals/reject-all', rejectAll);

// Rewards tab
router.get('/rewards/summary', getRewardsSummary);
router.post('/rewards/gift/claim', claimGiftRewards);
router.get('/rewards/boss', getUnclaimedBossRewards);
router.get('/rewards/missions', getUnclaimedMissions);

export default router;
