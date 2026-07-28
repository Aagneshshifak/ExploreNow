import { IUserProfileRepository, UserProfile } from '../../domain/interfaces/profile.repository.interface';
import { logger } from '../../utils/logger.util';

export class HttpProfileRepository implements IUserProfileRepository {
  async getProfilesBatch(userIds: string[]): Promise<Map<string, UserProfile>> {
    const profileMap = new Map<string, UserProfile>();
    if (userIds.length === 0) return profileMap;

    try {
      // TODO: Replace with real HTTP/gRPC call to tourist-backend
      // const response = await axios.get(`http://tourist-backend/api/users?ids=${userIds.join(',')}`);
      
      // Mocking the monolith response for now
      for (const id of userIds) {
        profileMap.set(id, {
          userId: id,
          username: `user_${id.substring(0,4)}`,
          avatarUrl: `https://avatars.example.com/${id}.jpg`
        });
      }
    } catch (error) {
      logger.error('Failed to fetch user profiles in batch', error);
      // Fail gracefully: if the monolith is down, we return empty profiles
      // The MatchingService will handle this.
    }

    return profileMap;
  }
}
