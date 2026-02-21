/**
 * Adventure start handler — direct start + area selection wizard.
 *
 * Direct start:  `/adventure start trainer:X location:area-id`
 * Wizard flow:   `/adventure start` (no location) → landmass → region → area → modal
 * Custom:        Wizard "Custom" option → modal with name + trainer + description
 */

import {
  ActionRowBuilder,
  ButtonStyle,
  ChannelType,
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
import { config } from '../../config/index.js';
import { requireContext } from '../../middleware/index.js';
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

/** Turn a relative path into a full URL; pass through already-absolute URLs. */
function resolveImageUrl(path: string | undefined | null): string | null {
  if (!path) { return null; }
  if (path.startsWith('http://') || path.startsWith('https://')) { return path; }
  return `${siteUrl()}${path.startsWith('/') ? '' : '/'}${path}`;
}

// ============================================================================
// Direct start (both options provided)
// ============================================================================

export async function handleStart(interaction: ChatInputCommandInteraction): Promise<void> {
  const trainerName = interaction.options.getString('trainer');
  const locationId = interaction.options.getString('location');

  // If no location, start the wizard
  if (!locationId) {
    await startWizard(interaction);
    return;
  }

  // Direct start — need auth context
  const ctx = requireContext(interaction);
  await interaction.deferReply({ ephemeral: true });

  // Validate area exists
  const areaConfig = await areaService.getAreaConfiguration(locationId);
  if (!areaConfig) {
    await interaction.editReply({
      embeds: [errorEmbed(`Area \`${locationId}\` not found. Use the wizard (\`/adventure start\` with no location) to browse areas.`)],
    });
    return;
  }

  // Create the adventure
  const title = trainerName
    ? `${trainerName}'s Adventure — ${areaConfig.areaName}`
    : `Adventure — ${areaConfig.areaName}`;

  const adventure = await adventureService.createAdventure(
    {
      title,
      adventureType: 'prebuilt',
      region: areaConfig.regionId,
      area: areaConfig.areaId,
      landmass: areaConfig.landmassId,
    },
    ctx.discordId,
  );

  const thread = await createAdventureThread(interaction, adventure);

  await interaction.editReply({
    embeds: [
      createEmbed(EmbedColor.SUCCESS)
        .setTitle('Adventure Created!')
        .setDescription(`Your adventure has been created in ${thread.toString()}`),
    ],
  });
}

// ============================================================================
// Wizard — Step 1: Landmass selection
// ============================================================================

/** Build the wizard embed + components (shared between slash command and button). */
async function buildWizardPayload(): Promise<{
  embeds: [ReturnType<typeof createEmbed>];
  components: ActionRowBuilder<MessageActionRowComponentBuilder>[];
} | null> {
  const landmasses = await areaService.getLandmasses();

  if (landmasses.length === 0) {
    return null;
  }

  const { menuRow } = buildPaginatedSelect(
    landmasses,
    (lm) => ({
      label: lm.name,
      value: lm.id,
      description: truncateText(lm.climate ?? '', 100),
    }),
    {
      customId: ADVENTURE.START_LANDMASS,
      placeholder: 'Select a landmass...',
    },
  );

  const customButton = createButton(
    ADVENTURE.START_CUSTOM,
    'Custom Adventure',
    ButtonStyle.Secondary,
    { emoji: '✏️' },
  );
  const customRow = createActionRow(customButton);

  const embed = createEmbed(EmbedColor.ADVENTURE)
    .setTitle('🗺️ Start an Adventure')
    .setDescription(
      'Choose a landmass to explore, or create a custom adventure.\n\n' +
      landmasses.map((lm) => {
        const desc = truncateText(lm.description, 120) || '';
        return `**${lm.name}** — ${lm.climate ?? 'Unknown'}${desc ? `\n${desc}` : ''}`;
      }).join('\n\n'),
    );

  const firstImageUrl = resolveImageUrl(landmasses.find((lm) => lm.images?.guide)?.images?.guide);
  if (firstImageUrl) {
    embed.setImage(firstImageUrl);
  }

  return { embeds: [embed], components: [menuRow, customRow] };
}

async function startWizard(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const payload = await buildWizardPayload();
  if (!payload) {
    await interaction.editReply({
      embeds: [errorEmbed('No landmasses are currently available.')],
    });
    return;
  }

  await interaction.editReply(payload);
}

// ============================================================================
// Main menu "Adventure" button → opens the wizard
// ============================================================================

export const adventureMenuButtonHandler: ButtonHandler = {
  customId: ADVENTURE.ENCOUNTER,
  async execute(interaction: ButtonInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const payload = await buildWizardPayload();
    if (!payload) {
      await interaction.editReply({
        embeds: [errorEmbed('No landmasses are currently available.')],
      });
      return;
    }

    await interaction.editReply(payload);
  },
};

// ============================================================================
// Wizard — Step 2: Region selection (landmass select handler)
// ============================================================================

export const landmassSelectHandler: SelectMenuHandler = {
  customId: ADVENTURE.START_LANDMASS,
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
        customId: ADVENTURE.START_REGION,
        placeholder: 'Select a region...',
      },
    );

    const embed = createEmbed(EmbedColor.ADVENTURE)
      .setTitle('🗺️ Select a Region')
      .setDescription(
        'Choose a region to explore.\n\n' +
        regions.map((r) => {
          const desc = truncateText(r.description, 150) || '';
          return `**${r.name}** — ${r.climate ?? 'Unknown'}${desc ? `\n${desc}` : ''}`;
        }).join('\n\n'),
      );

    const regionImageUrl = resolveImageUrl(regions.find((r) => r.images?.guide)?.images?.guide);
    if (regionImageUrl) {
      embed.setImage(regionImageUrl);
    }

    await interaction.editReply({
      embeds: [embed],
      components: [menuRow],
    });
  },
};

