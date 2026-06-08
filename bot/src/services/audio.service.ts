import { spawn, ChildProcess } from 'child_process';
import { createAudioResource, AudioResource, StreamType } from '@discordjs/voice';
import { Readable } from 'stream';
import prism from 'prism-media';
import * as fs from 'fs';
import * as path from 'path';
import { env } from '../utils/env';
import { logger } from '../utils/logger';
import { spotifyPlayerService } from './spotifyPlayer.service';

export class AudioService {
  private static processes = new Map<string, ChildProcess>();

  public static async startPlayer(guildId: string): Promise<Readable> {
    // Kill existing process for the guild if any
    this.stopPlayer(guildId);

    logger.info(`Starting librespot for guild: ${guildId}`);

    // Get the bot's Spotify access token
    let accessToken = '';
    try {
      accessToken = await spotifyPlayerService.getBotAccessToken();
    } catch (err) {
      logger.error(`Failed to get bot access token: ${(err as Error).message}`);
      throw err;
    }

    const args = [
      '-n', `Disco-XOXO-${guildId}`,
      '-k', accessToken,
      '--ap-port', '443',
      '--disable-discovery',
      '--backend', 'pipe' // pipe always outputs to stdout in librespot 0.8.0
    ];

    const librespot = spawn('librespot', args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    this.processes.set(guildId, librespot);

    librespot.stderr.on('data', (data) => {
      const logMsg = data.toString().trim();
      if (logMsg) {
        logger.error(`[librespot-${guildId}] ${logMsg}`);
      }
    });

    librespot.on('close', (code) => {
      logger.info(`librespot process for guild ${guildId} exited with code ${code}`);
      this.processes.delete(guildId);
    });

    // Return stdout which contains the raw PCM audio
    return librespot.stdout;
  }

  public static stopPlayer(guildId: string): void {
    const proc = this.processes.get(guildId);
    if (proc) {
      logger.info(`Stopping librespot for guild: ${guildId}`);
      proc.kill('SIGTERM');
      this.processes.delete(guildId);
    }
  }

  public static createResource(stream: Readable): AudioResource {
    // We encode this directly into Ogg Opus format using prism-media's FFmpeg wrapper
    // This perfectly integrates with discord.js/voice backpressure and streams.
    const transcoder = new prism.FFmpeg({
      args: [
        '-analyzeduration', '0',
        '-loglevel', '0',
        '-f', 's16le',
        '-ar', '44100',
        '-ac', '2',
        '-i', '-',
        '-c:a', 'libopus',
        '-b:a', '128k',
        '-vbr', 'on',
        '-f', 'opus',
      ]
    });

    const transcodedStream = stream.pipe(transcoder);

    return createAudioResource(transcodedStream, {
      inputType: StreamType.OggOpus,
    });
  }
}
