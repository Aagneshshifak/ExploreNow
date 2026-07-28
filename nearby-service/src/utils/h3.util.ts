import { latLngToCell, gridDisk, getResolution, getHexagonEdgeLengthAvg } from 'h3-js';

export const DEFAULT_H3_RESOLUTION = 9; // ~174m hexagon edge

/**
 * Converts GPS coordinates to an H3 cell index.
 */
export function getH3Index(lat: number, lng: number, resolution: number = DEFAULT_H3_RESOLUTION): string {
  return latLngToCell(lat, lng, resolution);
}

/**
 * Retrieves the central H3 cell and all surrounding neighboring cells up to a specified k-ring radius.
 */
export function getNeighboringCells(h3Index: string, kRingSize: number): string[] {
  if (kRingSize === 0) return [h3Index];
  return gridDisk(h3Index, kRingSize);
}

/**
 * Dynamically calculates the required k-ring size to cover a specific search radius in meters.
 * Uses the average edge length of a hexagon at the given resolution.
 */
export function calculateRingSize(radiusMeters: number, resolution: number = DEFAULT_H3_RESOLUTION): number {
  // getHexagonEdgeLengthAvg returns edge length in kilometers. We convert to meters.
  const edgeLengthMeters = getHexagonEdgeLengthAvg(resolution, 'km') * 1000;
  
  // The apothem (radius of inscribed circle) is roughly edgeLength * (sqrt(3)/2)
  // But for safety and full coverage of the radius, dividing by edgeLength is a conservative heuristic.
  // We take the ceiling to ensure we don't under-fetch.
  const roughRingSize = Math.ceil(radiusMeters / edgeLengthMeters);
  
  // Ensure we always search at least the central cell (k=0)
  return Math.max(0, roughRingSize);
}

/**
 * Calculates the exact distance between two coordinates in meters using the Haversine formula.
 */
export function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
