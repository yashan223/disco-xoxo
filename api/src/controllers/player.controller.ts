import { Request, Response, NextFunction } from 'express';
import { redis } from '../services/redis.service';
import { socketService } from '../services/socket.service';
import { spotifyService } from '../services/spotify.service';
import { Log } from '../models/Log.model';
import { logger } from '../utils/logger';

// Helper to publish command to the bot
async function publishBotCommand(guildId: string, action: string, userId: string, data: any = {}) {
  const payload = JSON.stringify({ guildId, action, userId, data });
  await redis.publish('bot:commands', payload);
  logger.debug(`Published bot command: ${action} for guild ${guildId} by user ${userId}`);
}

export async function getPlayerState(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const guildId = req.params.guildId as string;
    if (!guildId) {
      res.status(400).json({ error: 'BAD_REQUEST', message: 'guildId is required', statusCode: 400 });
      return;
    }

    const state = socketService.getPlayerState(guildId);
    if (!state) {
      res.json({
        isPlaying: false,
        isPaused: false,
        volume: 80,
        loopMode: 'off',
        currentTrack: null,
        position: 0,
      });
      return;
    }

    res.json(state);
  } catch (err) {
    next(err);
  }
}

export async function play(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { guildId, query } = req.body;
    if (!guildId || !query) {
      res.status(400).json({ error: 'BAD_REQUEST', message: 'guildId and query are required', statusCode: 400 });
      return;
    }

    if (!spotifyService.isValidSpotifyUrl(query)) {
      // It's a search term, validate that it's a string. We will perform the Spotify search in the bot or API.
      // We allow standard text queries for searching Spotify, but we do NOT allow YouTube/etc links.
      if (query.startsWith('http://') || query.startsWith('https://')) {
        res.status(400).json({
          error: 'INVALID_SPOTIFY_URL',
          message: 'Only Spotify URLs or search terms are supported',
          statusCode: 400,
        });
        return;
      }
    }

    const userId = req.user!.discordId;
    await publishBotCommand(guildId, 'PLAY', userId, { query });

    // Log action
    await Log.create({
      guildId,
      userId,
      username: req.user!.username,
      action: 'PLAY',
      details: { query },
      timestamp: new Date(),
    }).catch(() => {});

    res.json({ success: true, message: 'Play command sent to bot' });
  } catch (err) {
    next(err);
  }
}

export async function pause(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { guildId } = req.body;
    if (!guildId) {
      res.status(400).json({ error: 'BAD_REQUEST', message: 'guildId is required', statusCode: 400 });
      return;
    }

    const userId = req.user!.discordId;
    await publishBotCommand(guildId, 'PAUSE', userId);

    await Log.create({
      guildId,
      userId,
      username: req.user!.username,
      action: 'PAUSE',
      timestamp: new Date(),
    }).catch(() => {});

    res.json({ success: true, message: 'Pause command sent to bot' });
  } catch (err) {
    next(err);
  }
}

export async function resume(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { guildId } = req.body;
    if (!guildId) {
      res.status(400).json({ error: 'BAD_REQUEST', message: 'guildId is required', statusCode: 400 });
      return;
    }

    const userId = req.user!.discordId;
    await publishBotCommand(guildId, 'RESUME', userId);

    await Log.create({
      guildId,
      userId,
      username: req.user!.username,
      action: 'RESUME',
      timestamp: new Date(),
    }).catch(() => {});

    res.json({ success: true, message: 'Resume command sent to bot' });
  } catch (err) {
    next(err);
  }
}

export async function skip(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { guildId } = req.body;
    if (!guildId) {
      res.status(400).json({ error: 'BAD_REQUEST', message: 'guildId is required', statusCode: 400 });
      return;
    }

    const userId = req.user!.discordId;
    await publishBotCommand(guildId, 'SKIP', userId);

    await Log.create({
      guildId,
      userId,
      username: req.user!.username,
      action: 'SKIP',
      timestamp: new Date(),
    }).catch(() => {});

    res.json({ success: true, message: 'Skip command sent to bot' });
  } catch (err) {
    next(err);
  }
}

export async function stop(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { guildId } = req.body;
    if (!guildId) {
      res.status(400).json({ error: 'BAD_REQUEST', message: 'guildId is required', statusCode: 400 });
      return;
    }

    const userId = req.user!.discordId;
    await publishBotCommand(guildId, 'STOP', userId);

    await Log.create({
      guildId,
      userId,
      username: req.user!.username,
      action: 'STOP',
      timestamp: new Date(),
    }).catch(() => {});

    res.json({ success: true, message: 'Stop command sent to bot' });
  } catch (err) {
    next(err);
  }
}

export async function shuffle(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { guildId } = req.body;
    if (!guildId) {
      res.status(400).json({ error: 'BAD_REQUEST', message: 'guildId is required', statusCode: 400 });
      return;
    }

    const userId = req.user!.discordId;
    await publishBotCommand(guildId, 'SHUFFLE', userId);

    await Log.create({
      guildId,
      userId,
      username: req.user!.username,
      action: 'SHUFFLE',
      timestamp: new Date(),
    }).catch(() => {});

    res.json({ success: true, message: 'Shuffle command sent to bot' });
  } catch (err) {
    next(err);
  }
}

export async function loop(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { guildId, mode } = req.body;
    if (!guildId || !mode) {
      res.status(400).json({ error: 'BAD_REQUEST', message: 'guildId and mode are required', statusCode: 400 });
      return;
    }

    if (!['off', 'track', 'queue'].includes(mode)) {
      res.status(400).json({ error: 'BAD_REQUEST', message: 'Invalid loop mode', statusCode: 400 });
      return;
    }

    const userId = req.user!.discordId;
    await publishBotCommand(guildId, 'LOOP', userId, { mode });

    await Log.create({
      guildId,
      userId,
      username: req.user!.username,
      action: 'LOOP',
      details: { mode },
      timestamp: new Date(),
    }).catch(() => {});

    res.json({ success: true, message: `Loop mode set to ${mode}` });
  } catch (err) {
    next(err);
  }
}

export async function volume(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { guildId, volume } = req.body;
    if (!guildId || volume === undefined) {
      res.status(400).json({ error: 'BAD_REQUEST', message: 'guildId and volume are required', statusCode: 400 });
      return;
    }

    const volNum = parseInt(volume, 10);
    if (isNaN(volNum) || volNum < 0 || volNum > 100) {
      res.status(400).json({ error: 'BAD_REQUEST', message: 'Volume must be between 0 and 100', statusCode: 400 });
      return;
    }

    const userId = req.user!.discordId;
    await publishBotCommand(guildId, 'VOLUME', userId, { volume: volNum });

    await Log.create({
      guildId,
      userId,
      username: req.user!.username,
      action: 'VOLUME',
      details: { volume: volNum },
      timestamp: new Date(),
    }).catch(() => {});

    res.json({ success: true, message: `Volume set to ${volNum}` });
  } catch (err) {
    next(err);
  }
}
