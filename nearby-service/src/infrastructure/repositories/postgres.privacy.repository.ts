import { IPrivacyRepository } from '../../domain/interfaces/privacy.repository.interface';
import { prisma } from '../database/prisma.client';
import { logger } from '../../utils/logger.util';

export class PostgresPrivacyRepository implements IPrivacyRepository {
  async isUserDiscoverable(userId: string): Promise<boolean> {
    try {
      const settings = await prisma.client.privacySettings.findUnique({
        where: { userId },
        select: { isDiscoverable: true }
      });
      
      // If no settings exist yet, default to discoverable
      if (!settings) return true;
      
      return settings.isDiscoverable;
    } catch (error) {
      logger.error(`Failed to fetch privacy settings for user ${userId}`, error);
      // Fail safe: assume not discoverable on DB error to protect privacy
      return false;
    }
  }

  async filterDiscoverableUsers(userIds: string[]): Promise<string[]> {
    if (userIds.length === 0) return [];
    
    try {
      // Find all users in the list who explicitly have isDiscoverable = false
      const hiddenUsers = await prisma.client.privacySettings.findMany({
        where: {
          userId: { in: userIds },
          isDiscoverable: false
        },
        select: { userId: true }
      });

      const hiddenIds = new Set(hiddenUsers.map((u: { userId: string }) => u.userId));
      
      // Return the original list minus the hidden users
      return userIds.filter(id => !hiddenIds.has(id));
    } catch (error) {
      logger.error('Failed to filter discoverable users — returning all as discoverable to avoid silent empty results', error);
      return userIds; // Fail open: don't silently hide everyone on a DB hiccup
    }
  }
}
