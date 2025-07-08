import { PrismaClient as AuthPrismaClient } from '@prisma/client/auth';
import { createPrismaRedisCache } from 'prisma-redis-middleware';
import Redis from 'ioredis';

let authClient: AuthPrismaClient | null = null;

export function getAuthClient(): AuthPrismaClient {
  if (!authClient) {
    authClient = new AuthPrismaClient({
      datasources: {
        db: {
          url: process.env.AUTH_DATABASE_URL || process.env.DATABASE_URL,
        },
      },
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

    // Add Redis caching middleware if Redis is available
    if (process.env.REDIS_URL) {
      const redis = new Redis(process.env.REDIS_URL);
      const cacheMiddleware = createPrismaRedisCache({
        models: [
          { model: 'User', cacheTime: 300 }, // Cache users for 5 minutes
          { model: 'Session', cacheTime: 60 }, // Cache sessions for 1 minute
        ],
        storage: {
          type: 'redis',
          options: { client: redis },
        },
      });
      
      authClient.$use(cacheMiddleware);
    }
  }

  return authClient;
}

export async function disconnectAuthClient(): Promise<void> {
  if (authClient) {
    await authClient.$disconnect();
    authClient = null;
  }
}

// Export types
export * from '@prisma/client/auth';
