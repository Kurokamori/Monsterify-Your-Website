import { type Interaction } from 'discord.js';
import type { DuskClient } from '../client.js';
import { EmbedColor } from '../constants/colors.js';
import { runMiddleware } from '../middleware/index.js';

function errorEmbed(message: string) {
  return {
    embeds: [{ color: EmbedColor.ERROR, description: message }],
    ephemeral: true,
  } as const;
}

export async function execute(interaction: Interaction): Promise<void> {
  const client = interaction.client as DuskClient;

  try {
    // -- Slash commands -------------------------------------------------------
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);

      if (!command) {
        await interaction.reply(errorEmbed(`Unknown command: \`/${interaction.commandName}\``));
        return;
      }

      await runMiddleware(
        interaction,
        command.middleware ?? [],
        () => command.execute(interaction),
      );
      return;
    }

    // -- Autocomplete ---------------------------------------------------------
    if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);
      if (command?.autocomplete) {
        await command.autocomplete(interaction);
      }
      return;
    }

    // -- Buttons --------------------------------------------------------------
    if (interaction.isButton()) {
      const handler = client.buttonHandlers.find((h) =>
        typeof h.customId === 'string'
          ? h.customId === interaction.customId
          : h.customId.test(interaction.customId),
      );

      if (!handler) {
        console.warn(`Unhandled button: ${interaction.customId}`);
        await interaction.reply(errorEmbed('This button is not currently handled.'));
        return;
      }

      await handler.execute(interaction);
      return;
    }

    // -- Select menus ---------------------------------------------------------
    if (interaction.isStringSelectMenu()) {
      const handler = client.selectMenuHandlers.find((h) =>
        typeof h.customId === 'string'
          ? h.customId === interaction.customId
          : h.customId.test(interaction.customId),
      );

      if (!handler) {
        console.warn(`Unhandled select menu: ${interaction.customId}`);
        await interaction.reply(errorEmbed('This menu is not currently handled.'));
        return;
      }

      await handler.execute(interaction);
      return;
    }

    // -- Modals ---------------------------------------------------------------
    if (interaction.isModalSubmit()) {
      const handler = client.modalHandlers.find((h) =>
        typeof h.customId === 'string'
          ? h.customId === interaction.customId
          : h.customId.test(interaction.customId),
      );

      if (!handler) {
        console.warn(`Unhandled modal: ${interaction.customId}`);
        await interaction.reply(errorEmbed('This form submission is not currently handled.'));
        return;
      }

      await handler.execute(interaction);
      return;
    }
  } catch (err) {
    console.error('Error handling interaction:', err);

    const message = 'Something went wrong while processing that interaction.';

    if (interaction.isRepliable()) {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorEmbed(message)).catch(() => {});
      } else {
        await interaction.reply(errorEmbed(message)).catch(() => {});
      }
    }
  }
}
