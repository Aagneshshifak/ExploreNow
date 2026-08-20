import { createClient, RedisClientType } from 'redis';
import { IEventDispatcher } from '../../domain/interfaces/event.dispatcher.interface';
import { config } from '../../config/env.config';
import { logger } from '../../utils/logger.util';

export class RedisEventDispatcher implements IEventDispatcher {
  private publisher: RedisClientType;
  private subscriber: RedisClientType;

  constructor() {
    const isTls = config.REDIS_URL?.startsWith('rediss://');

    // Stop retrying on permanent errors (e.g. Upstash max_requests_limit).
    // Returning a non-number / Error from reconnectStrategy tells the client
    // to give up instead of scheduling another reconnect attempt — which would
    // otherwise surface as an unhandled promise rejection and crash the process.
    const reconnectStrategy = (retries: number, cause: Error) => {
      const isPermanent =
        cause?.message?.includes('max requests limit exceeded') ||
        cause?.message?.includes('WRONGPASS') ||
        cause?.message?.includes('NOAUTH');

      if (isPermanent) {
        logger.error('Redis permanent error — stopping reconnection', cause.message);
        return new Error('Permanent Redis error, aborting reconnect');
      }

      // Exponential back-off capped at 30 s for transient errors
      return Math.min(retries * 500, 30_000);
    };

    const redisOptions = {
      url: config.REDIS_URL,
      socket: {
        ...(isTls ? { tls: true, rejectUnauthorized: false } : {}),
        reconnectStrategy,
      },
    };

    this.publisher = createClient(redisOptions);
    this.subscriber = createClient(redisOptions);

    this.publisher.on('error', (err) => logger.error('Redis Publisher Error', err));
    this.subscriber.on('error', (err) => logger.error('Redis Subscriber Error', err));
  }

  public async connect(): Promise<void> {
    try {
      await Promise.all([
        this.publisher.connect(),
        this.subscriber.connect()
      ]);
    } catch (error) {
      // Log but don't crash — the error handler on each client will also fire.
      // The reconnectStrategy above will prevent infinite retry loops on
      // permanent errors such as Upstash's max_requests_limit.
      logger.error('Redis EventDispatcher failed to connect', error);
    }
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
