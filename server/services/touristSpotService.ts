/**
 * TouristSpotService - Handles tourist spot data retrieval and filtering
 * 
 * Features:
 * - Get spots by location with optional filtering
 * - Get detailed spot information
 * - Get alternative recommendations for crowded spots
 * 
 * Requirements: 1.2, 7.1, 7.2, 7.3, 7.4
 */

import { db } from '../db';
import { touristSpots } from '@shared/schema';
import { eq, and, ne, sql } from 'drizzle-orm';
import type { TouristSpot, Category, CrowdLevel } from '@shared/schema';
import type { Coordinates } from './locationService';

export interface TouristSpotWithCrowdLevel extends TouristSpot {
  currentCrowdLevel?: CrowdLevel;
}

export interface AlternativeSpot extends TouristSpotWithCrowdLevel {
  distance?: number; // Distance in kilometers from original spot
}

export interface PaginatedSpotsResult {
  spots: TouristSpotWithCrowdLevel[];
  total: number;
}

export class TouristSpotService {
  /**
   * Get unique city/country combinations from all tourist spots
   * Used for populating the location dropdown
   * 
   * @returns Array of unique locations sorted by country then city
   */
  async getUniqueLocations(): Promise<Array<{ country: string; city: string }>> {
    try {
      // Query distinct country/city combinations from the database
      const locations = await db
        .selectDistinct({
          country: touristSpots.country,
          city: touristSpots.city,
        })
        .from(touristSpots)
        .orderBy(touristSpots.country, touristSpots.city);

      return locations;
    } catch (error) {
      console.error('Error fetching unique locations:', error);
      throw new Error('Failed to fetch locations');
    }
  }

  /**
   * Get nearby tourist spots based on GPS coordinates
   * Uses Haversine formula to calculate distance
   * 
   * @param userLocation - User's GPS coordinates
   * @param radiusKm - Search radius in kilometers
   * @param category - Optional category filter
   * @param limit - Maximum number of results
   * @returns Array of spots sorted by distance with distance property
   */
  async getNearbySpots(
    userLocation: Coordinates,
    radiusKm: number = 10,
    category?: Category,
    limit: number = 20
  ): Promise<Array<TouristSpotWithCrowdLevel & { distance: number }>> {
    try {
      // Get all spots (or filtered by category)
      let query = db.select().from(touristSpots);
      
      if (category) {
        query = query.where(eq(touristSpots.category, category)) as any;
      }
      
      const allSpots = await query;
      
      // Calculate distance for each spot and filter by radius
      const spotsWithDistance = allSpots
        .map(spot => {
          const spotCoordinates: Coordinates = {
            latitude: parseFloat(spot.latitude as string),
            longitude: parseFloat(spot.longitude as string),
          };
          
          const distance = this.calculateDistance(userLocation, spotCoordinates);
          
          return {
            ...spot,
            distance,
            currentCrowdLevel: undefined as CrowdLevel | undefined,
          };
        })
        .filter(spot => spot.distance <= radiusKm) // Only spots within radius
        .sort((a, b) => a.distance - b.distance) // Sort by distance (closest first)
        .slice(0, limit); // Limit results
      
      return spotsWithDistance;
    } catch (error) {
      console.error('Error fetching nearby spots:', error);
      throw new Error('Failed to fetch nearby tourist spots');
    }
  }

