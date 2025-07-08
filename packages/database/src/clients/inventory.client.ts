import { PrismaClient as InventoryPrismaClient } from '@prisma/client/inventory';
import { createPrismaRedisCache } from 'prisma-redis-middleware';
import Redis from 'ioredis';

let inventoryClient: InventoryPrismaClient | null = null;

export function getInventoryClient(): InventoryPrismaClient {
  if (!inventoryClient) {
    inventoryClient = new InventoryPrismaClient({
      datasources: {
        db: {
          url: process.env.INVENTORY_DATABASE_URL || process.env.DATABASE_URL,
        },
      },
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

    // Add Redis caching middleware if Redis is available
    if (process.env.REDIS_URL) {
      const redis = new Redis(process.env.REDIS_URL);
      const cacheMiddleware = createPrismaRedisCache({
        models: [
          { model: 'InventoryItem', cacheTime: 300 }, // Cache items for 5 minutes
          { model: 'WarehouseLocation', cacheTime: 3600 }, // Cache locations for 1 hour
        ],
        storage: {
          type: 'redis',
          options: { client: redis },
        },
      });
      
      inventoryClient.$use(cacheMiddleware);
    }
  }

  return inventoryClient;
}

export async function disconnectInventoryClient(): Promise<void> {
  if (inventoryClient) {
    await inventoryClient.$disconnect();
    inventoryClient = null;
  }
}

// Export types
export * from '@prisma/client/inventory';
