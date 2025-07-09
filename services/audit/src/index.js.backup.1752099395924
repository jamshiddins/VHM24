const fastify = require('fastify')({ logger: true });
const { PrismaClient } = require('@prisma/client');
const cron = require('node-cron');

const prisma = new PrismaClient();

// Регистрация плагинов
fastify.register(require('@fastify/cors'), {
  origin: true,
  credentials: true
});

fastify.register(require('@fastify/helmet'));
fastify.register(require('@fastify/rate-limit'), {
  max: 100,
  timeWindow: '1 minute'
});

fastify.register(require('@fastify/jwt'), {
  secret: process.env.JWT_SECRET || 'your-secret-key'
});

// Импорт маршрутов
fastify.register(require('./routes/audit'), { prefix: '/api/audit' });
fastify.register(require('./routes/reports'), { prefix: '/api/reports' });
fastify.register(require('./routes/incomplete-data'), { prefix: '/api/incomplete-data' });

// Middleware для аутентификации
fastify.decorate('authenticate', async function(request, reply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
});

// Middleware для логирования всех запросов
fastify.addHook('preHandler', async (request, reply) => {
  const auditService = require('./services/auditService');
  
  // Логируем все входящие запросы
  await auditService.logSystemAction({
    userId: request.user?.id || null,
    sessionId: request.headers['x-session-id'] || null,
    action: 'READ',
    entity: 'API_REQUEST',
    description: `${request.method} ${request.url}`,
    inputData: {
      method: request.method,
      url: request.url,
      params: request.params,
      query: request.query,
      body: request.method !== 'GET' ? request.body : undefined
    },
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'],
    endpoint: request.url,
    method: request.method
  });
});

// Hook для логирования ответов
fastify.addHook('onSend', async (request, reply, payload) => {
  const auditService = require('./services/auditService');
  
  await auditService.logSystemAction({
    userId: request.user?.id || null,
    sessionId: request.headers['x-session-id'] || null,
    action: 'INFO',
    entity: 'API_RESPONSE',
    description: `Response for ${request.method} ${request.url}`,
    metadata: {
      statusCode: reply.statusCode,
      responseTime: reply.getResponseTime()
    },
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'],
    endpoint: request.url,
    method: request.method,
    statusCode: reply.statusCode,
    responseTime: reply.getResponseTime()
  });
});

// Проверка здоровья сервиса
fastify.get('/health', async (request, reply) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', service: 'audit', timestamp: new Date().toISOString() };
  } catch (error) {
    reply.code(500);
    return { status: 'error', service: 'audit', error: error.message };
  }
});

// Запуск cron задач для обработки незавершенных данных
cron.schedule('0 */6 * * *', async () => {
  const incompleteDataService = require('./services/incompleteDataService');
  await incompleteDataService.processIncompleteData();
});

// Запуск cron задач для очистки старых логов
cron.schedule('0 2 * * 0', async () => {
  const auditService = require('./services/auditService');
  await auditService.cleanupOldLogs();
});

// Запуск сервера
const start = async () => {
  try {
    const port = process.env.AUDIT_SERVICE_PORT || 3009;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`🔍 Audit service запущен на порту ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  await fastify.close();
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  await fastify.close();
});

start();
