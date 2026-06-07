import { REST, Routes } from 'discord.js';
import { env } from './utils/env';
import { commands } from './commands/music.commands';
import { logger } from './utils/logger';

const commandData = commands.map((cmd) => cmd.data.toJSON());

const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);

(async () => {
  try {
    logger.info(`Started refreshing ${commandData.length} application (/) commands.`);

    // Deploy commands globally
    const data: any = await rest.put(
      Routes.applicationCommands(env.CLIENT_ID),
      { body: commandData }
    );

    logger.info(`Successfully reloaded ${data.length} application (/) commands.`);
    process.exit(0);
  } catch (err) {
    logger.error('Error deploying application commands:', err);
    process.exit(1);
  }
})();
