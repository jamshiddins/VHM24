require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') 
    
    
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }} catch (error) {
      logger.error('Error:', error);
      throw error;
    
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }}} catch (error) {
      logger.error('Error:', error);
      throw error;
    
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }}});
const Fastify = require('fastify');
const cors = require('@fastify/cors');
const jwt = require('@fastify/jwt');
const { getInventoryClient 
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }} = require('@vhm24/database');
const prisma = getInventoryClient();
const fastify = Fastify({ logger: true 
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }});

// Создаем логгер
const logger = {
  info: (message, ...args) => console.info(`[INFO] ${message}`, ...args),
  warn: (message, ...args) => logger.warn(`[WARN] ${message}`, ...args),
  error: (message, ...args) => logger.error(`[ERROR] ${message}`, ...args)

    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }};

// Plugins
fastify.register(cors, {
  origin: true,
  credentials: true

    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }});

fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'your-secret-key'

    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }});

// Декоратор для проверки авторизации
fastify.decorate('authenticate', async function(request, reply) {
  try {
    await request.jwtVerify();
    const user = await prisma.user.findUnique({
      where: { id: request.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        roles: true,
        isActive: true
      }
    });
    
    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }
    
    request.user = user;
  } catch (err) {
    reply.code(401).send({ 
      success: false,
      error: 'Unauthorized',
      message: err.message || 'Invalid or expired token'
    });
  }

    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }});

// Health check
fastify.get('/health', async (request, reply) => {
    try {
      
    try {
      
    try {
      
  try {
    // Проверяем соединение с базой данных
    await prisma.$queryRaw`SELECT 1`;
    
    return { 
      status: 'ok', 
      service: 'inventory', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      database: 'connected'
    };
  } catch (error) {
    fastify.log.error('Health check failed:', error);
    return reply.code(503).send({ 
      status: 'error', 
      service: 'inventory',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed'
    });
  }
});

// Получить все товары/ингредиенты
fastify.get('/api/v1/inventory/items', {
  preValidation: [fastify.authenticate],
  schema: {
    querystring: {
      type: 'object',
      properties: {
        category: { type: 'string' },
        search: { type: 'string' },
        inStock: { type: 'boolean' },
        skip: { type: 'integer', minimum: 0, default: 0 },
        take: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
      }
    }
  }
}, async (request, reply) => {
    try {
      
    try {
      
    try {
      
  const { category, search, inStock, skip, take } = request.query;
  
  try {
    const where = {};
    
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } 
    
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }} catch (error) {
      logger.error('Error:', error);
      throw error;
    
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }}},
        { sku: { contains: search, mode: 'insensitive' 
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }} 
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }}
      ];
    }
    if (inStock !== undefined) {
      where.quantity = inStock ? { gt: 0 
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }} : { lte: 0 
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }};
    }

    const [items, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where,
        skip,
        take,
        orderBy: { name: 'asc' 
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }},
        include: {
          stockMovements: {
            take: 5,
            orderBy: { createdAt: 'desc' }
          }
        
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }}
      }),
      prisma.inventoryItem.count({ where })
    ]);

    return {
      success: true,
      data: {
        items,
        total,
        skip,
        take
      
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }}
    };
  } catch (error) {
    fastify.log.error(error);
    reply.code(500).send({
      success: false,
      error: 'Failed to fetch inventory items'
    });
  }
});

// Получить товар по ID
fastify.get('/api/v1/inventory/items/:id', {
  preValidation: [fastify.authenticate]
}, async (request, reply) => {
    try {
      
    try {
      
    try {
      
  const { id 
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }} = request.params;
  
  try {
    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        stockMovements: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!item) {
      return reply.code(404).send({
        success: false,
        error: 'Item not found'
      });
    }

    return {
      success: true,
      data: item
    };
  
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }} catch (error) {
    fastify.log.error(error);
    reply.code(500).send({
      success: false,
      error: 'Failed to fetch item'
    });
  
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }}
});

