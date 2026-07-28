export interface UserProfile {
  userId: string;
  username: string;
  avatarUrl: string;
}

export interface IUserProfileRepository {
  /**
   * Fetches user profiles in batch from the tourist-backend monolith.
   */
  getProfilesBatch(userIds: string[]): Promise<Map<string, UserProfile>>;
}
