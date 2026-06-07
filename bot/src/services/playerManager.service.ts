import { Client } from 'discord.js';
import { MusicPlayer } from '../structures/MusicPlayer';
import { logger } from '../utils/logger';

class PlayerManagerService {
  private players = new Map<string, MusicPlayer>();
  private client: Client | null = null;

  public setClient(client: Client): void {
    this.client = client;
  }

  public getOrCreatePlayer(guildId: string): MusicPlayer {
    let player = this.players.get(guildId);
    if (!player) {
      player = new MusicPlayer(guildId);
      this.players.set(guildId, player);
      logger.info(`Created new MusicPlayer instance for guild: ${guildId}`);
    }
    return player;
  }

  public getPlayer(guildId: string): MusicPlayer | undefined {
    return this.players.get(guildId);
  }

  public deletePlayer(guildId: string): void {
    const player = this.players.get(guildId);
    if (player) {
      player.destroy();
      this.players.delete(guildId);
      logger.info(`Destroyed MusicPlayer instance for guild: ${guildId}`);
    }
  }

  public getClient(): Client | null {
    return this.client;
  }
}

export const playerManager = new PlayerManagerService();
