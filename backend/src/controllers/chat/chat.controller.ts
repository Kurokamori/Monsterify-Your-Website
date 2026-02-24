import { Request, Response } from 'express';
import { ChatService } from '../../services/chat.service.js';
import cloudinary from '../../utils/cloudinary.js';

const chatService = new ChatService();

// ============================================================================
// Profiles
// ============================================================================

export async function getChatProfile(req: Request, res: Response): Promise<void> {
  try {
    const trainerId = Number(req.params.trainerId);
    const profile = await chatService.getOrCreateProfile(trainerId);
    res.json({ success: true, data: profile });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get profile';
    res.status(500).json({ success: false, error: message });
  }
}

export async function updateChatProfile(req: Request, res: Response): Promise<void> {
  try {
    const trainerId = Number(req.params.trainerId);
    const { nickname, status, bio, avatar_url } = req.body;
    const profile = await chatService.updateProfile(trainerId, { nickname, status, bio, avatar_url });
    res.json({ success: true, data: profile });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update profile';
    res.status(400).json({ success: false, error: message });
  }
}

// ============================================================================
// Rooms
// ============================================================================

export async function getMyRooms(req: Request, res: Response): Promise<void> {
  try {
    const trainerId = Number(req.params.trainerId);
    const rooms = await chatService.getRoomsForTrainer(trainerId);
    res.json({ success: true, data: rooms });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get rooms';
    res.status(500).json({ success: false, error: message });
  }
}

export async function getRoomDetails(req: Request, res: Response): Promise<void> {
  try {
    const roomId = Number(req.params.roomId);
    const room = await chatService.getRoomById(roomId);
    if (!room) {
      res.status(404).json({ success: false, error: 'Room not found' });
      return;
    }
    const members = await chatService.getRoomMembers(roomId);
    res.json({ success: true, data: { ...room, members } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get room';
    res.status(500).json({ success: false, error: message });
  }
}

export async function createGroupChat(req: Request, res: Response): Promise<void> {
  try {
    const { name, creatorTrainerId, memberTrainerIds } = req.body;
    if (!name || !creatorTrainerId || !Array.isArray(memberTrainerIds)) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }
    const room = await chatService.createGroupChat({
      name,
      creatorTrainerId,
      memberTrainerIds,
    });
    res.json({ success: true, data: room });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create group';
    res.status(400).json({ success: false, error: message });
  }
}

export async function markRoomRead(req: Request, res: Response): Promise<void> {
  try {
    const roomId = Number(req.params.roomId);
    const trainerId = Number(req.body.trainerId);
    await chatService.markRead(roomId, trainerId);
    res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to mark read';
    res.status(500).json({ success: false, error: message });
  }
}

// ============================================================================
// Messages
// ============================================================================

export async function getMessages(req: Request, res: Response): Promise<void> {
  try {
    const roomId = Number(req.params.roomId);
    const limit = Number(req.query.limit) || 50;
    const messages = await chatService.getMessages(roomId, limit);
    res.json({ success: true, data: messages });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get messages';
    res.status(500).json({ success: false, error: message });
  }
}

export async function getOlderMessages(req: Request, res: Response): Promise<void> {
  try {
    const roomId = Number(req.params.roomId);
    const before = req.query.before as string;
    const limit = Number(req.query.limit) || 50;

    if (!before) {
      res.status(400).json({ success: false, error: 'Missing "before" timestamp' });
      return;
    }

    const messages = await chatService.getOlderMessages(roomId, before, limit);
    res.json({ success: true, data: messages });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get messages';
    res.status(500).json({ success: false, error: message });
  }
}

// ============================================================================
// DM Requests
// ============================================================================

export async function getDmRequests(req: Request, res: Response): Promise<void> {
  try {
    const trainerId = Number(req.params.trainerId);
    const requests = await chatService.getDmRequestsForTrainer(trainerId);
    res.json({ success: true, data: requests });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get DM requests';
    res.status(500).json({ success: false, error: message });
  }
}

export async function sendDmRequest(req: Request, res: Response): Promise<void> {
  try {
    const { fromTrainerId, toTrainerId, message } = req.body;
    const request = await chatService.sendDmRequest(fromTrainerId, toTrainerId, message);
    res.json({ success: true, data: request });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send DM request';
    res.status(400).json({ success: false, error: message });
  }
}

export async function respondDmRequest(req: Request, res: Response): Promise<void> {
  try {
    const requestId = Number(req.params.requestId);
    const { trainerId, action } = req.body;

    if (action === 'accept') {
      const result = await chatService.acceptDmRequest(requestId, trainerId);
      res.json({ success: true, data: result });
    } else if (action === 'decline') {
      const result = await chatService.declineDmRequest(requestId, trainerId);
      res.json({ success: true, data: result });
    } else {
      res.status(400).json({ success: false, error: 'Invalid action. Use "accept" or "decline".' });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to respond to DM request';
    res.status(400).json({ success: false, error: message });
  }
}

// ============================================================================
// Room Icon
// ============================================================================

export async function updateRoomIcon(req: Request, res: Response): Promise<void> {
  try {
    const roomId = Number(req.params.roomId);
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, error: 'No file provided' });
      return;
    }

    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'chat-icons',
          resource_type: 'image',
          transformation: [{ width: 256, height: 256, crop: 'fill', quality: 'auto' }],
        },
        (error, uploadResult) => {
          if (error) {reject(error);}
          else {resolve(uploadResult as { secure_url: string });}
        },
      );
      stream.end(file.buffer);
    });

    const room = await chatService.updateRoomIcon(roomId, result.secure_url);
    res.json({ success: true, data: room });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update room icon';
    res.status(500).json({ success: false, error: message });
  }
}

// ============================================================================
// Image Upload
// ============================================================================

export async function uploadChatImage(req: Request, res: Response): Promise<void> {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, error: 'No file provided' });
      return;
    }

    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'chat-images',
          resource_type: 'image',
          transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
        },
        (error, result) => {
          if (error) {reject(error);}
          else {resolve(result as { secure_url: string });}
        },
      );
      stream.end(file.buffer);
    });

    res.json({ success: true, data: { url: result.secure_url } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to upload image';
    res.status(500).json({ success: false, error: message });
  }
}
