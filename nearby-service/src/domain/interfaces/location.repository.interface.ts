import { LiveLocation } from '../entities/location.entity';

export interface ILocationRepository {
  /**
   * Upsert a user's live location and place them in the correct spatial H3 bucket.
   */
  saveLocation(location: LiveLocation): Promise<void>;

  /**
   * Retrieve a user's exact last known location.
   */
  getLocationByUserId(userId: string): Promise<LiveLocation | null>;

  /**
   * Get all user IDs currently residing in a specific H3 bucket.
   */
  getActiveUsersInH3Cell(h3Index: string): Promise<string[]>;

  /**
   * Mark a user as offline due to inactivity/signal loss.
   */
  markUserOffline(userId: string): Promise<void>;
}
