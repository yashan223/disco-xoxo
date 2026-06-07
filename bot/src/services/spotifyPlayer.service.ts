import axios from 'axios';
import { User } from '../models/User.model';
import { spotifyService } from './spotify.service';
import { logger } from '../utils/logger';

const SPOTIFY_API_URL = 'https://api.spotify.com/v1';

export const spotifyPlayerService = {
  /**
   * Retrieves a valid Spotify Web API access token for the bot's Premium account.
   * Looks for a user in the DB with discordId = "bot".
   */
  async getBotAccessToken(): Promise<string> {
    const botUser = await User.findOne({ discordId: 'bot' });
    if (!botUser || !botUser.spotifyRefreshToken) {
      throw new Error('Bot Spotify account is not linked. Please link it via the admin dashboard.');
    }

    // Check if token is expired
    if (!botUser.spotifyTokenExpiry || botUser.spotifyTokenExpiry < new Date()) {
      logger.info('Bot Spotify token expired. Refreshing...');
      const accessToken = await spotifyService.refreshUserToken(botUser._id.toString());
      return accessToken;
    }

    return botUser.spotifyAccessToken!;
  },

  /**
   * Sends a play command to the librespot Connect device.
   */
  async play(guildId: string, trackUris: string[]): Promise<void> {
    try {
      const token = await this.getBotAccessToken();
      const deviceId = await this.findDevice(token, `Disco-XOXO-${guildId}`);

      if (!deviceId) {
        throw new Error('Librespot device not found. Please wait for it to connect.');
      }

      await axios.put(
        `${SPOTIFY_API_URL}/me/player/play`,
        { uris: trackUris },
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { device_id: deviceId },
        }
      );
    } catch (err) {
      logger.error(`Error sending play command to Spotify Connect: ${(err as Error).message}`);
      throw err;
    }
  },

  /**
   * Sends a pause command to the librespot Connect device.
   */
  async pause(guildId: string): Promise<void> {
    try {
      const token = await this.getBotAccessToken();
      const deviceId = await this.findDevice(token, `Disco-XOXO-${guildId}`);

      if (!deviceId) return;

      await axios.put(
        `${SPOTIFY_API_URL}/me/player/pause`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { device_id: deviceId },
        }
      );
    } catch (err) {
      logger.error(`Error sending pause command to Spotify Connect: ${(err as Error).message}`);
    }
  },

  /**
   * Sends a resume command to the librespot Connect device.
   */
  async resume(guildId: string): Promise<void> {
    try {
      const token = await this.getBotAccessToken();
      const deviceId = await this.findDevice(token, `Disco-XOXO-${guildId}`);

      if (!deviceId) return;

      await axios.put(
        `${SPOTIFY_API_URL}/me/player/play`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { device_id: deviceId },
        }
      );
    } catch (err) {
      logger.error(`Error sending resume command to Spotify Connect: ${(err as Error).message}`);
    }
  },

  /**
   * Sends a volume command to the librespot Connect device.
   */
  async setVolume(guildId: string, volume: number): Promise<void> {
    try {
      const token = await this.getBotAccessToken();
      const deviceId = await this.findDevice(token, `Disco-XOXO-${guildId}`);

      if (!deviceId) return;

      await axios.put(
        `${SPOTIFY_API_URL}/me/player/volume`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { device_id: deviceId, volume_percent: volume },
        }
      );
    } catch (err) {
      logger.error(`Error sending volume command to Spotify Connect: ${(err as Error).message}`);
    }
  },

  /**
   * Helper to search for a specific Spotify Connect device by name.
   */
  async findDevice(token: string, deviceName: string): Promise<string | null> {
    try {
      const response = await axios.get(`${SPOTIFY_API_URL}/me/player/devices`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const devices = response.data.devices || [];
      const device = devices.find((d: any) => d.name.toLowerCase() === deviceName.toLowerCase());

      return device ? device.id : null;
    } catch (err) {
      logger.error(`Error fetching devices: ${(err as Error).message}`);
      return null;
    }
  },
};
