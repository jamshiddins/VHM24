#!/usr/bin/env node

/**
 * VHM24 Railway Simple Start Script
 * Простой запуск для Railway без сложной логики
 */

const Fastify = require('fastify');

// Создаем простой логгер
const logger = {
  info: (...args) => console.log('[INFO]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
  warn: (...args) => console.warn('[WARN]', ...args),
  debug: (...args) => console.debug('[DEBUG]', ...args)
};

logger.info('🚂 VHM24 Railway Simple Start...');
logger.info(`📍 Environment: ${process.env.NODE_ENV || 'production'}`);
logger.info(`🔌 Port: ${process.env.PORT || 8000}`);

// Создаем простой Fastify сервер
const fastify = Fastify({
  logger: true
});

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  return { 
    status: 'ok', 
    service: 'vhm24-simple',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    port: process.env.PORT || 8000
  };
});

// Root endpoint
fastify.get('/', async (request, reply) => {
  reply.type('text/html');
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>VHM24 - Railway Deployment Success</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 40px; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-align: center;
        }
        .container { 
          max-width: 800px; 
          margin: 0 auto; 
          padding: 40px;
          background: rgba(255,255,255,0.1);
          border-radius: 20px;
          backdrop-filter: blur(10px);
        }
        .success { color: #4CAF50; font-size: 2em; margin: 20px 0; }
        .endpoint { 
          margin: 10px 0; 
          padding: 10px; 
          background: rgba(255,255,255,0.2); 
          border-radius: 10px; 
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🎉 VHM24 Railway Deployment</h1>
        <div class="success">✅ УСПЕШНО РАЗВЕРНУТО!</div>
        
        <h2>📊 Информация о системе:</h2>
        <div class="endpoint">🌍 Environment: ${process.env.NODE_ENV || 'production'}</div>
        <div class="endpoint">🔌 Port: ${process.env.PORT || 8000}</div>
        <div class="endpoint">🚂 Railway URL: ${process.env.RAILWAY_STATIC_URL || 'N/A'}</div>
        <div class="endpoint">⏰ Deployed: ${new Date().toISOString()}</div>
        
        <h2>🔗 Доступные endpoints:</h2>
        <div class="endpoint">GET /health - Health check</div>
        <div class="endpoint">GET / - Эта страница</div>
        
        <h2>🎯 Следующие шаги:</h2>
        <p>1. Проверить health endpoint: <code>/health</code></p>
        <p>2. Настроить переменные окружения для полной функциональности</p>
        <p>3. Добавить API endpoints по мере необходимости</p>
        
        <div style="margin-top: 40px; font-size: 0.9em; opacity: 0.8;">
          VHM24 - VendHub Manager 24/7<br>
          Railway Deployment Test - Version 1.0.0
        </div>
      </div>
    </body>
    </html>
  `;
});

// API Documentation endpoint
fastify.get('/docs', async (request, reply) => {
  reply.type('text/html');
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>VHM24 API Documentation</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .endpoint { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .method { font-weight: bold; color: #007bff; }
      </style>
    </head>
    <body>
      <h1>🤖 VHM24 API Documentation</h1>
      <p>VendHub Manager 24/7 - Railway Test Deployment</p>
      
      <div class="endpoint">
        <div class="method">GET /</div>
        <p>Main page with deployment information</p>
      </div>
      
      <div class="endpoint">
        <div class="method">GET /health</div>
        <p>Health check endpoint</p>
      </div>
      
      <div class="endpoint">
        <div class="method">GET /docs</div>
        <p>This documentation page</p>
      </div>
      
      <p><strong>Status:</strong> Railway deployment test successful</p>
      <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'production'}</p>
      <p><strong>Version:</strong> 1.0.0</p>
    </body>
    </html>
  `;
});

// Запускаем сервер
const start = async () => {
  try {
    const port = process.env.PORT || 8000;
    await fastify.listen({ 
      port: port,
      host: '0.0.0.0'
    });
    
    logger.info(`🎉 VHM24 Simple is running on port ${port}`);
    logger.info(`🌐 Health check: http://localhost:${port}/health`);
    logger.info(`📚 Documentation: http://localhost:${port}/docs`);
    
    // Railway specific logging
    if (process.env.RAILWAY_ENVIRONMENT) {
      logger.info('🚂 Running on Railway:', process.env.RAILWAY_STATIC_URL);
      logger.info('🔗 Public URL:', `https://${process.env.RAILWAY_STATIC_URL}`);
    }
    
  } catch (err) {
    logger.error('❌ Server failed to start:', err);
    process.exit(1);
  }
};

// Обработка сигналов
process.on('SIGTERM', async () => {
  logger.info('🛑 Received SIGTERM, shutting down...');
  await fastify.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('🛑 Received SIGINT, shutting down...');
  await fastify.close();
  process.exit(0);
});

// Запускаем приложение
start();
