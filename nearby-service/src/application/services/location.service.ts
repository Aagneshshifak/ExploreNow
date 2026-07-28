import { ILocationRepository } from '../../domain/interfaces/location.repository.interface';
import { IPrivacyRepository } from '../../domain/interfaces/privacy.repository.interface';
import { IEventDispatcher } from '../../domain/interfaces/event.dispatcher.interface';
import { UpdateLocationDTO } from '../dtos/location.dto';
import { LiveLocation } from '../../domain/entities/location.entity';
import { getH3Index, DEFAULT_H3_RESOLUTION } from '../../utils/h3.util';
import { logger } from '../../utils/logger.util';

export class LocationService {
  constructor(
    private readonly locationRepo: ILocationRepository,
    private readonly privacyRepo: IPrivacyRepository,
    private readonly eventDispatcher: IEventDispatcher
  ) {}

  /**
   * Processes a GPS update, validates privacy, saves to Redis, and broadcasts an event.
   */
  public async updateLocation(userId: string, data: UpdateLocationDTO): Promise<void> {
    logger.debug(`Processing location update for user ${userId}`);

    // 1. Calculate Spatial Index
    const h3Index = getH3Index(data.latitude, data.longitude, DEFAULT_H3_RESOLUTION);

    const locationData: LiveLocation = {
      userId,
      lat: data.latitude,
      lng: data.longitude,
      ts: Date.now(),
      h3: h3Index,
      spd: data.speed,
      dir: data.direction,
      on: 1 // Online
    };

    // 2. Check Privacy Settings (Ghost Mode)
    const isDiscoverable = await this.privacyRepo.isUserDiscoverable(userId);
    
    if (!isDiscoverable) {
      // If ghost mode, we alter the payload so they don't get saved into the public H3 bucket
      // We set their cell to a "ghost" bucket or just skip saving them to the spatial index.
      // But we still want to save their last known location hash.
      locationData.h3 = 'GHOST'; 
      locationData.on = 0; // Treat as offline for discovery purposes
    }

    // 3. Save to Redis (Upsert Hash & Add to H3 Spatial Bucket)
    await this.locationRepo.saveLocation(locationData);

    // 4. Publish Event for WebSocket Notification Service
    // We only publish if they are discoverable
    if (isDiscoverable) {
      await this.eventDispatcher.publish('channel:location_updated', locationData);
    }
  }

  /**
   * Called when a client disconnects unexpectedly or hasn't pinged in a while.
   */
  public async markUserOffline(userId: string): Promise<void> {
    await this.locationRepo.markUserOffline(userId);
    logger.info(`User ${userId} marked offline.`);
  }
}
