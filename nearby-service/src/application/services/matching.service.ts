import { ILocationRepository } from '../../domain/interfaces/location.repository.interface';
import { IPrivacyRepository } from '../../domain/interfaces/privacy.repository.interface';
import { IUserProfileRepository } from '../../domain/interfaces/profile.repository.interface';
import { getH3Index, getNeighboringCells, calculateRingSize, calculateHaversineDistance, DEFAULT_H3_RESOLUTION } from '../../utils/h3.util';
import { LiveLocation } from '../../domain/entities/location.entity';
import { logger } from '../../utils/logger.util';

export interface NearbyCandidate {
  userId: string;
  username: string;
  avatarUrl: string;
  approximateDistanceMeters: number;
}

export class MatchingService {
  constructor(
    private readonly locationRepo: ILocationRepository,
    private readonly privacyRepo: IPrivacyRepository,
    private readonly profileRepo: IUserProfileRepository
  ) {}

  /**
   * Obfuscates distance to prevent precise triangulation attacks.
   */
  private bucketDistance(distance: number): number {
    if (distance < 50) return 50;
    if (distance < 100) return 100;
    // Round to nearest 100m
    return Math.round(distance / 100) * 100;
  }

  public async findNearbyCandidates(
    searcherId: string, 
    lat: number, 
    lng: number, 
    radiusMeters: number
  ): Promise<NearbyCandidate[]> {
    logger.debug(`Searching for candidates near [${lat}, ${lng}] within ${radiusMeters}m for user ${searcherId}`);

    // PHASE 1: Geographic Bucketing
    const centerCell = getH3Index(lat, lng, DEFAULT_H3_RESOLUTION);
    const ringSize = calculateRingSize(radiusMeters, DEFAULT_H3_RESOLUTION);
    const cellsToSearch = getNeighboringCells(centerCell, ringSize);
    
    const cellPromises = cellsToSearch.map(cell => this.locationRepo.getActiveUsersInH3Cell(cell));
    const cellResults = await Promise.all(cellPromises);
    
    const uniqueUserIds = new Set<string>();
    cellResults.forEach(bucket => {
      bucket.forEach(userId => {
        if (userId !== searcherId) uniqueUserIds.add(userId);
      });
    });

    if (uniqueUserIds.size === 0) return [];

    // PHASE 2: Exact Distance Filtering
    const locationPromises = Array.from(uniqueUserIds).map(id => this.locationRepo.getLocationByUserId(id));
    const rawLocations = await Promise.all(locationPromises);

    const validCandidateIds: { id: string, exactDist: number }[] = [];

    for (const loc of rawLocations) {
      if (!loc || loc.on === 0) continue; 
      const distance = calculateHaversineDistance(lat, lng, loc.lat, loc.lng);
      if (distance <= radiusMeters) {
        validCandidateIds.push({ id: loc.userId, exactDist: distance });
      }
    }

    if (validCandidateIds.length === 0) return [];

    // Privacy Filter
    const discoverableIds = await this.privacyRepo.filterDiscoverableUsers(validCandidateIds.map(c => c.id));
    const discoverableSet = new Set(discoverableIds);
    const finalCandidates = validCandidateIds.filter(c => discoverableSet.has(c.id));

    if (finalCandidates.length === 0) return [];

    // PHASE 3: Profile Enrichment & Distance Obfuscation
    const profileMap = await this.profileRepo.getProfilesBatch(finalCandidates.map(c => c.id));
    const enrichedCandidates: NearbyCandidate[] = [];

    for (const candidate of finalCandidates) {
      const profile = profileMap.get(candidate.id);
      enrichedCandidates.push({
        userId: candidate.id,
        username: profile?.username || 'Unknown Tourist',
        avatarUrl: profile?.avatarUrl || '',
        approximateDistanceMeters: this.bucketDistance(candidate.exactDist)
      });
    }

    // Sort by approximate distance
    enrichedCandidates.sort((a, b) => a.approximateDistanceMeters - b.approximateDistanceMeters);
    return enrichedCandidates;
  }
}
