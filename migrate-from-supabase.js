const logger = require('@vhm24/shared/logger');

#!/usr/bin/env node

/**
 * Migration script from Supabase to new database architecture
 * This script will:
 * 1. Export data from Supabase
 * 2. Transform data for new schema structure
 * 3. Import data into new databases
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

// Old Supabase client
const supabaseClient = new PrismaClient({
  datasources: {
    db: {
      url: process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL
    }
  }
});

// New database clients (will be imported after generation)
let authClient, machinesClient, inventoryClient, tasksClient, sharedClient;

async function loadNewClients() {
  try {
    const { getAuthClient } = require('./packages/database/dist/clients/auth.client');
    const { getMachinesClient } = require('./packages/database/dist/clients/machines.client');
    const { getInventoryClient } = require('./packages/database/dist/clients/inventory.client');
    const { getTasksClient } = require('./packages/database/dist/clients/tasks.client');
    const { getSharedClient } = require('./packages/database/dist/clients/shared.client');

    authClient = getAuthClient();
    machinesClient = getMachinesClient();
    inventoryClient = getInventoryClient();
    tasksClient = getTasksClient();
    sharedClient = getSharedClient();
  } catch (error) {
    logger.error('Error loading new clients. Make sure to run "npm run generate" first.');
    throw error;
  }
}

async function exportData() {
  logger.info('📤 Exporting data from Supabase...');
  
  const data = {
    users: await supabaseClient.user.findMany({
      skip: (request.query.page - 1) * request.query.limit,
      take: request.query.limit,
      orderBy: { createdAt: 'desc' }
    }),
    locations: await supabaseClient.location.findMany({
      skip: (request.query.page - 1) * request.query.limit,
      take: request.query.limit,
      orderBy: { createdAt: 'desc' }
    }),
    machines: await supabaseClient.machine.findMany({
      skip: (request.query.page - 1) * request.query.limit,
      take: request.query.limit,
      orderBy: { createdAt: 'desc' }
    }),
    tasks: await supabaseClient.task.findMany({
      skip: (request.query.page - 1) * request.query.limit,
      take: request.query.limit,
      orderBy: { createdAt: 'desc' }
    }),
    taskActions: await supabaseClient.taskAction.findMany({
      skip: (request.query.page - 1) * request.query.limit,
      take: request.query.limit,
      orderBy: { createdAt: 'desc' }
    }),
    inventoryItems: await supabaseClient.inventoryItem.findMany({
      skip: (request.query.page - 1) * request.query.limit,
      take: request.query.limit,
      orderBy: { createdAt: 'desc' }
    }),
    stockMovements: await supabaseClient.stockMovement.findMany({
      skip: (request.query.page - 1) * request.query.limit,
      take: request.query.limit,
      orderBy: { createdAt: 'desc' }
    }),
    machineTelemetry: await supabaseClient.machineTelemetry.findMany({
      skip: (request.query.page - 1) * request.query.limit,
      take: request.query.limit,
      orderBy: { createdAt: 'desc' }
    }),
    auditLogs: await supabaseClient.auditLog.findMany({
      skip: (request.query.page - 1) * request.query.limit,
      take: request.query.limit,
      orderBy: { createdAt: 'desc' }
    }),
    transactions: await supabaseClient.transaction.findMany({
      skip: (request.query.page - 1) * request.query.limit,
      take: request.query.limit,
      orderBy: { createdAt: 'desc' }
    }),
    machineInventory: await supabaseClient.machineInventory.findMany({
      skip: (request.query.page - 1) * request.query.limit,
      take: request.query.limit,
      orderBy: { createdAt: 'desc' }
    }),
    serviceHistory: await supabaseClient.serviceHistory.findMany({
      skip: (request.query.page - 1) * request.query.limit,
      take: request.query.limit,
      orderBy: { createdAt: 'desc' }
    }),
  };

  // Save backup
  const backupPath = path.join(__dirname, 'supabase-backup.json');
  await fs.writeFile(backupPath, JSON.stringify(data, null, 2));
  logger.info(`✅ Data exported to ${backupPath}`);

  return data;
}

async function migrateAuthData(data) {
  logger.info('🔐 Migrating auth data...');
  
  // Migrate users
  for (const user of data.users) {
    await authClient.user.create({
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        passwordHash: user.passwordHash,
        roles: user.roles,
        phoneNumber: user.phoneNumber,
        telegramId: user.telegramId,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }
    });
  }

  // Migrate audit logs (only auth-related)
  const authAuditLogs = data.auditLogs.filter(log => 
    log.entity === 'User' || log.action.includes('auth') || log.action.includes('login')
  );
  
  for (const log of authAuditLogs) {
    await authClient.auditLog.create({
      data: {
        id: log.id,
        userId: log.userId,
        action: log.action,
        entity: log.entity,
        entityId: log.entityId,
        changes: log.changes,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        createdAt: log.createdAt,
      }
    });
  }

  logger.info(`✅ Migrated ${data.users.length} users and ${authAuditLogs.length} audit logs`);
}

async function migrateMachinesData(data) {
  logger.info('🤖 Migrating machines data...');
  
  // Migrate locations
  for (const location of data.locations) {
    await machinesClient.location.create({
      data: {
        id: location.id,
        name: location.name,
        address: location.address,
        latitude: location.latitude,
        longitude: location.longitude,
        isActive: location.isActive,
        createdAt: location.createdAt,
        updatedAt: location.updatedAt,
      }
    });
  }

  // Migrate machines
  for (const machine of data.machines) {
    await machinesClient.machine.create({
      data: {
        id: machine.id,
        code: machine.code,
        serialNumber: machine.serialNumber,
        type: machine.type,
        name: machine.name,
        status: machine.status,
        locationId: machine.locationId,
        lastPing: machine.lastPing,
        metadata: machine.metadata,
        createdAt: machine.createdAt,
        updatedAt: machine.updatedAt,
      }
    });
  }

  // Migrate telemetry
  for (const telemetry of data.machineTelemetry) {
    await machinesClient.machineTelemetry.create({
      data: {
        id: telemetry.id,
        machineId: telemetry.machineId,
        temperature: telemetry.temperature,
        humidity: telemetry.humidity,
        sales: telemetry.sales,
        errors: telemetry.errors,
        rawData: telemetry.rawData,
        createdAt: telemetry.createdAt,
      }
    });
  }

  // Migrate service history
  for (const service of data.serviceHistory) {
    await machinesClient.serviceHistory.create({
      data: {
        id: service.id,
        machineId: service.machineId,
        serviceType: service.serviceType,
        description: service.description,
        performedById: service.performedById,
        performedAt: service.performedAt,
        nextServiceDate: service.nextServiceDate,
        photos: service.photos,
        location: service.location,
        metadata: service.metadata,
      }
    });
  }

  logger.info(`✅ Migrated ${data.locations.length} locations, ${data.machines.length} machines`);
}

async function migrateInventoryData(data) {
  logger.info('📦 Migrating inventory data...');
  
  // Migrate inventory items
  for (const item of data.inventoryItems) {
    await inventoryClient.inventoryItem.create({
      data: {
        id: item.id,
        name: item.name,
        sku: item.sku,
        unit: item.unit,
        category: item.category,
        description: item.description,
        quantity: item.quantity,
        minQuantity: item.minQuantity,
        maxQuantity: item.maxQuantity,
        price: item.price,
        isActive: item.isActive,
        lastUpdated: item.lastUpdated,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }
    });
  }

  // Migrate stock movements
  for (const movement of data.stockMovements) {
    await inventoryClient.stockMovement.create({
      data: {
        id: movement.id,
        itemId: movement.itemId,
        userId: movement.userId,
        type: movement.type,
        quantity: movement.quantity,
        quantityBefore: movement.quantityBefore,
        quantityAfter: movement.quantityAfter,
        reason: movement.reason,
        reference: movement.reference,
        fromLocation: movement.fromLocation,
        toLocation: movement.toLocation,
        machineId: movement.machineId,
        metadata: movement.metadata,
        createdAt: movement.createdAt,
      }
    });
  }

  // Migrate machine inventory
  for (const inv of data.machineInventory) {
    await inventoryClient.machineInventory.create({
      data: {
        id: inv.id,
        machineId: inv.machineId,
        itemId: inv.itemId,
        quantity: inv.quantity,
        minQuantity: inv.minQuantity,
        maxQuantity: inv.maxQuantity,
        lastRefill: inv.lastRefill,
        createdAt: inv.createdAt,
        updatedAt: inv.updatedAt,
      }
    });
  }

  logger.info(`✅ Migrated ${data.inventoryItems.length} items, ${data.stockMovements.length} movements`);
}

async function migrateTasksData(data) {
  logger.info('📋 Migrating tasks data...');
  
  // Migrate tasks
  for (const task of data.tasks) {
    await tasksClient.task.create({
      data: {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        completedAt: task.completedAt,
        machineId: task.machineId,
        assignedToId: task.assignedToId,
        createdById: task.createdById,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      }
    });
  }

  // Migrate task actions
  for (const action of data.taskActions) {
    await tasksClient.taskAction.create({
      data: {
        id: action.id,
        taskId: action.taskId,
        userId: action.userId,
        action: action.action,
        comment: action.comment,
        location: action.location,
        photoUrls: action.photoUrls,
        metadata: action.metadata,
        createdAt: action.createdAt,
      }
    });
  }

  logger.info(`✅ Migrated ${data.tasks.length} tasks and ${data.taskActions.length} actions`);
}

async function migrateSharedData(data) {
  logger.info('🌐 Migrating shared data...');
  
  // Migrate transactions
  for (const transaction of data.transactions) {
    await sharedClient.transaction.create({
      data: {
        id: transaction.id,
        machineId: transaction.machineId,
        amount: transaction.amount,
        currency: transaction.currency,
        paymentType: transaction.paymentType,
        status: transaction.status,
        reference: transaction.reference,
        metadata: transaction.metadata,
        createdAt: transaction.createdAt,
      }
    });
  }

  logger.info(`✅ Migrated ${data.transactions.length} transactions`);
}

async function main() {
  try {
    logger.info('🚀 Starting migration from Supabase...\n');

    // Check environment
    if (!process.env.DATABASE_URL && !process.env.SUPABASE_DATABASE_URL) {
      throw new Error('Please set SUPABASE_DATABASE_URL or DATABASE_URL for the source database');
    }

    // Load new clients
    await loadNewClients();

    // Export data from Supabase
    const data = await exportData();

    // Migrate data to new databases
    await migrateAuthData(data);
    await migrateMachinesData(data);
    await migrateInventoryData(data);
    await migrateTasksData(data);
    await migrateSharedData(data);

    logger.info('\n✅ Migration completed successfully!');
    logger.info('📝 Next steps:');
    logger.info('1. Update your services to use the new database clients');
    logger.info('2. Test all functionality');
    logger.info('3. Remove Supabase dependencies');

  } catch (error) {
    logger.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await supabaseClient.$disconnect();
    if (authClient) await authClient.$disconnect();
    if (machinesClient) await machinesClient.$disconnect();
    if (inventoryClient) await inventoryClient.$disconnect();
    if (tasksClient) await tasksClient.$disconnect();
    if (sharedClient) await sharedClient.$disconnect();
  }
}

// Run migration
main();
