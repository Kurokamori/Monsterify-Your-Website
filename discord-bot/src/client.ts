import { Client, Collection, GatewayIntentBits } from 'discord.js';
import type { Command, ButtonHandler, SelectMenuHandler, ModalHandler } from './types/command.types.js';

export class DuskClient extends Client {
  readonly commands = new Collection<string, Command>();
  readonly buttonHandlers: ButtonHandler[] = [];
  readonly selectMenuHandlers: SelectMenuHandler[] = [];
  readonly modalHandlers: ModalHandler[] = [];

  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
      ],
    });
  }
}
