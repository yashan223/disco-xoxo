import { spawn, ChildProcess } from 'child_process';
import { createAudioResource, AudioResource, StreamType } from '@discordjs/voice';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as path from 'path';
import { env } from '../utils/env';
import { logger } from '../utils/logger';

export class AudioService {
  private static processes = new Map<string, ChildProcess>();

  public static async startPlayer(guildId: string): Promise<Readable> {
    // Kill existing process for the guild if any
    this.stopPlayer(guildId);

    const pipeName = `spotify_${guildId}.fifo`;
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const pipePath = path.join(tempDir, pipeName);

    // Clean up old pipe file if exists
    if (fs.existsSync(pipePath)) {
      try {
        fs.unlinkSync(pipePath);
      } catch (err) {
        logger.error(`Error deleting old pipe file: ${(err as Error).message}`);
      }
    }

    // Try creating named pipe using mkfifo on Linux/Unix
    const isWindows = process.platform === 'win32';
    if (!isWindows) {
      try {
        const mkfifo = spawn('mkfifo', [pipePath]);
        await new Promise<void>((resolve, reject) => {
          mkfifo.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`mkfifo exited with code ${code}`));
          });
        });
      } catch (err) {
        logger.warn(`mkfifo failed, falling back to stdout streaming: ${(err as Error).message}`);
      }
    }

    logger.info(`Starting librespot for guild: ${guildId}`);

    const args = [
      '-n', `Disco-XOXO-${guildId}`,
      '-u', env.SPOTIFY_BOT_USERNAME,
      '-p', env.SPOTIFY_BOT_PASSWORD,
    ];

    if (!isWindows && fs.existsSync(pipePath)) {
      args.push('--backend', 'pipe', '--device', pipePath);
    } else {
      // Stream to stdout
      args.push('--backend', 'pipe'); // Pipe with no device parameter or "-" streams to stdout
    }

    const librespot = spawn('librespot', args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    this.processes.set(guildId, librespot);

    librespot.stderr.on('data', (data) => {
      const logMsg = data.toString().trim();
      if (logMsg) {
        logger.debug(`[librespot-${guildId}] ${logMsg}`);
      }
    });

    librespot.on('close', (code) => {
      logger.info(`librespot process for guild ${guildId} exited with code ${code}`);
      this.processes.delete(guildId);
      if (fs.existsSync(pipePath)) {
        try {
          fs.unlinkSync(pipePath);
        } catch {}
      }
    });

    // Return the audio stream
    if (!isWindows && fs.existsSync(pipePath)) {
      // Wait a bit for pipe creation and connection, then read
      await new Promise(r => setTimeout(r, 500));
      return fs.createReadStream(pipePath);
    } else {
      return librespot.stdout;
    }
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
    // Librespot outputs raw PCM: 44.1kHz, 16-bit, stereo, signed-integer
    // We pass it to FFmpeg or demuxProbe to format correctly for discord.js voice
    return createAudioResource(stream, {
      inputType: StreamType.Raw,
    });
  }
}