// Создать новый товар
fastify.post('/api/v1/inventory/items', {
  preValidation: [fastify.authenticate],
  schema: {
    body: {
      type: 'object',
      required: ['name', 'sku', 'unit', 'category'],
      properties: {
        name: { type: 'string', minLength: 1 },
        sku: { type: 'string', minLength: 1 },
        unit: { type: 'string', enum: ['KG', 'L', 'PCS', 'PACK'] },
        category: { type: 'string' },
        description: { type: 'string' },
        minQuantity: { type: 'number', minimum: 0 },
        maxQuantity: { type: 'number', minimum: 0 },
        price: { type: 'number', minimum: 0 }
      }
    }
  
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }}
}, async (request, reply) => {
    try {
      
    try {
      
    try {
      
  const data = request.body;
  
  try {
    // Проверяем уникальность SKU
    const existing = await prisma.inventoryItem.findUnique({
      where: { sku: data.sku }
    });

    if (existing) {
      return reply.code(400).send({
        success: false,
        error: 'SKU already exists'
      });
    }

    const item = await prisma.inventoryItem.create({
      data: {
        ...data,
        quantity: 0, // Начальное количество всегда 0
        lastUpdated: new Date()
      }
    });

    return {
      success: true,
      data: item
    };
  } catch (error) {
    fastify.log.error(error);
    reply.code(500).send({
      success: false,
      error: 'Failed to create item'
    });
  }
});

// Обновить товар
fastify.patch('/api/v1/inventory/items/:id', {
  preValidation: [fastify.authenticate],
  schema: {
    params: {
      type: 'object',
      properties: {
        id: { type: 'string' }
      }
    },
    body: {
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 1 },
        description: { type: 'string' },
        minQuantity: { type: 'number', minimum: 0 },
        maxQuantity: { type: 'number', minimum: 0 },
        price: { type: 'number', minimum: 0 }
      }
    }
  }
}, async (request, reply) => {
    try {
      
    try {
      
    try {
      
  const { id } = request.params;
  const updates = request.body;
  
  try {
    const item = await prisma.inventoryItem.update({
      where: { id },
      data: {
        ...updates,
        lastUpdated: new Date()
      }
    });

    return {
      success: true,
      data: item
    };
  } catch (error) {
    if (error.code === 'P2025') {
      return reply.code(404).send({
        success: false,
        error: 'Item not found'
      });
    }
    
    fastify.log.error(error);
    reply.code(500).send({
      success: false,
      error: 'Failed to update item'
    });
  }
});

// Движение товара (приход/расход)
fastify.post('/api/v1/inventory/stock-movement', {
  preValidation: [fastify.authenticate],
  schema: {
    body: {
      type: 'object',
      required: ['itemId', 'type', 'quantity', 'reason'],
      properties: {
        itemId: { type: 'string' },
        type: { type: 'string', enum: ['IN', 'OUT', 'ADJUSTMENT', 'TRANSFER'] },
        quantity: { type: 'number', minimum: 0.01 },
        reason: { type: 'string', minLength: 1 },
        reference: { type: 'string' },
        fromLocation: { type: 'string' },
        toLocation: { type: 'string' },
        machineId: { type: 'string' }
      }
    }
  }
}, async (request, reply) => {
    try {
      
    try {
      
    try {
      
  const { itemId, type, quantity, reason, reference, fromLocation, toLocation, machineId } = request.body;
  const userId = request.user.id;
  
  try {
    // Получаем текущий товар
    const item = await prisma.inventoryItem.findUnique({
      where: { id: itemId }
    
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }});

    if (!item) {
      return reply.code(404).send({
        success: false,
        error: 'Item not found'
      });
    
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }}

    // Вычисляем новое количество
    let newQuantity = item.quantity;
    if (type === 'IN') {
      newQuantity += quantity;
    
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }} else if (type === 'OUT') {
      newQuantity -= quantity;
      if (newQuantity < 0) {
        return reply.code(400).send({
          success: false,
          error: 'Insufficient stock'
        });
      }
    
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }}

    // Создаем транзакцию
    const [movement, updatedItem] = await prisma.$transaction([
      prisma.stockMovement.create({
        data: {
          itemId,
          userId,
          type,
          quantity,
          quantityBefore: item.quantity,
          quantityAfter: newQuantity,
          reason,
          reference,
          fromLocation,
          toLocation,
          machineId
        }
      
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }}),
      prisma.inventoryItem.update({
        where: { id: itemId },
        data: {
          quantity: newQuantity,
          lastUpdated: new Date()
        }
      
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }})
    ]);

    return {
      success: true,
      data: {
        movement,
        item: updatedItem
      }
    
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }};
  } catch (error) {
    fastify.log.error(error);
    reply.code(500).send({
      success: false,
      error: 'Failed to process stock movement'
    
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }});
  }
});

// Получить историю движений
fastify.get('/api/v1/inventory/movements', {
  preValidation: [fastify.authenticate],
  schema: {
    querystring: {
      type: 'object',
      properties: {
        itemId: { type: 'string' },
        type: { type: 'string', enum: ['IN', 'OUT', 'ADJUSTMENT', 'TRANSFER'] },
        machineId: { type: 'string' },
        dateFrom: { type: 'string', format: 'date' },
        dateTo: { type: 'string', format: 'date' },
        skip: { type: 'integer', minimum: 0, default: 0 },
        take: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
      }
    
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }}
  }
}, async (request, reply) => {
    try {
      
    try {
      
    try {
      
  const { itemId, type, machineId, dateFrom, dateTo, skip, take } = request.query;
  
  try {
    const where = {};
    
    if (itemId) where.itemId = itemId;
    if (type) where.type = type;
    if (machineId) where.machineId = machineId;
    
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          item: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          machine: {
            select: {
              id: true,
              code: true,
              name: true
            }
          }
        }
      }),
      prisma.stockMovement.count({ where })
    ]);

    return {
      success: true,
      data: {
        movements,
        total,
        skip,
        take
      }
    };
  } catch (error) {
    fastify.log.error(error);
    reply.code(500).send({
      success: false,
      error: 'Failed to fetch movements'
    });
  }
});

