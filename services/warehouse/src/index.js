const logger = console;
/**
 * VHM24 Warehouse Service
 * Микросервис для управления складскими операциями
 */

const fastify = require('fastify')({ logger: true 
} catch (error) {
      logger.error('Error:', error);
      throw error;)
    }} catch (error) {
      logger.error('Error:', error);
      throw error;
} catch (error) {
      logger.error('Error:', error);
      throw error;
    }}});
const { PrismaClient )} = require('@prisma/client');

const prisma = new PrismaClient();

// Регистрируем плагины
fastify.register(require('@fastify/cors'), {
  origin: true
} catch (error) {
      logger.error('Error:', error);
      throw error;
    }});

fastify.register(require('@fastify/jwt'), {
  secret: process.env.JWT_SECRET || 'your-secret-key'
} catch (error) {
      logger.error('Error:', error);
      throw error;
    }});

// Middleware для аутентификации
fastify.decorate('authenticate', async function (request, reply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.code(err.statusCode || 500).send({
          error: err.name || 'Internal Server Error',
          message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
        });
  }
} catch (error) {
      logger.error('Error:', error);
      throw error;
    }});

// Получить статистику склада
fastify.get('/warehouse/stats', {
  preHandler: [fastify.authenticate]
} catch (error) {
      logger.error('Error:', error);
      throw error;
    }}, async (request, reply) => {
    try {
      
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Общее количество товаров
    const totalItems = await prisma.inventoryItem.count();

    // Товары с низкими остатками
    const lowStock = await prisma.inventoryItem.count({
      where: {
        quantity: {
          lte: prisma.inventoryItem.fields.minQuantity
} catch (error) {
      logger.error('Error:', error);
      throw error;
    }}
      }
    });

    // Поступления сегодня
    const todayReceived = await prisma.stockMovement.count({
      where: {
        type: 'IN',
        createdAt: {
          gte: today,
          lt: tomorrow
} catch (error) {
      logger.error('Error:', error);
      throw error;
    }}
      }
    });

    // Отгружено сегодня
    const todayShipped = await prisma.stockMovement.count({
      where: {
        type: 'OUT',
        createdAt: {
          gte: today,
          lt: tomorrow
} catch (error) {
      logger.error('Error:', error);
      throw error;
    }}
      }
    });

    reply.send({
      success: true,
      data: {
        totalItems,
        lowStock,
        todayReceived,
        todayShipped
      }
    });
  } catch (error) {
    fastify.log.error(error);
    reply.status(500).send({
      success: false,
      error: 'Failed to fetch warehouse stats'
    });
  }
});

// Получить движения товаров
fastify.get('/stock-movements', {
  preHandler: [fastify.authenticate]
}, async (request, reply) => {
    try {
      
  try {
    const { type, itemId, userId, limit = 50, offset = 0 )} = request.query;
    
    const where = {)};
    if (type) where.type = type;
    if (itemId) where.itemId = itemId;
    if (userId) where.userId = userId;

    const movements = await prisma.stockMovement.findMany({
      where,
      include: {
        item: {
          select: { id: true, name: true, sku: true, unit: true }
        },
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)});

    reply.send({
      success: true,
      data: movements,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: await prisma.stockMovement.count({ where })
      }
} catch (error) {
      logger.error('Error:', error);
      throw error;
    }});
  } catch (error) {
    fastify.log.error(error);
    reply.status(500).send({
      success: false,
      error: 'Failed to fetch stock movements'
} catch (error) {
      logger.error('Error:', error);
      throw error;
    }});
  }
});

// Создать движение товара

// Схема валидации для POST /stock-movements
const poststock-movementsSchema = {
  body: {
    type: 'object',
    required: [],
    properties: {)}
  }
};

