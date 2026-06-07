import { Request, Response, NextFunction } from 'express';
import { redis } from '../services/redis.service';
import { socketService } from '../services/socket.service';
import { Log } from '../models/Log.model';
import { logger } from '../utils/logger';

async function publishBotCommand(guildId: string, action: string, userId: string, data: any = {}) {
  const payload = JSON.stringify({ guildId, action, userId, data });
  await redis.publish('bot:commands', payload);
  logger.debug(`Published bot queue command: ${action} for guild ${guildId} by user ${userId}`);
}

export async function getQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const guildId = req.params.guildId as string;
    if (!guildId) {
      res.status(400).json({ error: 'BAD_REQUEST', message: 'guildId is required', statusCode: 400 });
      return;
    }

    const queue = socketService.getQueueState(guildId);
    if (!queue) {
      res.json({
        tracks: [],
        history: [],
        total: 0,
        currentIndex: 0,
      });
      return;
    }

    res.json(queue);
  } catch (err) {
    next(err);
  }
}

export async function removeTrack(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const guildId = req.params.guildId as string;
    const trackId = req.params.trackId as string;
    if (!guildId || !trackId) {
      res.status(400).json({ error: 'BAD_REQUEST', message: 'guildId and trackId are required', statusCode: 400 });
      return;
    }

    const userId = req.user!.discordId;
    await publishBotCommand(guildId, 'REMOVE', userId, { trackId });

    await Log.create({
      guildId,
      userId,
      username: req.user!.username,
      action: 'REMOVE',
      details: { trackId },
      timestamp: new Date(),
    }).catch(() => {});

    res.json({ success: true, message: 'Remove command sent to bot' });
  } catch (err) {
    next(err);
  }
}

export async function moveTrack(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const guildId = req.params.guildId as string;
    const { fromIndex, toIndex } = req.body;

    if (!guildId || fromIndex === undefined || toIndex === undefined) {
      res.status(400).json({
        error: 'BAD_REQUEST',
        message: 'guildId, fromIndex, and toIndex are required',
        statusCode: 400,
      });
      return;
    }

    const userId = req.user!.discordId;
    await publishBotCommand(guildId, 'MOVE', userId, { fromIndex, toIndex });

    res.json({ success: true, message: 'Move command sent to bot' });
  } catch (err) {
    next(err);
  }
}

export async function clearQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const guildId = req.params.guildId as string;
    if (!guildId) {
      res.status(400).json({ error: 'BAD_REQUEST', message: 'guildId is required', statusCode: 400 });
      return;
    }

    const userId = req.user!.discordId;
    await publishBotCommand(guildId, 'CLEAR', userId);

    await Log.create({
      guildId,
      userId,
      username: req.user!.username,
      action: 'CLEAR',
      timestamp: new Date(),
    }).catch(() => {});

    res.json({ success: true, message: 'Clear command sent to bot' });
  } catch (err) {
    next(err);
  }
}
