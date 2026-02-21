import type { DuskClient } from '../client.js';
import type { Command, ButtonHandler, SelectMenuHandler, ModalHandler } from '../types/command.types.js';

// ============================================================================
// Command module shape
// ============================================================================

/**
 * Each command module may export a slash command and/or component handlers.
 *
 * To register a new command:
 *   1. Create a file in the appropriate `src/commands/<category>/` directory.
 *   2. Export `command`, plus optional `buttons`, `selectMenus`, `modals`.
 *   3. Import and add it to the `MODULES` array below.
 *
 * The `/help` command reads from the client's command collection, so any
 * command registered here automatically appears in help output.
 */
export interface CommandModule {
  command?: Command;
  buttons?: ButtonHandler[];
  selectMenus?: SelectMenuHandler[];
  modals?: ModalHandler[];
}

// ============================================================================
// Import all command modules here
// ============================================================================

import * as menu from './general/menu.js';
import * as help from './general/help.js';
import * as adventure from './adventure/index.js';
import * as battle from './battle/index.js';
import * as trainer from './trainer/index.js';
import * as monster from './monster/index.js';
import * as town from './town/index.js';
import * as shop from './shop/index.js';
import * as buy from './buy/index.js';

/**
 * Master list of all command modules.
 * Add new modules here to register them with the bot.
 */
const MODULES: CommandModule[] = [
  menu,
  help,
  adventure,
  battle,
  trainer,
  monster,
  town,
  shop,
  buy,
];

// ============================================================================
// Registration
// ============================================================================

/**
 * Register all commands and component handlers with the client.
 *
 * Call this once during bot startup (e.g. in the `ready` event).
 */
export function registerAll(client: DuskClient): void {
  let commandCount = 0;
  let buttonCount = 0;
  let selectMenuCount = 0;
  let modalCount = 0;

  for (const mod of MODULES) {
    if (mod.command) {
      client.commands.set(mod.command.data.name, mod.command);
      commandCount++;
    }

    if (mod.buttons) {
      client.buttonHandlers.push(...mod.buttons);
      buttonCount += mod.buttons.length;
    }

    if (mod.selectMenus) {
      client.selectMenuHandlers.push(...mod.selectMenus);
      selectMenuCount += mod.selectMenus.length;
    }

    if (mod.modals) {
      client.modalHandlers.push(...mod.modals);
      modalCount += mod.modals.length;
    }
  }

  console.log(
    `Registered ${commandCount} command(s), `
    + `${buttonCount} button handler(s), `
    + `${selectMenuCount} select menu handler(s), `
    + `${modalCount} modal handler(s)`,
  );
}

/**
 * Get all registered command modules.
 * Useful for building the `/help` output or deploy scripts.
 */
export function getModules(): readonly CommandModule[] {
  return MODULES;
}
