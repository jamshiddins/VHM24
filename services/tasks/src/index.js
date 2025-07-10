require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') 
    
    
    
    
    
    
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }} catch (error) {
      console.error('Error:', error);
      throw error;
    
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }}} catch (error) {
      console.error('Error:', error);
      throw error;
    
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }}} catch (error) {
      logger.error('Error:', error);
      throw error;
    
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }}} catch (error) {
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
const { getTasksClient 
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }} = require('@vhm24/database');
const { TaskStatus 
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }} = require('@prisma/client');
const scheduledTasks = require('./scheduledTasks');

// Создаем логгер
const logger = {
  info: (message, ...args) => console.info(`[INFO] ${message}`, ...args),
  warn: (message, ...args) => logger.warn(`[WARN] ${message}`, ...args),
  error: (message, ...args) => logger.error(`[ERROR] ${message}`, ...args)

    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }};

const prisma = getTasksClient();
const fastify = Fastify({ logger: true 
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }});

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
      
    try {
      
    try {
      
    try {
      
  try {
    // Проверяем соединение с базой данных
    await prisma.$queryRaw`SELECT 1`;
    
    return { 
      status: 'ok', 
      service: 'tasks', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      database: 'connected',
      scheduledTasks: process.env.ENABLE_SCHEDULED_TASKS !== 'false' ? 'enabled' : 'disabled'
    };
  } catch (error) {
    fastify.log.error('Health check failed:', error);
    return reply.code(503).send({ 
      status: 'error', 
      service: 'tasks',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed'
    });
  }
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
    try {
      
    try {
      
    try {
      
    try {
      
    try {
      
    try {
      
    try {
      
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
          
    
    
    
    
    
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }} catch (error) {
      console.error('Error:', error);
      throw error;
    
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }}} catch (error) {
      console.error('Error:', error);
      throw error;
    
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }}} catch (error) {
      logger.error('Error:', error);
      throw error;
    
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }}} catch (error) {
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
    }}},
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true
            
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }}
          
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }},
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }}
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
        id: { type: 'string' 
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }}
      }
    }
  }
}, async (request, reply) => {
    try {
      
    try {
      
    try {
      
    try {
      
    try {
      
    try {
      
    try {
      
  const { id } = request.params;
  
  try {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        machine: true,
        assignedTo: true,
        createdBy: true,
        actions: {
          orderBy: { createdAt: 'desc' 
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }},
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }}
        }
      }
    
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }});

    if (!task) {
      return reply.code(404).send({
        success: false,
        error: 'Task not found'
      });
    
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }}

    return {
      success: true,
      data: task
    
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }};
  } catch (error) {
    fastify.log.error(error);
    reply.code(500).send({
      success: false,
      error: 'Failed to fetch task'
    
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }});
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
    
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }}
  }
}, async (request, reply) => {
    try {
      
    try {
      
    try {
      
    try {
      
    try {
      
    try {
      
    try {
      
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

    // Проверяем существование пользователя, если задача назначается
    if (assignedToId) {
      const assignedUser = await prisma.user.findUnique({
        where: { id: assignedToId }
      });

      if (!assignedUser) {
        return reply.code(400).send({
          success: false,
          error: 'Assigned user not found'
        });
      }
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

    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }});

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

    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }}, async (request, reply) => {
    try {
      
    try {
      
    try {
      
    try {
      
    try {
      
    try {
      
    try {
      
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

    // Проверяем существование пользователя, если задача переназначается
    if (updates.assignedToId && updates.assignedToId !== existingTask.assignedToId) {
      const assignedUser = await prisma.user.findUnique({
        where: { id: updates.assignedToId }
      });

      if (!assignedUser) {
        return reply.code(400).send({
          success: false,
          error: 'Assigned user not found'
        });
      }
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
          comment: `Updated: ${changes.join(', ')
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }}`
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
            latitude: { type: 'number' 
    
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }} catch (error) {
      logger.error('Error:', error);
      throw error;
    
    
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }} catch (error) {
      console.error('Error:', error);
      throw error;
    
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }}}},
            longitude: { type: 'number' 
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }}
          }
        },
        photoUrls: { type: 'array', items: { type: 'string' } }
      }
    }
  }
}, async (request, reply) => {
    try {
      
    try {
      
    try {
      
    try {
      
    try {
      
    try {
      
    try {
      
  const { id } = request.params;
  const { action, comment, location, photoUrls } = request.body;
  const userId = request.user.id;
  
  try {
    // Проверяем существование задачи
    const task = await prisma.task.findUnique({
      where: { id 
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }
    
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }} catch (error) {
      console.error('Error:', error);
      throw error;
    
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }}}
    });

    if (!task) {
      return reply.code(404).send({
        success: false,
        error: 'Task not found'
      
    
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }} catch (error) {
      logger.error('Error:', error);
      throw error;
    
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }}});
    }

    // Создаем действие
    const taskAction = await prisma.taskAction.create({
      data: {
        taskId: id,
        userId,
        action,
        comment,
        location: location ? `${location.latitude
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }},${location.longitude
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }}` : null,
        photoUrls: photoUrls || []
      
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }},
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }}
        }
      
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }}
    });

    // Обновляем статус задачи при необходимости
    if (action === 'STARTED' && task.status !== 'IN_PROGRESS') {
      await prisma.task.update({
        where: { id },
        data: { status: 'IN_PROGRESS' }
      
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }});
    } else if (action === 'COMPLETED' && task.status !== 'COMPLETED') {
      await prisma.task.update({
        where: { id },
        data: { 
          status: 'COMPLETED',
          completedAt: new Date()
        }
      
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }});
    } else if (action === 'CANCELLED' && task.status !== 'CANCELLED') {
      await prisma.task.update({
        where: { id },
        data: { status: 'CANCELLED' }
      
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }});
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
      
    try {
      
    try {
      
    try {
      
    try {
      
    try {
      
    try {
      
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
        
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }}
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
      
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }}
    };
  } catch (error) {
    fastify.log.error(error);
    reply.code(500).send({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }

    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }});

