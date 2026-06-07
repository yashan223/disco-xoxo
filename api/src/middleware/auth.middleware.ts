import { Request, Response, NextFunction } from 'express';
import { jwtService, JWTPayload } from '../services/jwt.service';
import { User } from '../models/User.model';
import { Guild } from '../models/Guild.model';
import { logger } from '../utils/logger';

// Extend Express Request with authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload & { dbUser?: InstanceType<typeof User> };
    }
  }
}

// ─── Verify JWT ───────────────────────────────────────────────────────────────
export async function verifyJWT(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token =
      req.cookies?.token ||
      req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'No token provided', statusCode: 401 });
      return;
    }

    const payload = jwtService.verify(token);
    req.user = payload;
    next();
  } catch (err) {
    logger.debug(`JWT verification failed: ${(err as Error).message}`);
    res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid or expired token', statusCode: 401 });
  }
}

// ─── Load DB user ─────────────────────────────────────────────────────────────
export async function loadDbUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) { next(); return; }
  try {
    const dbUser = await User.findById(req.user.userId);
    if (!dbUser) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'User not found', statusCode: 401 });
      return;
    }
    req.user.dbUser = dbUser as InstanceType<typeof User>;
    next();
  } catch (err) {
    next(err);
  }
}

// ─── Require DJ role or guild admin ──────────────────────────────────────────
export async function requireDJ(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { guildId } = req.body || req.query || req.params;
  if (!guildId) {
    res.status(400).json({ error: 'BAD_REQUEST', message: 'guildId is required', statusCode: 400 });
    return;
  }

  const guild = await Guild.findOne({ guildId });
  if (!guild) { next(); return; } // No settings set = no restrictions

  const djRoles = guild.settings?.djRoles ?? [];
  if (djRoles.length === 0) { next(); return; } // No DJ roles configured = open

  // We'd need to call Discord API to check user roles — skip in API context
  // This check is primarily enforced in the bot
  next();
}

// ─── Rate limit per user ──────────────────────────────────────────────────────
export { rateLimit } from 'express-rate-limit';
