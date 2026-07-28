export interface OfflineMessage {
  id: string; // UUID for idempotency
  type: string; // e.g. "CONNECTION_REQUESTED", "CONNECTION_ACCEPTED"
  payload: any;
  timestamp: number;
}

export interface IOfflineQueueRepository {
  /**
   * Pushes a message to the user's offline queue in Redis.
   */
  pushMessage(userId: string, message: OfflineMessage): Promise<void>;

  /**
   * Retrieves all offline messages for a user and clears the queue atomically.
   */
  getAndClearMessages(userId: string): Promise<OfflineMessage[]>;
}
