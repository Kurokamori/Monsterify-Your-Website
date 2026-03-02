/**
 * Adventure end handler — ends an adventure and displays rewards.
 */

import type { ChatInputCommandInteraction } from 'discord.js';
import { adventureEndEmbed } from '../../presenters/adventure.presenter.js';
import { siteUrl } from '../../presenters/base.presenter.js';
import { createLinkButton, createActionRow } from '../../presenters/components/buttons.js';
import * as adventureService from '../../services/adventure.service.js';
import { requireAdventureThread } from './thread-guard.js';

export async function handleEnd(interaction: ChatInputCommandInteraction): Promise<void> {
  const adventure = await requireAdventureThread(interaction);
  if (!adventure) { return; }

  await interaction.deferReply();

  // Retroactive reconciliation — fetch the full thread history and sync
  // participant tallies so missed messages are accounted for.
  if (interaction.channel) {
    try {
      const tally = await adventureService.reconcileThreadMessages(interaction.channel);
      if (tally.length > 0) {
        const { synced } = await adventureService.syncParticipants(adventure.id, tally);
        const totalWords = tally.reduce((sum, p) => sum + p.wordCount, 0);
        console.log(
          `[adventure-end] Synced ${synced} participants (${totalWords} total words) for adventure ${adventure.id}`,
        );
      }
    } catch (err) {
      console.error('[adventure-end] Failed to reconcile thread messages:', err);
      // Continue with end — the real-time tracking data is still usable
    }
  }

  const result = await adventureService.endAdventure({
    adventureId: adventure.id,
    discordUserId: interaction.user.id,
  });

  const embed = adventureEndEmbed(adventure, result);

  const rewardsRow = createActionRow(
    createLinkButton(
      `${siteUrl()}/adventures/rewards`,
      'Claim Rewards',
      '🎁',
    ),
  );

  await interaction.editReply({
    embeds: [embed],
    components: [rewardsRow],
  });

  // Archive the thread after a 30-second delay
  const channel = interaction.channel;
  if (channel && 'setArchived' in channel) {
    const threadChannel = channel as { setArchived: (archived: boolean) => Promise<unknown> };
    setTimeout(async () => {
      try {
        await threadChannel.setArchived(true);
      } catch {
        // Thread may already be archived or bot lacks permissions — ignore
      }
    }, 30_000);
  }
}
