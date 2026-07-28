import { ILocationRepository } from '../../domain/interfaces/location.repository.interface';
import { LiveLocation } from '../../domain/entities/location.entity';
import { redisDB } from '../redis/redis.client';
import { logger } from '../../utils/logger.util';

export class RedisLocationRepository implements ILocationRepository {
  private readonly LOC_KEY_PREFIX = 'user:loc:';
  private readonly H3_KEY_PREFIX = 'geo:h3:';
  private readonly EVICTION_TIME_MS = 15 * 60 * 1000; // 15 minutes

  async saveLocation(location: LiveLocation): Promise<void> {
    const locKey = `${this.LOC_KEY_PREFIX}${location.userId}`;
    const h3Key = `${this.H3_KEY_PREFIX}${location.h3}`;

    const multi = redisDB.client.multi();

    // 1. Save exact location (MessagePack/JSON string for memory efficiency)
    multi.set(locKey, JSON.stringify(location));

    // 2. Add to spatial bucket for discovery
    multi.zAdd(h3Key, {
      score: location.ts,
      value: location.userId,
    });

    // 3. Evict stale users from this specific bucket
    const staleThreshold = location.ts - this.EVICTION_TIME_MS;
    multi.zRemRangeByScore(h3Key, '-inf', staleThreshold);

    try {
      await multi.exec();
    } catch (error) {
      logger.error(`Failed to save location for user ${location.userId}`, error);
      throw error;
    }
  }

  async getLocationByUserId(userId: string): Promise<LiveLocation | null> {
    const data = await redisDB.client.get(`${this.LOC_KEY_PREFIX}${userId}`);
    if (!data) return null;

    try {
      return JSON.parse(data) as LiveLocation;
    } catch {
      return null;
    }
  }

  async getActiveUsersInH3Cell(h3Index: string): Promise<string[]> {
    const h3Key = `${this.H3_KEY_PREFIX}${h3Index}`;
    const now = Date.now();
    const staleThreshold = now - this.EVICTION_TIME_MS;

    // Optional: Evict on read to ensure we don't return stale users if write throughput is low
    await redisDB.client.zRemRangeByScore(h3Key, '-inf', staleThreshold);

    // Get remaining active users
    return await redisDB.client.zRange(h3Key, 0, -1);
  }

  async markUserOffline(userId: string): Promise<void> {
    const location = await this.getLocationByUserId(userId);
    if (!location) return;

    // Mark as offline but keep the last known location
    location.on = 0;
    
    const multi = redisDB.client.multi();
    multi.set(`${this.LOC_KEY_PREFIX}${userId}`, JSON.stringify(location));
    multi.zRem(`${this.H3_KEY_PREFIX}${location.h3}`, userId);

    await multi.exec();
  }
}
