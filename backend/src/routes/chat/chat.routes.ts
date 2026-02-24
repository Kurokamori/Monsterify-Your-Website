import { Router } from 'express';
import { authenticate } from '@middleware/auth.middleware';
import { memoryUpload } from '@middleware/upload.middleware';
import {
  getChatProfile,
  updateChatProfile,
  getMyRooms,
  getRoomDetails,
  createGroupChat,
  markRoomRead,
  getMessages,
  getOlderMessages,
  getDmRequests,
  sendDmRequest,
  respondDmRequest,
  updateRoomIcon,
  uploadChatImage,
} from '../../controllers';

const router = Router();

// All chat routes require authentication
router.use(authenticate);

// ============================================================================
// Profiles
// ============================================================================

router.get('/profiles/:trainerId', getChatProfile);
router.patch('/profiles/:trainerId', updateChatProfile);

// ============================================================================
// Rooms
// ============================================================================

router.get('/rooms/trainer/:trainerId', getMyRooms);
router.get('/rooms/:roomId', getRoomDetails);
router.post('/rooms', createGroupChat);
router.post('/rooms/:roomId/read', markRoomRead);
router.patch('/rooms/:roomId/icon', memoryUpload.single('icon'), updateRoomIcon);

// ============================================================================
// Messages
// ============================================================================

router.get('/rooms/:roomId/messages', getMessages);
router.get('/rooms/:roomId/messages/older', getOlderMessages);

// ============================================================================
// DM Requests
// ============================================================================

router.get('/dm-requests/:trainerId', getDmRequests);
router.post('/dm-requests', sendDmRequest);
router.post('/dm-requests/:requestId/respond', respondDmRequest);

// ============================================================================
// Image Upload
// ============================================================================

router.post('/upload', memoryUpload.single('image'), uploadChatImage);

export default router;
