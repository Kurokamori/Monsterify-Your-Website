import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type MessageActionRowComponentBuilder,
} from 'discord.js';

// ============================================================================
// Button factory helpers
// ============================================================================

/** Create a standard interactive button. */
export function createButton(
  customId: string,
  label: string,
  style: ButtonStyle = ButtonStyle.Primary,
  options?: { emoji?: string; disabled?: boolean },
): ButtonBuilder {
  const button = new ButtonBuilder()
    .setCustomId(customId)
    .setLabel(label)
    .setStyle(style)
    .setDisabled(options?.disabled ?? false);

  if (options?.emoji) {
    button.setEmoji(options.emoji);
  }

  return button;
}

/** Create a link button (opens a URL, no custom ID). */
export function createLinkButton(
  url: string,
  label: string,
  emoji?: string,
): ButtonBuilder {
  const button = new ButtonBuilder()
    .setURL(url)
    .setLabel(label)
    .setStyle(ButtonStyle.Link);

  if (emoji) {
    button.setEmoji(emoji);
  }

  return button;
}

/** Wrap one or more components into a single action row. */
export function createActionRow(
  ...components: MessageActionRowComponentBuilder[]
): ActionRowBuilder<MessageActionRowComponentBuilder> {
  return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
    ...components,
  );
}

// ============================================================================
// Common button presets
// ============================================================================

export const CommonButtons = {
  // Navigation
  back: (disabled = false) =>
    createButton('back', 'Back', ButtonStyle.Secondary, {
      emoji: '⬅️',
      disabled,
    }),

  home: (disabled = false) =>
    createButton('home', 'Home', ButtonStyle.Secondary, {
      emoji: '🏠',
      disabled,
    }),

  refresh: (disabled = false) =>
    createButton('refresh', 'Refresh', ButtonStyle.Secondary, {
      emoji: '🔄',
      disabled,
    }),

  // Confirmation
  confirm: (disabled = false) =>
    createButton('confirm', 'Confirm', ButtonStyle.Success, {
      emoji: '✅',
      disabled,
    }),

  cancel: (disabled = false) =>
    createButton('cancel', 'Cancel', ButtonStyle.Danger, {
      emoji: '❌',
      disabled,
    }),

  // Context-specific
  viewTrainer: (disabled = false) =>
    createButton('view_trainer', 'View Trainer', ButtonStyle.Primary, {
      emoji: '👤',
      disabled,
    }),

  trainerInventory: (disabled = false) =>
    createButton('trainer_inventory', 'Inventory', ButtonStyle.Secondary, {
      emoji: '🎒',
      disabled,
    }),

  trainerMonsters: (disabled = false) =>
    createButton('trainer_monsters', 'Monsters', ButtonStyle.Secondary, {
      emoji: '👾',
      disabled,
    }),

  viewMonster: (disabled = false) =>
    createButton('view_monster', 'View Monster', ButtonStyle.Primary, {
      emoji: '👾',
      disabled,
    }),

  renameMonster: (disabled = false) =>
    createButton('rename_monster', 'Rename', ButtonStyle.Secondary, {
      emoji: '✏️',
      disabled,
    }),

  townMenu: (disabled = false) =>
    createButton('town_menu', 'Town Menu', ButtonStyle.Primary, {
      emoji: '🏘️',
      disabled,
    }),

  shopMenu: (disabled = false) =>
    createButton('shop_menu', 'Shop Menu', ButtonStyle.Primary, {
      emoji: '🛒',
      disabled,
    }),

  buyItem: (disabled = false) =>
    createButton('shop_buy', 'Buy', ButtonStyle.Success, {
      emoji: '💰',
      disabled,
    }),
} as const;

// ============================================================================
// Confirm / Cancel row (common pattern)
// ============================================================================

/** Standard confirm + cancel action row. */
export function confirmCancelRow(
  confirmId = 'confirm',
  cancelId = 'cancel',
): ActionRowBuilder<MessageActionRowComponentBuilder> {
  return createActionRow(
    createButton(confirmId, 'Confirm', ButtonStyle.Success, { emoji: '✅' }),
    createButton(cancelId, 'Cancel', ButtonStyle.Danger, { emoji: '❌' }),
  );
}
