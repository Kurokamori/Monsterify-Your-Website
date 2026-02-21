import type { Client } from 'discord.js';
import { startBridgeServer } from '../bridge/server.js';
import type { DuskClient } from '../client.js';
import { registerAll } from '../commands/registry.js';

export function execute(readyClient: Client<true>): void {
  const client = readyClient as unknown as DuskClient;

  // Load all commands and component handlers
  registerAll(client);

  console.log(`${readyClient.user.tag} is online and ready`);
  console.log(`Connected to ${readyClient.guilds.cache.size} guild(s)`);
  readyClient.user.setActivity('Dusk and Dawn RPG');

  startBridgeServer(client);
}