// Получить товары с низким остатком
fastify.get('/api/v1/inventory/low-stock', {
  preValidation: [fastify.authenticate]
}, async (request, reply) => {
    try {
      
    try {
      
    try {
      
  try {
    const items = await prisma.inventoryItem.findMany({
      where: {
        OR: [
          {
            AND: [
              { minQuantity: { not: null } },
              { quantity: { lte: prisma.inventoryItem.fields.minQuantity } }
            ]
          }
        ]
      },
      orderBy: { quantity: 'asc' }
    });

    return {
      success: true,
      data: items
    };
  } catch (error) {
    fastify.log.error(error);
    reply.code(500).send({
      success: false,
      error: 'Failed to fetch low stock items'
    });
  }
});

// Получить статистику инвентаря
fastify.get('/api/v1/inventory/stats', {
  preValidation: [fastify.authenticate]
}, async (request, reply) => {
    try {
      
    try {
      
    try {
      
  try {
    const [
      totalItems,
      totalValue,
      lowStockCount,
      outOfStockCount,
      categories
    ] = await Promise.all([
      prisma.inventoryItem.count(),
      prisma.inventoryItem.aggregate({
        _sum: {
          quantity: true,
          price: true
        }
      }),
      prisma.inventoryItem.count({
        where: {
          AND: [
            { minQuantity: { not: null } },
            { quantity: { lte: prisma.inventoryItem.fields.minQuantity } }
          ]
        }
      }),
      prisma.inventoryItem.count({
        where: { quantity: 0 }
      }),
      prisma.inventoryItem.groupBy({
        by: ['category'],
        _count: true
      })
    ]);

    // Вычисляем общую стоимость
    const totalValueAmount = totalValue._sum.quantity * (totalValue._sum.price || 0);

    return {
      success: true,
      data: {
        totalItems,
        totalValue: totalValueAmount,
        lowStockCount,
        outOfStockCount,
        categoriesCount: categories.length,
        categories: categories.map(c => ({
          name: c.category,
          count: c._count
        }))
      }
    };
  } catch (error) {
    fastify.log.error(error);
    reply.code(500).send({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

// Массовая загрузка товаров (для импорта)
fastify.post('/api/v1/inventory/bulk-import', {
  preValidation: [fastify.authenticate],
  schema: {
    body: {
      type: 'object',
      required: ['items'],
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            required: ['name', 'sku', 'unit', 'category'],
            properties: {
              name: { type: 'string' },
              sku: { type: 'string' },
              unit: { type: 'string', enum: ['KG', 'L', 'PCS', 'PACK'] },
              category: { type: 'string' },
              quantity: { type: 'number', minimum: 0 },
              price: { type: 'number', minimum: 0 }
            }
          }
        }
      }
    }
  }
}, async (request, reply) => {
    try {
      
    try {
      
    try {
      
  const { items } = request.body;
  
  try {
    // Проверяем дубликаты SKU
    const skus = items.map(item => item.sku);
    const existingItems = await prisma.inventoryItem.findMany({
      where: { sku: { in: skus } },
      select: { sku: true }
    });

    if (existingItems.length > 0) {
      return reply.code(400).send({
        success: false,
        error: 'Duplicate SKUs found',
        duplicates: existingItems.map(i => i.sku)
      });
    }

    // Создаем все товары
    const createdItems = await prisma.inventoryItem.createMany({
      data: items.map(item => ({
        ...item,
        quantity: item.quantity || 0,
        lastUpdated: new Date()
      }))
    });

    return {
      success: true,
      data: {
        created: createdItems.count
      }
    };
  } catch (error) {
    fastify.log.error(error);
    reply.code(500).send({
      success: false,
      error: 'Failed to import items'
    });
  }
});

// Start server
const start = async () => {
    try {
      
    try {
      
    try {
      
  try {
    await fastify.listen({ 
      port: process.env.PORT || 3003,
      host: '0.0.0.0'
    });
    logger.info('Inventory service is running on port', process.env.PORT || 3003);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

// Graceful shutdown
process.on('SIGTERM', async () => {
    try {
      
    try {
      
    try {
      
  await fastify.close();
  await prisma.$disconnect();
  process.exit(0);
});


// Экспортируем только необходимые компоненты
module.exports = { fastify, prisma, start };
