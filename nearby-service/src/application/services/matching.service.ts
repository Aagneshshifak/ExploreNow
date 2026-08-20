import { ILocationRepository } from '../../domain/interfaces/location.repository.interface';
import { IPrivacyRepository } from '../../domain/interfaces/privacy.repository.interface';
import { IUserProfileRepository } from '../../domain/interfaces/profile.repository.interface';
import { IConnectionRepository } from '../../domain/interfaces/connection.repository.interface';
import { getH3Index, getNeighboringCells, calculateRingSize, calculateHaversineDistance, DEFAULT_H3_RESOLUTION, MAX_SEARCH_RADIUS_METERS } from '../../utils/h3.util';
import { LiveLocation } from '../../domain/entities/location.entity';
import { logger } from '../../utils/logger.util';

export interface NearbyCandidate {
  userId: string;
  username: string;
  avatarUrl: string;
  approximateDistanceMeters: number;
  exactLatitude?: number;
  exactLongitude?: number;
  isConnected: boolean;
}

export class MatchingService {
  constructor(
    private readonly locationRepo: ILocationRepository,
    private readonly privacyRepo: IPrivacyRepository,
    private readonly profileRepo: IUserProfileRepository,
    private readonly connectionRepo: IConnectionRepository
  ) {}

  /**
   * Obfuscates distance to prevent precise triangulation attacks.
   */
  private bucketDistance(distance: number): number {
    if (distance < 50) return 50;
    if (distance < 100) return 100;
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
    const clampedRadius = Math.min(radiusMeters, MAX_SEARCH_RADIUS_METERS);
    const centerCell = getH3Index(lat, lng, DEFAULT_H3_RESOLUTION);
    const ringSize = calculateRingSize(clampedRadius, DEFAULT_H3_RESOLUTION);
    const cellsToSearch = getNeighboringCells(centerCell, ringSize);

    logger.debug(`H3 search: radius=${clampedRadius}m res=${DEFAULT_H3_RESOLUTION} ring=${ringSize} cells=${cellsToSearch.length}`);
    
    const cellPromises = cellsToSearch.map(cell => this.locationRepo.getActiveUsersInH3Cell(cell));
    const cellResults = await Promise.all(cellPromises);
    
    const uniqueUserIds = new Set<string>();
    cellResults.forEach(bucket => {
      bucket.forEach(userId => {
        if (userId !== searcherId) uniqueUserIds.add(userId);
      });
    });

    if (uniqueUserIds.size === 0) return [];

    // PHASE 2: Batch-fetch all locations in ONE Redis call instead of N individual GETs
    const rawLocations = await this.locationRepo.getLocationsByUserIds(Array.from(uniqueUserIds));

    const validCandidateLocations: LiveLocation[] = [];

    for (const loc of rawLocations) {
      if (!loc || loc.on === 0) continue; 
      const distance = calculateHaversineDistance(lat, lng, loc.lat, loc.lng);
      if (distance <= radiusMeters) {
        // Temporarily store exact distance in the 'spd' field for mapping, as we need the full loc object later
        loc.spd = distance;
        validCandidateLocations.push(loc);
      }
    }

    if (validCandidateLocations.length === 0) return [];

    // Privacy Filter (Global Ghost Mode Check)
    const candidateIds = validCandidateLocations.map(c => c.userId);
    const discoverableIds = await this.privacyRepo.filterDiscoverableUsers(candidateIds);
    const discoverableSet = new Set(discoverableIds);
    
    // Fetch Mutual Connections (The Permission Layer)
    const approvedConnections = await this.connectionRepo.getApprovedConnections(searcherId);

    // PHASE 3: Profile Enrichment & Distance Obfuscation
    const profileMap = await this.profileRepo.getProfilesBatch(candidateIds);
    const enrichedCandidates: NearbyCandidate[] = [];

    for (const loc of validCandidateLocations) {
      if (!discoverableSet.has(loc.userId)) continue;

      const profile = profileMap.get(loc.userId);
      const isConnected = approvedConnections.has(loc.userId);
      const distance = loc.spd || 0; // The exact distance we stored earlier

      const candidate: NearbyCandidate = {
        userId: loc.userId,
        username: profile?.username || 'Unknown Tourist',
        avatarUrl: profile?.avatarUrl || '',
        approximateDistanceMeters: this.bucketDistance(distance),
        isConnected
      };

      // EXACT GPS UNLOCK: Only inject coordinates if they are mutual friends
      if (isConnected) {
        candidate.exactLatitude = loc.lat;
        candidate.exactLongitude = loc.lng;
      }

      enrichedCandidates.push(candidate);
    }

    // Sort by approximate distance
    enrichedCandidates.sort((a, b) => a.approximateDistanceMeters - b.approximateDistanceMeters);
    return enrichedCandidates;
  }
}
