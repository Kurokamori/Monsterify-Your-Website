/**
 * Deploy slash commands to Discord.
 *
 * Usage:
 *   npx tsx src/deploy-commands.ts              — Sync commands globally
 *   npx tsx src/deploy-commands.ts --guild ID   — Sync commands to a specific guild (instant, good for dev)
 *   npx tsx src/deploy-commands.ts --clear      — Remove ALL global commands
 *   npx tsx src/deploy-commands.ts --clear --guild ID  — Remove ALL commands from a guild
 *
 * This replaces the full command set, so any stale/old commands not in the
 * current MODULES list will be automatically removed.
 */

import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { getModules } from './commands/registry.js';

const token = process.env['DISCORD_BOT_TOKEN'];
const clientId = process.env['DISCORD_CLIENT_ID'];

if (!token || !clientId) {
  console.error('Missing DISCORD_BOT_TOKEN or DISCORD_CLIENT_ID in .env');
  process.exit(1);
}

const args = process.argv.slice(2);
const clearMode = args.includes('--clear');
const guildIdx = args.indexOf('--guild');
const guildId = guildIdx !== -1 ? args[guildIdx + 1] : undefined;

const rest = new REST({ version: '10' }).setToken(token);

async function deploy() {
  const commands = clearMode
    ? []
    : getModules()
        .filter((m) => m.command)
        .map((m) => m.command!.data.toJSON());

  const action = clearMode ? 'Clearing' : 'Deploying';
  const target = guildId ? `guild ${guildId}` : 'globally';
  console.log(`${action} ${commands.length} command(s) ${target}...`);

  const route = guildId
    ? Routes.applicationGuildCommands(clientId!, guildId)
    : Routes.applicationCommands(clientId!);

  const result = await rest.put(route, { body: commands }) as unknown[];

  console.log(`Successfully ${clearMode ? 'cleared' : 'deployed'} ${result.length} command(s) ${target}.`);
}

deploy().catch((err) => {
  console.error('Failed to deploy commands:', err);
  process.exit(1);
});
