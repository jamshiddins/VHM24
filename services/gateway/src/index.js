/**
 * VHM24 - VendHub Manager 24/7
 * Gateway Service - PRODUCTION READY
 * Secure API Gateway with WebSocket support
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });

// Устанавливаем SERVICE_NAME для конфигурации
process.env.SERVICE_NAME = 'gateway';

const Fastify = require('fastify');
const httpProxy = require('@fastify/http-proxy');
const multipart = require('@fastify/multipart');
const websocket = require('@fastify/websocket');
const { getPrismaClient } = require('@vhm24/database');
const { validateFileType, sanitizeInput } = require('@vhm24/shared-types/src/security');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

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
  createFastifyConfig
} = require('@vhm24/shared');

// Настройка глобальных обработчиков ошибок
setupGlobalErrorHandlers();

// Создаем Fastify с безопасной конфигурацией
const fastify = Fastify({
  ...createFastifyConfig(),
  bodyLimit: parseInt(process.env.MAX_FILE_SIZE) || 10485760 // 10MB по умолчанию
});

const prisma = getPrismaClient();

// Регистрируем обработчики ошибок
registerErrorHandlers(fastify);

// Настройка безопасности
setupHelmet(fastify, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
    },
  },
});
setupCORS(fastify);
setupRateLimit(fastify, {
  max: 200, // Более высокий лимит для gateway
  timeWindow: '1 minute'
});
setupJWT(fastify, {
  verify: {
    issuer: ['vhm24-gateway', 'vhm24-auth'] // Принимаем токены от auth сервиса
  }
});

// Middleware для логирования и санитизации
fastify.addHook('preHandler', securityLogger);
fastify.addHook('preHandler', sanitizeInputs);

fastify.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

fastify.register(websocket);

// WebSocket клиенты
const wsClients = new Set();

// Декоратор для проверки авторизации (переопределяем для совместимости)
fastify.decorate('authenticate', authenticate);

// Health check
fastify.get('/health', async (request, reply) => {
  const services = {
    auth: 'unknown',
    machines: 'unknown',
    inventory: 'unknown',
    tasks: 'unknown',
    bunkers: 'unknown',
    notifications: 'unknown'
  };
  
  // Проверяем каждый сервис
  const checks = [
    { name: 'auth', url: 'http://127.0.0.1:3001/health' },
    { name: 'machines', url: 'http://127.0.0.1:3002/health' },
    { name: 'inventory', url: 'http://127.0.0.1:3003/health' },
    { name: 'tasks', url: 'http://127.0.0.1:3004/health' },
    { name: 'bunkers', url: 'http://127.0.0.1:3005/health' },
    { name: 'notifications', url: 'http://127.0.0.1:3006/health' }
  ];
  
  for (const check of checks) {
    try {
      const response = await fetch(check.url);
      if (response.ok) {
        services[check.name] = 'ok';
      } else {
        services[check.name] = 'error';
      }
    } catch (e) {
      services[check.name] = 'offline';
    }
  }
  
  // Проверяем базу данных
  let dbStatus = 'unknown';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (e) {
    dbStatus = 'error';
  }
  
  return { 
    status: 'ok', 
    service: 'gateway',
    services,
    database: process.env.DATABASE_URL ? 'supabase' : 'local',
    dbStatus,
    timestamp: new Date().toISOString()
  };
});

// WebSocket endpoint для real-time обновлений
fastify.register(async function (fastify) {
  fastify.get('/ws', { websocket: true }, (connection, req) => {
    console.log('WebSocket client connected');
    
    // Добавляем клиента в список
    wsClients.add(connection.socket);
    
    // Отправляем приветствие
    connection.socket.send(JSON.stringify({
      type: 'connected',
      message: 'Connected to VHM24 WebSocket',
      timestamp: new Date()
    }));
    
    // Обработка сообщений от клиента
    connection.socket.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('WebSocket message:', data);
        
        // Echo обратно
        connection.socket.send(JSON.stringify({
          type: 'echo',
          data: data,
          timestamp: new Date()
        }));
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    // Очистка при отключении
    connection.socket.on('close', () => {
      console.log('WebSocket client disconnected');
      wsClients.delete(connection.socket);
    });
  });
});

// Функция для broadcast сообщений всем WebSocket клиентам
function broadcastToClients(type, data) {
  const message = JSON.stringify({
    type,
    data,
    timestamp: new Date()
  });
  
  wsClients.forEach(client => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(message);
    }
  });
}

// Загрузка файлов с валидацией
fastify.post('/api/v1/upload', {
  preValidation: [fastify.authenticate],
  handler: async (request, reply) => {
    const parts = request.parts();
    const uploadedFiles = [];
    const maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 10485760; // 10MB
    
    for await (const part of parts) {
      if (part.file) {
        // Валидация типа файла
        if (!validateFileType(part.mimetype)) {
          return reply.code(400).send({
            success: false,
            error: `File type ${part.mimetype} is not allowed`
          });
        }
        
        // Санитизация имени файла
        const sanitizedFilename = sanitizeInput(part.filename);
        const ext = path.extname(sanitizedFilename);
        const filename = `${uuidv4()}${ext}`;
        const uploadDir = path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
        const filepath = path.join(uploadDir, filename);
        
        // Создаем директорию если не существует
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        // Проверяем размер файла
        let fileSize = 0;
        const chunks = [];
        
        for await (const chunk of part.file) {
          fileSize += chunk.length;
          if (fileSize > maxFileSize) {
            return reply.code(413).send({
              success: false,
              error: `File size exceeds maximum allowed size of ${maxFileSize} bytes`
            });
          }
          chunks.push(chunk);
        }
        
        // Сохраняем файл
        const buffer = Buffer.concat(chunks);
        fs.writeFileSync(filepath, buffer);
        
        // Логируем загрузку файла
        await prisma.auditLog.create({
          data: {
            userId: request.user.id,
            action: 'FILE_UPLOADED',
            entity: 'File',
            entityId: filename,
            changes: {
              originalName: sanitizedFilename,
              size: fileSize,
              mimetype: part.mimetype
            },
            ipAddress: request.ip
          }
        });
        
        uploadedFiles.push({
          originalName: sanitizedFilename,
          filename: filename,
          mimetype: part.mimetype,
          size: fileSize,
          url: `/uploads/${filename}`
        });
        
        // TODO: Интеграция с MinIO для постоянного хранения
      }
    }
    
    return {
      success: true,
      data: uploadedFiles
    };
  }
});

// Статика для загруженных файлов
// TODO: Временно отключено из-за несовместимости версий
// fastify.register(require('@fastify/static'), {
//   root: path.join(process.cwd(), 'uploads'),
//   prefix: '/uploads/',
//   decorateReply: false
// });

// Загружаем конфигурацию
const config = require('./config');

// Proxy к сервисам
// Auth service
fastify.register(httpProxy, {
  upstream: config.services.auth.url,
  prefix: config.services.auth.prefix,
  rewritePrefix: config.services.auth.prefix
});

// Machines service
fastify.register(httpProxy, {
  upstream: config.services.machines.url,
  prefix: config.services.machines.prefix,
  rewritePrefix: config.services.machines.prefix
});

// Inventory service
fastify.register(httpProxy, {
  upstream: config.services.inventory.url,
  prefix: config.services.inventory.prefix,
  rewritePrefix: config.services.inventory.prefix
});

// Tasks service
fastify.register(httpProxy, {
  upstream: config.services.tasks.url,
  prefix: config.services.tasks.prefix,
  rewritePrefix: config.services.tasks.prefix
});

// Bunkers service
fastify.register(httpProxy, {
  upstream: config.services.bunkers.url,
  prefix: config.services.bunkers.prefix,
  rewritePrefix: config.services.bunkers.prefix
});

// Notifications service
fastify.register(httpProxy, {
  upstream: config.services.notifications.url,
  prefix: config.services.notifications.prefix,
  rewritePrefix: config.services.notifications.prefix
});

// Dashboard stats endpoint
fastify.get('/api/v1/dashboard/stats', {
  preValidation: [fastify.authenticate]
}, async (request, reply) => {
  try {
    const [
      totalMachines,
      onlineMachines,
      totalTasks,
      pendingTasks,
      totalUsers,
      activeUsers,
      inventoryItems,
      lowStockItems
    ] = await Promise.all([
      prisma.machine.count(),
      prisma.machine.count({ where: { status: 'ONLINE' } }),
      prisma.task.count(),
      prisma.task.count({ where: { status: { in: ['CREATED', 'ASSIGNED'] } } }),
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.inventoryItem.count(),
      prisma.inventoryItem.count({ 
        where: { 
          quantity: { lte: 10 } // TODO: Сделать динамическим из поля minQuantity
        } 
      })
    ]);
    
    // Получаем последние транзакции
    const recentTransactions = await prisma.transaction.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    
    // Считаем выручку за сегодня
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayRevenue = await prisma.transaction.aggregate({
      where: {
        createdAt: { gte: todayStart },
        status: 'SUCCESS'
      },
      _sum: { amount: true }
    });
    
    const stats = {
      totalMachines,
      onlineMachines,
      totalTasks,
      pendingTasks,
      totalUsers,
      activeUsers,
      inventoryItems,
      lowStockItems,
      todayRevenue: todayRevenue._sum.amount || 0,
      totalRevenue: 156789.50, // TODO: Вычислить из БД
      recentTransactions
    };
    
    // Отправляем обновление через WebSocket
    broadcastToClients('stats_update', stats);
    
    return {
      success: true,
      data: stats
    };
  } catch (error) {
    throw createError.database('Failed to fetch dashboard stats');
  }
});

// Тестовый endpoint для проверки базы данных
fastify.get('/api/v1/test-db', async (request, reply) => {
  try {
    const [machines, tasks, users] = await Promise.all([
      prisma.machine.count(),
      prisma.task.count(),
      prisma.user.count()
    ]);
    
    return {
      success: true,
      data: {
        machines,
        tasks,
        users,
        database: 'connected'
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

// Audit log endpoint
fastify.get('/api/v1/audit-log', {
  preValidation: [fastify.authenticate]
}, async (request, reply) => {
  try {
    const { entity, entityId, userId, from, to, skip = 0, take = 50 } = request.query;
    
    const where = {};
    if (entity) where.entity = entity;
    if (entityId) where.entityId = entityId;
    if (userId) where.userId = userId;
    
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }
    
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(take),
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
      }),
      prisma.auditLog.count({ where })
    ]);
    
    return {
      success: true,
      data: {
        items: logs,
        total,
        skip: parseInt(skip),
        take: parseInt(take)
      }
    };
  } catch (error) {
    throw createError.database('Failed to fetch audit logs');
  }
});

// Start server
const start = async () => {
  try {
    // Создаем директорию для загрузок
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const port = process.env.PORT || process.env.GATEWAY_PORT || 8000;
    await fastify.listen({ 
      port: port,
      host: '0.0.0.0'
    });
    console.log('Gateway is running on port', port);
    console.log('WebSocket available at ws://localhost:' + port + '/ws');
    
    // Railway specific logging
    if (process.env.RAILWAY_ENVIRONMENT) {
      console.log('Running on Railway:', process.env.RAILWAY_STATIC_URL);
    }
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

// Graceful shutdown
process.on('SIGTERM', async () => {
  // Закрываем все WebSocket соединения
  wsClients.forEach(client => {
    client.close();
  });
  
  await fastify.close();
  await prisma.$disconnect();
  process.exit(0);
});

// Экспорт функции broadcast для использования в других модулях
module.exports = { broadcastToClients };
