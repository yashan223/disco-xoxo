import Redis from 'ioredis';
import { env } from '../utils/env';
import { logger } from '../utils/logger';

export const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  retryStrategy: (times) => {
    if (times > 5) {
      logger.error('Redis connection failed after 5 retries');
      return null;
    }
    return Math.min(times * 1000, 5000);
  },
});

redis.on('connect', () => logger.info('✅ Redis connected'));
redis.on('error', (err) => logger.error(`Redis error: ${err.message}`));

export async function connectRedis(): Promise<void> {
  await redis.connect().catch(() => {
    logger.warn('Redis not available — running without cache/rate-limit backing');
  });
}
