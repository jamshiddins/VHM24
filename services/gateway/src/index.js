require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const Fastify = require('fastify');
const httpProxy = require('@fastify/http-proxy');
const cors = require('@fastify/cors');
const jwt = require('@fastify/jwt');
const multipart = require('@fastify/multipart');
const websocket = require('@fastify/websocket');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();
const fastify = Fastify({ 
  logger: true,
  bodyLimit: 10485760 // 10MB для загрузки файлов
});

// WebSocket клиенты
const wsClients = new Set();

// Plugins
fastify.register(cors, {
  origin: true,
  credentials: true
});

fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'your-secret-key'
});

fastify.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

fastify.register(websocket);

// Декоратор для проверки авторизации
fastify.decorate('authenticate', async function(request, reply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.code(401).send({ error: 'Unauthorized' });
  }
});

// Health check
fastify.get('/health', async (request, reply) => {
  const services = {
    auth: 'unknown',
    machines: 'unknown',
    inventory: 'unknown',
    tasks: 'unknown'
  };
  
  // Проверяем каждый сервис
  const checks = [
    { name: 'auth', url: 'http://localhost:3001/health' },
    { name: 'machines', url: 'http://localhost:3002/health' },
    { name: 'inventory', url: 'http://localhost:3003/health' },
    { name: 'tasks', url: 'http://localhost:3004/health' }
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

// Загрузка файлов
fastify.post('/api/v1/upload', {
  preValidation: [fastify.authenticate],
  handler: async (request, reply) => {
    const parts = request.parts();
    const uploadedFiles = [];
    
    for await (const part of parts) {
      if (part.file) {
        // Генерируем уникальное имя файла
        const ext = path.extname(part.filename);
        const filename = `${uuidv4()}${ext}`;
        const uploadDir = path.join(process.cwd(), 'uploads');
        const filepath = path.join(uploadDir, filename);
        
        // Создаем директорию если не существует
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        // Сохраняем файл
        const writeStream = fs.createWriteStream(filepath);
        await part.file.pipe(writeStream);
        
        uploadedFiles.push({
          originalName: part.filename,
          filename: filename,
          mimetype: part.mimetype,
          size: writeStream.bytesWritten,
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

// Proxy к сервисам
// Auth service
fastify.register(httpProxy, {
  upstream: 'http://localhost:3001',
  prefix: '/api/v1/auth',
  rewritePrefix: '/api/v1/auth'
});

// Machines service
fastify.register(httpProxy, {
  upstream: 'http://localhost:3002',
  prefix: '/api/v1/machines',
  rewritePrefix: '/api/v1/machines'
});

// Inventory service
fastify.register(httpProxy, {
  upstream: 'http://localhost:3003',
  prefix: '/api/v1/inventory',
  rewritePrefix: '/api/v1/inventory'
});

// Tasks service
fastify.register(httpProxy, {
  upstream: 'http://localhost:3004',
  prefix: '/api/v1/tasks',
  rewritePrefix: '/api/v1/tasks'
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
    fastify.log.error(error);
    reply.code(500).send({
      success: false,
      error: 'Failed to fetch dashboard stats'
    });
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
    fastify.log.error(error);
    reply.code(500).send({
      success: false,
      error: 'Failed to fetch audit logs'
    });
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
    
    await fastify.listen({ 
      port: process.env.PORT || 8000,
      host: '0.0.0.0'
    });
    console.log('Gateway is running on port', process.env.PORT || 8000);
    console.log('WebSocket available at ws://localhost:8000/ws');
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
