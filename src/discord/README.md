# Monsterify Discord Bot

This Discord bot serves as a companion to the Monsterify website, providing an alternative way to interact with the content.

## Setup

1. Create a Discord application and bot at the [Discord Developer Portal](https://discord.com/developers/applications)
2. Enable the following Privileged Gateway Intents:
   - Server Members Intent
   - Message Content Intent
3. Copy your bot token and client ID
4. Add the following to your `.env` file:
   ```
   DISCORD_BOT_TOKEN=your_bot_token_here
   DISCORD_CLIENT_ID=your_client_id_here
   ```
5. Install dependencies:
   ```
   npm install
   ```
6. Run the bot:
   ```
   npm run bot
   ```

## Features

The bot provides a menu-based interface with the following main sections:

- **Visit Town**: Access all Town Square locations
- **Visit Market**: Access all Market locations
- **Process Submission**: Submit art, writing, prompts, or references
- **View Schedule**: Manage tasks and habits

## Commands

- `/menu` or `!menu`: Show the main menu
- `/town` or `!town`: Show the Town Square menu
- `/market` or `!market`: Show the Market menu
- `/submission` or `!submission`: Show the Submission menu
- `/schedule` or `!schedule`: Show the Schedule menu

## Structure

- `bot.js`: Main bot file
- `config/`: Configuration files
  - `embeds.js`: Embed details
  - `buttons.js`: Button configurations
- `handlers/`: Interaction handlers
  - `commandHandler.js`: Command handler
  - `buttonHandler.js`: Button interaction handler
  - `selectMenuHandler.js`: Select menu interaction handler
- `utils/`: Utility functions
  - `embedBuilder.js`: Embed and button builder
- `commands/`: Command definitions
  - `registerCommands.js`: Register slash commands with Discord
- `components/`: UI components
  - `PaginatedDropdown.js`: Dropdown with pagination for more than 25 options
  - `TrainerSelect.js`: Base trainer selection component
  - `UserTrainerSelect.js`: Select trainers belonging to a user
  - `AllTrainerSelect.js`: Select from all trainers
  - `MonsterSelect.js`: Base monster selection component
  - `TrainerMonsterSelect.js`: Select monsters belonging to a trainer

## Components

### PaginatedDropdown

A dropdown component that supports pagination for more than 25 options (Discord's limit).

### TrainerSelect

A component for selecting trainers with pagination.

### UserTrainerSelect

A component for selecting trainers belonging to a specific user.

### AllTrainerSelect

A component for selecting from all trainers.

### MonsterSelect

A component for selecting monsters with pagination.

### TrainerMonsterSelect

A component for selecting monsters belonging to a specific trainer.

## Development

To add new features:

1. Add new embed details to `config/embeds.js`
2. Add new button configurations to `config/buttons.js`
3. Add handlers for new buttons in `handlers/buttonHandler.js`
4. Add new commands in `commands/registerCommands.js` and handlers in `handlers/commandHandler.js`
5. Add new select menu handlers in `handlers/selectMenuHandler.js`
