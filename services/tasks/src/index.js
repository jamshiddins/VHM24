const Fastify = require('fastify');
const cors = require('@fastify/cors');
const jwt = require('@fastify/jwt');
const { PrismaClient } = require('@prisma/client');
const { TaskStatus } = require('@prisma/client');

const prisma = new PrismaClient();
const fastify = Fastify({ logger: true });

// Plugins
fastify.register(cors, {
  origin: true,
  credentials: true
});

fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'your-secret-key'
});

// Декоратор для проверки авторизации
fastify.decorate('authenticate', async function(request, reply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
});

// Health check
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', service: 'tasks' };
});

// Получить все задачи с фильтрами
fastify.get('/api/v1/tasks', {
  preValidation: [fastify.authenticate],
  schema: {
    querystring: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['CREATED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] },
        assignedToId: { type: 'string' },
        machineId: { type: 'string' },
        skip: { type: 'integer', minimum: 0, default: 0 },
        take: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        orderBy: { type: 'string', enum: ['createdAt', 'updatedAt', 'priority'], default: 'createdAt' },
        order: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }
      }
    }
  }
}, async (request, reply) => {
  const { status, assignedToId, machineId, skip, take, orderBy, order } = request.query;
  
  try {
    const where = {};
    if (status) where.status = status;
    if (assignedToId) where.assignedToId = assignedToId;
    if (machineId) where.machineId = machineId;

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take,
        orderBy: { [orderBy]: order },
        include: {
          machine: {
            select: {
              id: true,
              code: true,
              name: true,
              location: true
            }
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }),
      prisma.task.count({ where })
    ]);

    return {
      success: true,
      data: {
        items: tasks,
        total,
        skip,
        take
      }
    };
  } catch (error) {
    fastify.log.error(error);
    reply.code(500).send({
      success: false,
      error: 'Failed to fetch tasks'
    });
  }
});

// Получить задачу по ID
fastify.get('/api/v1/tasks/:id', {
  preValidation: [fastify.authenticate],
  schema: {
    params: {
      type: 'object',
      properties: {
        id: { type: 'string' }
      }
    }
  }
}, async (request, reply) => {
  const { id } = request.params;
  
  try {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        machine: true,
        assignedTo: true,
        createdBy: true,
        actions: {
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

    if (!task) {
      return reply.code(404).send({
        success: false,
        error: 'Task not found'
      });
    }

    return {
      success: true,
      data: task
    };
  } catch (error) {
    fastify.log.error(error);
    reply.code(500).send({
      success: false,
      error: 'Failed to fetch task'
    });
  }
});

// Создать новую задачу
fastify.post('/api/v1/tasks', {
  preValidation: [fastify.authenticate],
  schema: {
    body: {
      type: 'object',
      required: ['title', 'machineId', 'priority'],
      properties: {
        title: { type: 'string', minLength: 1 },
        description: { type: 'string' },
        machineId: { type: 'string' },
        assignedToId: { type: 'string' },
        priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
        dueDate: { type: 'string', format: 'date-time' }
      }
    }
  }
}, async (request, reply) => {
  const { title, description, machineId, assignedToId, priority, dueDate } = request.body;
  const userId = request.user.id;
  
  try {
    // Проверяем существование машины
    const machine = await prisma.machine.findUnique({
      where: { id: machineId }
    });

    if (!machine) {
      return reply.code(400).send({
        success: false,
        error: 'Machine not found'
      });
    }

    // Создаем задачу
    const task = await prisma.task.create({
      data: {
        title,
        description: description || '',
        machineId,
        assignedToId,
        createdById: userId,
        status: assignedToId ? 'ASSIGNED' : 'CREATED',
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null
      },
      include: {
        machine: true,
        assignedTo: true,
        createdBy: true
      }
    });

    // Добавляем запись в историю действий
    await prisma.taskAction.create({
      data: {
        taskId: task.id,
        userId,
        action: 'CREATED',
        comment: `Task created: ${title}`
      }
    });

    // TODO: Отправить уведомление назначенному пользователю

    return {
      success: true,
      data: task
    };
  } catch (error) {
    fastify.log.error(error);
    reply.code(500).send({
      success: false,
      error: 'Failed to create task'
    });
  }
});

// Обновить задачу
fastify.patch('/api/v1/tasks/:id', {
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
        title: { type: 'string', minLength: 1 },
        description: { type: 'string' },
        status: { type: 'string', enum: ['CREATED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] },
        assignedToId: { type: 'string' },
        priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
        dueDate: { type: 'string', format: 'date-time' }
      }
    }
  }
}, async (request, reply) => {
  const { id } = request.params;
  const updates = request.body;
  const userId = request.user.id;
  
  try {
    // Проверяем существование задачи
    const existingTask = await prisma.task.findUnique({
      where: { id }
    });

    if (!existingTask) {
      return reply.code(404).send({
        success: false,
        error: 'Task not found'
      });
    }

    // Обновляем задачу
    const task = await prisma.task.update({
      where: { id },
      data: {
        ...updates,
        dueDate: updates.dueDate ? new Date(updates.dueDate) : undefined,
        updatedAt: new Date()
      },
      include: {
        machine: true,
        assignedTo: true,
        createdBy: true
      }
    });

    // Логируем изменения
    const changes = [];
    for (const [key, value] of Object.entries(updates)) {
      if (existingTask[key] !== value) {
        changes.push(`${key}: ${existingTask[key]} → ${value}`);
      }
    }

    if (changes.length > 0) {
      await prisma.taskAction.create({
        data: {
          taskId: task.id,
          userId,
          action: 'UPDATED',
          comment: `Updated: ${changes.join(', ')}`
        }
      });
    }

    return {
      success: true,
      data: task
    };
  } catch (error) {
    fastify.log.error(error);
    reply.code(500).send({
      success: false,
      error: 'Failed to update task'
    });
  }
});

