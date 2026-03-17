/**
 * Adventure "here" handler — start a silent adventure in the current thread.
 *
 * Silent adventures use the same tracking and reward system but do not appear
 * on the website.  The user creates their own thread and runs `/adventure here`
 * to attach an adventure to it.
 *
 * Two modes:
 *   Custom   — No further questions; adventure starts immediately.
 *   Pre-built — Landmass → Region → Area → Trainer modal, same as normal start.
 */

import {
  ActionRowBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  type ButtonInteraction,
  type ChatInputCommandInteraction,
  type MessageActionRowComponentBuilder,
  type ModalSubmitInteraction,
  type StringSelectMenuInteraction,
} from 'discord.js';
import { ADVENTURE } from '../../constants/button-ids.js';
import { EmbedColor } from '../../constants/colors.js';
import { createEmbed, errorEmbed, truncateText, siteUrl } from '../../presenters/base.presenter.js';
import { createButton, createActionRow } from '../../presenters/components/buttons.js';
import { buildPaginatedSelect } from '../../presenters/components/select-menus.js';
import { adventureWelcomeEmbed } from '../../presenters/adventure.presenter.js';
import * as adventureService from '../../services/adventure.service.js';
import * as areaService from '../../services/area.service.js';
import type { AreaConfiguration } from '../../services/area.service.js';
import type { ButtonHandler, SelectMenuHandler, ModalHandler } from '../../types/command.types.js';

// ============================================================================
// Helpers
// ============================================================================

function resolveImageUrl(path: string | undefined | null): string | null {
  if (!path) { return null; }
  if (path.startsWith('http://') || path.startsWith('https://')) { return path; }
  return `${siteUrl()}${path.startsWith('/') ? '' : '/'}${path}`;
}

function formatItemRequirements(
  reqs?: { needsMissionMandate?: boolean; itemRequired?: string },
): string {
  if (!reqs) { return ''; }
  const parts: string[] = [];
  if (reqs.needsMissionMandate) { parts.push('Mission Mandate'); }
  if (reqs.itemRequired) { parts.push(reqs.itemRequired); }
  return parts.join(' + ');
}

// ============================================================================
// Entry point: /adventure here
// ============================================================================

