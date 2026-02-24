import { Request, Response } from 'express';
import { ChatService } from '../../services/chat.service.js';

const chatService = new ChatService();

export async function adminGetAllRooms(_req: Request, res: Response): Promise<void> {
  try {
    const rooms = await chatService.getAllRooms();
    res.json({ success: true, data: rooms });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get rooms';
    res.status(500).json({ success: false, error: message });
  }
}

export async function adminCreateRoom(req: Request, res: Response): Promise<void> {
  try {
    const { name, type, memberIds } = req.body;
    if (!type || !Array.isArray(memberIds)) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }
    const room = await chatService.adminCreateRoom(name, type, memberIds);
    res.json({ success: true, data: room });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create room';
    res.status(400).json({ success: false, error: message });
  }
}

export async function adminDeleteRoom(req: Request, res: Response): Promise<void> {
  try {
    const roomId = Number(req.params.roomId);
    const deleted = await chatService.adminDeleteRoom(roomId);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Room not found' });
      return;
    }
    res.json({ success: true, message: 'Room deleted' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete room';
    res.status(500).json({ success: false, error: message });
  }
}

export async function adminAddMember(req: Request, res: Response): Promise<void> {
  try {
    const roomId = Number(req.params.roomId);
    const { trainerId, role } = req.body;
    await chatService.addMember(roomId, trainerId, role);
    res.json({ success: true, message: 'Member added' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add member';
    res.status(400).json({ success: false, error: message });
  }
}

export async function adminRemoveMember(req: Request, res: Response): Promise<void> {
  try {
    const roomId = Number(req.params.roomId);
    const trainerId = Number(req.params.trainerId);
    const removed = await chatService.removeMember(roomId, trainerId, true);
    if (!removed) {
      res.status(404).json({ success: false, error: 'Member not found in room' });
      return;
    }
    res.json({ success: true, message: 'Member removed' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to remove member';
    res.status(500).json({ success: false, error: message });
  }
}

export async function adminGetRoomMembers(req: Request, res: Response): Promise<void> {
  try {
    const roomId = Number(req.params.roomId);
    const members = await chatService.getRoomMembers(roomId);
    res.json({ success: true, data: members });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get room members';
    res.status(500).json({ success: false, error: message });
  }
}

export async function adminGetMessages(req: Request, res: Response): Promise<void> {
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

export async function adminSendMessage(req: Request, res: Response): Promise<void> {
  try {
    const roomId = Number(req.params.roomId);
    const { content, senderName } = req.body;
    if (!content) {
      res.status(400).json({ success: false, error: 'Message content is required' });
      return;
    }
    const msg = await chatService.sendAdminMessage({ roomId, content, senderName });

    // Broadcast via Socket.IO
    try {
      const { io } = await import('../../socket/chat.socket.js');
      if (io) {
        io.to(`room:${roomId}`).emit('message:new', msg);
        io.emit('room:updated', {
          room_id: roomId,
          last_message_at: msg.timestamp,
          last_message_preview: `${msg.sender_nickname}: ${(msg.content ?? '').slice(0, 150)}`,
        });
      }
    } catch {
      // Socket.IO not initialized – skip broadcast
    }

    res.json({ success: true, data: msg });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send admin message';
    res.status(400).json({ success: false, error: message });
  }
}
