import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User.model';
import { Guild } from '../models/Guild.model';
import { logger } from '../utils/logger';

export async function getUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Not authenticated', statusCode: 401 });
      return;
    }
    const dbUser = await User.findOne({ discordId: req.user.discordId });
    if (!dbUser) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'User not found', statusCode: 404 });
      return;
    }

    res.json({
      id: dbUser._id,
      discordId: dbUser.discordId,
      username: dbUser.username,
      avatar: dbUser.avatar,
      email: dbUser.email,
      spotifyLinked: !!dbUser.spotifyId,
      spotifyDisplayName: dbUser.spotifyDisplayName,
      isPremium: dbUser.isPremium,
      locale: dbUser.locale,
      createdAt: dbUser.createdAt,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Not authenticated', statusCode: 401 });
      return;
    }
    const { locale } = req.body;
    const dbUser = await User.findOneAndUpdate(
      { discordId: req.user.discordId },
      { $set: { locale } },
      { new: true }
    );

    if (!dbUser) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'User not found', statusCode: 404 });
      return;
    }

    res.json({
      id: dbUser._id,
      discordId: dbUser.discordId,
      username: dbUser.username,
      avatar: dbUser.avatar,
      email: dbUser.email,
      spotifyLinked: !!dbUser.spotifyId,
      spotifyDisplayName: dbUser.spotifyDisplayName,
      isPremium: dbUser.isPremium,
      locale: dbUser.locale,
      createdAt: dbUser.createdAt,
    });
  } catch (err) {
    next(err);
  }
}

export async function getGuilds(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Not authenticated', statusCode: 401 });
      return;
    }
    const guilds = await Guild.find({ ownerId: req.user.discordId });
    res.json(guilds);
  } catch (err) {
    next(err);
  }
}

export async function updateGuildSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { guildId } = req.params;
    if (!req.user) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Not authenticated', statusCode: 401 });
      return;
    }

    const guild = await Guild.findOne({ guildId });
    if (!guild) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Guild not found', statusCode: 404 });
      return;
    }

    // Security check: User must be owner/admin of the guild
    if (guild.ownerId !== req.user.discordId) {
      res.status(403).json({ error: 'FORBIDDEN', message: 'You are not the administrator of this guild', statusCode: 403 });
      return;
    }

    // Update settings fields safely
    const { defaultVolume, djRoles, musicChannel, autoplay, loopMode, announce } = req.body;
    
    if (guild.settings) {
      if (defaultVolume !== undefined) guild.settings.defaultVolume = defaultVolume;
      if (djRoles !== undefined) guild.settings.djRoles = djRoles;
      if (musicChannel !== undefined) guild.settings.musicChannel = musicChannel;
      if (autoplay !== undefined) guild.settings.autoplay = autoplay;
      if (loopMode !== undefined) guild.settings.loopMode = loopMode;
      if (announce !== undefined) guild.settings.announce = announce;
    }

    await guild.save();
    res.json({ success: true, settings: guild.settings });
  } catch (err) {
    next(err);
  }
}
