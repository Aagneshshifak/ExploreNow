import { MatchingService } from './matching.service';
import { ILocationRepository } from '../../domain/interfaces/location.repository.interface';
import { IPrivacyRepository } from '../../domain/interfaces/privacy.repository.interface';
import { IUserProfileRepository, UserProfile } from '../../domain/interfaces/profile.repository.interface';
import { IConnectionRepository } from '../../domain/interfaces/connection.repository.interface';
import { LiveLocation } from '../../domain/entities/location.entity';

describe('MatchingService (Privacy & Connections Enforced)', () => {
  let matchingService: MatchingService;
  let mockLocationRepo: jest.Mocked<ILocationRepository>;
  let mockPrivacyRepo: jest.Mocked<IPrivacyRepository>;
  let mockProfileRepo: jest.Mocked<IUserProfileRepository>;
  let mockConnectionRepo: jest.Mocked<IConnectionRepository>;

  const SEARCHER_ID = 'user_searcher';
  const SEARCHER_LAT = 40.7128;
  const SEARCHER_LNG = -74.0060;

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

    mockProfileRepo = {
      getProfilesBatch: jest.fn(),
    };

    mockConnectionRepo = {
      upsertConnection: jest.fn(),
      getApprovedConnections: jest.fn(),
      logAudit: jest.fn()
    };

    matchingService = new MatchingService(mockLocationRepo, mockPrivacyRepo, mockProfileRepo, mockConnectionRepo);

    // Default mocks
    mockPrivacyRepo.filterDiscoverableUsers.mockImplementation(async (ids) => ids); // All discoverable
    mockProfileRepo.getProfilesBatch.mockImplementation(async (ids) => {
      const map = new Map<string, UserProfile>();
      ids.forEach(id => map.set(id, { userId: id, username: `name_${id}`, avatarUrl: 'img' }));
      return map;
    });
    mockConnectionRepo.getApprovedConnections.mockResolvedValue(new Set());
  });

  test('should obscure distance and NOT expose GPS for strangers', async () => {
    mockLocationRepo.getActiveUsersInH3Cell.mockResolvedValue(['user_stranger']);
    
    mockLocationRepo.getLocationByUserId.mockResolvedValue({
      userId: 'user_stranger', lat: 40.71281, lng: -74.0060, ts: Date.now(), h3: 'mock', on: 1
    } as LiveLocation);

    const results = await matchingService.findNearbyCandidates(SEARCHER_ID, SEARCHER_LAT, SEARCHER_LNG, 500);
    
    expect(results.length).toBe(1);
    expect(results[0].approximateDistanceMeters).toBe(50);
    expect(results[0].exactLatitude).toBeUndefined();
    expect(results[0].exactLongitude).toBeUndefined();
    expect(results[0].isConnected).toBe(false);
  });

  test('should expose exact GPS coordinates for approved mutual connections', async () => {
    mockLocationRepo.getActiveUsersInH3Cell.mockResolvedValue(['user_friend']);
    
    mockLocationRepo.getLocationByUserId.mockResolvedValue({
      userId: 'user_friend', lat: 40.71587, lng: -74.0060, ts: Date.now(), h3: 'mock', on: 1
    } as LiveLocation);

    // Mock that they are approved friends
    mockConnectionRepo.getApprovedConnections.mockResolvedValue(new Set(['user_friend']));

    const results = await matchingService.findNearbyCandidates(SEARCHER_ID, SEARCHER_LAT, SEARCHER_LNG, 1000);
    
    expect(results.length).toBe(1);
    expect(results[0].approximateDistanceMeters).toBe(300); // Distance still bucketed for UI consistency
    expect(results[0].isConnected).toBe(true);
    // Exact GPS UNLOCKED!
    expect(results[0].exactLatitude).toBe(40.71587);
    expect(results[0].exactLongitude).toBe(-74.0060);
  });
});
