#!/usr/bin/env node

/**
 * VHM24 Railway Production Start Script
 * Стабильный запуск для Railway с базовой функциональностью
 */

const Fastify = require('fastify');
const path = require('path');

logger.info('🚂 VHM24 Railway Production Start...');
logger.info(`📍 Environment: ${process.env.NODE_ENV || 'production'}`);
logger.info(`🔌 Port: ${process.env.PORT || 8000}`);

// Устанавливаем переменные окружения
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
const PORT = process.env.PORT || 8000;

// Создаем Fastify сервер с логированием
const fastify = Fastify({
  logger: {
    level: 'info',
    prettyPrint: process.env.NODE_ENV === 'development'
  }
});

// Регистрируем CORS
fastify.register(require('@fastify/cors'), {
  origin: true,
  credentials: true
});

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  const healthData = {
    status: 'ok',
    service: 'vhm24-production',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    port: PORT,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '1.0.0'
  };

  // Проверяем подключение к базе данных если доступно
  if (process.env.DATABASE_URL) {
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      await prisma.$queryRaw`SELECT 1`;
      await prisma.$disconnect();
      healthData.database = 'connected';
    } catch (error) {
      healthData.database = 'disconnected';
      healthData.database_error = error.message;
    }
  }

  return healthData;
});