// ============================================================================
// Wizard — Step 3: Area selection (region select handler)
//
// Fetches area configurations in parallel so we can show item requirements
// alongside each area's description and difficulty.
// ============================================================================

export const regionSelectHandler: SelectMenuHandler = {
  customId: ADVENTURE.START_REGION,
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

    // Fetch configurations in parallel for item requirements
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
        customId: ADVENTURE.START_AREA,
        placeholder: 'Select an area...',
      },
    );

    const embed = createEmbed(EmbedColor.ADVENTURE)
      .setTitle('🗺️ Select an Area')
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

    // Show area image if available
    const areaImageUrl = resolveImageUrl(areas[0]?.image);
    if (areaImageUrl) {
      embed.setThumbnail(areaImageUrl);
    }

    await interaction.editReply({
      embeds: [embed],
      components: [menuRow],
    });
  },
};

// ============================================================================
// Wizard — Step 4: Modal (area select handler → show modal)
// ============================================================================

export const areaSelectHandler: SelectMenuHandler = {
  customId: ADVENTURE.START_AREA,
  async execute(interaction: StringSelectMenuInteraction) {
    const areaId = interaction.values[0];
    if (!areaId) { return; }

    const modal = new ModalBuilder()
      .setCustomId(`${ADVENTURE.START_MODAL}:${areaId}`)
      .setTitle('Start Adventure');

    const nameInput = new TextInputBuilder()
      .setCustomId('adventure_name')
      .setLabel('Adventure Name')
      .setPlaceholder('My Great Adventure')
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setMaxLength(100);

    const trainerInput = new TextInputBuilder()
      .setCustomId('trainer_name')
      .setLabel('Trainer Name')
      .setPlaceholder('Enter your trainer\'s name')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(100);

    const emojiInput = new TextInputBuilder()
      .setCustomId('thread_emoji')
      .setLabel('Thread Emoji (optional)')
      .setPlaceholder('e.g. ⚔️ or 🌋')
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setMaxLength(10);

    const channelInput = new TextInputBuilder()
      .setCustomId('channel_id')
      .setLabel('Channel ID (Admin — leave blank for default)')
      .setPlaceholder('e.g. 1234567890')
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setMaxLength(25);

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(trainerInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(emojiInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(channelInput),
    );

    await interaction.showModal(modal);
  },
};

// ============================================================================
// Wizard — Step 5: Modal submit (create adventure)
// ============================================================================

export const startModalHandler: ModalHandler = {
  customId: /^adventure_start_modal:/,
  async execute(interaction: ModalSubmitInteraction) {
    const areaId = interaction.customId.split(':')[1];
    if (!areaId) { return; }

    await interaction.deferReply({ ephemeral: true });

    const adventureName = interaction.fields.getTextInputValue('adventure_name').trim();
    const trainerName = interaction.fields.getTextInputValue('trainer_name').trim();
    const threadEmoji = interaction.fields.getTextInputValue('thread_emoji').trim() || undefined;
    const customChannelId = interaction.fields.getTextInputValue('channel_id').trim() || undefined;

    if (!trainerName) {
      await interaction.editReply({
        embeds: [errorEmbed('Trainer name is required.')],
      });
      return;
    }

    const areaConfig = await areaService.getAreaConfiguration(areaId);
    if (!areaConfig) {
      await interaction.editReply({
        embeds: [errorEmbed(`Area \`${areaId}\` configuration not found.`)],
      });
      return;
    }

    const title = adventureName || `${trainerName}'s Adventure — ${areaConfig.areaName}`;

    const adventure = await adventureService.createAdventure(
      {
        title,
        threadEmoji,
        adventureType: 'prebuilt',
        region: areaConfig.regionId,
        area: areaConfig.areaId,
        landmass: areaConfig.landmassId,
      },
      interaction.user.id,
    );

    const thread = await createAdventureThread(interaction, adventure, customChannelId);

    await interaction.editReply({
      embeds: [
        createEmbed(EmbedColor.SUCCESS)
          .setTitle('Adventure Created!')
          .setDescription(`Your adventure has been created in ${thread.toString()}`),
      ],
    });
  },
};

// ============================================================================
// Custom adventure — button handler → show modal
// ============================================================================

export const customButtonHandler: ButtonHandler = {
  customId: ADVENTURE.START_CUSTOM,
  async execute(interaction: ButtonInteraction) {
    const modal = new ModalBuilder()
      .setCustomId(ADVENTURE.START_CUSTOM_MODAL)
      .setTitle('Custom Adventure');

    const nameInput = new TextInputBuilder()
      .setCustomId('adventure_name')
      .setLabel('Adventure Name')
      .setPlaceholder('My Custom Adventure')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(100);

    const trainerInput = new TextInputBuilder()
      .setCustomId('trainer_name')
      .setLabel('Trainer Name')
      .setPlaceholder('Enter your trainer\'s name')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(100);

    const descriptionInput = new TextInputBuilder()
      .setCustomId('description')
      .setLabel('Description (optional)')
      .setPlaceholder('Describe your adventure...')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false)
      .setMaxLength(1000);

    const emojiInput = new TextInputBuilder()
      .setCustomId('thread_emoji')
      .setLabel('Thread Emoji (optional)')
      .setPlaceholder('e.g. ⚔️ or 🌋')
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setMaxLength(10);

    const channelInput = new TextInputBuilder()
      .setCustomId('channel_id')
      .setLabel('Channel ID (Admin — leave blank for default)')
      .setPlaceholder('e.g. 1234567890')
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setMaxLength(25);

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(trainerInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(emojiInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(channelInput),
    );

    await interaction.showModal(modal);
  },
};

// ============================================================================
// Custom adventure — modal submit
// ============================================================================

export const customModalHandler: ModalHandler = {
  customId: ADVENTURE.START_CUSTOM_MODAL,
  async execute(interaction: ModalSubmitInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const adventureName = interaction.fields.getTextInputValue('adventure_name').trim();
    const trainerName = interaction.fields.getTextInputValue('trainer_name').trim();
    const description = interaction.fields.getTextInputValue('description').trim() || undefined;
    const threadEmoji = interaction.fields.getTextInputValue('thread_emoji').trim() || undefined;
    const customChannelId = interaction.fields.getTextInputValue('channel_id').trim() || undefined;

    if (!adventureName) {
      await interaction.editReply({
        embeds: [errorEmbed('Adventure name is required.')],
      });
      return;
    }

    if (!trainerName) {
      await interaction.editReply({
        embeds: [errorEmbed('Trainer name is required.')],
      });
      return;
    }

    const adventure = await adventureService.createAdventure(
      {
        title: adventureName,
        description,
        threadEmoji,
        adventureType: 'custom',
      },
      interaction.user.id,
    );

    const thread = await createAdventureThread(interaction, adventure, customChannelId);

    await interaction.editReply({
      embeds: [
        createEmbed(EmbedColor.SUCCESS)
          .setTitle('Custom Adventure Created!')
          .setDescription(`Your adventure has been created in ${thread.toString()}`),
      ],
    });
  },
};

// ============================================================================
// Thread creation helper
// ============================================================================

async function createAdventureThread(
  interaction: ChatInputCommandInteraction | ModalSubmitInteraction,
  adventure: adventureService.Adventure,
  overrideChannelId?: string,
) {
  const channelId = overrideChannelId
    ?? config.channels.defaultAdventure
    ?? interaction.channelId
    ?? undefined;
  if (!interaction.guildId) {
    throw new Error('Adventures can only be created in a server.');
  }
  if (!channelId) {
    throw new Error('Could not determine a channel for the adventure thread.');
  }

  const channel = await interaction.client.channels.fetch(channelId);
  if (!channel || !channel.isTextBased() || channel.isDMBased()) {
    throw new Error('Could not find a valid text channel for the adventure thread.');
  }

  // Only text channels support thread creation
  if (channel.type !== ChannelType.GuildText) {
    throw new Error('Adventure threads can only be created in text channels.');
  }

  const threadName = adventure.threadEmoji
    ? `${adventure.threadEmoji} ${adventure.title}`
    : `⚔️ ${adventure.title}`;

  const thread = await channel.threads.create({
    name: threadName.slice(0, 100),
    autoArchiveDuration: 10080, // 7 days
    reason: `Adventure: ${adventure.title}`,
  });

  // Register the thread with the backend
  await adventureService.registerThread({
    adventureId: adventure.id,
    discordThreadId: thread.id,
    discordChannelId: channelId,
    threadName: thread.name,
  });

  // Send welcome message
  const welcomeEmbed = adventureWelcomeEmbed(adventure);
  const rewardsButton = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
    createButton(ADVENTURE.STATUS, 'Adventure Status', ButtonStyle.Secondary, { emoji: '📊' }),
  );
  await thread.send({ embeds: [welcomeEmbed], components: [rewardsButton] });

  return thread;
}

// ============================================================================
// Helpers
// ============================================================================

function formatItemRequirements(
  reqs?: { needsMissionMandate?: boolean; itemRequired?: string },
): string {
  if (!reqs) { return ''; }
  const parts: string[] = [];
  if (reqs.needsMissionMandate) {
    parts.push('Mission Mandate');
  }
  if (reqs.itemRequired) {
    parts.push(reqs.itemRequired);
  }
  return parts.join(' + ');
}
