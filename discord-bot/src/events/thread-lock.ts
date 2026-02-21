import type { AnyThreadChannel } from 'discord.js';

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

  // TODO: Once the adventure service is implemented, finalise the adventure
  // when its thread is locked (if it hasn't already been completed):
  //
  //   const adventure = await adventureService.getByThreadId(newThread.id);
  //   if (adventure && adventure.status === 'active') {
  //     await adventureService.complete(adventure.id);
  //     console.log(`Adventure #${adventure.id} completed — thread was locked`);
  //   }
}