  /**
   * Get tourist spots by location with optional filtering and pagination
   * 
   * @param country - Country to filter by
   * @param city - City to filter by
   * @param category - Optional category filter
   * @param crowdLevel - Optional crowd level filter
   * @param page - Page number (default: 1)
   * @param limit - Results per page (default: 20)
   * @returns Paginated result with spots and total count
   */
  async getSpotsByLocation(
    country: string,
    city: string,
    category?: Category,
    crowdLevel?: CrowdLevel,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedSpotsResult> {
    try {
      // Build the where conditions
      const conditions = [
        eq(touristSpots.country, country),
        eq(touristSpots.city, city),
      ];

      if (category) {
        conditions.push(eq(touristSpots.category, category));
      }

      // Get total count for pagination
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(touristSpots)
        .where(and(...conditions));
      
      const total = Number(countResult[0]?.count || 0);

      // Calculate offset for pagination
      const offset = (page - 1) * limit;

      // Query spots from database with pagination
      const spots = await db
        .select()
        .from(touristSpots)
        .where(and(...conditions))
        .limit(limit)
        .offset(offset);

      // TODO: Add current crowd level to each spot
      // This will be implemented when CrowdPredictionService is available
      const spotsWithCrowdLevel: TouristSpotWithCrowdLevel[] = spots.map(spot => ({
        ...spot,
        currentCrowdLevel: undefined, // Will be populated by CrowdPredictionService
      }));

      // Filter by crowd level if specified
      if (crowdLevel) {
        const filtered = spotsWithCrowdLevel.filter(
          spot => spot.currentCrowdLevel === crowdLevel
        );
        return {
          spots: filtered,
          total: filtered.length
        };
      }

      return {
        spots: spotsWithCrowdLevel,
        total
      };
    } catch (error) {
      console.error('Error fetching spots by location:', error);
      throw new Error('Failed to fetch tourist spots');
    }
  }

  /**
   * Get detailed information for a specific tourist spot
   * 
   * @param spotId - ID of the tourist spot
   * @returns Tourist spot with all details
   * @throws Error if spot not found
   */
  async getSpotDetails(spotId: number): Promise<TouristSpotWithCrowdLevel> {
    try {
      const spot = await db
        .select()
        .from(touristSpots)
        .where(eq(touristSpots.id, spotId))
        .limit(1);

      if (!spot || spot.length === 0) {
        throw new Error('Tourist spot not found');
      }

      // TODO: Add current crowd level
      // This will be implemented when CrowdPredictionService is available
      return {
        ...spot[0],
        currentCrowdLevel: undefined,
      };
    } catch (error) {
      if (error instanceof Error && error.message === 'Tourist spot not found') {
        throw error;
      }
      console.error('Error fetching spot details:', error);
      throw new Error('Failed to fetch tourist spot details');
    }
  }

  /**
   * Get alternative recommendations for a crowded spot
   * Returns spots in the same category and location with lower crowd levels
   * 
   * @param spotId - ID of the original tourist spot
   * @param category - Category of the original spot
   * @param country - Country of the original spot
   * @param city - City of the original spot
   * @param originalCoordinates - Coordinates of the original spot for distance calculation
   * @param limit - Maximum number of alternatives to return (default: 3)
   * @returns Array of alternative spots sorted by distance
   */
  async getAlternatives(
    spotId: number,
    category: Category,
    country: string,
    city: string,
    originalCoordinates: Coordinates,
    limit: number = 3
  ): Promise<AlternativeSpot[]> {
    try {
      // Query spots in same category and location, excluding the original spot
      const alternatives = await db
        .select()
        .from(touristSpots)
        .where(
          and(
            eq(touristSpots.country, country),
            eq(touristSpots.city, city),
            eq(touristSpots.category, category),
            ne(touristSpots.id, spotId)
          )
        );

      // TODO: Filter by lower crowd levels when CrowdPredictionService is available
      // For now, return all alternatives

      // Calculate distance for each alternative
      const alternativesWithDistance: AlternativeSpot[] = alternatives.map(spot => {
        const spotCoordinates: Coordinates = {
          latitude: parseFloat(spot.latitude as string),
          longitude: parseFloat(spot.longitude as string),
        };
        
        const distance = this.calculateDistance(originalCoordinates, spotCoordinates);
        
        return {
          ...spot,
          currentCrowdLevel: undefined, // Will be populated by CrowdPredictionService
          distance,
        };
      });

      // Sort by distance (closest first) and limit results
      return alternativesWithDistance
        .sort((a, b) => (a.distance || 0) - (b.distance || 0))
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching alternatives:', error);
      throw new Error('Failed to fetch alternative spots');
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * 
   * @param coord1 - First coordinate
   * @param coord2 - Second coordinate
   * @returns Distance in kilometers
   */
  private calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    const R = 6371; // Earth's radius in kilometers
    
    const lat1Rad = this.toRadians(coord1.latitude);
    const lat2Rad = this.toRadians(coord2.latitude);
    const deltaLat = this.toRadians(coord2.latitude - coord1.latitude);
    const deltaLon = this.toRadians(coord2.longitude - coord1.longitude);
    
    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1Rad) *
        Math.cos(lat2Rad) *
        Math.sin(deltaLon / 2) *
        Math.sin(deltaLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    const distance = R * c;
    
    return distance;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

// Export singleton instance
export const touristSpotService = new TouristSpotService();
