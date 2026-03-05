/**
 * Tourist Map TanStack Query Hooks
 * 
 * Custom hooks for the Tourist & Crowd Map feature using TanStack Query
 * 
 * Hooks:
 * - useLocation() - Detect user location from IP
 * - useSpots() - Get tourist spots with filtering
 * - useSpotDetails() - Get detailed spot information
 * - usePredictions() - Get crowd predictions
 * - useAlternatives() - Get alternative recommendations
 * - useSubmitReport() - Submit crowd report mutation
 * 
 * Requirements: 12.5
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Category, CrowdLevel } from '@shared/schema';
import {
  fetchLocation,
  fetchSpots,
  fetchSpotDetails,
  fetchPredictions,
  fetchAlternatives,
  submitCrowdReport,
  fetchNearbySpots,
  type Location,
  type TouristSpot,
  type CrowdPrediction,
  type CrowdReportData,
  type PaginatedSpotsResponse,
} from '@/lib/touristMapClient';

/**
 * Hook to detect user location from GPS or IP address
 * Tries GPS first, falls back to IP-based detection
 * 
 * @returns Query result with location data
 * 
 * Caching strategy:
 * - staleTime: 5 minutes (location might change as user moves)
 * - cacheTime: 30 minutes
 * - refetchOnWindowFocus: true (check location when user returns)
 */
export function useLocation() {
  return useQuery({
    queryKey: ['tourist-map', 'location'],
    queryFn: async () => {
      // Try to get GPS location first
      if ('geolocation' in navigator) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              maximumAge: 300000, // 5 minutes
              enableHighAccuracy: true
            });
          });
          
          // Use GPS coordinates for more accurate location
          return await fetchLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        } catch (gpsError) {
          console.log('GPS location failed, falling back to IP-based detection:', gpsError);
          // Fall back to IP-based detection
          return await fetchLocation();
        }
      }
      
      // No GPS available, use IP-based detection
      return await fetchLocation();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: true,
    retry: 2,
  });
}

/**
 * Hook to fetch nearby tourist spots based on GPS coordinates
 * 
 * @param latitude - User's latitude
 * @param longitude - User's longitude
 * @param radius - Search radius in kilometers
 * @param category - Optional category filter
 * @returns Query result with nearby spots
 * 
 * Caching strategy:
 * - staleTime: 2 minutes (crowd levels update frequently)
 * - cacheTime: 10 minutes
 * - refetchOnWindowFocus: true
 */
export function useNearbySpots(
  latitude: number | null,
  longitude: number | null,
  radius: number = 10,
  category?: Category
) {
  return useQuery({
    queryKey: ['tourist-map', 'nearby-spots', latitude, longitude, radius, category],
    queryFn: () => fetchNearbySpots(latitude!, longitude!, radius, category),
    enabled: latitude !== null && longitude !== null,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to fetch tourist spots with optional filtering and pagination
 * 
 * @param country - Country name (required)
 * @param city - City name (required)
 * @param category - Optional category filter
 * @param crowdLevel - Optional crowd level filter
 * @param page - Page number (default: 1)
 * @param limit - Results per page (default: 20)
 * @returns Query result with paginated tourist spots
 * 
 * Caching strategy:
 * - staleTime: 5 minutes (crowd levels update hourly, but we want fresh data)
 * - cacheTime: 30 minutes
 * - refetchOnWindowFocus: true (refetch when user returns to tab)
 */
export function useSpots(
  country: string,
  city: string,
  category?: Category,
  crowdLevel?: CrowdLevel,
  page: number = 1,
  limit: number = 20
) {
  return useQuery({
    queryKey: ['tourist-map', 'spots', country, city, category, crowdLevel, page, limit],
    queryFn: () => fetchSpots(country, city, category, crowdLevel, page, limit),
    enabled: !!country && !!city, // Only fetch if location is available
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to fetch detailed information for a specific tourist spot
 * 
 * @param spotId - Tourist spot ID
 * @returns Query result with spot details
 * 
 * Caching strategy:
 * - staleTime: 5 minutes (crowd level updates)
 * - cacheTime: 30 minutes
 * - refetchOnWindowFocus: true
 */
export function useSpotDetails(spotId: number | null) {
  return useQuery({
    queryKey: ['tourist-map', 'spot', spotId],
    queryFn: () => fetchSpotDetails(spotId!),
    enabled: spotId !== null, // Only fetch if spotId is provided
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to fetch crowd predictions for the next N hours
 * 
 * @param spotId - Tourist spot ID
 * @param hours - Number of hours to predict (default: 24)
 * @returns Query result with predictions array
 * 
 * Caching strategy:
 * - staleTime: 1 hour (predictions update hourly)
 * - cacheTime: 2 hours
 * - refetchOnWindowFocus: false (predictions don't change that often)
 */
export function usePredictions(spotId: number | null, hours: number = 24) {
  return useQuery({
    queryKey: ['tourist-map', 'predictions', spotId, hours],
    queryFn: async () => {
      const predictions = await fetchPredictions(spotId!, hours);
      // Convert timestamp strings to Date objects for CrowdTimeline component
      return predictions.map(pred => ({
        ...pred,
        timestamp: new Date(pred.timestamp),
      }));
    },
    enabled: spotId !== null, // Only fetch if spotId is provided
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to fetch alternative less-crowded spots
 * 
 * @param spotId - Tourist spot ID
 * @returns Query result with alternative spots array
 * 
 * Caching strategy:
 * - staleTime: 5 minutes (crowd levels update)
 * - cacheTime: 30 minutes
 * - refetchOnWindowFocus: true
 */
export function useAlternatives(spotId: number | null) {
  return useQuery({
    queryKey: ['tourist-map', 'alternatives', spotId],
    queryFn: () => fetchAlternatives(spotId!),
    enabled: spotId !== null, // Only fetch if spotId is provided
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to submit a crowd report for a tourist spot
 * 
 * @returns Mutation object with mutate function and status
 * 
 * On success:
 * - Invalidates spot details query to refetch updated crowd level
 * - Invalidates spots query to update map markers
 * - Invalidates predictions query to update timeline
 */
export function useSubmitReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ spotId, reportData }: { spotId: number; reportData: CrowdReportData }) =>
      submitCrowdReport(spotId, reportData),
    onSuccess: (_, variables) => {
      // Invalidate related queries to refetch with updated data
      queryClient.invalidateQueries({
        queryKey: ['tourist-map', 'spot', variables.spotId],
      });
      queryClient.invalidateQueries({
        queryKey: ['tourist-map', 'spots'],
      });
      queryClient.invalidateQueries({
        queryKey: ['tourist-map', 'predictions', variables.spotId],
      });
      queryClient.invalidateQueries({
        queryKey: ['tourist-map', 'alternatives', variables.spotId],
      });
    },
  });
}

/**
 * Export types for convenience
 */
export type {
  Location,
  TouristSpot,
  CrowdPrediction,
  CrowdReportData,
  PaginatedSpotsResponse,
};
