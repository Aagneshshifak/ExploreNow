import { ConnectionService } from './connection.service';
import { IConnectionRepository } from '../../domain/interfaces/connection.repository.interface';
import { IEventDispatcher } from '../../domain/interfaces/event.dispatcher.interface';
import { OfflineQueueService } from './offline.queue.service';
import { IOfflineQueueRepository } from '../../domain/interfaces/offline.queue.repository.interface';

describe('ConnectionService', () => {
  let connectionService: ConnectionService;
  let mockConnectionRepo: jest.Mocked<IConnectionRepository>;
  let mockEventDispatcher: jest.Mocked<IEventDispatcher>;
  let mockOfflineQueueRepo: jest.Mocked<IOfflineQueueRepository>;
  let offlineQueueService: OfflineQueueService;

  beforeEach(() => {
    mockConnectionRepo = {
      upsertConnection: jest.fn(),
      getApprovedConnections: jest.fn(),
      logAudit: jest.fn()
    };
    mockEventDispatcher = {
      publish: jest.fn(),
      subscribe: jest.fn()
    };
    mockOfflineQueueRepo = {
      pushMessage: jest.fn(),
      getAndClearMessages: jest.fn()
    };
    
    offlineQueueService = new OfflineQueueService(mockOfflineQueueRepo);
    connectionService = new ConnectionService(mockConnectionRepo, mockEventDispatcher, offlineQueueService);
  });

  test('should upsert PENDING connection and log audit when sending request', async () => {
    await connectionService.sendRequest('userA', 'userB');
    expect(mockConnectionRepo.upsertConnection).toHaveBeenCalledWith('userA', 'userB', 'PENDING');
    expect(mockConnectionRepo.logAudit).toHaveBeenCalledWith('userA', 'CONNECTION_REQUEST_SENT', { receiverId: 'userB' });
    expect(mockEventDispatcher.publish).toHaveBeenCalledWith('channel:connection_requested', { senderId: 'userA', receiverId: 'userB' });
  });

  test('should unlock UI by broadcasting ACCEPTED event', async () => {
    await connectionService.respondToRequest('userB', 'userA', 'ACCEPTED');
    expect(mockConnectionRepo.upsertConnection).toHaveBeenCalledWith('userA', 'userB', 'ACCEPTED');
    expect(mockEventDispatcher.publish).toHaveBeenCalledWith('channel:connection_accepted', { userA: 'userB', userB: 'userA' });
  });
});
