export type ConnectionStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'BLOCKED';

export interface IConnectionRepository {
  /**
   * Upserts a connection request status between two users.
   */
  upsertConnection(senderId: string, receiverId: string, status: ConnectionStatus): Promise<void>;

  /**
   * Gets a set of user IDs that have an ACCEPTED connection with the given user.
   */
  getApprovedConnections(userId: string): Promise<Set<string>>;

  /**
   * Logs a privacy or connection event for compliance.
   */
  logAudit(userId: string, action: string, metadata?: any): Promise<void>;
}
