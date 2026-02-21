import type { AnyThreadChannel } from 'discord.js';

/**
 * Fires when a thread is created or when the bot gains access to one.
 * Currently logs adventure thread creation; future hooks can be added here.
 */
export function execute(thread: AnyThreadChannel, newlyCreated: boolean): void {
  if (!newlyCreated) {
    return;
  }

  console.log(`[thread-create] Thread created: ${thread.name} (${thread.id})`);

  // TODO: Once the adventure service is implemented, this could auto-join
  // the thread or initialise tracking state.
}
