import { PrismaClient as MachinesPrismaClient } from '@prisma/client/machines';
import { createPrismaRedisCache } from 'prisma-redis-middleware';
import Redis from 'ioredis';

let machinesClient: MachinesPrismaClient | null = null;

export function getMachinesClient(): MachinesPrismaClient {
  if (!machinesClient) {
    machinesClient = new MachinesPrismaClient({
      datasources: {
        db: {
          url: process.env.MACHINES_DATABASE_URL || process.env.DATABASE_URL,
        },
      },
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

    // Add Redis caching middleware if Redis is available
    if (process.env.REDIS_URL) {
      const redis = new Redis(process.env.REDIS_URL);
      const cacheMiddleware = createPrismaRedisCache({
        models: [
          { model: 'Machine', cacheTime: 600 }, // Cache machines for 10 minutes
          { model: 'Location', cacheTime: 3600 }, // Cache locations for 1 hour
        ],
        storage: {
          type: 'redis',
          options: { client: redis },
        },
      });
      
      machinesClient.$use(cacheMiddleware);
    }
  }

  return machinesClient;
}

export async function disconnectMachinesClient(): Promise<void> {
  if (machinesClient) {
    await machinesClient.$disconnect();
    machinesClient = null;
  }
}

// Export types
export * from '@prisma/client/machines';
