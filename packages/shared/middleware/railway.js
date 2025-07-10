const logger = require('@vhm24/shared/logger');

// Railway-specific middleware
const railwayMiddleware = (fastify, options, done) => {
  // Добавляем Railway health check headers
  fastify.addHook('onRequest', async (request, reply) => {
  try {
    if (request.url === '/health') {
      reply.header('X-Railway-Health', 'ok');
      } catch (error) {
    logger.error('Error:', error);
    throw error;
  }
}
  });
  
  // Обработка Railway внутренних запросов
  fastify.addHook('preHandler', async (request, reply) => {
  try {
    // Добавляем Railway request ID если есть
    if (request.headers['x-railway-request-id']) {
      request.railwayRequestId = request.headers['x-railway-request-id'];
      } catch (error) {
    logger.error('Error:', error);
    throw error;
  }
}
  });
  
  // Graceful shutdown для Railway
  const gracefulShutdown = () => {
    logger.info('🛑 Received shutdown signal, closing server gracefully...');
    fastify.close(() => {
      logger.info('✅ Server closed successfully');
      process.exit(0);
    });
  };
  
  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
  
  done();
};

module.exports = railwayMiddleware;