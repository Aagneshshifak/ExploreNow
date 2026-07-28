import { ILocationRepository } from '../../domain/interfaces/location.repository.interface';
import { getH3Index, getNeighboringCells, calculateRingSize, calculateHaversineDistance, DEFAULT_H3_RESOLUTION } from '../../utils/h3.util';
import { LiveLocation } from '../../domain/entities/location.entity';
import { logger } from '../../utils/logger.util';

export interface NearbyCandidate {
  userId: string;
  latitude: number;
  longitude: number;
  distanceMeters: number;
}

export class MatchingService {
  constructor(
    private readonly locationRepo: ILocationRepository,
    // Inject PrivacyRepository here in a real implementation:
    // private readonly privacyRepo: IPrivacyRepository 
  ) {}

  /**
   * Finds nearby users utilizing the two-phase H3 -> Haversine filtering approach.
   * 
   * @param searcherId The ID of the user requesting the search
   * @param lat Search center latitude
   * @param lng Search center longitude
   * @param radiusMeters Maximum distance to search
   * @returns Array of candidates strictly within the requested radius
   */
  public async findNearbyCandidates(
    searcherId: string, 
    lat: number, 
    lng: number, 
    radiusMeters: number
  ): Promise<NearbyCandidate[]> {
    logger.debug(`Searching for candidates near [${lat}, ${lng}] within ${radiusMeters}m for user ${searcherId}`);

    // PHASE 1: Geographic Bucketing (O(1) Redis fetch)
    
    // 1. Calculate the central cell
    const centerCell = getH3Index(lat, lng, DEFAULT_H3_RESOLUTION);
    
    // 2. Determine how many neighbor rings we need to cover the radius
    const ringSize = calculateRingSize(radiusMeters, DEFAULT_H3_RESOLUTION);
    
    // 3. Get all cells to search
    const cellsToSearch = getNeighboringCells(centerCell, ringSize);
    
    // 4. Fetch user IDs from all these cells concurrently from Redis
    const cellPromises = cellsToSearch.map(cell => this.locationRepo.getActiveUsersInH3Cell(cell));
    const cellResults = await Promise.all(cellPromises);
    
    // 5. Flatten and deduplicate user IDs (a user might hop cells right as we query)
    const uniqueUserIds = new Set<string>();
    cellResults.forEach(bucket => {
      bucket.forEach(userId => {
        if (userId !== searcherId) { // Exclude the searcher
          uniqueUserIds.add(userId);
        }
      });
    });

    if (uniqueUserIds.size === 0) {
      return [];
    }

    // TODO: Privacy Check
    // const discoverableUsers = await this.privacyRepo.filterDiscoverable(Array.from(uniqueUserIds));
    // For now, assume all returned users are discoverable.
    const discoverableUsers = Array.from(uniqueUserIds);

    // PHASE 2: Exact Distance Filtering (CPU Math)
    
    // 6. Fetch exact locations for the candidates
    const locationPromises = discoverableUsers.map(id => this.locationRepo.getLocationByUserId(id));
    const rawLocations = await Promise.all(locationPromises);

    const validCandidates: NearbyCandidate[] = [];

    // 7. Haversine refinement
    for (const loc of rawLocations) {
      if (!loc || loc.on === 0) continue; // Skip offline or missing users

      const distance = calculateHaversineDistance(lat, lng, loc.lat, loc.lng);
      
      // Strict radius check
      if (distance <= radiusMeters) {
        validCandidates.push({
          userId: loc.userId,
          latitude: loc.lat,
          longitude: loc.lng,
          distanceMeters: Math.round(distance), // Round to nearest meter
        });
      }
    }

    // Sort by closest first
    validCandidates.sort((a, b) => a.distanceMeters - b.distanceMeters);

    logger.debug(`Found ${validCandidates.length} valid candidates for ${searcherId}`);
    return validCandidates;
  }
}
