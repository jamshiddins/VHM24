const logger = console;
/**
 * VHM24 - VendHub Manager 24/7
 * Monitoring Service
 * Мониторинг системы и метрики для Prometheus
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const Fastify = require('fastify');
const cors = require('@fastify/cors');
const jwt = require('@fastify/jwt');
const client = require('prom-client');
const { getPrismaClient } = require('@vhm24/database');

const prisma = getPrismaClient();
const fastify = Fastify({ 
  logger: true,
  trustProxy: true
});

// Проверка обязательных переменных окружения
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in environment variables');
}

// Создаем реестр для метрик
const register = new client.Registry();

// Добавляем метрики по умолчанию (CPU, память и т.д.)
client.collectDefaultMetrics({ register });

// Кастомные метрики
const httpRequestDuration = new client.Histogram({
  name: 'vhm24_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code', 'service'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

const httpRequestTotal = new client.Counter({
  name: 'vhm24_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code', 'service']
});

const machinesOnline = new client.Gauge({
  name: 'vhm24_machines_online',
  help: 'Number of online vending machines'
});

const machinesOffline = new client.Gauge({
  name: 'vhm24_machines_offline',
  help: 'Number of offline vending machines'
});

const machinesError = new client.Gauge({
  name: 'vhm24_machines_error',
  help: 'Number of vending machines with errors'
});

const tasksOpen = new client.Gauge({
  name: 'vhm24_tasks_open',
  help: 'Number of open tasks'
});

const tasksCompleted = new client.Counter({
  name: 'vhm24_tasks_completed_total',
  help: 'Total number of completed tasks'
});

const inventoryLowStock = new client.Gauge({
  name: 'vhm24_inventory_low_stock',
  help: 'Number of items with low stock'
});

const transactionsTotal = new client.Counter({
  name: 'vhm24_transactions_total',
  help: 'Total number of transactions',
  labelNames: ['status', 'payment_type']
});

const transactionsAmount = new client.Counter({
  name: 'vhm24_transactions_amount_total',
  help: 'Total amount of transactions',
  labelNames: ['currency']
});

const activeUsers = new client.Gauge({
  name: 'vhm24_users_active',
  help: 'Number of active users'
});

const databaseConnections = new client.Gauge({
  name: 'vhm24_database_connections',
  help: 'Number of database connections'
});

const apiErrors = new client.Counter({
  name: 'vhm24_api_errors_total',
  help: 'Total number of API errors',
  labelNames: ['service', 'error_type']
});

// Регистрируем все метрики
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(machinesOnline);
register.registerMetric(machinesOffline);
register.registerMetric(machinesError);
register.registerMetric(tasksOpen);
register.registerMetric(tasksCompleted);
register.registerMetric(inventoryLowStock);
register.registerMetric(transactionsTotal);
register.registerMetric(transactionsAmount);
register.registerMetric(activeUsers);
register.registerMetric(databaseConnections);
register.registerMetric(apiErrors);

// CORS
fastify.register(cors, {
  origin: (origin, cb) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
    if (!origin || allowedOrigins.includes(origin)) {
      cb(null, true);
    } else {
      cb(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
});

// JWT
fastify.register(jwt, {
  secret: process.env.JWT_SECRET,
  verify: {
    issuer: ['vhm24-gateway', 'vhm24-auth']
  }
});

// Декоратор для проверки авторизации
fastify.decorate('authenticate', async function(request, reply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.code(401).send({ 
      success: false,
      error: 'Unauthorized',
      message: err.message || 'Invalid or expired token'
    });
  }
});

// Health check
fastify.get('/health', async (request, reply) => {
  return { 
    status: 'ok', 
    service: 'monitoring',
    metrics: {
      prometheus: 'enabled',
      endpoint: '/metrics'
    }
  };
});

// Prometheus метрики endpoint
fastify.get('/metrics', async (request, reply) => {
  try {
    // Обновляем метрики из базы данных
    await updateMetrics();
    
    // Возвращаем метрики в формате Prometheus
    reply.type('text/plain');
    return register.metrics();
  } catch (error) {
    fastify.log.error('Failed to collect metrics:', error);
    reply.code(500).send('Failed to collect metrics');
  }
});

// Функция обновления метрик
async function updateMetrics() {
  try {
    // Метрики машин
    const [onlineCount, offlineCount, errorCount] = await Promise.all([
      prisma.machine.count({ where: { status: 'ONLINE' } }),
      prisma.machine.count({ where: { status: 'OFFLINE' } }),
      prisma.machine.count({ where: { status: 'ERROR' } })
    ]);
    
    machinesOnline.set(onlineCount);
    machinesOffline.set(offlineCount);
    machinesError.set(errorCount);
    
    // Метрики задач
    const openTasksCount = await prisma.task.count({
      where: {
        status: { in: ['CREATED', 'ASSIGNED', 'IN_PROGRESS'] }
      }
    });
    
    tasksOpen.set(openTasksCount);
    
    // Метрики инвентаря
    const lowStockCount = await prisma.inventoryItem.count({
      where: {
        quantity: { lte: 10 } // TODO: Использовать minQuantity
      }
    });
    
    inventoryLowStock.set(lowStockCount);
    
    // Метрики пользователей
    const activeUsersCount = await prisma.user.count({
      where: { isActive: true }
    });
    
    activeUsers.set(activeUsersCount);
    
  } catch (error) {
    fastify.log.error('Failed to update metrics:', error);
    apiErrors.inc({ service: 'monitoring', error_type: 'metrics_update' });
  }
}

// API для получения детальной статистики
fastify.get('/api/v1/monitoring/stats', {
  preValidation: [fastify.authenticate]
}, async (request, reply) => {
  try {
    const stats = {
      machines: {
        total: await prisma.machine.count(),
        online: await prisma.machine.count({ where: { status: 'ONLINE' } }),
        offline: await prisma.machine.count({ where: { status: 'OFFLINE' } }),
        maintenance: await prisma.machine.count({ where: { status: 'MAINTENANCE' } }),
        error: await prisma.machine.count({ where: { status: 'ERROR' } })
      },
      tasks: {
        total: await prisma.task.count(),
        created: await prisma.task.count({ where: { status: 'CREATED' } }),
        assigned: await prisma.task.count({ where: { status: 'ASSIGNED' } }),
        inProgress: await prisma.task.count({ where: { status: 'IN_PROGRESS' } }),
        completed: await prisma.task.count({ where: { status: 'COMPLETED' } }),
        cancelled: await prisma.task.count({ where: { status: 'CANCELLED' } })
      },
      inventory: {
        totalItems: await prisma.inventoryItem.count(),
        activeItems: await prisma.inventoryItem.count({ where: { isActive: true } }),
        lowStock: await prisma.inventoryItem.count({ where: { quantity: { lte: 10 } } }),
        outOfStock: await prisma.inventoryItem.count({ where: { quantity: 0 } })
      },
      users: {
        total: await prisma.user.count(),
        active: await prisma.user.count({ where: { isActive: true } }),
        byRole: await prisma.user.groupBy({
          by: ['roles'],
          _count: true
        })
      },
      transactions: {
        today: await prisma.transaction.count({
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        }),
        todayAmount: await prisma.transaction.aggregate({
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            },
            status: 'SUCCESS'
          },
          _sum: { amount: true }
        }),
        last24h: await prisma.transaction.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
          }
        })
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      }
    };
    
    return {
      success: true,
      data: stats
    };
  } catch (error) {
    fastify.log.error(error);
    apiErrors.inc({ service: 'monitoring', error_type: 'stats_fetch' });
    reply.code(500).send({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

// API для получения истории метрик
fastify.get('/api/v1/monitoring/history', {
  preValidation: [fastify.authenticate],
  schema: {
    querystring: {
      type: 'object',
      properties: {
        metric: { type: 'string' },
        from: { type: 'string', format: 'date-time' },
        to: { type: 'string', format: 'date-time' },
        interval: { type: 'string', enum: ['1m', '5m', '15m', '1h', '1d'], default: '5m' }
      }
    }
  }
}, async (request, reply) => {
  const { metric, from, to, interval } = request.query;
  
  // TODO: Интеграция с системой хранения временных рядов (InfluxDB, TimescaleDB)
  
  return {
    success: false,
    error: 'History storage not implemented yet',
    message: 'Please use Prometheus with Grafana for historical data'
  };
});

// API для настройки алертов
fastify.post('/api/v1/monitoring/alerts', {
  preValidation: [fastify.authenticate],
  schema: {
    body: {
      type: 'object',
      required: ['name', 'condition', 'threshold', 'action'],
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        metric: { type: 'string' },
        condition: { type: 'string', enum: ['gt', 'lt', 'eq', 'ne'] },
        threshold: { type: 'number' },
        action: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['email', 'telegram', 'webhook'] },
            target: { type: 'string' }
          }
        },
        enabled: { type: 'boolean', default: true }
      }
    }
  }
}, async (request, reply) => {
  // TODO: Реализовать систему алертов
  
  return {
    success: false,
    error: 'Alerts not implemented yet',
    message: 'Please use Prometheus AlertManager for alerts'
  };
});

// Middleware для отслеживания HTTP запросов
fastify.addHook('onRequest', async (request, reply) => {
  request.startTime = Date.now();
});

fastify.addHook('onResponse', async (request, reply) => {
  const duration = (Date.now() - request.startTime) / 1000;
  const labels = {
    method: request.method,
    route: request.routerPath || request.url,
    status_code: reply.statusCode,
    service: 'monitoring'
  };
  
  httpRequestDuration.observe(labels, duration);
  httpRequestTotal.inc(labels);
});

// Периодическое обновление метрик
setInterval(async () => {
  try {
    await updateMetrics();
  } catch (error) {
    fastify.log.error('Failed to update metrics:', error);
  }
}, 30000); // Каждые 30 секунд

// Start server
const start = async () => {
  try {
    await fastify.listen({ 
      port: process.env.MONITORING_PORT || 3008,
      host: '0.0.0.0'
    });
    logger.info('VHM24 Monitoring Service running 24/7 on port', process.env.MONITORING_PORT || 3008);
    logger.info('Prometheus metrics available at /metrics');
    
    // Первоначальное обновление метрик
    await updateMetrics();
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
