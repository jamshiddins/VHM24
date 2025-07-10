/**
 * VHM24 - VendHub Manager 24/7
 * Bunkers Service
 * Manages coffee bunkers (machine inventory) for 24/7 vending operations
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const Fastify = require('fastify');
const cors = require('@fastify/cors');
const { getSharedClient } = require('@vhm24/database');

const fastify = Fastify({ logger: true });
const prisma = getSharedClient();

// Register plugins
fastify.register(cors, { origin: true });

// Health check
fastify.get('/health', async () => {
  return { 
    status: 'ok', 
    service: 'bunkers',
    description: 'VHM24 Bunkers Service - 24/7 Operation',
    uptime: process.uptime()
  };
});

// Get all machine inventory (bunkers) with filters
fastify.get('/api/v1/bunkers', async (request, reply) => {
  try {
    const { machineId, itemId, needsRefill, page = 1, limit = 10 } = request.query;
    
    const where = {};
    if (machineId) where.machineId = machineId;
    if (itemId) where.itemId = itemId;
    
    // Get total count
    const total = await prisma.machineInventory.count({ where });
    
    // Get paginated data
    let bunkers = await prisma.machineInventory.findMany({
      where,
      include: {
        machine: {
          include: {
            location: true
          }
        },
        item: true
      },
      skip: (page - 1) * limit,
      take: parseInt(limit),
      orderBy: [
        { machine: { code: 'asc' } },
        { item: { name: 'asc' } }
      ]
    });

    // Calculate fill percentage and filter if needed
    bunkers = bunkers.map(bunker => {
      const fillPercentage = bunker.maxQuantity > 0 
        ? (bunker.quantity / bunker.maxQuantity) * 100 
        : 0;
      
      return {
        ...bunker,
        fillPercentage,
        needsRefill: fillPercentage < 20,
        critical: fillPercentage < 10
      };
    });

    // Filter for bunkers needing refill (для 24/7 мониторинга)
    if (needsRefill === 'true') {
      bunkers = bunkers.filter(bunker => bunker.needsRefill);
    }

    const criticalCount = bunkers.filter(b => b.critical).length;

    return {
      success: true,
      data: {
        items: bunkers,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
        criticalCount,
        message: criticalCount > 0 
          ? `⚠️ ${criticalCount} bunkers critically low - 24/7 monitoring active!`
          : '✅ All bunkers operational for 24/7 service'
      }
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({ error: 'Failed to fetch bunkers' });
  }
});

// Get bunker details
fastify.get('/api/v1/bunkers/:machineId/:itemId', async (request, reply) => {
  try {
    const { machineId, itemId } = request.params;
    
    const bunker = await prisma.machineInventory.findUnique({
      where: {
        machineId_itemId: {
          machineId,
          itemId
        }
      },
      include: {
        machine: {
          include: {
            location: true
          }
        },
        item: true
      }
    });

    if (!bunker) {
      return reply.code(404).send({ error: 'Bunker not found' });
    }

    // Get recent movements
    const recentMovements = await prisma.stockMovement.findMany({
      where: {
        machineId,
        itemId
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    const fillPercentage = bunker.maxQuantity > 0 
      ? (bunker.quantity / bunker.maxQuantity) * 100 
      : 0;

    return {
      success: true,
      data: {
        ...bunker,
        fillPercentage,
        needsRefill: fillPercentage < 20,
        critical: fillPercentage < 10,
        recentMovements,
        status: fillPercentage < 10 ? 'CRITICAL' : 
                fillPercentage < 20 ? 'LOW' : 
                fillPercentage < 50 ? 'MEDIUM' : 'GOOD'
      }
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({ error: 'Failed to fetch bunker details' });
  }
});

// Refill bunker

// Схема валидации для POST /api/v1/bunkers/:machineId/:itemId/refill
const postapiv1bunkers:machineId:itemIdrefillSchema = {
  body: {
    type: 'object',
    required: [],
    properties: {}
  }
};

fastify.post('/api/v1/bunkers/:machineId/:itemId/refill', { schema: postapiv1bunkers:machineId:itemIdrefillSchema }, async (request, reply) => {
  try {
    const { machineId, itemId } = request.params;
    const { quantity, userId, notes } = request.body;
    
    // Get current bunker state
    const bunker = await prisma.machineInventory.findUnique({
      where: {
        machineId_itemId: {
          machineId,
          itemId
        }
      },
      include: {
        item: true
      }
    });

    if (!bunker) {
      return reply.code(404).send({ error: 'Bunker not found' });
    }

    const quantityBefore = bunker.quantity;
    const quantityAfter = Math.min(bunker.quantity + quantity, bunker.maxQuantity || quantity);
    const actualQuantity = quantityAfter - quantityBefore;

    // Update bunker
    const updatedBunker = await prisma.machineInventory.update({
      where: {
        machineId_itemId: {
          machineId,
          itemId
        }
      },
      data: {
        quantity: quantityAfter,
        lastRefill: new Date()
      }
    });

    // Record stock movement
    await prisma.stockMovement.create({
      data: {
        itemId,
        userId,
        type: 'IN',
        quantity: actualQuantity,
        quantityBefore,
        quantityAfter,
        reason: `Bunker refill - ${notes || 'Regular 24/7 maintenance'}`,
        machineId
      }
    });

    // Create service history
    await prisma.serviceHistory.create({
      data: {
        machineId,
        serviceType: 'REFILL',
        description: `Refilled ${bunker.item?.name || 'Item'} - Added ${actualQuantity} ${bunker.item?.unit || 'units'}`,
        performedById: userId,
        performedAt: new Date(),
        metadata: {
          itemId,
          quantityAdded: actualQuantity,
          notes
        }
      }
    });

    fastify.log.info(`Bunker refilled - Machine: ${machineId}, Item: ${itemId}, Quantity: ${actualQuantity}`);

    return {
      success: true,
      data: {
        bunker: updatedBunker,
        refillAmount: actualQuantity,
        message: `✅ Bunker refilled successfully - Ready for 24/7 operation`
      }
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({ error: 'Failed to refill bunker' });
  }
});

// Get critical bunkers (low level)
fastify.get('/api/v1/bunkers/critical', async (request, reply) => {
  try {
    const bunkers = await prisma.machineInventory.findMany({
      include: {
        machine: {
          include: {
            location: true
          }
        },
        item: true
      }
    });

    // Filter critical bunkers
    const criticalBunkers = bunkers
      .map(bunker => {
        const fillPercentage = bunker.maxQuantity > 0 
          ? (bunker.quantity / bunker.maxQuantity) * 100 
          : 0;
        
        return {
          ...bunker,
          fillPercentage,
          hoursRemaining: fillPercentage < 20 
            ? Math.round((bunker.quantity / 10) * 24) // Estimate based on average consumption
            : null
        };
      })
      .filter(bunker => bunker.fillPercentage < 20)
      .sort((a, b) => a.fillPercentage - b.fillPercentage);

    return {
      success: true,
      data: {
        critical: criticalBunkers.filter(b => b.fillPercentage < 10),
        low: criticalBunkers.filter(b => b.fillPercentage >= 10 && b.fillPercentage < 20),
        totalCritical: criticalBunkers.length,
        message: criticalBunkers.length > 0 
          ? `⚠️ ${criticalBunkers.length} bunkers need urgent attention for 24/7 operation!`
          : '✅ All bunkers have sufficient levels for 24/7 operation'
      }
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({ error: 'Failed to fetch critical bunkers' });
  }
});

// Bunker consumption report
fastify.get('/api/v1/bunkers/consumption-report', async (request, reply) => {
  try {
    const { machineId, itemId, days = 7 } = request.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const where = {
      type: 'OUT',
      createdAt: { gte: startDate }
    };
    
    if (machineId) where.machineId = machineId;
    if (itemId) where.itemId = itemId;
    
    const movements = await prisma.stockMovement.findMany({
      where,
      include: {
        machine: true,
        item: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Group by machine and item
    const consumption = {};
    movements.forEach(movement => {
      const key = `${movement.machineId}-${movement.itemId}`;
      if (!consumption[key]) {
        consumption[key] = {
          machine: movement.machine,
          item: movement.item,
          totalConsumed: 0,
          movements: []
        };
      }
      consumption[key].totalConsumed += movement.quantity;
      consumption[key].movements.push(movement);
    });
    
    return {
      success: true,
      data: {
        period: `Last ${days} days`,
        startDate,
        endDate: new Date(),
        consumption: Object.values(consumption),
        totalMovements: movements.length
      }
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({ error: 'Failed to generate consumption report' });
  }
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ 
      port: process.env.BUNKERS_PORT || 3005,
      host: '0.0.0.0'
    });
    logger.info('VHM24 Bunkers Service running 24/7 on port', process.env.BUNKERS_PORT || 3005);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

// Graceful shutdown
process.on('SIGTERM', async () => {
  await fastify.close();
  await prisma.$disconnect();
  process.exit(0);
});