// Root endpoint
fastify.get('/', async (request, reply) => {
  reply.type('text/html');
  return `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>VHM24 - Railway Production</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .container { 
          max-width: 900px; 
          margin: 0 auto; 
          padding: 40px;
          background: rgba(255,255,255,0.1);
          border-radius: 20px;
          backdrop-filter: blur(10px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          text-align: center;
        }
        .success { 
          color: #4CAF50; 
          font-size: 2.5em; 
          margin: 20px 0;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
          margin: 30px 0;
        }
        .info-card { 
          padding: 15px; 
          background: rgba(255,255,255,0.2); 
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.3);
        }
        .endpoint-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 10px;
          margin: 20px 0;
        }
        .endpoint { 
          padding: 12px; 
          background: rgba(255,255,255,0.15); 
          border-radius: 8px;
          font-family: 'Courier New', monospace;
          font-size: 0.9em;
        }
        .status-indicator {
          display: inline-block;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #4CAF50;
          margin-right: 8px;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        .footer {
          margin-top: 40px;
          font-size: 0.9em;
          opacity: 0.8;
          border-top: 1px solid rgba(255,255,255,0.2);
          padding-top: 20px;
        }
        .btn {
          display: inline-block;
          padding: 12px 24px;
          margin: 10px;
          background: rgba(255,255,255,0.2);
          border: 1px solid rgba(255,255,255,0.3);
          border-radius: 8px;
          color: white;
          text-decoration: none;
          transition: all 0.3s ease;
        }
        .btn:hover {
          background: rgba(255,255,255,0.3);
          transform: translateY(-2px);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🎉 VHM24 Railway Production</h1>
        <div class="success">
          <span class="status-indicator"></span>
          УСПЕШНО РАЗВЕРНУТО!
        </div>
        
        <div class="info-grid">
          <div class="info-card">
            <strong>🌍 Environment</strong><br>
            ${process.env.NODE_ENV || 'production'}
          </div>
          <div class="info-card">
            <strong>🔌 Port</strong><br>
            ${PORT}
          </div>
          <div class="info-card">
            <strong>🚂 Railway URL</strong><br>
            ${process.env.RAILWAY_STATIC_URL || 'N/A'}
          </div>
          <div class="info-card">
            <strong>⏰ Deployed</strong><br>
            ${new Date().toLocaleString('ru-RU')}
          </div>
        </div>
        
        <h2>🔗 Доступные API endpoints:</h2>
        <div class="endpoint-list">
          <div class="endpoint">GET /health</div>
          <div class="endpoint">GET /</div>
          <div class="endpoint">GET /docs</div>
          <div class="endpoint">GET /api/status</div>
        </div>
        
        <div style="margin: 30px 0;">
          <a href="/health" class="btn">🏥 Health Check</a>
          <a href="/docs" class="btn">📚 Documentation</a>
          <a href="/api/status" class="btn">📊 System Status</a>
        </div>
        
        <h2>🎯 Статус системы:</h2>
        <div class="info-grid">
          <div class="info-card">
            <strong>✅ Сервер</strong><br>
            Запущен и работает
          </div>
          <div class="info-card">
            <strong>🗄️ База данных</strong><br>
            ${process.env.DATABASE_URL ? 'Настроена' : 'Не настроена'}
          </div>
          <div class="info-card">
            <strong>🔐 Аутентификация</strong><br>
            ${process.env.JWT_SECRET ? 'Настроена' : 'Не настроена'}
          </div>
          <div class="info-card">
            <strong>🤖 Telegram Bot</strong><br>
            ${process.env.TELEGRAM_BOT_TOKEN ? 'Настроен' : 'Не настроен'}
          </div>
        </div>
        
        <div class="footer">
          <strong>VHM24 - VendHub Manager 24/7</strong><br>
          Railway Production Deployment - Version 1.0.0<br>
          Uptime: ${Math.floor(process.uptime())} seconds
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
    <html lang="ru">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>VHM24 API Documentation</title>
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 40px; 
          background: #f5f5f5;
          color: #333;
        }
        .container { max-width: 1000px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .endpoint { 
          margin: 20px 0; 
          padding: 20px; 
          border: 1px solid #ddd; 
          border-radius: 8px;
          background: #fafafa;
        }
        .method { 
          font-weight: bold; 
          color: #007bff; 
          font-family: 'Courier New', monospace;
          background: #e3f2fd;
          padding: 4px 8px;
          border-radius: 4px;
          display: inline-block;
          margin-bottom: 10px;
        }
        .description { margin: 10px 0; }
        .response { 
          background: #f8f9fa; 
          padding: 15px; 
          border-radius: 5px; 
          font-family: 'Courier New', monospace;
          font-size: 0.9em;
          margin-top: 10px;
        }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        .status { color: #27ae60; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🤖 VHM24 API Documentation</h1>
        <p><strong>VendHub Manager 24/7 - Railway Production API</strong></p>
        
        <h2>📋 Основные endpoints</h2>
        
        <div class="endpoint">
          <div class="method">GET /</div>
          <div class="description">Главная страница с информацией о развертывании</div>
          <div class="response">Возвращает: HTML страницу с системной информацией</div>
        </div>
        
        <div class="endpoint">
          <div class="method">GET /health</div>
          <div class="description">Health check endpoint для мониторинга состояния сервиса</div>
          <div class="response">
Возвращает: JSON объект<br>
{<br>
&nbsp;&nbsp;"status": "ok",<br>
&nbsp;&nbsp;"service": "vhm24-production",<br>
&nbsp;&nbsp;"timestamp": "2025-07-10T02:10:00.000Z",<br>
&nbsp;&nbsp;"environment": "production",<br>
&nbsp;&nbsp;"port": 8000,<br>
&nbsp;&nbsp;"uptime": 123.45,<br>
&nbsp;&nbsp;"memory": {...},<br>
&nbsp;&nbsp;"database": "connected"<br>
}
          </div>
        </div>
        
        <div class="endpoint">
          <div class="method">GET /docs</div>
          <div class="description">Эта страница документации API</div>
          <div class="response">Возвращает: HTML страницу с документацией</div>
        </div>
        
        <div class="endpoint">
          <div class="method">GET /api/status</div>
          <div class="description">Расширенная информация о статусе системы</div>
          <div class="response">Возвращает: JSON с детальной информацией о системе</div>
        </div>
        
        <h2>📊 Системная информация</h2>
        <div class="endpoint">
          <p><strong>Статус:</strong> <span class="status">Railway production deployment успешен</span></p>
          <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'production'}</p>
          <p><strong>Version:</strong> 1.0.0</p>
          <p><strong>Port:</strong> ${PORT}</p>
          <p><strong>Uptime:</strong> ${Math.floor(process.uptime())} секунд</p>
        </div>
        
        <h2>🔧 Конфигурация</h2>
        <div class="endpoint">
          <p><strong>База данных:</strong> ${process.env.DATABASE_URL ? '✅ Настроена' : '❌ Не настроена'}</p>
          <p><strong>JWT Secret:</strong> ${process.env.JWT_SECRET ? '✅ Настроен' : '❌ Не настроен'}</p>
          <p><strong>Telegram Bot:</strong> ${process.env.TELEGRAM_BOT_TOKEN ? '✅ Настроен' : '❌ Не настроен'}</p>
          <p><strong>Redis:</strong> ${process.env.REDIS_URL ? '✅ Настроен' : '❌ Не настроен'}</p>
        </div>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666;">
          <p>VHM24 - VendHub Manager 24/7 | Railway Production API</p>
        </div>
      </div>
    </body>
    </html>
  `;
});

