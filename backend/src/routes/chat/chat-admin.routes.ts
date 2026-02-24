import { Router } from 'express';
import { authenticate } from '@middleware/auth.middleware';
import { requireAdmin } from '@middleware/permissions.middleware';
import {
  adminGetAllRooms,
  adminCreateRoom,
  adminDeleteRoom,
  adminAddMember,
  adminRemoveMember,
  adminGetRoomMembers,
  adminGetMessages,
  adminSendMessage,
} from '../../controllers';

const router = Router();

// All admin chat routes require authentication + admin role
router.use(authenticate, requireAdmin);

router.get('/rooms', adminGetAllRooms);
router.post('/rooms', adminCreateRoom);
router.delete('/rooms/:roomId', adminDeleteRoom);
router.get('/rooms/:roomId/members', adminGetRoomMembers);
router.post('/rooms/:roomId/members', adminAddMember);
router.delete('/rooms/:roomId/members/:trainerId', adminRemoveMember);
router.get('/rooms/:roomId/messages', adminGetMessages);
router.post('/rooms/:roomId/messages', adminSendMessage);

export default router;
