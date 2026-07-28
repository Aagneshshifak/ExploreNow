import { NotificationService } from './notification.service';
import { IEventDispatcher } from '../../domain/interfaces/event.dispatcher.interface';

describe('NotificationService', () => {
  let notificationService: NotificationService;
  let mockEventDispatcher: jest.Mocked<IEventDispatcher>;
  let redisCallbacks: Record<string, Function> = {};

  beforeEach(() => {
    redisCallbacks = {};
    mockEventDispatcher = {
      publish: jest.fn(),
      subscribe: jest.fn().mockImplementation((channel, callback) => {
        redisCallbacks[channel] = callback;
      })
    };
    notificationService = new NotificationService(mockEventDispatcher);
  });

  test('should subscribe to Redis channels on initialization', () => {
    expect(mockEventDispatcher.subscribe).toHaveBeenCalledWith('channel:connection_requested', expect.any(Function));
    expect(mockEventDispatcher.subscribe).toHaveBeenCalledWith('channel:connection_accepted', expect.any(Function));
  });

  test('should pipe connection_requested events to stream listener', (done) => {
    const cleanup = notificationService.registerStreamListener((event) => {
      expect(event.match_type).toBe('CONNECTION_REQUESTED');
      expect(event.user_id_a).toBe('userA');
      expect(event.user_id_b).toBe('userB');
      expect(event.timestamp).toBeDefined();
      cleanup();
      done();
    });

    // Simulate Redis firing an event
    redisCallbacks['channel:connection_requested']({ senderId: 'userA', receiverId: 'userB' });
  });

  test('should pipe connection_accepted events to stream listener', (done) => {
    const cleanup = notificationService.registerStreamListener((event) => {
      expect(event.match_type).toBe('CONNECTION_ACCEPTED');
      expect(event.user_id_a).toBe('user1');
      expect(event.user_id_b).toBe('user2');
      cleanup();
      done();
    });

    // Simulate Redis firing an event
    redisCallbacks['channel:connection_accepted']({ userA: 'user1', userB: 'user2' });
  });

  test('cleanup function should remove listener', () => {
    const callback = jest.fn();
    const cleanup = notificationService.registerStreamListener(callback);
    
    // Fire event once
    redisCallbacks['channel:connection_accepted']({ userA: '1', userB: '2' });
    expect(callback).toHaveBeenCalledTimes(1);

    // Call cleanup
    cleanup();

    // Fire event again
    redisCallbacks['channel:connection_accepted']({ userA: '3', userB: '4' });
    
    // Callback should NOT be called again
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
