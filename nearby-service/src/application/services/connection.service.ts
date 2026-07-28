import { IConnectionRepository, ConnectionStatus } from '../../domain/interfaces/connection.repository.interface';
import { IEventDispatcher } from '../../domain/interfaces/event.dispatcher.interface';
import { OfflineQueueService } from './offline.queue.service';
import { logger } from '../../utils/logger.util';

export class ConnectionService {
  constructor(
    private readonly connectionRepo: IConnectionRepository,
    private readonly eventDispatcher: IEventDispatcher,
    private readonly offlineQueue: OfflineQueueService
  ) {}

  public async sendRequest(senderId: string, receiverId: string): Promise<void> {
    logger.info(`User ${senderId} sent connection request to ${receiverId}`);
    
    await this.connectionRepo.upsertConnection(senderId, receiverId, 'PENDING');
    await this.connectionRepo.logAudit(senderId, 'CONNECTION_REQUEST_SENT', { receiverId });
    
    // 1. Enqueue offline message for guaranteed delivery
    await this.offlineQueue.enqueueNotification(receiverId, 'CONNECTION_REQUESTED', { senderId });

    // 2. Publish event for real-time WebSocket delivery
    await this.eventDispatcher.publish('channel:connection_requested', { senderId, receiverId });
  }

  public async respondToRequest(responderId: string, senderId: string, status: ConnectionStatus): Promise<void> {
    logger.info(`User ${responderId} responded to ${senderId} with ${status}`);
    
    await this.connectionRepo.upsertConnection(senderId, responderId, status);
    await this.connectionRepo.logAudit(responderId, `CONNECTION_REQUEST_${status}`, { senderId });

    if (status === 'ACCEPTED' || status === 'REJECTED') {
      // 1. Enqueue offline message for the person who originally sent the request
      await this.offlineQueue.enqueueNotification(senderId, `CONNECTION_${status}`, { responderId });

      // 2. Publish real-time event
      await this.eventDispatcher.publish(`channel:connection_${status.toLowerCase()}`, { userA: responderId, userB: senderId });
    }
  }
}
