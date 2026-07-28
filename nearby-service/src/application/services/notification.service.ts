import { IEventDispatcher } from '../../domain/interfaces/event.dispatcher.interface';
import { logger } from '../../utils/logger.util';
import { EventEmitter } from 'events';

export class NotificationService extends EventEmitter {
  constructor(private readonly eventDispatcher: IEventDispatcher) {
    super();
    this.initializeSubscriptions();
  }

  private async initializeSubscriptions(): Promise<void> {
    try {
      // Listen for connection events
      await this.eventDispatcher.subscribe('channel:connection_requested', (data) => {
        logger.debug('Received connection_requested event from Redis', data);
        this.emit('connection_requested', data);
      });

      await this.eventDispatcher.subscribe('channel:connection_accepted', (data) => {
        logger.debug('Received connection_accepted event from Redis', data);
        this.emit('connection_accepted', data);
      });

      logger.info('NotificationService successfully subscribed to Redis Pub/Sub channels');
    } catch (error) {
      logger.error('Failed to initialize Redis subscriptions in NotificationService', error);
    }
  }

  /**
   * Registers a callback that fires whenever a relevant event occurs for a specific user.
   * This is used by the gRPC streaming handler to pipe events to the client.
   * 
   * @returns A cleanup function to remove the listener
   */
  public registerStreamListener(callback: (event: any) => void): () => void {
    
    const requestHandler = (data: { senderId: string, receiverId: string }) => {
      callback({
        user_id_a: data.senderId,
        user_id_b: data.receiverId,
        match_type: 'CONNECTION_REQUESTED',
        timestamp: Date.now()
      });
    };

    const acceptHandler = (data: { userA: string, userB: string }) => {
      callback({
        user_id_a: data.userA,
        user_id_b: data.userB,
        match_type: 'CONNECTION_ACCEPTED',
        timestamp: Date.now()
      });
    };

    this.on('connection_requested', requestHandler);
    this.on('connection_accepted', acceptHandler);

    // Return a cleanup function
    return () => {
      this.off('connection_requested', requestHandler);
      this.off('connection_accepted', acceptHandler);
    };
  }
}
