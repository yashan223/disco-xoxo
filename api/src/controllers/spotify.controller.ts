import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { User } from '../models/User.model';
import { spotifyService } from '../services/spotify.service';
import { env } from '../utils/env';
import { logger } from '../utils/logger';

export async function linkSpotify(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const state = crypto.randomBytes(16).toString('hex');
    // Save state in a secure cookie or database to verify on callback.
    // In this case, we send the redirect URL back to the frontend.
    // The frontend will redirect the user. We will also set cookies so the callback route can verify.
    res.cookie('spotify_state', state, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      maxAge: 5 * 60 * 1000,
      sameSite: 'lax',
    });
    res.cookie('spotify_user', req.user!.userId, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      maxAge: 5 * 60 * 1000,
      sameSite: 'lax',
    });

    const redirectUrl = spotifyService.getAuthUrl(state);
    res.json({ redirectUrl });
  } catch (err) {
    next(err);
  }
}

export async function linkBotSpotify(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const state = crypto.randomBytes(16).toString('hex');
    res.cookie('spotify_state', state, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      maxAge: 5 * 60 * 1000,
      sameSite: 'lax',
    });
    res.cookie('spotify_is_bot', 'true', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      maxAge: 5 * 60 * 1000,
      sameSite: 'lax',
    });

    const redirectUrl = spotifyService.getAuthUrl(state);
    res.json({ redirectUrl });
  } catch (err) {
    next(err);
  }
}

export async function unlinkSpotify(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await User.findById(req.user!.userId);
    if (!user) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'User not found', statusCode: 404 });
      return;
    }

    user.spotifyId = undefined;
    user.spotifyAccessToken = undefined;
    user.spotifyRefreshToken = undefined;
    user.spotifyTokenExpiry = undefined;
    user.spotifyDisplayName = undefined;
    await user.save();

    res.json({ success: true, message: 'Spotify account unlinked successfully' });
  } catch (err) {
    next(err);
  }
}

export async function unlinkBotSpotify(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await User.findOne({ discordId: 'bot' });
    if (!user) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Bot user not found', statusCode: 404 });
      return;
    }

    user.spotifyId = undefined;
    user.spotifyAccessToken = undefined;
    user.spotifyRefreshToken = undefined;
    user.spotifyTokenExpiry = undefined;
    user.spotifyDisplayName = undefined;
    await user.save();

    res.json({ success: true, message: 'Bot Spotify account unlinked successfully' });
  } catch (err) {
    next(err);
  }
}

export async function getPlaylists(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await User.findById(req.user!.userId);
    if (!user || !user.spotifyId) {
      res.status(400).json({ error: 'SPOTIFY_NOT_LINKED', message: 'Spotify account is not linked', statusCode: 400 });
      return;
    }

    const playlists = await spotifyService.getUserPlaylists(user.id);
    res.json({ playlists });
  } catch (err) {
    next(err);
  }
}

export async function getLikedSongs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await User.findById(req.user!.userId);
    if (!user || !user.spotifyId) {
      res.status(400).json({ error: 'SPOTIFY_NOT_LINKED', message: 'Spotify account is not linked', statusCode: 400 });
      return;
    }

    const limit = parseInt(req.query.limit as string, 10) || 50;
    const offset = parseInt(req.query.offset as string, 10) || 0;

    const songs = await spotifyService.getUserLikedSongs(user.id, limit, offset);
    res.json({ songs });
  } catch (err) {
    next(err);
  }
}

export async function getSavedAlbums(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await User.findById(req.user!.userId);
    if (!user || !user.spotifyId) {
      res.status(400).json({ error: 'SPOTIFY_NOT_LINKED', message: 'Spotify account is not linked', statusCode: 400 });
      return;
    }

    const albums = await spotifyService.getUserSavedAlbums(user.id);
    res.json({ albums });
  } catch (err) {
    next(err);
  }
}

export async function search(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { q, type } = req.query;
    if (!q) {
      res.status(400).json({ error: 'BAD_REQUEST', message: 'Query parameter q is required', statusCode: 400 });
      return;
    }

    // Default to track search if no type is provided
    const searchTypes = type
      ? (type as string).split(',').filter(t => ['track', 'album', 'playlist', 'artist'].includes(t))
      : ['track'];

    if (searchTypes.length === 0) {
      res.status(400).json({ error: 'BAD_REQUEST', message: 'Invalid search types', statusCode: 400 });
      return;
    }

    const results = await spotifyService.search(q as string, searchTypes as any);
    res.json(results);
  } catch (err) {
    next(err);
  }
}

export async function addFavorite(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { trackId } = req.body;
    if (!trackId) {
      res.status(400).json({ error: 'BAD_REQUEST', message: 'trackId is required', statusCode: 400 });
      return;
    }

    const user = await User.findById(req.user!.userId);
    if (!user) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'User not found', statusCode: 404 });
      return;
    }

    if (!user.favorites.includes(trackId)) {
      user.favorites.push(trackId);
      await user.save();
    }

    res.json({ success: true, favorites: user.favorites });
  } catch (err) {
    next(err);
  }
}

export async function removeFavorite(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { trackId } = req.params;
    if (!trackId) {
      res.status(400).json({ error: 'BAD_REQUEST', message: 'trackId is required', statusCode: 400 });
      return;
    }

    const user = await User.findById(req.user!.userId);
    if (!user) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'User not found', statusCode: 404 });
      return;
    }

    user.favorites = user.favorites.filter(id => id !== trackId);
    await user.save();

    res.json({ success: true, favorites: user.favorites });
  } catch (err) {
    next(err);
  }
}

export async function getFavorites(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await User.findById(req.user!.userId);
    if (!user) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'User not found', statusCode: 404 });
      return;
    }

    // Resolve details for each favorite track via Spotify
    const tracks = await Promise.all(
      user.favorites.map(async (id) => {
        try {
          return await spotifyService.getTrack(id);
        } catch {
          return null; // Skip if song cannot be found/resolved
        }
      })
    );

    res.json({ favorites: tracks.filter(t => t !== null) });
  } catch (err) {
    next(err);
  }
}
