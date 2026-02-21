import type {
  AutocompleteInteraction,
  ButtonInteraction,
  ChatInputCommandInteraction,
  ModalSubmitInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
  StringSelectMenuInteraction,
} from 'discord.js';

// ============================================================================
// Slash command definition
// ============================================================================

export interface Command {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
  /** Middleware to run before `execute`. Processed in order (first = outermost). */
  middleware?: CommandMiddleware[];
  /** Optional metadata used by the /help command. */
  meta?: CommandMeta;
}

// ============================================================================
// Component handlers — button, select menu, modal
// ============================================================================

export interface ButtonHandler {
  customId: string | RegExp;
  execute: (interaction: ButtonInteraction) => Promise<void>;
}

export interface SelectMenuHandler {
  customId: string | RegExp;
  execute: (interaction: StringSelectMenuInteraction) => Promise<void>;
}

export interface ModalHandler {
  customId: string | RegExp;
  execute: (interaction: ModalSubmitInteraction) => Promise<void>;
}

export type ComponentHandler = ButtonHandler | SelectMenuHandler | ModalHandler;

// ============================================================================
// Middleware
// ============================================================================

export type MiddlewareNext = () => Promise<void>;

export type CommandMiddleware = (
  interaction: ChatInputCommandInteraction,
  next: MiddlewareNext,
) => Promise<void>;

// ============================================================================
// Command metadata (used for help & registration)
// ============================================================================

export interface CommandMeta {
  name: string;
  description: string;
  category: string;
  usage?: string;
  examples?: string[];
  cooldown?: number;
  permissions?: string[];
}