fastify.post('/stock-movements', { preHandler: [fastify.authenticate], schema: poststock-movementsSchema }, async (request, reply) => {
    try {
      
  try {
    const { 
      itemId, 
      type, 
      quantity, 
      quantityBefore,
      quantityAfter,
      reason, 
      reference, 
      machineId,
      metadata 
    } = request.body;

    // Валидация
    if (!itemId || !type || !quantity || !reason) {
      return reply.status(400).send({
        success: false,
        error: 'ItemId, type, quantity and reason are required'
      });
    }

    // Проверяем существование товара
    const item = await prisma.inventoryItem.findUnique({
      where: { id: itemId }
    });

    if (!item) {
      return reply.status(404).send({
        success: false,
        error: 'Item not found'
      });
    }

    // Создаем движение в транзакции
    const result = await prisma.$transaction(async (tx) => {
    try {
      
      // Создаем запись о движении
      const movement = await tx.stockMovement.create({
        data: {
          itemId,
          type,
          quantity: parseFloat(quantity),
          quantityBefore: quantityBefore ? parseFloat(quantityBefore) : item.quantity,
          quantityAfter: quantityAfter ? parseFloat(quantityAfter) : null,
          reason,
          reference,
          userId: request.user.id,
          machineId,
          metadata: metadata || {}
        },
        include: {
          item: {
            select: { id: true, name: true, sku: true, unit: true }
          },
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      // Обновляем остаток товара
      let newQuantity;
      if (quantityAfter !== undefined) {
        newQuantity = parseFloat(quantityAfter);
      } else {
        newQuantity = type === 'IN' 
          ? item.quantity + parseFloat(quantity)
          : item.quantity - parseFloat(quantity);
      }

      await tx.inventoryItem.update({
        where: { id: itemId },
        data: { 
          quantity: newQuantity,
          updatedAt: new Date()
        }
      });

      return { ...movement, newQuantity };
    });

    reply.status(201).send({
      success: true,
      data: result
    });
  } catch (error) {
    fastify.log.error(error);
    reply.status(500).send({
      success: false,
      error: 'Failed to create stock movement'
    });
  }
});

// Получить складские логи
fastify.get('/warehouse-logs', {
  preHandler: [fastify.authenticate]
}, async (request, reply) => {
    try {
      
  try {
    const { type, userId, limit = 50, offset = 0 } = request.query;
    
    const where = {};
    if (type) where.type = type;
    if (userId) where.userId = userId;

    // Используем общую таблицу логов или создаем отдельную для склада
    const logs = await prisma.activityLog.findMany({
      where: {
        ...where,
        category: 'WAREHOUSE'
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    reply.send({
      success: true,
      data: logs,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: await prisma.activityLog.count({ 
          where: { ...where, category: 'WAREHOUSE' } 
        })
      }
    });
  } catch (error) {
    fastify.log.error(error);
    reply.status(500).send({
      success: false,
      error: 'Failed to fetch warehouse logs'
    });
  }
});

// Создать складской лог

// Схема валидации для POST /warehouse-logs
const postwarehouse-logsSchema = {
  body: {
    type: 'object',
    required: [],
    properties: {}
  }
};

fastify.post('/warehouse-logs', { preHandler: [fastify.authenticate], schema: postwarehouse-logsSchema }, async (request, reply) => {
    try {
      
  try {
    const { type, description, weight, photos, metadata } = request.body;

    // Валидация
    if (!type || !description) {
      return reply.status(400).send({
        success: false,
        error: 'Type and description are required'
      });
    }

    const log = await prisma.activityLog.create({
      data: {
        category: 'WAREHOUSE',
        type,
        description,
        userId: request.user.id,
        metadata: {
          ...metadata,
          weight: weight ? parseFloat(weight) : null,
          photos: photos || []
        }
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    reply.status(201).send({
      success: true,
      data: log
    });
  } catch (error) {
    fastify.log.error(error);
    reply.status(500).send({
      success: false,
      error: 'Failed to create warehouse log'
    });
  }
});

// Получить товары для заполнения бункеров
fastify.get('/machine-inventory', {
  preHandler: [fastify.authenticate]
}, async (request, reply) => {
    try {
      
  try {
    const { machineId, needsRefill, limit = 20, offset = 0 } = request.query;
    
    const where = {};
    if (machineId) where.machineId = machineId;
    if (needsRefill === 'true') {
      where.quantity = {
        lte: 10 // Считаем что нужна дозаправка если меньше 10 единиц
      };
    }

    const inventory = await prisma.machineInventory.findMany({
      where,
      include: {
        machine: {
          select: { id: true, name: true, location: true }
        },
        item: {
          select: { id: true, name: true, sku: true, unit: true }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    reply.send({
      success: true,
      data: inventory,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: await prisma.machineInventory.count({ where })
      }
    });
  } catch (error) {
    fastify.log.error(error);
    reply.status(500).send({
      success: false,
      error: 'Failed to fetch machine inventory'
    });
  }
});

// Обновить остатки в бункере

// Схема валидации для PATCH /machine-inventory/:id
const patchmachine-inventory:idSchema = {
  body: {
    type: 'object',
    required: [],
    properties: {}
  }
};

fastify.patch('/machine-inventory/:id', { preHandler: [fastify.authenticate], schema: patchmachine-inventory:idSchema }, async (request, reply) => {
    try {
      
  try {
    const { id } = request.params;
    const { quantity } = request.body;

    if (quantity === undefined || quantity < 0) {
      return reply.status(400).send({
        success: false,
        error: 'Valid quantity is required'
      });
    }

    // Проверяем существование записи
    const existing = await prisma.machineInventory.findUnique({
      where: { id },
      include: {
        machine: { select: { id: true, name: true } },
        item: { select: { id: true, name: true, sku: true } }
      }
    });

    if (!existing) {
      return reply.status(404).send({
        success: false,
        error: 'Machine inventory record not found'
      });
    }

    // Обновляем количество
    const updated = await prisma.machineInventory.update({
      where: { id },
      data: {
        quantity: parseFloat(quantity),
        updatedAt: new Date()
      },
      include: {
        machine: {
          select: { id: true, name: true, location: true }
        },
        item: {
          select: { id: true, name: true, sku: true, unit: true }
        }
      }
    });

    // Создаем лог изменения
    await prisma.activityLog.create({
      data: {
        category: 'WAREHOUSE',
        type: 'INVENTORY_UPDATE',
        description: `Обновлены остатки ${existing.item.name} в ${existing.machine.name}: ${existing.quantity} → ${quantity}`,
        userId: request.user.id,
        metadata: {
          machineId: existing.machineId,
          itemId: existing.itemId,
          oldQuantity: existing.quantity,
          newQuantity: parseFloat(quantity)
        }
      }
    });

    reply.send({
      success: true,
      data: updated
    });
  } catch (error) {
    fastify.log.error(error);
    reply.status(500).send({
      success: false,
      error: 'Failed to update machine inventory'
    });
  }
});

// Поиск товаров по артикулу/названию
fastify.get('/inventory/items', {
  preHandler: [fastify.authenticate]
}, async (request, reply) => {
    try {
      
  try {
    const { sku, name, limit = 20, offset = 0 } = request.query;
    
    const where = {};
    if (sku) {
      where.sku = {
        contains: sku,
        mode: 'insensitive'
      };
    }
    if (name) {
      where.name = {
        contains: name,
        mode: 'insensitive'
      };
    }

    const items = await prisma.inventoryItem.findMany({
      where,
      orderBy: { name: 'asc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    reply.send({
      success: true,
      data: items,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: await prisma.inventoryItem.count({ where })
      }
    });
  } catch (error) {
    fastify.log.error(error);
    reply.status(500).send({
      success: false,
      error: 'Failed to search items'
    });
  }
});

// Health check
fastify.get('/health', async (request, reply) => {
    try {
      
  reply.send({ status: 'ok', service: 'warehouse', timestamp: new Date().toISOString() });
});

// Запуск сервера
const start = async () => {
    try {
      
  try {
    const port = process.env.PORT || 3006;
    await fastify.listen({ port, host: '0.0.0.0' });
    fastify.log.info(`Warehouse service listening on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
