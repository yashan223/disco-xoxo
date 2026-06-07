import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redis } from '../services/redis.service';
import { logger } from '../utils/logger';

const createStore = () => {
  try {
    const store = new RedisStore({
      sendCommand: async (...args: string[]): Promise<any> => {
        try {
          const [command, ...commandArgs] = args;
          return await redis.call(command, ...commandArgs);
        } catch (err: any) {
          logger.error(`Redis rate limit command failed: ${err.message}`);
          throw err;
        }
      }
    });

    // Handle initial script load rejections gracefully to prevent unhandled promise rejections
    store.incrementScriptSha.catch((err: any) => {
      logger.warn(`Redis rate limit script load failed (increment): ${err.message}`);
    });
    store.getScriptSha.catch((err: any) => {
      logger.warn(`Redis rate limit script load failed (get): ${err.message}`);
    });

    return store;
  } catch (err: any) {
    logger.warn(`Redis rate limit store creation failed: ${err.message}`);
    return undefined;
  }
};

// General API rate limit
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,     // 1 minute
  max: 100,
  message: { error: 'RATE_LIMITED', message: 'Too many requests', statusCode: 429 },
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore(),
  passOnStoreError: true,
});

// Auth endpoints rate limit (stricter)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 20,
  message: { error: 'RATE_LIMITED', message: 'Too many auth requests', statusCode: 429 },
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore(),
  passOnStoreError: true,
});

// Player control rate limit
export const playerLimiter = rateLimit({
  windowMs: 1000,    // 1 second
  max: 5,
  message: { error: 'RATE_LIMITED', message: 'Too many player requests', statusCode: 429 },
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore(),
  passOnStoreError: true,
  skip: () => false,
});
