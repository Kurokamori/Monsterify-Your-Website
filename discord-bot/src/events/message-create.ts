import type { Message } from 'discord.js';

/**
 * Count words in a string.  Splits on whitespace, ignores empty tokens.
 */
function countWords(text: string): number {
  if (!text) {
    return 0;
  }
  return text.trim().split(/\s+/).length;
}

/**
 * Tracks word counts for messages sent in adventure threads.
 * Called on every `messageCreate` event.
 */
export async function execute(message: Message): Promise<void> {
  // Ignore bots
  if (message.author.bot) {
    return;
  }

  // Only care about thread messages
  if (!message.channel.isThread()) {
    return;
  }

  const wordCount = countWords(message.content);
  if (wordCount === 0) {
    return;
  }

  // TODO: Once the adventure service is implemented, replace the log below
  // with actual API calls:
  //
  //   const adventure = await adventureService.getByThreadId(message.channel.id);
  //   if (!adventure || adventure.status === 'completed') return;
  //   await adventureService.trackMessage({
  //     discordThreadId: message.channel.id,
  //     discordUserId:   message.author.id,
  //     wordCount,
  //     messageCount:    1,
  //   });

  console.log(
    `[word-count] ${message.author.username} in thread ${message.channel.name}: ${wordCount} words`,
  );
}
