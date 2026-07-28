import { IOfflineQueueRepository, OfflineMessage } from '../../domain/interfaces/offline.queue.repository.interface';
import { redisDB } from '../redis/redis.client';
import { logger } from '../../utils/logger.util';

export class RedisOfflineQueueRepository implements IOfflineQueueRepository {
  
  private getQueueKey(userId: string): string {
    return `user:offline_queue:${userId}`;
  }

  async pushMessage(userId: string, message: OfflineMessage): Promise<void> {
    try {
      const key = this.getQueueKey(userId);
      const data = JSON.stringify(message);
      
      // Use pipeline to push and set expiry (e.g., 7 days max for offline messages)
      const pipeline = redisDB.client.multi();
      pipeline.rPush(key, data);
      pipeline.expire(key, 7 * 24 * 60 * 60);
      await pipeline.exec();

      logger.debug(`Pushed offline message to ${userId}`);
    } catch (error) {
      logger.error(`Failed to push offline message for ${userId}`, error);
    }
  }

  async getAndClearMessages(userId: string): Promise<OfflineMessage[]> {
    try {
      const key = this.getQueueKey(userId);
      
      // We use a transaction (MULTI) to fetch the list and delete it atomically
      const pipeline = redisDB.client.multi();
      pipeline.lRange(key, 0, -1);
      pipeline.del(key);
      
      const results = await pipeline.exec();
      
      if (!results || results.length === 0) return [];

      // The 0th result is from lRange
      const listData = results[0] as unknown as string[];
      if (!listData || listData.length === 0) return [];

      const messages: OfflineMessage[] = listData.map(item => JSON.parse(item));
      logger.debug(`Flushed ${messages.length} offline messages for ${userId}`);
      
      return messages;
    } catch (error) {
      logger.error(`Failed to fetch/clear offline queue for ${userId}`, error);
      return [];
    }
  }
}
