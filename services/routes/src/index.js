const logger = console;
/**
 * VHM24 Routes Service
 * Микросервис для управления маршрутами водителей
 */

const fastify = require('fastify')({ logger: true });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Регистрируем плагины
fastify.register(require('@fastify/cors'), {
  origin: true
});

fastify.register(require('@fastify/jwt'), {
  secret: process.env.JWT_SECRET || 'your-secret-key'
});

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
});

// Получить маршруты
fastify.get('/routes', {
  preHandler: [fastify.authenticate]
}, async (request, reply) => {
  try {
    const { driverId, status, limit = 10, offset = 0 } = request.query;
    
    const where = {};
    if (driverId) where.driverId = driverId;
    if (status) {
      if (status.includes(',')) {
        where.status = { in: status.split(',') };
      } else {
        where.status = status;
      }
    }

    const routes = await prisma.route.findMany({
      where,
      include: {
        driver: {
          select: { id: true, name: true, email: true }
        },
        stops: {
          include: {
            machine: {
              select: { id: true, name: true, location: true }
            }
          },
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    // Добавляем вычисляемые поля
    const routesWithStats = routes.map(route => ({
      ...route,
      totalStops: route.stops.length,
      completedStops: route.stops.filter(stop => stop.status === 'COMPLETED').length,
      currentStop: route.stops.find(stop => stop.status === 'ARRIVED') || 
                   route.stops.find(stop => stop.status === 'PENDING')
    }));

    reply.send({
      success: true,
      data: routesWithStats,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: await prisma.route.count({ where })
      }
    });
  } catch (error) {
    fastify.log.error(error);
    reply.status(500).send({
      success: false,
      error: 'Failed to fetch routes'
    });
  }
});

// Получить конкретный маршрут
fastify.get('/routes/:id', {
  preHandler: [fastify.authenticate]
}, async (request, reply) => {
  try {
    const { id } = request.params;

    const route = await prisma.route.findUnique({
      where: { id },
      include: {
        driver: {
          select: { id: true, name: true, email: true }
        },
        stops: {
          include: {
            machine: {
              select: { id: true, name: true, location: true }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!route) {
      return reply.status(404).send({
        success: false,
        error: 'Route not found'
      });
    }

    // Добавляем статистику
    const routeWithStats = {
      ...route,
      totalStops: route.stops.length,
      completedStops: route.stops.filter(stop => stop.status === 'COMPLETED').length,
      currentStop: route.stops.find(stop => stop.status === 'ARRIVED') || 
                   route.stops.find(stop => stop.status === 'PENDING')
    };

    reply.send({
      success: true,
      data: routeWithStats
    });
  } catch (error) {
    fastify.log.error(error);
    reply.status(500).send({
      success: false,
      error: 'Failed to fetch route'
    });
  }
});

// Создать новый маршрут

// Схема валидации для POST /routes
const postroutesSchema = {
  body: {
    type: 'object',
    required: [],
    properties: {}
  }
};

fastify.post('/routes', { preHandler: [fastify.authenticate], schema: postroutesSchema }, async (request, reply) => {
  try {
    const { name, description, driverId, plannedDate, stops } = request.body;

    // Валидация
    if (!name || !driverId || !stops || stops.length === 0) {
      return reply.status(400).send({
        success: false,
        error: 'Name, driverId and stops are required'
      });
    }

    // Проверяем существование водителя
    const driver = await prisma.user.findUnique({
      where: { id: driverId }
    });

    if (!driver || !driver.isDriver) {
      return reply.status(400).send({
        success: false,
        error: 'Invalid driver'
      });
    }

    // Создаем маршрут с остановками
    const route = await prisma.route.create({
      data: {
        name,
        description,
        driverId,
        plannedDate: plannedDate ? new Date(plannedDate) : null,
        status: 'PLANNED',
        stops: {
          create: stops.map((stop, index) => ({
            machineId: stop.machineId,
            order: index + 1,
            status: 'PENDING',
            plannedTime: stop.plannedTime ? new Date(stop.plannedTime) : null,
            description: stop.description
          }))
        }
      },
      include: {
        driver: {
          select: { id: true, name: true, email: true }
        },
        stops: {
          include: {
            machine: {
              select: { id: true, name: true, location: true }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    reply.status(201).send({
      success: true,
      data: route
    });
  } catch (error) {
    fastify.log.error(error);
    reply.status(500).send({
      success: false,
      error: 'Failed to create route'
    });
  }
});

// Обновить маршрут

// Схема валидации для PATCH /routes/:id
const patchRoutesIdSchema = {
  body: {
    type: 'object',
    required: [],
    properties: {}
  }
};

fastify.patch('/routes/:id', { preHandler: [fastify.authenticate], schema: patchRoutesIdSchema }, async (request, reply) => {
  try {
    const { id } = request.params;
    const updateData = request.body;

    // Проверяем существование маршрута
    const existingRoute = await prisma.route.findUnique({
      where: { id }
    });

    if (!existingRoute) {
      return reply.status(404).send({
        success: false,
        error: 'Route not found'
      });
    }

    // Обновляем маршрут
    const route = await prisma.route.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      include: {
        driver: {
          select: { id: true, name: true, email: true }
        },
        stops: {
          include: {
            machine: {
              select: { id: true, name: true, location: true }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    reply.send({
      success: true,
      data: route
    });
  } catch (error) {
    fastify.log.error(error);
    reply.status(500).send({
      success: false,
      error: 'Failed to update route'
    });
  }
});

// Получить остановки маршрута
fastify.get('/route-stops', {
  preHandler: [fastify.authenticate]
}, async (request, reply) => {
  try {
    const { routeId, status, limit = 10, offset = 0 } = request.query;
    
    const where = {};
    if (routeId) where.routeId = routeId;
    if (status) {
      if (status.includes(',')) {
        where.status = { in: status.split(',') };
      } else {
        where.status = status;
      }
    }

    const stops = await prisma.routeStop.findMany({
      where,
      include: {
        route: {
          select: { id: true, name: true, status: true }
        },
        machine: {
          select: { id: true, name: true, location: true }
        }
      },
      orderBy: [
        { routeId: 'asc' },
        { order: 'asc' }
      ],
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    reply.send({
      success: true,
      data: stops,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: await prisma.routeStop.count({ where })
      }
    });
  } catch (error) {
    fastify.log.error(error);
    reply.status(500).send({
      success: false,
      error: 'Failed to fetch route stops'
    });
  }
});

// Обновить остановку

// Схема валидации для PATCH /route-stops/:id
const patchroute-stops:idSchema = {
  body: {
    type: 'object',
    required: [],
    properties: {}
  }
};

fastify.patch('/route-stops/:id', { preHandler: [fastify.authenticate], schema: patchroute-stops:idSchema }, async (request, reply) => {
  try {
    const { id } = request.params;
    const updateData = request.body;

    // Проверяем существование остановки
    const existingStop = await prisma.routeStop.findUnique({
      where: { id }
    });

    if (!existingStop) {
      return reply.status(404).send({
        success: false,
        error: 'Route stop not found'
      });
    }

    // Обновляем остановку
    const stop = await prisma.routeStop.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      include: {
        route: {
          select: { id: true, name: true, status: true }
        },
        machine: {
          select: { id: true, name: true, location: true }
        }
      }
    });

    reply.send({
      success: true,
      data: stop
    });
  } catch (error) {
    fastify.log.error(error);
    reply.status(500).send({
      success: false,
      error: 'Failed to update route stop'
    });
  }
});

// Получить логи водителя
fastify.get('/driver-logs', {
  preHandler: [fastify.authenticate]
}, async (request, reply) => {
  try {
    const { driverId, type, routeId, limit = 50, offset = 0 } = request.query;
    
    const where = {};
    if (driverId) where.driverId = driverId;
    if (type) where.type = type;
    if (routeId) where.routeId = routeId;

    const logs = await prisma.driverLog.findMany({
      where,
      include: {
        driver: {
          select: { id: true, name: true, email: true }
        },
        route: {
          select: { id: true, name: true }
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
        total: await prisma.driverLog.count({ where })
      }
    });
  } catch (error) {
    fastify.log.error(error);
    reply.status(500).send({
      success: false,
      error: 'Failed to fetch driver logs'
    });
  }
});

// Создать лог водителя

// Схема валидации для POST /driver-logs
const postdriver-logsSchema = {
  body: {
    type: 'object',
    required: [],
    properties: {}
  }
};

fastify.post('/driver-logs', { preHandler: [fastify.authenticate], schema: postdriver-logsSchema }, async (request, reply) => {
  try {
    const { type, description, driverId, routeId, mileage, latitude, longitude, photos, metadata } = request.body;

    // Валидация
    if (!type || !description) {
      return reply.status(400).send({
        success: false,
        error: 'Type and description are required'
      });
    }

    // Если driverId не указан, берем из токена
    const finalDriverId = driverId || request.user.id;

    const log = await prisma.driverLog.create({
      data: {
        type,
        description,
        driverId: finalDriverId,
        routeId,
        mileage: mileage ? parseFloat(mileage) : null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        photos: photos || [],
        metadata: metadata || {}
      },
      include: {
        driver: {
          select: { id: true, name: true, email: true }
        },
        route: {
          select: { id: true, name: true }
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
      error: 'Failed to create driver log'
    });
  }
});

// Health check
fastify.get('/health', async (request, reply) => {
  reply.send({ status: 'ok', service: 'routes', timestamp: new Date().toISOString() });
});

// Запуск сервера
const start = async () => {
  try {
    const port = process.env.PORT || 3005;
    await fastify.listen({ port, host: '0.0.0.0' });
    fastify.log.info(`Routes service listening on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
