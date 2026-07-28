import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger.util';
import { config } from '../../config/env.config';

class PrismaDatabase {
  public client: PrismaClient;

  constructor() {
    this.client = new PrismaClient({
      datasources: {
        db: {
          url: config.DATABASE_URL,
        },
      },
      log: config.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }

  public async connect(): Promise<void> {
    try {
      await this.client.$connect();
      logger.info('✅ PostgreSQL connected via Prisma');
    } catch (error) {
      logger.error('❌ Failed to connect to PostgreSQL', error);
      process.exit(1);
    }
  }

  public async disconnect(): Promise<void> {
    await this.client.$disconnect();
    logger.info('🔌 PostgreSQL disconnected');
  }
}

export const prisma = new PrismaDatabase();
