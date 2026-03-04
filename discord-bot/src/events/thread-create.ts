import type { AnyThreadChannel } from 'discord.js';
import { getAdventureByThreadId } from '../services/adventure.service.js';

/**
 * Fires when a thread is created or when the bot gains access to one.
 * If the thread belongs to an adventure, the bot auto-joins it.
 */
export async function execute(thread: AnyThreadChannel, newlyCreated: boolean): Promise<void> {
  if (!newlyCreated) {
    return;
  }

  console.log(`[thread-create] Thread created: ${thread.name} (${thread.id})`);

  // Auto-join the thread if it's associated with an adventure
  try {
    const adventure = await getAdventureByThreadId(thread.id);
    if (adventure) {
      if (!thread.joined) {
        await thread.join();
      }
      console.log(`[thread-create] Joined adventure thread: ${thread.name} (Adventure #${adventure.id})`);
    }
  } catch (err) {
    // Non-critical: failing to auto-join shouldn't crash the bot
    console.error(`[thread-create] Failed to process adventure thread ${thread.id}:`, err);
  }
}
