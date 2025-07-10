const logger = console;
/**
 * VHM24 - VendHub Manager 24/7
 * Machines Service - PRODUCTION READY
 * Secure machine management with telemetry
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../../.env' catch (error) {
      logger.error('Error:', error);
      throw error;
    }}});

// Устанавливаем SERVICE_NAME для конфигурации
process.env.SERVICE_NAME = 'machines';

const Fastify = require('fastify');
const { getMachinesClient )} = require('@vhm24/database');
const { sanitizeInput )} = require('@vhm24/shared-types/src/security');
const { cacheManagers, cacheMiddleware )} = require('@vhm24/shared-types/src/redis');

// Импортируем наш новый shared пакет
const {
  // Middleware
  setupCORS,
  setupHelmet,
  setupRateLimit,
  setupJWT,
  authenticate,
  authorize,
  sanitizeInputs,
  securityLogger,
  healthCheck,
  
  // Validation
  validateBody,
  validateQuery,
  validateId,
  
  // Error handling
  registerErrorHandlers,
  setupGlobalErrorHandlers,
  createError,
  asyncHandler,
  
  // Utils
  logger,
  config: sharedConfig,
  createFastifyConfig,
  paginate
} catch (error) {
      logger.error('Error:', error);
      throw error;
    }} = require('@vhm24/shared');

// Настройка глобальных обработчиков ошибок
setupGlobalErrorHandlers();

// Создаем Fastify с безопасной конфигурацией
const fastify = Fastify(createFastifyConfig());

const prisma = getMachinesClient();
const cache = cacheManagers.machines;

// Регистрируем обработчики ошибок
registerErrorHandlers(fastify);

// Настройка безопасности
setupHelmet(fastify);
setupCORS(fastify);
setupRateLimit(fastify, {
  max: 150, // Средний лимит для machines сервиса
  timeWindow: '1 minute'
} catch (error) {
      logger.error('Error:', error);
      throw error;
    }});
setupJWT(fastify, {
  verify: {
    issuer: ['vhm24-gateway', 'vhm24-auth']
  }
} catch (error) {
      logger.error('Error:', error);
      throw error;
    }});

// Middleware для логирования и санитизации
fastify.addHook('preHandler', securityLogger);
fastify.addHook('preHandler', sanitizeInputs);

// Декоратор для проверки авторизации (переопределяем для совместимости)
fastify.decorate('authenticate', authenticate);

// Декоратор для проверки ролей (переопределяем для совместимости)
fastify.decorate('requireRole', (roles) => {
  return authorize(roles);
} catch (error) {
      logger.error('Error:', error);
      throw error;
    }});

// Health check
fastify.get('/health', async (request, reply) => {
    try {
      
  try {
    // Проверяем соединение с базой данных
    await prisma.$queryRaw`SELECT 1`;
    
    // Проверяем соединение с Redis
    let redisStatus = 'disconnected';
    try {
      if (cache && cache.client) {
        await cache.client.ping();
        redisStatus = 'connected';
      }
    } catch (redisError) {
      logger.error('Redis health check failed:', redisError);
    }
    
    return { 
      status: 'ok', 
      service: 'machines', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      database: 'connected',
      redis: redisStatus
    };));
  }
});

// Получить все машины с фильтрами
fastify.get('/api/v1/machines', {
  preValidation: [fastify.authenticate],
  preHandler: cacheMiddleware({
    keyGenerator: (req) => `machines:list:${JSON.stringify(req.query)}`,
    ttl: 300, // 5 минут
    serviceName: 'machines',
    condition: (req) => !req.query.search // Кешируем только если нет поиска
  }),
  schema: {
    querystring: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['ONLINE', 'OFFLINE', 'MAINTENANCE', 'ERROR'] },
        type: { type: 'string' },
        locationId: { type: 'string' },
        search: { type: 'string' },
        skip: { type: 'integer', minimum: 0, default: 0 },
        take: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        orderBy: { type: 'string', enum: ['code', 'name', 'status', 'updatedAt'], default: 'code' }
      }
    }
  }
}, async (request, reply) => {
    try {
      
  const { status, type, locationId, search, skip, take, orderBy } = request.query;
  
  try {
    const where = {};
    
    if (status) where.status = status;
    if (type) where.type = type;
    if (locationId) where.locationId = locationId;
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' )} },
        { name: { contains: search, mode: 'insensitive' )} },
        { serialNumber: { contains: search, mode: 'insensitive' )} }
      ];
    }

    const [machines, total] = await Promise.all([
      prisma.machine.findMany({
        where,
        skip,
        take,
        orderBy: { [orderBy]: 'asc' },
        include: {
          location: true,
          _count: {
            select: {
              tasks: true,
              telemetry: true
            }
} catch (error) {
      logger.error('Error:', error);
      throw error;
    }}
        }
      }),
      prisma.machine.count({ where })
    ]);

    // Добавляем последнюю телеметрию
    const machinesWithTelemetry = await Promise.all(
      machines.map(async (machine) => {
    try {
      
        const lastTelemetry = await prisma.machineTelemetry.findFirst({
          where: { machineId: machine.id },
          orderBy: { createdAt: 'desc' }
        });
        return {
          ...machine,
          lastTelemetry
        };
} catch (error) {
      logger.error('Error:', error);
      throw error;
    }})
    );

    return {
      success: true,
      data: {
        items: machinesWithTelemetry,
        total,
        skip,
        take
      }
} catch (error) {
      logger.error('Error:', error);
      throw error;
    }};)
});

// Получить машину по ID
fastify.get('/api/v1/machines/:id', {
  preValidation: [fastify.authenticate]
}, async (request, reply) => {
    try {
      
  const { id } = request.params;
  
  try {
    // Пробуем получить из кеша
    const cacheKey = `machine:${id}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      reply.header('X-Cache', 'HIT');
      return {
        success: true,
        data: cached
      };
    }
    
    const machine = await prisma.machine.findUnique({
      where: { id },
      include: {
        location: true,
        tasks: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        telemetry: {
          take: 50,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!machine) {
      return reply.code(404).send({
        success: false,
        error: 'Machine not found'
      });
    }

    // Вычисляем статистику
    const stats = {
      totalTasks: await prisma.task.count({ where: { machineId: id } }),
      activeTasks: await prisma.task.count({ 
        where: { 
          machineId: id,
          status: { in: ['CREATED', 'ASSIGNED', 'IN_PROGRESS'] }
        }
      }),
      completedToday: await prisma.task.count({
        where: {
          machineId: id,
          status: 'COMPLETED',
          completedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      })
    };

    const result = {
      ...machine,
      stats
    };
    
    // Сохраняем в кеш
    await cache.set(cacheKey, result, 600); // 10 минут
    
    return {
      success: true,
      data: result
    };});

// Создать новую машину (только для ADMIN и MANAGER)
fastify.post('/api/v1/machines', {
  preValidation: [fastify.authenticate, fastify.requireRole(['ADMIN', 'MANAGER'])],
  schema: {
    body: {
      type: 'object',
      required: ['code', 'serialNumber', 'type', 'name'],
      properties: {
        code: { type: 'string', pattern: '^CVM-\\d{5}$' },
        serialNumber: { type: 'string', minLength: 5 },
        type: { type: 'string', enum: ['COFFEE', 'SNACK', 'COMBO', 'OTHER'] },
        name: { type: 'string', minLength: 3 },
        locationId: { type: 'string' },
        metadata: { type: 'object' }
      }
    }
  }
} catch (error) {
      logger.error('Error:', error);
      throw error;
    }}, async (request, reply) => {
    try {
      
  const data = request.body;
  
  try {
    // Проверяем уникальность кода и серийного номера
    const existing = await prisma.machine.findFirst({
      where: {
        OR: [
          { code: data.code },
          { serialNumber: data.serialNumber }
        ]
      }
    });

    if (existing) {
      return reply.code(400).send({
        success: false,
        error: 'Machine with this code or serial number already exists'
      });
    }

    // Проверяем локацию, если указана
    if (data.locationId) {
      const location = await prisma.location.findUnique({
        where: { id: data.locationId }
      });
      
      if (!location) {
        return reply.code(400).send({
          success: false,
          error: 'Location not found'
        });
      }
    }

    // Создаем машину
    const machine = await prisma.machine.create({
      data: {
        ...data,
        status: 'OFFLINE'
      },
      include: {
        location: true
      }
    });

    // Логируем действие
    await prisma.auditLog.create({
      data: {
        userId: request.user.id,
        action: 'MACHINE_CREATED',
        entity: 'Machine',
        entityId: machine.id,
        changes: data
      }
    });

    // Инвалидируем кеш списка машин
    await cache.deletePattern('machines:list:*');
    await cache.deletePattern('machines:stats');

    return {
      success: true,
      data: machine
    };)
});

// Обновить машину
fastify.patch('/api/v1/machines/:id', {
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
        name: { type: 'string', minLength: 3 },
        status: { type: 'string', enum: ['ONLINE', 'OFFLINE', 'MAINTENANCE', 'ERROR'] },
        locationId: { type: 'string' },
        metadata: { type: 'object' }
      }
    }
  }
}, async (request, reply) => {
    try {
      
  const { id } = request.params;
  const updates = request.body;
  
  try {
    // Проверяем существование машины
    const existingMachine = await prisma.machine.findUnique({
      where: { id }
    });

    if (!existingMachine) {
      return reply.code(404).send({
        success: false,
        error: 'Machine not found'
      });
    }

    // Проверяем локацию, если обновляется
    if (updates.locationId) {
      const location = await prisma.location.findUnique({
        where: { id: updates.locationId }
      });
      
      if (!location) {
        return reply.code(400).send({
          success: false,
          error: 'Location not found'
        });
      }
    }

    // Обновляем машину
    const machine = await prisma.machine.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date()
      },
      include: {
        location: true
      }
    });

    // Логируем изменения
    const changes = {};
    for (const [key, value] of Object.entries(updates)) {
      if (existingMachine[key] !== value) {
        changes[key] = {
          from: existingMachine[key],
          to: value
        };
      }
    }

    if (Object.keys(changes).length > 0) {
      await prisma.auditLog.create({
        data: {
          userId: request.user.id,
          action: 'MACHINE_UPDATED',
          entity: 'Machine',
          entityId: machine.id,
          changes
        }
      });
    }

    // Инвалидируем кеш
    await cache.delete(`machine:${id}`);
    await cache.deletePattern('machines:list:*');
    await cache.deletePattern('machines:stats');

    return {
      success: true,
      data: machine
    };)
});

// Удалить машину (soft delete) - только для ADMIN
fastify.delete('/api/v1/machines/:id', {
  preValidation: [fastify.authenticate, fastify.requireRole(['ADMIN'])]
}, async (request, reply) => {
    try {
      
  const { id } = request.params;
  
  try {
    // Проверяем, есть ли активные задачи
    const activeTasks = await prisma.task.count({
      where: {
        machineId: id,
        status: { in: ['CREATED', 'ASSIGNED', 'IN_PROGRESS'] }
      }
    });

    if (activeTasks > 0) {
      return reply.code(400).send({
        success: false,
        error: `Cannot delete machine with ${activeTasks} active tasks`
      });
    }

    // Помечаем как удаленную (soft delete)
    const machine = await prisma.machine.update({
      where: { id },
      data: {
        status: 'OFFLINE',
        metadata: {
          ...(await prisma.machine.findUnique({ where: { id } })).metadata,
          deletedAt: new Date().toISOString(),
          deletedBy: request.user.id
        }
      }
    });

    // Логируем действие
    await prisma.auditLog.create({
      data: {
        userId: request.user.id,
        action: 'MACHINE_DELETED',
        entity: 'Machine',
        entityId: id
      }
    });

    // Инвалидируем кеш
    await cache.delete(`machine:${id}`);
    await cache.deletePattern('machines:list:*');
    await cache.deletePattern('machines:stats');

    return {
      success: true,
      message: 'Machine deleted successfully'
    };));
    }
    
    throw createError.database('Failed to delete machine');
  }
});

// Записать телеметрию
fastify.post('/api/v1/machines/:id/telemetry', {
  schema: {
    params: {
      type: 'object',
      properties: {
        id: { type: 'string' }
      }
    },
    body: {
      type: 'object',
      required: ['rawData'],
      properties: {
        temperature: { type: 'number' },
        humidity: { type: 'number' },
        sales: { type: 'integer' },
        errors: { type: 'array', items: { type: 'string' } },
        rawData: { type: 'object' }
      }
    }
  }
}, async (request, reply) => {
    try {
      
  const { id } = request.params;
  const telemetryData = request.body;
  
  try {
    // Проверяем существование машины
    const machine = await prisma.machine.findUnique({
      where: { id }
    });

    if (!machine) {
      return reply.code(404).send({
        success: false,
        error: 'Machine not found'
      });
    }

    // Создаем запись телеметрии
    const telemetry = await prisma.machineTelemetry.create({
      data: {
        machineId: id,
        ...telemetryData
      }
    });

    // Обновляем статус машины и время последнего пинга
    const newStatus = telemetryData.errors && telemetryData.errors.length > 0 
      ? 'ERROR' 
      : 'ONLINE';

    await prisma.machine.update({
      where: { id },
      data: {
        status: newStatus,
        lastPing: new Date()
      }
    });

    // Инвалидируем кеш машины
    await cache.delete(`machine:${id}`);
    await cache.deletePattern('machines:stats');

    return {
      success: true,
      data: telemetry
    };)
});

// Получить телеметрию машины
fastify.get('/api/v1/machines/:id/telemetry', {
  preValidation: [fastify.authenticate],
  schema: {
    params: {
      type: 'object',
      properties: {
        id: { type: 'string' }
      }
    },
    querystring: {
      type: 'object',
      properties: {
        from: { type: 'string', format: 'date-time' },
        to: { type: 'string', format: 'date-time' },
        limit: { type: 'integer', minimum: 1, maximum: 1000, default: 100 }
      }
    }
  }
}, async (request, reply) => {
    try {
      
  const { id } = request.params;
  const { from, to, limit } = request.query;
  
  try {
    const where = { machineId: id };
    
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const telemetry = await prisma.machineTelemetry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return {
      success: true,
      data: telemetry
    };));
  }
});

// Получить статистику машин
fastify.get('/api/v1/machines/stats', {
  preValidation: [fastify.authenticate]
}, async (request, reply) => {
    try {
      
  try {
    // Пробуем получить из кеша
    const cacheKey = 'machines:stats';
    const cached = await cache.get(cacheKey);
    if (cached) {
      reply.header('X-Cache', 'HIT');
      return {
        success: true,
        data: cached
      };
    }
    
    const [
      totalMachines,
      machinesByStatus,
      machinesByType,
      machinesWithErrors,
      recentTelemetry
    ] = await Promise.all([
      prisma.machine.count(),
      prisma.machine.groupBy({
        by: ['status'],
        _count: true
      }),
      prisma.machine.groupBy({
        by: ['type'],
        _count: true
      }),
      prisma.machine.count({
        where: { status: 'ERROR' }
      }),
      prisma.machineTelemetry.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // За последние 24 часа
          }
        }
      })
    ]);

    const stats = {
      total: totalMachines,
      byStatus: machinesByStatus.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {}),
      byType: machinesByType.reduce((acc, item) => {
        acc[item.type] = item._count;
        return acc;
      }, {}),
      withErrors: machinesWithErrors,
      telemetryLast24h: recentTelemetry
    };
    
    // Сохраняем в кеш на 5 минут
    await cache.set(cacheKey, stats, 300);
    
    return {
      success: true,
      data: stats
    };));
  }
});

// Start server
const start = async () => {
    try {
      
  try {
    const port = process.env.MACHINES_PORT || process.env.PORT || 3002;
    await fastify.listen({ 
      port: port,
      host: '0.0.0.0'
    });
    logger.info('Machines service is running on port', port);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

// Graceful shutdown
process.on('SIGTERM', async () => {
    try {
      
  await fastify.close();
  await prisma.$disconnect();
  process.exit(0);
});