export async function handleHere(interaction: ChatInputCommandInteraction): Promise<void> {
  const channel = interaction.channel;

  if (!channel?.isThread()) {
    await interaction.reply({
      embeds: [errorEmbed('This command must be used inside a thread you created.')],
      ephemeral: true,
    });
    return;
  }

  // Check the thread isn't already an adventure
  const existing = await adventureService.getAdventureByThreadId(channel.id);
  if (existing) {
    await interaction.reply({
      embeds: [errorEmbed('This thread is already linked to an adventure.')],
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  const embed = createEmbed(EmbedColor.ADVENTURE)
    .setTitle('🔇 Start a Silent Adventure')
    .setDescription(
      'This adventure will use this thread and **will not appear on the website**.\n\n'
      + '**Custom** — Start immediately with no location requirements.\n'
      + '**Pre-built** — Choose a location (continent → region → area) with the normal flow.',
    );

  const customButton = createButton(
    ADVENTURE.HERE_CUSTOM,
    'Custom',
    ButtonStyle.Secondary,
    { emoji: '✏️' },
  );
  const prebuiltButton = createButton(
    ADVENTURE.HERE_PREBUILT,
    'Pre-built',
    ButtonStyle.Primary,
    { emoji: '🗺️' },
  );
  const row = createActionRow(customButton, prebuiltButton);

  await interaction.editReply({ embeds: [embed], components: [row] });
}

// ============================================================================
// Custom silent adventure — button handler
// ============================================================================

export const hereCustomButtonHandler: ButtonHandler = {
  customId: ADVENTURE.HERE_CUSTOM,
  async execute(interaction: ButtonInteraction) {
    const channel = interaction.channel;
    if (!channel?.isThread()) {
      await interaction.reply({ embeds: [errorEmbed('Must be used in a thread.')], ephemeral: true });
      return;
    }

    await interaction.deferUpdate();

    const threadName = channel.name;
    const title = threadName || 'Silent Adventure';

    const adventure = await adventureService.createAdventure(
      {
        title,
        adventureType: 'custom',
        isSilent: true,
      },
      interaction.user.id,
    );

    // Register this thread with the adventure
    await adventureService.registerThread({
      adventureId: adventure.id,
      discordThreadId: channel.id,
      discordChannelId: channel.parentId ?? channel.id,
      threadName: channel.name,
    });

    // Send welcome message in thread
    const welcomeEmbed = adventureWelcomeEmbed(adventure);
    const statusButton = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      createButton(ADVENTURE.STATUS, 'Adventure Status', ButtonStyle.Secondary, { emoji: '📊' }),
    );
    await channel.send({ embeds: [welcomeEmbed], components: [statusButton] });

    await interaction.editReply({
      embeds: [
        createEmbed(EmbedColor.SUCCESS)
          .setTitle('🔇 Silent Adventure Started!')
          .setDescription('Your custom silent adventure is now active in this thread.'),
      ],
      components: [],
    });
  },
};

// ============================================================================
// Pre-built silent adventure — button handler → landmass select
// ============================================================================

export const herePrebuiltButtonHandler: ButtonHandler = {
  customId: ADVENTURE.HERE_PREBUILT,
  async execute(interaction: ButtonInteraction) {
    await interaction.deferUpdate();

    const landmasses = await areaService.getLandmasses();
    if (landmasses.length === 0) {
      await interaction.editReply({
        embeds: [errorEmbed('No landmasses are currently available.')],
        components: [],
      });
      return;
    }

    const { menuRow } = buildPaginatedSelect(
      landmasses,
      (lm) => ({
        label: lm.name,
        value: lm.id,
        description: truncateText(lm.climate ?? '', 100),
      }),
      {
        customId: ADVENTURE.HERE_LANDMASS,
        placeholder: 'Select a landmass...',
      },
    );

    const embed = createEmbed(EmbedColor.ADVENTURE)
      .setTitle('🗺️ Silent Adventure — Choose Landmass')
      .setDescription(
        landmasses.map((lm) => {
          const desc = truncateText(lm.description, 120) || '';
          return `**${lm.name}** — ${lm.climate ?? 'Unknown'}${desc ? `\n${desc}` : ''}`;
        }).join('\n\n'),
      );

    const firstImageUrl = resolveImageUrl(landmasses.find((lm) => lm.images?.guide)?.images?.guide);
    if (firstImageUrl) { embed.setImage(firstImageUrl); }

    await interaction.editReply({ embeds: [embed], components: [menuRow] });
  },
};

// ============================================================================
// Step 2: Region selection
// ============================================================================

export const hereLandmassSelectHandler: SelectMenuHandler = {
  customId: ADVENTURE.HERE_LANDMASS,
  async execute(interaction: StringSelectMenuInteraction) {
    const landmassId = interaction.values[0];
    if (!landmassId) { return; }

    await interaction.deferUpdate();

    const regions = await areaService.getRegionsForLandmass(landmassId);
    if (regions.length === 0) {
      await interaction.editReply({
        embeds: [errorEmbed('No regions found for this landmass.')],
        components: [],
      });
      return;
    }

    const { menuRow } = buildPaginatedSelect(
      regions,
      (region) => ({
        label: region.name,
        value: `${landmassId}:${region.id}`,
        description: truncateText(region.climate ?? '', 100),
      }),
      {
        customId: ADVENTURE.HERE_REGION,
        placeholder: 'Select a region...',
      },
    );

    const embed = createEmbed(EmbedColor.ADVENTURE)
      .setTitle('🗺️ Silent Adventure — Choose Region')
      .setDescription(
        regions.map((r) => {
          const desc = truncateText(r.description, 150) || '';
          return `**${r.name}** — ${r.climate ?? 'Unknown'}${desc ? `\n${desc}` : ''}`;
        }).join('\n\n'),
      );

    const regionImageUrl = resolveImageUrl(regions.find((r) => r.images?.guide)?.images?.guide);
    if (regionImageUrl) { embed.setImage(regionImageUrl); }

    await interaction.editReply({ embeds: [embed], components: [menuRow] });
  },
};

// ============================================================================
// Step 3: Area selection
// ============================================================================

export const hereRegionSelectHandler: SelectMenuHandler = {
  customId: ADVENTURE.HERE_REGION,
  async execute(interaction: StringSelectMenuInteraction) {
    const value = interaction.values[0];
    if (!value) { return; }

    const [landmassId, regionId] = value.split(':');
    if (!landmassId || !regionId) { return; }

    await interaction.deferUpdate();

    const areas = await areaService.getAreasForRegion(regionId);
    if (areas.length === 0) {
      await interaction.editReply({
        embeds: [errorEmbed('No areas found for this region.')],
        components: [],
      });
      return;
    }

    const configs = await Promise.all(
      areas.map((a) => areaService.getAreaConfiguration(a.id)),
    );
    const configMap = new Map<string, AreaConfiguration>();
    for (const cfg of configs) {
      if (cfg) { configMap.set(cfg.areaId, cfg); }
    }

    const { menuRow } = buildPaginatedSelect(
      areas,
      (area) => {
        const cfg = configMap.get(area.id);
        const reqs = formatItemRequirements(cfg?.itemRequirements);
        return {
          label: area.name,
          value: area.id,
          description: truncateText(
            [
              area.difficulty ? `[${area.difficulty}]` : null,
              reqs || null,
              area.description,
            ].filter(Boolean).join(' — '),
            100,
          ),
        };
      },
      {
        customId: ADVENTURE.HERE_AREA,
        placeholder: 'Select an area...',
      },
    );

    const embed = createEmbed(EmbedColor.ADVENTURE)
      .setTitle('🗺️ Silent Adventure — Choose Area')
      .setDescription(
        areas.map((a) => {
          const cfg = configMap.get(a.id);
          const reqs = formatItemRequirements(cfg?.itemRequirements);
          const diff = a.difficulty ? ` [${a.difficulty}]` : '';
          const reqLine = reqs ? `\n  Requires: **${reqs}**` : '';
          const desc = a.description ? `\n  ${truncateText(a.description, 150)}` : '';
          return `**${a.name}**${diff}${reqLine}${desc}`;
        }).join('\n\n'),
      );

    const areaImageUrl = resolveImageUrl(areas[0]?.image);
    if (areaImageUrl) { embed.setThumbnail(areaImageUrl); }

    await interaction.editReply({ embeds: [embed], components: [menuRow] });
  },
};

// ============================================================================
// Step 4: Area selected → show modal for trainer name
// ============================================================================

export const hereAreaSelectHandler: SelectMenuHandler = {
  customId: ADVENTURE.HERE_AREA,
  async execute(interaction: StringSelectMenuInteraction) {
    const areaId = interaction.values[0];
    if (!areaId) { return; }

    const modal = new ModalBuilder()
      .setCustomId(`${ADVENTURE.HERE_MODAL}:${areaId}`)
      .setTitle('Silent Adventure — Trainer');

    const trainerInput = new TextInputBuilder()
      .setCustomId('trainer_name')
      .setLabel('Trainer Name')
      .setPlaceholder('Enter your trainer\'s name')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(100);

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(trainerInput),
    );

    await interaction.showModal(modal);
  },
};

// ============================================================================
// Step 5: Modal submit — create adventure + register thread
// ============================================================================

export const hereModalHandler: ModalHandler = {
  customId: /^adventure_here_modal:/,
  async execute(interaction: ModalSubmitInteraction) {
    const areaId = interaction.customId.split(':')[1];
    if (!areaId) { return; }

    const channel = interaction.channel;
    if (!channel?.isThread()) {
      await interaction.reply({ embeds: [errorEmbed('Must be used in a thread.')], ephemeral: true });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const trainerName = interaction.fields.getTextInputValue('trainer_name').trim();
    if (!trainerName) {
      await interaction.editReply({ embeds: [errorEmbed('Trainer name is required.')] });
      return;
    }

    const areaConfig = await areaService.getAreaConfiguration(areaId);
    if (!areaConfig) {
      await interaction.editReply({ embeds: [errorEmbed(`Area \`${areaId}\` configuration not found.`)] });
      return;
    }

    const title = `${trainerName}'s Adventure — ${areaConfig.areaName}`;

    const adventure = await adventureService.createAdventure(
      {
        title,
        adventureType: 'prebuilt',
        isSilent: true,
        region: areaConfig.regionId,
        area: areaConfig.areaId,
        landmass: areaConfig.landmassId,
      },
      interaction.user.id,
    );

    // Register the existing thread
    await adventureService.registerThread({
      adventureId: adventure.id,
      discordThreadId: channel.id,
      discordChannelId: channel.parentId ?? channel.id,
      threadName: channel.name,
    });

    // Send welcome message
    const welcomeEmbed = adventureWelcomeEmbed(adventure);
    const statusButton = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      createButton(ADVENTURE.STATUS, 'Adventure Status', ButtonStyle.Secondary, { emoji: '📊' }),
    );
    await channel.send({ embeds: [welcomeEmbed], components: [statusButton] });

    await interaction.editReply({
      embeds: [
        createEmbed(EmbedColor.SUCCESS)
          .setTitle('🔇 Silent Adventure Started!')
          .setDescription(`Your pre-built silent adventure in **${areaConfig.areaName}** is now active.`),
      ],
    });
  },
};
