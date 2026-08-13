import { IUserProfileRepository, UserProfile } from '../../domain/interfaces/profile.repository.interface';
import { config } from '../../config/env.config';
import { logger } from '../../utils/logger.util';

export class HttpProfileRepository implements IUserProfileRepository {
  private readonly monolithUrl: string;

  constructor() {
    this.monolithUrl = config.MONOLITH_URL;
  }

  async getProfilesBatch(userIds: string[]): Promise<Map<string, UserProfile>> {
    const profileMap = new Map<string, UserProfile>();
    if (userIds.length === 0) return profileMap;

    try {
      const response = await fetch(`${this.monolithUrl}/api/internal/users/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds }),
      });

      if (!response.ok) {
        logger.warn(`Monolith /api/internal/users/batch returned ${response.status}`);
        // Graceful fallback: return empty profiles
        return this.buildFallbackProfiles(userIds);
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        for (const profile of data.data) {
          profileMap.set(profile.userId, {
            userId: profile.userId,
            username: profile.username || 'Unknown Tourist',
            avatarUrl: profile.avatarUrl || '',
          });
        }
      }

      // Fill in any IDs that weren't returned (e.g. deleted users)
      for (const id of userIds) {
        if (!profileMap.has(id)) {
          profileMap.set(id, {
            userId: id,
            username: 'Unknown Tourist',
            avatarUrl: '',
          });
        }
      }
    } catch (error) {
      logger.error('Failed to fetch user profiles from monolith', error);
      // Fail gracefully: return fallback profiles so matching still works
      return this.buildFallbackProfiles(userIds);
    }

    return profileMap;
  }

  private buildFallbackProfiles(userIds: string[]): Map<string, UserProfile> {
    const fallback = new Map<string, UserProfile>();
    for (const id of userIds) {
      fallback.set(id, {
        userId: id,
        username: 'Unknown Tourist',
        avatarUrl: '',
      });
    }
    return fallback;
  }
}
