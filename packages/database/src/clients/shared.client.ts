import { PrismaClient as SharedPrismaClient } from '@prisma/client/shared';
import { createPrismaRedisCache } from 'prisma-redis-middleware';
import Redis from 'ioredis';

let sharedClient: SharedPrismaClient | null = null;

export function getSharedClient(): SharedPrismaClient {
  if (!sharedClient) {
    sharedClient = new SharedPrismaClient({
      datasources: {
        db: {
          url: process.env.SHARED_DATABASE_URL || process.env.DATABASE_URL,
        },
      },
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

    // Add Redis caching middleware if Redis is available
    if (process.env.REDIS_URL) {
      const redis = new Redis(process.env.REDIS_URL);
      const cacheMiddleware = createPrismaRedisCache({
        models: [
          { model: 'SystemConfig', cacheTime: 3600 }, // Cache config for 1 hour
        ],
        storage: {
          type: 'redis',
          options: { client: redis },
        },
      });
      
      sharedClient.$use(cacheMiddleware);
    }
  }

  return sharedClient;
}

export async function disconnectSharedClient(): Promise<void> {
  if (sharedClient) {
    await sharedClient.$disconnect();
    sharedClient = null;
  }
}

// Export types
export * from '@prisma/client/shared';
