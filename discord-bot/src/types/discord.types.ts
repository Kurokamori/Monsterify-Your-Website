import type { Collection } from 'discord.js';
import type { Command } from './command.types.js';

// ============================================================================
// Extended Discord client properties
// ============================================================================

export interface DuskClientProperties {
  commands: Collection<string, Command>;
}

// ============================================================================
// Interaction context — resolved user info attached during middleware
// ============================================================================

export interface InteractionContext {
  userId: number;
  username: string;
  discordId: string;
  isAdmin: boolean;
}
