import type { AnyThreadChannel } from 'discord.js';

/**
 * Fires when a thread is deleted.
 * If the thread belonged to an adventure, clean-up can happen here.
 */
export async function execute(thread: AnyThreadChannel): Promise<void> {
  console.log(`[thread-delete] Thread deleted: ${thread.name ?? thread.id}`);

  // TODO: Once the adventure service is implemented, mark the adventure as
  // cancelled if this was its active thread:
  //
  //   const adventure = await adventureService.getByThreadId(thread.id);
  //   if (adventure) {
  //     await adventureService.cancel(adventure.id);
  //     console.log(`Adventure #${adventure.id} cancelled — thread was deleted`);
  //   }
}
