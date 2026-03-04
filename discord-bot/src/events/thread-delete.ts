import type { AnyThreadChannel } from 'discord.js';
import { getAdventureByThreadId } from '../services/adventure.service.js';
import { post, type BaseResponse } from '../services/api-client.js';

/**
 * Fires when a thread is deleted.
 * If the thread belonged to an active adventure, cancel it.
 */
export async function execute(thread: AnyThreadChannel): Promise<void> {
  console.log(`[thread-delete] Thread deleted: ${thread.name ?? thread.id}`);

  try {
    const adventure = await getAdventureByThreadId(thread.id);
    if (adventure?.status === 'active') {
      await post<BaseResponse>(`/adventures/${adventure.id}/cancel`, {
        status: 'cancelled',
      });
      console.log(`[thread-delete] Adventure #${adventure.id} cancelled — thread was deleted`);
    }
  } catch (err) {
    // Non-critical: log and move on
    console.error(`[thread-delete] Failed to cancel adventure for thread ${thread.id}:`, err);
  }
}
