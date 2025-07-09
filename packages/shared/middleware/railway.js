// Railway-specific middleware
const railwayMiddleware = (fastify, options, done) => {
  // Добавляем Railway health check headers
  fastify.addHook('onRequest', async (request, reply) => {
    if (request.url === '/health') {
      reply.header('X-Railway-Health', 'ok');
    }
  });
  
  // Обработка Railway внутренних запросов
  fastify.addHook('preHandler', async (request, reply) => {
    // Добавляем Railway request ID если есть
    if (request.headers['x-railway-request-id']) {
      request.railwayRequestId = request.headers['x-railway-request-id'];
    }
  });
  
  // Graceful shutdown для Railway
  const gracefulShutdown = () => {
    console.log('🛑 Received shutdown signal, closing server gracefully...');
    fastify.close(() => {
      console.log('✅ Server closed successfully');
      process.exit(0);
    });
  };
  
  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
  
  done();
};

module.exports = railwayMiddleware;