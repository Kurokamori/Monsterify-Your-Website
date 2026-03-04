import type { AnyThreadChannel } from 'discord.js';
import {
  getAdventureByThreadId,
  completeAdventure,
} from '../services/adventure.service.js';

/**
 * Detects when a thread becomes locked via the `threadUpdate` event.
 * Discord.js does not have a dedicated "threadLock" event — this handler
 * compares the old and new thread states.
 */
export async function execute(
  oldThread: AnyThreadChannel,
  newThread: AnyThreadChannel,
): Promise<void> {
  // Only react to the locked transition (unlocked → locked)
  if (oldThread.locked || !newThread.locked) {
    return;
  }

  console.log(`[thread-lock] Thread locked: ${newThread.name} (${newThread.id})`);

  try {
    const adventure = await getAdventureByThreadId(newThread.id);
    if (adventure?.status === 'active') {
      await completeAdventure(adventure.id, 'system');
      console.log(`[thread-lock] Adventure #${adventure.id} completed — thread was locked`);
    }
  } catch (err) {
    // Non-critical: log and move on
    console.error(`[thread-lock] Failed to complete adventure for thread ${newThread.id}:`, err);
  }
}
