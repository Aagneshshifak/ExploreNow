/**
 * LocationService - Handles location detection and proximity validation
 * 
 * Features:
 * - IP-based location detection using ExternalAPIService
 * - Proximity validation using Haversine formula
 * - Error handling for detection failures
 * 
 * Requirements: 1.1, 10.3
 */

import { externalAPIService } from './externalAPIService';

export interface Location {
  country: string;
  city: string;
  coordinates: Coordinates;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export class LocationService {
  /**
   * Detect user location from IP address
   * Uses ExternalAPIService which handles caching and fallback
   * 
   * @param ipAddress - User's IP address
   * @returns Location object with country, city, and coordinates
   * @throws Error if location detection fails
   */
  async detectLocation(ipAddress: string): Promise<Location> {
    try {
      const geoData = await externalAPIService.getGeolocation(ipAddress);
      
      return {
        country: geoData.country,
        city: geoData.city,
        coordinates: {
          latitude: geoData.latitude,
          longitude: geoData.longitude,
        },
      };
    } catch (error) {
      console.error('Location detection failed:', error);
      throw new Error('Failed to detect location. Please select your location manually.');
    }
  }

  /**
   * Validate if user is within proximity of a tourist spot
   * Uses Haversine formula to calculate distance between two coordinates
   * 
   * @param userLocation - User's current coordinates
   * @param spotLocation - Tourist spot coordinates
   * @param maxDistance - Maximum allowed distance in kilometers (default: 1km)
   * @returns true if user is within maxDistance, false otherwise
   */
  validateProximity(
    userLocation: Coordinates,
    spotLocation: Coordinates,
    maxDistance: number = 1
  ): boolean {
    const distance = this.calculateDistance(userLocation, spotLocation);
    return distance <= maxDistance;
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
export const locationService = new LocationService();
