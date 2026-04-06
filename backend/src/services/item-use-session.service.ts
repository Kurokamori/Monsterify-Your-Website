import { ItemUseSessionRepository } from '../repositories';
import type { ItemUseSessionType, ItemUseSession } from '../repositories';

const repo = new ItemUseSessionRepository();

export class ItemUseSessionService {
  async getSession(userId: string, sessionType: ItemUseSessionType): Promise<ItemUseSession | null> {
    return repo.findByUserAndType(userId, sessionType);
  }

  async saveSession(userId: string, sessionType: ItemUseSessionType, sessionData: Record<string, unknown>): Promise<ItemUseSession> {
    return repo.upsert(userId, sessionType, sessionData);
  }

  async deleteSession(userId: string, sessionType: ItemUseSessionType): Promise<boolean> {
    return repo.delete(userId, sessionType);
  }
}
