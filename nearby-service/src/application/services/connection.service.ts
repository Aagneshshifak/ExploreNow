import { IConnectionRepository, ConnectionStatus } from '../../domain/interfaces/connection.repository.interface';
import { IEventDispatcher } from '../../domain/interfaces/event.dispatcher.interface';
import { logger } from '../../utils/logger.util';

export class ConnectionService {
  constructor(
    private readonly connectionRepo: IConnectionRepository,
    private readonly eventDispatcher: IEventDispatcher
  ) {}

  public async sendRequest(senderId: string, receiverId: string): Promise<void> {
    logger.info(`User ${senderId} sent connection request to ${receiverId}`);
    
    await this.connectionRepo.upsertConnection(senderId, receiverId, 'PENDING');
    await this.connectionRepo.logAudit(senderId, 'CONNECTION_REQUEST_SENT', { receiverId });
    
    // Publish event so receiver gets real-time notification
    await this.eventDispatcher.publish('channel:connection_requested', { senderId, receiverId });
  }

  public async respondToRequest(responderId: string, senderId: string, status: ConnectionStatus): Promise<void> {
    logger.info(`User ${responderId} responded to ${senderId} with ${status}`);
    
    await this.connectionRepo.upsertConnection(senderId, responderId, status);
    await this.connectionRepo.logAudit(responderId, `CONNECTION_REQUEST_${status}`, { senderId });

    if (status === 'ACCEPTED') {
      // Trigger instant UI unlock for both users
      await this.eventDispatcher.publish('channel:connection_accepted', { userA: responderId, userB: senderId });
    }
  }
}
