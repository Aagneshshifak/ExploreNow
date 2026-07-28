import { LocationService } from './location.service';
import { ILocationRepository } from '../../domain/interfaces/location.repository.interface';
import { IPrivacyRepository } from '../../domain/interfaces/privacy.repository.interface';
import { IEventDispatcher } from '../../domain/interfaces/event.dispatcher.interface';
import { UpdateLocationDTO } from '../dtos/location.dto';

describe('LocationService', () => {
  let locationService: LocationService;
  let mockLocationRepo: jest.Mocked<ILocationRepository>;
  let mockPrivacyRepo: jest.Mocked<IPrivacyRepository>;
  let mockEventDispatcher: jest.Mocked<IEventDispatcher>;

  const MOCK_USER_ID = 'user_123';
  const MOCK_DTO: UpdateLocationDTO = {
    latitude: 40.7128,
    longitude: -74.0060,
    speed: 1.5,
    direction: 90
  };

  beforeEach(() => {
    mockLocationRepo = {
      saveLocation: jest.fn(),
      getLocationByUserId: jest.fn(),
      getActiveUsersInH3Cell: jest.fn(),
      markUserOffline: jest.fn(),
    };

    mockPrivacyRepo = {
      isUserDiscoverable: jest.fn(),
      filterDiscoverableUsers: jest.fn(),
    };

    mockEventDispatcher = {
      publish: jest.fn(),
      subscribe: jest.fn(),
    };

    locationService = new LocationService(mockLocationRepo, mockPrivacyRepo, mockEventDispatcher);
  });

  test('should process location, save to Redis, and publish event for discoverable user', async () => {
    mockPrivacyRepo.isUserDiscoverable.mockResolvedValue(true);

    await locationService.updateLocation(MOCK_USER_ID, MOCK_DTO);

    // Verify Privacy check
    expect(mockPrivacyRepo.isUserDiscoverable).toHaveBeenCalledWith(MOCK_USER_ID);

    // Verify Redis save
    expect(mockLocationRepo.saveLocation).toHaveBeenCalled();
    const savedLocation = mockLocationRepo.saveLocation.mock.calls[0][0];
    expect(savedLocation.userId).toBe(MOCK_USER_ID);
    expect(savedLocation.on).toBe(1); // Online
    expect(savedLocation.h3).not.toBe('GHOST'); // Real H3 cell

    // Verify Event dispatch
    expect(mockEventDispatcher.publish).toHaveBeenCalledWith('channel:location_updated', savedLocation);
  });

  test('should save to Redis but NOT publish event or add to active H3 bucket for Ghost Mode users', async () => {
    mockPrivacyRepo.isUserDiscoverable.mockResolvedValue(false); // Ghost mode

    await locationService.updateLocation(MOCK_USER_ID, MOCK_DTO);

    expect(mockLocationRepo.saveLocation).toHaveBeenCalled();
    const savedLocation = mockLocationRepo.saveLocation.mock.calls[0][0];
    
    // Ghost Mode checks
    expect(savedLocation.h3).toBe('GHOST');
    expect(savedLocation.on).toBe(0); // Appears offline

    // Verify NO event dispatched
    expect(mockEventDispatcher.publish).not.toHaveBeenCalled();
  });
});
