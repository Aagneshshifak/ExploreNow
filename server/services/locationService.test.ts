/**
 * Unit tests for LocationService
 * Tests location detection and proximity validation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LocationService } from './locationService';
import { externalAPIService } from './externalAPIService';

describe('LocationService', () => {
  let locationService: LocationService;

  beforeEach(() => {
    locationService = new LocationService();
    vi.clearAllMocks();
  });

  describe('detectLocation', () => {
    it('should detect location successfully', async () => {
      // Mock the external API service
      const mockGeoData = {
        country: 'United States',
        city: 'New York',
        latitude: 40.7128,
        longitude: -74.0060,
      };

      vi.spyOn(externalAPIService, 'getGeolocation').mockResolvedValue(mockGeoData);

      const result = await locationService.detectLocation('8.8.8.8');

      expect(result).toEqual({
        country: 'United States',
        city: 'New York',
        coordinates: {
          latitude: 40.7128,
          longitude: -74.0060,
        },
      });

      expect(externalAPIService.getGeolocation).toHaveBeenCalledWith('8.8.8.8');
    });

    it('should throw error when geolocation fails', async () => {
      vi.spyOn(externalAPIService, 'getGeolocation').mockRejectedValue(
        new Error('API error')
      );

      await expect(locationService.detectLocation('invalid-ip')).rejects.toThrow(
        'Failed to detect location. Please select your location manually.'
      );
    });

    it('should handle different IP addresses', async () => {
      const mockGeoData = {
        country: 'United Kingdom',
        city: 'London',
        latitude: 51.5074,
        longitude: -0.1278,
      };

      vi.spyOn(externalAPIService, 'getGeolocation').mockResolvedValue(mockGeoData);

      const result = await locationService.detectLocation('1.2.3.4');

      expect(result.country).toBe('United Kingdom');
      expect(result.city).toBe('London');
    });
  });

  describe('validateProximity', () => {
    it('should return true when user is within 1km', () => {
      const userLocation = { latitude: 40.7128, longitude: -74.0060 };
      const spotLocation = { latitude: 40.7138, longitude: -74.0070 };

      const result = locationService.validateProximity(userLocation, spotLocation);

      expect(result).toBe(true);
    });

    it('should return false when user is beyond 1km', () => {
      const userLocation = { latitude: 40.7128, longitude: -74.0060 };
      const spotLocation = { latitude: 40.7300, longitude: -74.0200 };

      const result = locationService.validateProximity(userLocation, spotLocation);

      expect(result).toBe(false);
    });

    it('should respect custom maxDistance parameter', () => {
      const userLocation = { latitude: 40.7128, longitude: -74.0060 };
      const spotLocation = { latitude: 40.7300, longitude: -74.0200 };

      // Should be false with 1km
      expect(locationService.validateProximity(userLocation, spotLocation, 1)).toBe(false);

      // Should be true with 5km
      expect(locationService.validateProximity(userLocation, spotLocation, 5)).toBe(true);
    });

    it('should return true when coordinates are identical', () => {
      const location = { latitude: 40.7128, longitude: -74.0060 };

      const result = locationService.validateProximity(location, location);

      expect(result).toBe(true);
    });

    it('should handle coordinates at different hemispheres', () => {
      const userLocation = { latitude: 35.6762, longitude: 139.6503 }; // Tokyo
      const spotLocation = { latitude: -33.8688, longitude: 151.2093 }; // Sydney

      const result = locationService.validateProximity(userLocation, spotLocation);

      expect(result).toBe(false);
    });

    it('should calculate distance correctly for known locations', () => {
      // New York to Los Angeles is approximately 3944 km
      const newYork = { latitude: 40.7128, longitude: -74.0060 };
      const losAngeles = { latitude: 34.0522, longitude: -118.2437 };

      const result = locationService.validateProximity(newYork, losAngeles, 4000);

      expect(result).toBe(true);
    });

    it('should handle edge case with equator coordinates', () => {
      const coord1 = { latitude: 0, longitude: 0 };
      const coord2 = { latitude: 0, longitude: 0.01 };

      const result = locationService.validateProximity(coord1, coord2, 2);

      expect(result).toBe(true);
    });

    it('should handle negative coordinates', () => {
      const coord1 = { latitude: -23.5505, longitude: -46.6333 }; // São Paulo
      const coord2 = { latitude: -23.5506, longitude: -46.6334 };

      const result = locationService.validateProximity(coord1, coord2, 1);

      expect(result).toBe(true);
    });
  });

  describe('Haversine formula accuracy', () => {
    it('should calculate short distances accurately', () => {
      // Two points approximately 500 meters apart
      const coord1 = { latitude: 40.7128, longitude: -74.0060 };
      const coord2 = { latitude: 40.7173, longitude: -74.0060 };

      const result = locationService.validateProximity(coord1, coord2, 1);

      expect(result).toBe(true);
    });

    it('should calculate medium distances accurately', () => {
      // Two points approximately 10 km apart
      const coord1 = { latitude: 40.7128, longitude: -74.0060 };
      const coord2 = { latitude: 40.8000, longitude: -74.0060 };

      const result = locationService.validateProximity(coord1, coord2, 15);

      expect(result).toBe(true);
    });
  });
});