// API endpoints для ручного запуска задач по расписанию
fastify.post('/api/v1/tasks/scheduled/inventory-check', {
  preValidation: [fastify.authenticate],
  schema: {
    description: 'Manually trigger inventory check',
    tags: ['Scheduled Tasks']
  }

    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }}, async (request, reply) => {
    try {
      
    try {
      
    try {
      
    try {
      
    try {
      
    try {
      
    try {
      
  try {
    // Проверяем, что пользователь - администратор
    if (!request.user.roles.includes('ADMIN')) {
      return reply.code(403).send({
        success: false,
        error: 'Only administrators can trigger scheduled tasks'
      
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }});
    }

    const result = await scheduledTasks.manualCheckInventory();

    return {
      success: result,
      message: result ? 'Inventory check triggered successfully' : 'Failed to trigger inventory check'
    };
  } catch (error) {
    fastify.log.error(error);
    reply.code(500).send({
      success: false,
      error: 'Failed to trigger inventory check'
    });
  }

    } catch (error) {
      console.error('Error:', error);
      throw error;
    }});

fastify.post('/api/v1/tasks/scheduled/maintenance', {
  preValidation: [fastify.authenticate],
  schema: {
    description: 'Manually trigger maintenance tasks creation',
    tags: ['Scheduled Tasks']
  }

    } catch (error) {
      console.error('Error:', error);
      throw error;
    }}, async (request, reply) => {
    try {
      
    try {
      
    try {
      
    try {
      
    try {
      
    try {
      
    try {
      
  try {
    // Проверяем, что пользователь - администратор
    if (!request.user.roles.includes('ADMIN')) {
      return reply.code(403).send({
        success: false,
        error: 'Only administrators can trigger scheduled tasks'
      
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }});
    
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }}

    const result = await scheduledTasks.manualCreateMaintenanceTasks();

    return {
      success: result,
      message: result ? 'Maintenance tasks created successfully' : 'Failed to create maintenance tasks'
    
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }};
  } catch (error) {
    fastify.log.error(error);
    reply.code(500).send({
      success: false,
      error: 'Failed to create maintenance tasks'
    
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }});
  }
});

fastify.post('/api/v1/tasks/scheduled/inventory', {
  preValidation: [fastify.authenticate],
  schema: {
    description: 'Manually trigger inventory tasks creation',
    tags: ['Scheduled Tasks']
  }
}, async (request, reply) => {
    try {
      
    try {
      
    try {
      
    try {
      
    try {
      
    try {
      
    try {
      
  try {
    // Проверяем, что пользователь - администратор
    if (!request.user.roles.includes('ADMIN')) {
      return reply.code(403).send({
        success: false,
        error: 'Only administrators can trigger scheduled tasks'
      });
    }

    const result = await scheduledTasks.manualCreateInventoryTasks();

    return {
      success: result,
      message: result ? 'Inventory tasks created successfully' : 'Failed to create inventory tasks'
    };
  } catch (error) {
    fastify.log.error(error);
    reply.code(500).send({
      success: false,
      error: 'Failed to create inventory tasks'
    });
  }
});

// Start server
const start = async () => {
    try {
      
    try {
      
    try {
      
    try {
      
    try {
      
    try {
      
    try {
      
  try {
    await fastify.listen({ 
      port: process.env.PORT || 3004,
      host: '0.0.0.0'
    });
    logger.info('Tasks service is running on port', process.env.PORT || 3004);
    
    // Инициализируем расписания задач
    if (process.env.ENABLE_SCHEDULED_TASKS !== 'false') {
      scheduledTasks.initScheduledTasks();
      logger.info('Scheduled tasks initialized');
    } else {
      logger.info('Scheduled tasks disabled');
    }
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
      
    try {
      
    try {
      
    try {
      
    try {
      
  await fastify.close();
  await prisma.$disconnect();
  process.exit(0);
});
