import { IOfflineQueueRepository, OfflineMessage } from '../../domain/interfaces/offline.queue.repository.interface';
import crypto from 'crypto';

export class OfflineQueueService {
  constructor(private readonly queueRepo: IOfflineQueueRepository) {}

  /**
   * Enqueues a notification for a user.
   */
  public async enqueueNotification(userId: string, type: string, payload: any): Promise<void> {
    const message: OfflineMessage = {
      id: crypto.randomUUID(),
      type,
      payload,
      timestamp: Date.now()
    };
    await this.queueRepo.pushMessage(userId, message);
  }

  /**
   * Fetches and clears all pending notifications for a user upon socket connection.
   */
  public async flushNotifications(userId: string): Promise<OfflineMessage[]> {
    return await this.queueRepo.getAndClearMessages(userId);
  }
}
