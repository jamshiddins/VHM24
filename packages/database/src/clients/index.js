// Simplified database clients for JavaScript usage
const { PrismaClient } = require('@prisma/client');

// Single database mode (default)
let prismaClient = null;

function getPrismaClient() {
  if (!prismaClient) {
    prismaClient = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }
  return prismaClient;
}

// Multi-database mode clients
let authClient = null;
let machinesClient = null;
let inventoryClient = null;
let tasksClient = null;
let sharedClient = null;

function getAuthClient() {
  if (process.env.USE_MULTIPLE_DATABASES !== 'true') {
    return getPrismaClient();
  }
  
  if (!authClient) {
    authClient = new PrismaClient({
      datasources: {
        db: {
          url: process.env.AUTH_DATABASE_URL || process.env.DATABASE_URL,
        },
      },
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }
  return authClient;
}

function getMachinesClient() {
  if (process.env.USE_MULTIPLE_DATABASES !== 'true') {
    return getPrismaClient();
  }
  
  if (!machinesClient) {
    machinesClient = new PrismaClient({
      datasources: {
        db: {
          url: process.env.MACHINES_DATABASE_URL || process.env.DATABASE_URL,
        },
      },
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }
  return machinesClient;
}

function getInventoryClient() {
  if (process.env.USE_MULTIPLE_DATABASES !== 'true') {
    return getPrismaClient();
  }
  
  if (!inventoryClient) {
    inventoryClient = new PrismaClient({
      datasources: {
        db: {
          url: process.env.INVENTORY_DATABASE_URL || process.env.DATABASE_URL,
        },
      },
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }
  return inventoryClient;
}

function getTasksClient() {
  if (process.env.USE_MULTIPLE_DATABASES !== 'true') {
    return getPrismaClient();
  }
  
  if (!tasksClient) {
    tasksClient = new PrismaClient({
      datasources: {
        db: {
          url: process.env.TASKS_DATABASE_URL || process.env.DATABASE_URL,
        },
      },
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }
  return tasksClient;
}

function getSharedClient() {
  if (process.env.USE_MULTIPLE_DATABASES !== 'true') {
    return getPrismaClient();
  }
  
  if (!sharedClient) {
    sharedClient = new PrismaClient({
      datasources: {
        db: {
          url: process.env.SHARED_DATABASE_URL || process.env.DATABASE_URL,
        },
      },
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }
  return sharedClient;
}

// Disconnect functions
async function disconnectAllClients() {
  const clients = [
    prismaClient,
    authClient,
    machinesClient,
    inventoryClient,
    tasksClient,
    sharedClient
  ].filter(Boolean);

  await Promise.all(clients.map(client => client.$disconnect()));
  
  // Reset all clients
  prismaClient = null;
  authClient = null;
  machinesClient = null;
  inventoryClient = null;
  tasksClient = null;
  sharedClient = null;
}

module.exports = {
  getPrismaClient,
  getAuthClient,
  getMachinesClient,
  getInventoryClient,
  getTasksClient,
  getSharedClient,
  disconnectAllClients,
  // For backward compatibility
  PrismaClient
};