// Добавить действие к задаче
fastify.post('/api/v1/tasks/:id/actions', {
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
      required: ['action', 'comment'],
      properties: {
        action: { type: 'string', enum: ['COMMENT', 'STATUS_CHANGE', 'ASSIGNED', 'STARTED', 'COMPLETED', 'CANCELLED'] },
        comment: { type: 'string', minLength: 1 },
        location: {
          type: 'object',
          properties: {
            latitude: { type: 'number' },
            longitude: { type: 'number' }
          }
        },
        photoUrls: { type: 'array', items: { type: 'string' } }
      }
    }
  }
}, async (request, reply) => {
  const { id } = request.params;
  const { action, comment, location, photoUrls } = request.body;
  const userId = request.user.id;
  
  try {
    // Проверяем существование задачи
    const task = await prisma.task.findUnique({
      where: { id }
    });

    if (!task) {
      return reply.code(404).send({
        success: false,
        error: 'Task not found'
      });
    }

    // Создаем действие
    const taskAction = await prisma.taskAction.create({
      data: {
        taskId: id,
        userId,
        action,
        comment,
        location: location ? `${location.latitude},${location.longitude}` : null,
        photoUrls: photoUrls || []
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Обновляем статус задачи при необходимости
    if (action === 'STARTED' && task.status !== 'IN_PROGRESS') {
      await prisma.task.update({
        where: { id },
        data: { status: 'IN_PROGRESS' }
      });
    } else if (action === 'COMPLETED' && task.status !== 'COMPLETED') {
      await prisma.task.update({
        where: { id },
        data: { 
          status: 'COMPLETED',
          completedAt: new Date()
        }
      });
    } else if (action === 'CANCELLED' && task.status !== 'CANCELLED') {
      await prisma.task.update({
        where: { id },
        data: { status: 'CANCELLED' }
      });
    }

    return {
      success: true,
      data: taskAction
    };
  } catch (error) {
    fastify.log.error(error);
    reply.code(500).send({
      success: false,
      error: 'Failed to add action'
    });
  }
});

// Получить статистику задач
fastify.get('/api/v1/tasks/stats', {
  preValidation: [fastify.authenticate]
}, async (request, reply) => {
  try {
    const [
      totalTasks,
      tasksByStatus,
      tasksByPriority,
      overdueTasks
    ] = await Promise.all([
      prisma.task.count(),
      prisma.task.groupBy({
        by: ['status'],
        _count: true
      }),
      prisma.task.groupBy({
        by: ['priority'],
        _count: true
      }),
      prisma.task.count({
        where: {
          dueDate: { lt: new Date() },
          status: { not: 'COMPLETED' }
        }
      })
    ]);

    return {
      success: true,
      data: {
        total: totalTasks,
        byStatus: tasksByStatus.reduce((acc, item) => {
          acc[item.status] = item._count;
          return acc;
        }, {}),
        byPriority: tasksByPriority.reduce((acc, item) => {
          acc[item.priority] = item._count;
          return acc;
        }, {}),
        overdue: overdueTasks
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

// Start server
const start = async () => {
  try {
    await fastify.listen({ 
      port: process.env.PORT || 3004,
      host: '0.0.0.0'
    });
    console.log('Tasks service is running on port', process.env.PORT || 3004);
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
