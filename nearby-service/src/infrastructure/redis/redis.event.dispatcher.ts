import { createClient, RedisClientType } from 'redis';
import { IEventDispatcher } from '../../domain/interfaces/event.dispatcher.interface';
import { config } from '../../config/env.config';
import { logger } from '../../utils/logger.util';

export class RedisEventDispatcher implements IEventDispatcher {
  private publisher: RedisClientType;
  private subscriber: RedisClientType;

  constructor() {
    const isTls = config.REDIS_URL?.startsWith('rediss://');
    const redisOptions = {
      url: config.REDIS_URL,
      ...(isTls && {
        socket: {
          tls: true,
          rejectUnauthorized: false
        }
      })
    };

    this.publisher = createClient(redisOptions);
    this.subscriber = createClient(redisOptions);

    this.publisher.on('error', (err) => logger.error('Redis Publisher Error', err));
    this.subscriber.on('error', (err) => logger.error('Redis Subscriber Error', err));
  }

  public async connect(): Promise<void> {
    await Promise.all([
      this.publisher.connect(),
      this.subscriber.connect()
    ]);
  }

  public async disconnect(): Promise<void> {
    await Promise.all([
      this.publisher.disconnect(),
      this.subscriber.disconnect()
    ]);
  }

  async publish<T>(channel: string, payload: T): Promise<void> {
    const message = JSON.stringify(payload);
    await this.publisher.publish(channel, message);
  }

  async subscribe<T>(channel: string, callback: (payload: T) => void): Promise<void> {
    await this.subscriber.subscribe(channel, (message: string) => {
      try {
        const payload = JSON.parse(message) as T;
        callback(payload);
      } catch (error) {
        logger.error(`Failed to parse Pub/Sub message on channel ${channel}`, error);
      }
    });
  }
}

export const eventDispatcher = new RedisEventDispatcher();
