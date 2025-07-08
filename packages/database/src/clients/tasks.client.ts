import { PrismaClient as TasksPrismaClient } from '@prisma/client/tasks';
import { createPrismaRedisCache } from 'prisma-redis-middleware';
import Redis from 'ioredis';

let tasksClient: TasksPrismaClient | null = null;

export function getTasksClient(): TasksPrismaClient {
  if (!tasksClient) {
    tasksClient = new TasksPrismaClient({
      datasources: {
        db: {
          url: process.env.TASKS_DATABASE_URL || process.env.DATABASE_URL,
        },
      },
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

    // Add Redis caching middleware if Redis is available
    if (process.env.REDIS_URL) {
      const redis = new Redis(process.env.REDIS_URL);
      const cacheMiddleware = createPrismaRedisCache({
        models: [
          { model: 'TaskTemplate', cacheTime: 3600 }, // Cache templates for 1 hour
        ],
        storage: {
          type: 'redis',
          options: { client: redis },
        },
      });
      
      tasksClient.$use(cacheMiddleware);
    }
  }

  return tasksClient;
}

export async function disconnectTasksClient(): Promise<void> {
  if (tasksClient) {
    await tasksClient.$disconnect();
    tasksClient = null;
  }
}

// Export types
export * from '@prisma/client/tasks';
