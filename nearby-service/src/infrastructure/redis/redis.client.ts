import { createClient, RedisClientType } from 'redis';
import { logger } from '../../utils/logger.util';
import { config } from '../../config/env.config';

class RedisDatabase {
  public client: RedisClientType;

  constructor() {
    const isTls = config.REDIS_URL?.startsWith('rediss://');

    // Stop retrying on permanent errors (e.g. Upstash max_requests_limit).
    // Returning an Error aborts the reconnect loop; returning a number delays
    // the next attempt by that many milliseconds.
    const reconnectStrategy = (retries: number, cause: Error) => {
      const isPermanent =
        cause?.message?.includes('max requests limit exceeded') ||
        cause?.message?.includes('WRONGPASS') ||
        cause?.message?.includes('NOAUTH');

      if (isPermanent) {
        logger.error('Redis permanent error — stopping reconnection', cause.message);
        return new Error('Permanent Redis error, aborting reconnect');
      }

      return Math.min(retries * 500, 30_000);
    };

    this.client = createClient({
      url: config.REDIS_URL,
      socket: {
        ...(isTls ? { tls: true, rejectUnauthorized: false } : {}),
        reconnectStrategy,
      },
    });

    this.client.on('error', (err) => {
      logger.error('❌ Redis Client Error', err);
    });

    this.client.on('connect', () => {
      logger.info('✅ Redis connected successfully');
    });
  }

  public async connect(): Promise<void> {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
  }

  public async disconnect(): Promise<void> {
    if (this.client.isOpen) {
      await this.client.disconnect();
      logger.info('🔌 Redis disconnected');
    }
  }
}

export const redisDB = new RedisDatabase();
