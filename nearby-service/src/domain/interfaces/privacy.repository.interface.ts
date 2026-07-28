export interface IPrivacyRepository {
  /**
   * Checks if a user is discoverable by others.
   * If they are in Ghost Mode, this returns false.
   */
  isUserDiscoverable(userId: string): Promise<boolean>;

  /**
   * Filters an array of user IDs, returning only those who are discoverable.
   */
  filterDiscoverableUsers(userIds: string[]): Promise<string[]>;
}
