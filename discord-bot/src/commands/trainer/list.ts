/**
 * /trainer list [player] — list all trainers for a user.
 *
 * If `player` is provided (Discord @mention), shows that player's trainers.
 * Otherwise shows the calling user's trainers.
 */

import type { ChatInputCommandInteraction } from 'discord.js';
import { getContext } from '../../middleware/index.js';
import { NotFoundError } from '../../middleware/error.middleware.js';
import { getUserByDiscordId } from '../../services/account.service.js';
import { getTrainersByUserId } from '../../services/trainer.service.js';
import { trainerListView } from '../../presenters/trainer.presenter.js';

export async function handleList(interaction: ChatInputCommandInteraction): Promise<void> {
  const mentionedUser = interaction.options.getUser('player');
  const ctx = getContext(interaction);

  let targetDiscordId: string;
  let ownerName: string | undefined;

  if (mentionedUser) {
    // Viewing another player's trainers
    targetDiscordId = mentionedUser.id;
    const targetCtx = await getUserByDiscordId(targetDiscordId);
    if (!targetCtx) {
      throw new NotFoundError('That player doesn\'t have a linked Dusk & Dawn account');
    }
    ownerName = mentionedUser.displayName;
  } else if (ctx) {
    // Viewing own trainers
    targetDiscordId = ctx.discordId;
  } else {
    throw new NotFoundError('Your Discord account is not linked. Please link your account first');
  }

  const trainers = await getTrainersByUserId(targetDiscordId);
  const { embed, components } = trainerListView(trainers, 1, ownerName);

  await interaction.reply({ embeds: [embed], components });
}
