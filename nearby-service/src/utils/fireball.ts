import { latLngToCell } from 'h3-js';

export interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: number; // ms since epoch
  speed?: number; // m/s
  direction?: number; // degrees
}

export class FireballAlgorithm {
  private lastSentLocation: LocationData | null = null;
  
  // Configuration Thresholds
  private readonly DISTANCE_THRESHOLD_METERS = 50;
  private readonly TIME_THRESHOLD_MS = 120_000; // 2 minutes
  private readonly SPEED_THRESHOLD = 2.0; // m/s (approx 7.2 km/h)
  private readonly DIRECTION_THRESHOLD = 30.0; // degrees
  private readonly H3_RESOLUTION = 9; // Hexagon radius ~174m

  /**
   * Calculates the Haversine distance between two coordinates in meters
   */
  private calculateHaversine(loc1: LocationData, loc2: LocationData): number {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (loc1.latitude * Math.PI) / 180;
    const phi2 = (loc2.latitude * Math.PI) / 180;
    const deltaPhi = ((loc2.latitude - loc1.latitude) * Math.PI) / 180;
    const deltaLambda = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Evaluates if the new location should be transmitted over the network.
   * @param currentLocation The current GPS reading
   * @returns boolean True if transmission is required
   */
  public shouldSendUpdate(currentLocation: LocationData): boolean {
    if (!this.lastSentLocation) {
      this.lastSentLocation = currentLocation;
      return true; // Always send the very first location
    }

    const last = this.lastSentLocation;

    // 1. Temporal Check
    if (currentLocation.timestamp - last.timestamp >= this.TIME_THRESHOLD_MS) {
      this.lastSentLocation = currentLocation;
      return true;
    }

    // 2. Spatial Index Check
    const currentH3 = latLngToCell(currentLocation.latitude, currentLocation.longitude, this.H3_RESOLUTION);
    const lastH3 = latLngToCell(last.latitude, last.longitude, this.H3_RESOLUTION);
    if (currentH3 !== lastH3) {
      this.lastSentLocation = currentLocation;
      return true;
    }

    // 3. Distance Check
    const distance = this.calculateHaversine(last, currentLocation);
    if (distance >= this.DISTANCE_THRESHOLD_METERS) {
      this.lastSentLocation = currentLocation;
      return true;
    }

    // 4. Speed Check
    if (
      currentLocation.speed !== undefined &&
      last.speed !== undefined &&
      Math.abs(currentLocation.speed - last.speed) >= this.SPEED_THRESHOLD
    ) {
      this.lastSentLocation = currentLocation;
      return true;
    }

    // 5. Direction Check
    if (
      currentLocation.direction !== undefined &&
      last.direction !== undefined
    ) {
      // Handle 360 wrap-around
      let diff = Math.abs(currentLocation.direction - last.direction);
      if (diff > 180) {
        diff = 360 - diff;
      }
      if (diff >= this.DIRECTION_THRESHOLD) {
        this.lastSentLocation = currentLocation;
        return true;
      }
    }

    // If no threshold was breached, do not send.
    return false;
  }

  /**
   * Clears the internal state. Useful if the app goes to deep background.
   */
  public reset(): void {
    this.lastSentLocation = null;
  }
}
