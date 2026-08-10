import { createClient, RedisClientType } from 'redis';
import { logger } from '../../utils/logger.util';
import { config } from '../../config/env.config';

class RedisDatabase {
  public client: RedisClientType;

  constructor() {
    const isTls = config.REDIS_URL?.startsWith('rediss://');
    this.client = createClient({
      url: config.REDIS_URL,
      ...(isTls && {
        socket: {
          tls: true,
          rejectUnauthorized: false
        }
      })
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
