import { IConnectionRepository, ConnectionStatus } from '../../domain/interfaces/connection.repository.interface';
import { prisma } from '../database/prisma.client';
import { logger } from '../../utils/logger.util';

export class PostgresConnectionRepository implements IConnectionRepository {
  
  async upsertConnection(senderId: string, receiverId: string, status: ConnectionStatus): Promise<void> {
    try {
      await prisma.client.connectionRequest.upsert({
        where: {
          senderId_receiverId: {
            senderId,
            receiverId
          }
        },
        update: { status: status as any },
        create: {
          senderId,
          receiverId,
          status: status as any
        }
      });
    } catch (error) {
      logger.error(`Failed to upsert connection between ${senderId} and ${receiverId}`, error);
      throw error;
    }
  }

  async getApprovedConnections(userId: string): Promise<Set<string>> {
    try {
      // Find all connections where the user is either the sender OR the receiver, and status is ACCEPTED
      const connections = await prisma.client.connectionRequest.findMany({
        where: {
          OR: [
            { senderId: userId },
            { receiverId: userId }
          ],
          status: 'ACCEPTED'
        },
        select: {
          senderId: true,
          receiverId: true
        }
      });

      const approvedIds = new Set<string>();
      for (const conn of connections) {
        if (conn.senderId !== userId) approvedIds.add(conn.senderId);
        if (conn.receiverId !== userId) approvedIds.add(conn.receiverId);
      }
      
      return approvedIds;
    } catch (error) {
      logger.error(`Failed to fetch approved connections for ${userId}`, error);
      return new Set();
    }
  }

  async logAudit(userId: string, action: string, metadata?: any): Promise<void> {
    try {
      await prisma.client.auditLog.create({
        data: {
          userId,
          action,
          metadata: metadata ? metadata : undefined
        }
      });
    } catch (error) {
      logger.error(`Failed to write audit log for ${userId}`, error);
    }
  }
}
