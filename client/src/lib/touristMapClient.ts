/**
 * Tourist Map API Client
 * 
 * Client-side API functions for the Tourist & Crowd Map feature
 * 
 * Functions:
 * - fetchLocation() - Detect user location from IP
 * - fetchSpots() - Get tourist spots with filtering
 * - fetchSpotDetails() - Get detailed spot information
 * - fetchPredictions() - Get crowd predictions
 * - fetchAlternatives() - Get alternative recommendations
 * - submitCrowdReport() - Submit crowd report
 * 
 * Requirements: All API requirements
 */

import type { Category, CrowdLevel } from '@shared/schema';

const API_BASE = '/api/tourist-map';

/**
 * API Response wrapper
 */
interface APIResponse<T> {
  success: boolean;
  data: T | null;
  message: string;
}

/**
 * Location data structure
 */
export interface Location {
  country: string;
  city: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Tourist spot data structure
 */
export interface TouristSpot {
  id: number;
  name: string;
  country: string;
  city: string;
  latitude: string;
  longitude: string;
  category: Category;
  description: string;
  images: string[];
  openingHours?: string | null;
  bestTimeToVisit?: string | null;
  currentCrowdLevel?: CrowdLevel;
  distance?: number; // Distance in km (for alternatives)
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

/**
 * Pagination metadata
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Paginated spots response
 */
export interface PaginatedSpotsResponse {
  spots: TouristSpot[];
  pagination: PaginationInfo;
}

/**
 * Crowd prediction data structure
 */
export interface CrowdPrediction {
  timestamp: string;
  crowdLevel: CrowdLevel;
  confidence: number;
}

/**
 * Crowd report submission data
 */
export interface CrowdReportData {
  crowdLevel: CrowdLevel;
  userLocation: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Fetch user location from IP address OR GPS coordinates
 * 
 * @param gpsCoordinates - Optional GPS coordinates from device
 * @returns Promise<Location> - Detected location
 * @throws Error if location detection fails
 */
export async function fetchLocation(gpsCoordinates?: { latitude: number; longitude: number }): Promise<Location> {
  let url = `${API_BASE}/location`;
  
  // If GPS coordinates provided, add them as query params
  if (gpsCoordinates) {
    url += `?lat=${gpsCoordinates.latitude}&lon=${gpsCoordinates.longitude}`;
  }
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to detect location: ${response.statusText}`);
  }
  
  const result: APIResponse<Location> = await response.json();
  
  if (!result.success || !result.data) {
    throw new Error(result.message || 'Failed to detect location');
  }
  
  return result.data;
}

/**
 * Fetch nearby tourist spots based on GPS coordinates
 * 
 * @param latitude - User's latitude
 * @param longitude - User's longitude
 * @param radius - Search radius in kilometers (default: 10km)
 * @param category - Optional category filter
 * @param limit - Maximum number of results (default: 20)
 * @returns Promise<TouristSpot[]> - Array of nearby spots sorted by distance
 * @throws Error if fetch fails
 */
export async function fetchNearbySpots(
  latitude: number,
  longitude: number,
  radius: number = 10,
  category?: Category,
  limit: number = 20
): Promise<TouristSpot[]> {
  const params = new URLSearchParams({
    lat: latitude.toString(),
    lon: longitude.toString(),
    radius: radius.toString(),
    limit: limit.toString(),
  });
  
  if (category) {
    params.append('category', category);
  }
  
  const response = await fetch(`${API_BASE}/spots/nearby?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch nearby spots: ${response.statusText}`);
  }
  
  const result: APIResponse<TouristSpot[]> = await response.json();
  
  if (!result.success || !result.data) {
    throw new Error(result.message || 'Failed to fetch nearby spots');
  }
  
  return result.data;
}

/**
 * Fetch tourist spots filtered by location and optional filters
 * 
 * @param country - Country name (required)
 * @param city - City name (required)
 * @param category - Optional category filter
 * @param crowdLevel - Optional crowd level filter
 * @param page - Page number (default: 1)
 * @param limit - Results per page (default: 20, max: 100)
 * @returns Promise<PaginatedSpotsResponse> - Paginated tourist spots with metadata
 * @throws Error if fetch fails
 */
export async function fetchSpots(
  country: string,
  city: string,
  category?: Category,
  crowdLevel?: CrowdLevel,
  page: number = 1,
  limit: number = 20
): Promise<PaginatedSpotsResponse> {
  const params = new URLSearchParams({
    country,
    city,
    page: page.toString(),
    limit: limit.toString(),
  });
  
  if (category) {
    params.append('category', category);
  }
  
  if (crowdLevel) {
    params.append('crowdLevel', crowdLevel);
  }
  
  const response = await fetch(`${API_BASE}/spots?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch spots: ${response.statusText}`);
  }
  
  const result: APIResponse<TouristSpot[]> & { pagination?: PaginationInfo } = await response.json();
  
  if (!result.success || !result.data) {
    throw new Error(result.message || 'Failed to fetch spots');
  }
  
  return {
    spots: result.data,
    pagination: result.pagination || {
      page: 1,
      limit: result.data.length,
      total: result.data.length,
      totalPages: 1,
      hasMore: false
    }
  };
}

/**
 * Fetch detailed information for a specific tourist spot
 * 
 * @param spotId - Tourist spot ID
 * @returns Promise<TouristSpot> - Detailed spot information
 * @throws Error if fetch fails or spot not found
 */
export async function fetchSpotDetails(spotId: number): Promise<TouristSpot> {
  const response = await fetch(`${API_BASE}/spots/${spotId}`);
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Tourist spot not found');
    }
    throw new Error(`Failed to fetch spot details: ${response.statusText}`);
  }
  
  const result: APIResponse<TouristSpot> = await response.json();
  
  if (!result.success || !result.data) {
    throw new Error(result.message || 'Failed to fetch spot details');
  }
  
  return result.data;
}

/**
 * Fetch crowd predictions for the next N hours
 * 
 * @param spotId - Tourist spot ID
 * @param hours - Number of hours to predict (default: 24, max: 168)
 * @returns Promise<CrowdPrediction[]> - Array of hourly predictions
 * @throws Error if fetch fails
 */
export async function fetchPredictions(
  spotId: number,
  hours: number = 24
): Promise<CrowdPrediction[]> {
  const params = new URLSearchParams({
    hours: hours.toString(),
  });
  
  const response = await fetch(`${API_BASE}/spots/${spotId}/predictions?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch predictions: ${response.statusText}`);
  }
  
  const result: APIResponse<CrowdPrediction[]> = await response.json();
  
  if (!result.success || !result.data) {
    throw new Error(result.message || 'Failed to fetch predictions');
  }
  
  return result.data;
}

/**
 * Fetch alternative less-crowded spots in the same category
 * 
 * @param spotId - Tourist spot ID
 * @returns Promise<TouristSpot[]> - Array of alternative spots
 * @throws Error if fetch fails
 */
export async function fetchAlternatives(spotId: number): Promise<TouristSpot[]> {
  const response = await fetch(`${API_BASE}/spots/${spotId}/alternatives`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch alternatives: ${response.statusText}`);
  }
  
  const result: APIResponse<TouristSpot[]> = await response.json();
  
  if (!result.success || !result.data) {
    throw new Error(result.message || 'Failed to fetch alternatives');
  }
  
  return result.data;
}

/**
 * Submit a crowd report for a tourist spot
 * 
 * @param spotId - Tourist spot ID
 * @param reportData - Crowd report data (crowd level and user location)
 * @returns Promise<{ reportId: number }> - Report ID
 * @throws Error if submission fails or validation fails
 */
export async function submitCrowdReport(
  spotId: number,
  reportData: CrowdReportData
): Promise<{ reportId: number }> {
  const response = await fetch(`${API_BASE}/spots/${spotId}/report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(reportData),
  });
  
  if (!response.ok) {
    if (response.status === 400) {
      const result: APIResponse<null> = await response.json();
      throw new Error(result.message || 'Invalid report data');
    }
    if (response.status === 401) {
      throw new Error('You must be logged in to submit a crowd report');
    }
    throw new Error(`Failed to submit crowd report: ${response.statusText}`);
  }
  
  const result: APIResponse<{ reportId: number }> = await response.json();
  
  if (!result.success || !result.data) {
    throw new Error(result.message || 'Failed to submit crowd report');
  }
  
  return result.data;
}