// System status API endpoint
fastify.get('/api/status', async (request, reply) => {
  const status = {
    service: 'vhm24-production',
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    port: PORT,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '1.0.0',
    railway: {
      environment: process.env.RAILWAY_ENVIRONMENT || null,
      static_url: process.env.RAILWAY_STATIC_URL || null,
      deployment_id: process.env.RAILWAY_DEPLOYMENT_ID || null
    },
    configuration: {
      database: !!process.env.DATABASE_URL,
      jwt_secret: !!process.env.JWT_SECRET,
      telegram_bot: !!process.env.TELEGRAM_BOT_TOKEN,
      redis: !!process.env.REDIS_URL,
      admin_ids: !!process.env.ADMIN_IDS
    }
  };

  // Проверяем подключение к базе данных
  if (process.env.DATABASE_URL) {
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      await prisma.$queryRaw`SELECT 1`;
      await prisma.$disconnect();
      status.database = { status: 'connected', error: null };
    } catch (error) {
      status.database = { status: 'error', error: error.message };
    }
  } else {
    status.database = { status: 'not_configured', error: null };
  }

  return status;
});

// 404 handler
fastify.setNotFoundHandler(async (request, reply) => {
  reply.code(404).type('application/json');
  return {
    error: 'Not Found',
    message: `Route ${request.method}:${request.url} not found`,
    statusCode: 404,
    timestamp: new Date().toISOString()
  };
});

// Error handler
fastify.setErrorHandler(async (error, request, reply) => {
  fastify.log.error(error);
  reply.code(500).type('application/json');
  return {
    error: 'Internal Server Error',
    message: error.message,
    statusCode: 500,
    timestamp: new Date().toISOString()
  };
});

// Запускаем сервер
const start = async () => {
  try {
    await fastify.listen({
      port: PORT,
      host: '0.0.0.0'
    });

    logger.info(`🎉 VHM24 Production is running on port ${PORT}`);
    logger.info(`🌐 Health check: http://localhost:${PORT}/health`);
    logger.info(`📚 Documentation: http://localhost:${PORT}/docs`);
    logger.info(`📊 System status: http://localhost:${PORT}/api/status`);

    // Railway specific logging
    if (process.env.RAILWAY_ENVIRONMENT) {
      logger.info(
        '🚂 Running on Railway environment:',
        process.env.RAILWAY_ENVIRONMENT
      );
      logger.info('🔗 Railway static URL:', process.env.RAILWAY_STATIC_URL);
      logger.info('🆔 Deployment ID:', process.env.RAILWAY_DEPLOYMENT_ID);
    }
  } catch (err) {
    logger.error('❌ Server failed to start:', err);
    process.exit(1);
  }
};

// Обработка сигналов для graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('🛑 Received SIGTERM, shutting down gracefully...');
  try {
    await fastify.close();
    logger.info('✅ Server closed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  logger.info('🛑 Received SIGINT, shutting down gracefully...');
  try {
    await fastify.close();
    logger.info('✅ Server closed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

// Обработка необработанных ошибок
process.on('uncaughtException', error => {
  logger.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Запускаем приложение
start();
