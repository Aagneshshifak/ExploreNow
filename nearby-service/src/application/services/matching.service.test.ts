import { MatchingService } from './matching.service';
import { ILocationRepository } from '../../domain/interfaces/location.repository.interface';
import { LiveLocation } from '../../domain/entities/location.entity';
import { getH3Index } from '../../utils/h3.util';

describe('MatchingService', () => {
  let matchingService: MatchingService;
  let mockLocationRepo: jest.Mocked<ILocationRepository>;

  const SEARCHER_ID = 'user_searcher';
  const SEARCHER_LAT = 40.7128;
  const SEARCHER_LNG = -74.0060;

  beforeEach(() => {
    // Setup Mock Repository
    mockLocationRepo = {
      saveLocation: jest.fn(),
      getLocationByUserId: jest.fn(),
      getActiveUsersInH3Cell: jest.fn(),
      markUserOffline: jest.fn(),
    };

    matchingService = new MatchingService(mockLocationRepo);
  });

  test('should return empty array if no users found in H3 buckets', async () => {
    // Mock H3 buckets returning empty arrays
    mockLocationRepo.getActiveUsersInH3Cell.mockResolvedValue([]);

    const results = await matchingService.findNearbyCandidates(SEARCHER_ID, SEARCHER_LAT, SEARCHER_LNG, 500);
    
    expect(results).toEqual([]);
    expect(mockLocationRepo.getActiveUsersInH3Cell).toHaveBeenCalled();
  });

  test('should filter out the searcher from the results', async () => {
    // Searcher is in the bucket
    mockLocationRepo.getActiveUsersInH3Cell.mockResolvedValue([SEARCHER_ID, 'user_2']);
    
    // User 2's exact location is within 10 meters
    mockLocationRepo.getLocationByUserId.mockResolvedValue({
      userId: 'user_2',
      lat: 40.71281, // very close
      lng: -74.0060,
      ts: Date.now(),
      h3: 'mock_h3',
      on: 1
    } as LiveLocation);

    const results = await matchingService.findNearbyCandidates(SEARCHER_ID, SEARCHER_LAT, SEARCHER_LNG, 500);
    
    expect(results.length).toBe(1);
    expect(results[0].userId).toBe('user_2');
    expect(mockLocationRepo.getLocationByUserId).not.toHaveBeenCalledWith(SEARCHER_ID);
  });

  test('should exclude users who fall outside the exact Haversine radius (false positives from H3)', async () => {
    // Both users are in the same general neighborhood H3 bucket ring
    mockLocationRepo.getActiveUsersInH3Cell.mockResolvedValue(['user_close', 'user_far']);
    
    // Close user is 10m away
    mockLocationRepo.getLocationByUserId.mockImplementation(async (id) => {
      if (id === 'user_close') {
        return { userId: 'user_close', lat: 40.71281, lng: -74.0060, ts: Date.now(), h3: 'mock', on: 1 };
      }
      if (id === 'user_far') {
        // Far user is ~1km away, technically caught in a large k-ring but fails exact radius test
        return { userId: 'user_far', lat: 40.7200, lng: -74.0060, ts: Date.now(), h3: 'mock', on: 1 };
      }
      return null;
    });

    // Request 500m radius
    const results = await matchingService.findNearbyCandidates(SEARCHER_ID, SEARCHER_LAT, SEARCHER_LNG, 500);
    
    expect(results.length).toBe(1);
    expect(results[0].userId).toBe('user_close');
    expect(results[0].distanceMeters).toBeLessThan(500);
  });

  test('should exclude users who are offline (on: 0)', async () => {
    mockLocationRepo.getActiveUsersInH3Cell.mockResolvedValue(['user_offline']);
    
    mockLocationRepo.getLocationByUserId.mockResolvedValue({
      userId: 'user_offline',
      lat: 40.71281,
      lng: -74.0060,
      ts: Date.now(),
      h3: 'mock',
      on: 0 // OFFLINE
    } as LiveLocation);

    const results = await matchingService.findNearbyCandidates(SEARCHER_ID, SEARCHER_LAT, SEARCHER_LNG, 500);
    
    expect(results.length).toBe(0);
  });
});
