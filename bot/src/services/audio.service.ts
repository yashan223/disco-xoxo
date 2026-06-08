import { spawn, ChildProcess } from 'child_process';
import { createAudioResource, AudioResource, StreamType } from '@discordjs/voice';
import { Readable } from 'stream';
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
      '--disable-discovery'
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
        logger.error(`[librespot-${guildId}] ${logMsg}`);
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
    // Discord strictly requires 48kHz, 16-bit, stereo for StreamType.Raw
    const ffmpegArgs = [
      '-f', 's16le',
      '-ar', '44100',
      '-ac', '2',
      '-i', 'pipe:0',
      '-f', 's16le',
      '-ar', '48000',
      '-ac', '2',
      'pipe:1'
    ];

    const ffmpegProcess = spawn('ffmpeg', ffmpegArgs, {
      stdio: ['pipe', 'pipe', 'ignore'] // ignore stderr to prevent spam
    });

    stream.pipe(ffmpegProcess.stdin);

    ffmpegProcess.on('error', (err) => {
      logger.error(`FFmpeg process error: ${err.message}`);
    });

    return createAudioResource(ffmpegProcess.stdout, {
      inputType: StreamType.Raw,
    });
  }
}
