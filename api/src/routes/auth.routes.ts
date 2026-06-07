import { Router, Request, Response, NextFunction } from 'express';
import axios from 'axios';
import crypto from 'crypto';
import { User } from '../models/User.model';
import { Guild } from '../models/Guild.model';
import { jwtService } from '../services/jwt.service';
import { spotifyService } from '../services/spotify.service';
import { verifyJWT } from '../middleware/auth.middleware';
import { authLimiter } from '../middleware/rateLimit.middleware';
import { env } from '../utils/env';
import { logger } from '../utils/logger';
import { Log } from '../models/Log.model';

const router = Router();

// ─── Discord OAuth2 ───────────────────────────────────────────────────────────

router.get('/discord', authLimiter, (req: Request, res: Response) => {
  const state = crypto.randomBytes(16).toString('hex');
  res.cookie('oauth_state', state, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    maxAge: 5 * 60 * 1000,
    sameSite: 'lax',
  });
  const params = new URLSearchParams({
    client_id: env.CLIENT_ID,
    redirect_uri: env.DISCORD_REDIRECT_URI,
    response_type: 'code',
    scope: 'identify guilds email',
    state,
  });
  res.redirect(`https://discord.com/api/oauth2/authorize?${params.toString()}`);
});

router.get(
  '/discord/callback',
  authLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { code, state, error } = req.query;

      if (error) {
        res.redirect(`${env.DASHBOARD_URL}/login?error=discord_denied`);
        return;
      }

      const storedState = req.cookies?.oauth_state;
      if (!state || state !== storedState) {
        res.redirect(`${env.DASHBOARD_URL}/login?error=invalid_state`);
        return;
      }
      res.clearCookie('oauth_state');

      // Exchange code for Discord token
      const tokenRes = await axios.post(
        'https://discord.com/api/oauth2/token',
        new URLSearchParams({
          client_id: env.CLIENT_ID,
          client_secret: env.CLIENT_SECRET,
          grant_type: 'authorization_code',
          code: code as string,
          redirect_uri: env.DISCORD_REDIRECT_URI,
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      const { access_token } = tokenRes.data;

      // Get Discord user profile
      const userRes = await axios.get('https://discord.com/api/users/@me', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const discordUser = userRes.data;

      // Get user's guilds
      const guildsRes = await axios.get('https://discord.com/api/users/@me/guilds', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const guilds = guildsRes.data;

      // Upsert user in DB
      const user = await User.findOneAndUpdate(
        { discordId: discordUser.id },
        {
          $set: {
            username: discordUser.username,
            discriminator: discordUser.discriminator || '0',
            avatar: discordUser.avatar
              ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
              : null,
            email: discordUser.email,
          },
          $setOnInsert: { discordId: discordUser.id, createdAt: new Date() },
        },
        { upsert: true, new: true }
      );

      // Sync guilds where user is admin
      for (const g of guilds) {
        if ((g.permissions & 0x8) !== 0) {
          // ADMINISTRATOR permission
          await Guild.findOneAndUpdate(
            { guildId: g.id },
            { $set: { name: g.name, icon: g.icon, ownerId: discordUser.id } },
            { upsert: true }
          );
        }
      }

      // Issue JWT
      const token = jwtService.sign({
        userId: user._id.toString(),
        discordId: user.discordId,
        username: user.username,
      });

      // Log event
      await Log.create({
        guildId: 'global',
        userId: user.discordId,
        username: user.username,
        action: 'LOGIN',
        timestamp: new Date(),
      }).catch(() => {});

      res.cookie('token', token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: 'lax',
      });

      res.redirect(`${env.DASHBOARD_URL}/servers?token=${token}`);
    } catch (err) {
      logger.error(`Discord callback error: ${(err as Error).message}`);
      res.redirect(`${env.DASHBOARD_URL}/login?error=auth_failed`);
    }
  }
);

// ─── Spotify OAuth2 ───────────────────────────────────────────────────────────

router.get(
  '/spotify',
  authLimiter,
  verifyJWT,
  (req: Request, res: Response): void => {
    const state = crypto.randomBytes(16).toString('hex');
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
    res.redirect(spotifyService.getAuthUrl(state));
  }
);

router.get(
  '/spotify/callback',
  authLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { code, state, error } = req.query;

      if (error) {
        res.redirect(`${env.DASHBOARD_URL}/profile?error=spotify_denied`);
        return;
      }

      const storedState = req.cookies?.spotify_state;
      const userId = req.cookies?.spotify_user;
      const isBot = req.cookies?.spotify_is_bot === 'true';

      if (!state || state !== storedState || (!userId && !isBot)) {
        res.redirect(`${env.DASHBOARD_URL}/profile?error=invalid_state`);
        return;
      }
      res.clearCookie('spotify_state');
      res.clearCookie('spotify_user');
      res.clearCookie('spotify_is_bot');

      const tokens = await spotifyService.exchangeCode(code as string);
      const profile = await spotifyService.getSpotifyProfile(tokens.access_token);

      if (isBot) {
        await User.findOneAndUpdate(
          { discordId: 'bot' },
          {
            $set: {
              username: 'Bot',
              spotifyId: profile.id,
              spotifyAccessToken: tokens.access_token,
              spotifyRefreshToken: tokens.refresh_token,
              spotifyTokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
              spotifyDisplayName: profile.display_name,
            },
          },
          { upsert: true }
        );

        await Log.create({
          guildId: 'global',
          userId: 'bot',
          action: 'SPOTIFY_LINK',
          timestamp: new Date(),
        }).catch(() => {});

        res.redirect(`${env.DASHBOARD_URL}/servers`); // Admin could be from any server, just redirect to servers for simplicity
      } else {
        await User.findByIdAndUpdate(userId, {
          $set: {
            spotifyId: profile.id,
            spotifyAccessToken: tokens.access_token,
            spotifyRefreshToken: tokens.refresh_token,
            spotifyTokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
            spotifyDisplayName: profile.display_name,
          },
        });

        await Log.create({
          guildId: 'global',
          userId,
          action: 'SPOTIFY_LINK',
          timestamp: new Date(),
        }).catch(() => {});

        res.redirect(`${env.DASHBOARD_URL}/servers`); // Profile doesn't exist, redirect to servers instead
      }
    } catch (err) {
      logger.error(`Spotify callback error: ${(err as Error).message}`);
      res.redirect(`${env.DASHBOARD_URL}/servers`); // Change to servers since profile doesn't exist
    }
  }
);

// ─── Logout ───────────────────────────────────────────────────────────────────

router.get('/logout', (req: Request, res: Response): void => {
  res.clearCookie('token');
  res.redirect(`${env.DASHBOARD_URL}/login`);
});

export default router;
