import { Request, Response, NextFunction } from 'express';
import { History } from '../models/History.model';
import { Statistics } from '../models/Statistics.model';
import { Log } from '../models/Log.model';

export async function getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { guildId } = req.params;
    if (!guildId) {
      res.status(400).json({ error: 'BAD_REQUEST', message: 'guildId is required', statusCode: 400 });
      return;
    }

    const history = await History.findOne({ guildId });
    if (!history) {
      res.json({ guildId, tracks: [] });
      return;
    }

    res.json(history);
  } catch (err) {
    next(err);
  }
}

export async function getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { guildId } = req.params;
    if (!guildId) {
      res.status(400).json({ error: 'BAD_REQUEST', message: 'guildId is required', statusCode: 400 });
      return;
    }

    const stats = await Statistics.findOne({ guildId });
    if (!stats) {
      res.json({
        guildId,
        songsPlayed: 0,
        commandsUsed: 0,
        totalPlaytimeMs: 0,
        activePlayersToday: 0,
        topTracks: [],
        topRequesters: [],
        dailyPlays: [],
      });
      return;
    }

    res.json(stats);
  } catch (err) {
    next(err);
  }
}

export async function getLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { guildId } = req.params;
    if (!guildId) {
      res.status(400).json({ error: 'BAD_REQUEST', message: 'guildId is required', statusCode: 400 });
      return;
    }

    const limit = parseInt(req.query.limit as string, 10) || 50;
    const logs = await Log.find({ guildId })
      .sort({ timestamp: -1 })
      .limit(limit);

    res.json({ guildId, logs });
  } catch (err) {
    next(err);
  }
}
