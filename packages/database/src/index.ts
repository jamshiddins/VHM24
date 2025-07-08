// Export all database clients
export * from './clients/auth.client';
export * from './clients/machines.client';
export * from './clients/inventory.client';
export * from './clients/tasks.client';
export * from './clients/shared.client';

// Re-export the original PrismaClient for backward compatibility
// This will be removed after migration
export { PrismaClient } from '@prisma/client';

// Utility function to disconnect all clients
export async function disconnectAllClients(): Promise<void> {
  const { disconnectAuthClient } = await import('./clients/auth.client');
  const { disconnectMachinesClient } = await import('./clients/machines.client');
  const { disconnectInventoryClient } = await import('./clients/inventory.client');
  const { disconnectTasksClient } = await import('./clients/tasks.client');
  const { disconnectSharedClient } = await import('./clients/shared.client');

  await Promise.all([
    disconnectAuthClient(),
    disconnectMachinesClient(),
    disconnectInventoryClient(),
    disconnectTasksClient(),
    disconnectSharedClient(),
  ]);
}

// Database configuration helper
export interface DatabaseConfig {
  useMultipleDatabases: boolean;
  authDatabaseUrl?: string;
  machinesDatabaseUrl?: string;
  inventoryDatabaseUrl?: string;
  tasksDatabaseUrl?: string;
  sharedDatabaseUrl?: string;
  defaultDatabaseUrl: string;
  redisUrl?: string;
}

export function getDatabaseConfig(): DatabaseConfig {
  const useMultipleDatabases = process.env.USE_MULTIPLE_DATABASES === 'true';
  
  return {
    useMultipleDatabases,
    authDatabaseUrl: process.env.AUTH_DATABASE_URL,
    machinesDatabaseUrl: process.env.MACHINES_DATABASE_URL,
    inventoryDatabaseUrl: process.env.INVENTORY_DATABASE_URL,
    tasksDatabaseUrl: process.env.TASKS_DATABASE_URL,
    sharedDatabaseUrl: process.env.SHARED_DATABASE_URL,
    defaultDatabaseUrl: process.env.DATABASE_URL || '',
    redisUrl: process.env.REDIS_URL,
  };
}
