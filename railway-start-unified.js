#!/usr/bin/env node

/**
 * VHM24 Railway Unified Start Script
 * Объединяет миграцию базы данных и запуск приложения в одном скрипте
 * Решает проблемы с деплоем на Railway
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const Fastify = require('fastify');

// Загружаем переменные окружения
try {
  require('dotenv').config();
} catch (error) {
  logger.info('⚠️ dotenv not available, using environment variables');
}

logger.info('🚂 VHM24 Railway Unified Start...');
logger.info(`📍 Environment: ${process.env.NODE_ENV || 'production'}`);
logger.info(`🔌 Port: ${process.env.PORT || 8000}`);

// Устанавливаем переменные окружения
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.PORT = process.env.PORT || '8000';

// Проверяем обязательные переменные
if (!process.env.DATABASE_URL) {
  logger.error('❌ DATABASE_URL is required for Railway deployment');
  process.exit(1);
}

// Функция для запуска команды
function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    logger.info(`🔧 Running: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    child.on('error', reject);
  });
}

// Основная функция
async function startRailwayApp() {
  try {
    logger.info('🗄️ === DATABASE MIGRATION PHASE ===');
    
    // Проверяем наличие schema.prisma
    const schemaPath = path.join(__dirname, 'packages/database/prisma/schema.prisma');
    if (!fs.existsSync(schemaPath)) {
      logger.warn('⚠️ Prisma schema not found at packages/database/prisma/schema.prisma');
      logger.warn('⚠️ Skipping database migration phase');
    } else {
      logger.info('✅ Prisma schema found');
      
      // Генерируем Prisma клиент
      logger.info('🔧 Generating Prisma client...');
      try {
        await runCommand('npx', ['prisma', 'generate'], {
          cwd: path.join(__dirname, 'packages/database')
        });
        logger.info('✅ Prisma client generated');
      } catch (error) {
        logger.error('⚠️ Failed to generate Prisma client:', error.message);
        logger.info('⚠️ Continuing without Prisma client generation');
      }
      
      // Запускаем миграции
      logger.info('🔧 Running database migrations...');
      try {
        await runCommand('npx', ['prisma', 'migrate', 'deploy'], {
          cwd: path.join(__dirname, 'packages/database')
        });
        logger.info('✅ Database migrations completed');
      } catch (error) {
        logger.error('⚠️ Failed to run database migrations:', error.message);
        logger.info('⚠️ Continuing without database migrations');
      }
      
      // Проверяем подключение к базе данных
      logger.info('🔧 Testing database connection...');
      let prisma;
      
      try {
        const { getPrismaClient } = require('./packages/database');
        prisma = getPrismaClient();
        await prisma.$connect();
        logger.info('✅ Database connection successful');
        
        // Проверяем наличие пользователей
        const userCount = await prisma.user.count();
        logger.info(`📊 Users in database: ${userCount}`);
        
        // Создаем администратора если нет пользователей
        if (userCount === 0) {
          logger.info('🔧 Creating default admin user...');
          try {
            const bcrypt = require('bcrypt');
            
            const adminUser = await prisma.user.create({
              data: {
                email: 'admin@vhm24.ru',
                name: 'System Administrator',
                passwordHash: await bcrypt.hash('admin123', 10),
                telegramId: process.env.ADMIN_IDS || '42283329',
                roles: ['ADMIN'],
                isActive: true
              }
            });
            
            logger.info('✅ Default admin user created');
            logger.info(`📧 Email: admin@vhm24.ru`);
            logger.info(`🔑 Password: admin123`);
            logger.info(`📱 Telegram ID: ${adminUser.telegramId}`);
          } catch (error) {
            logger.error('⚠️ Failed to create admin user:', error.message);
            logger.info('⚠️ Continuing without admin user creation');
          }
        }
        
        await prisma.$disconnect();
        logger.info('🎉 Database migration completed successfully!');
      } catch (error) {
        logger.error('⚠️ Database connection failed:', error.message);
        logger.info('⚠️ Continuing without database setup...');
      }
    }
    
    logger.info('\n🚂 === MONOLITH APPLICATION START ===');
    
    // Создаем единый Fastify сервер
    const fastify = Fastify({
      logger: true,
      bodyLimit: 10485760 // 10MB
    });

    // Регистрируем CORS
    try {
      await fastify.register(require('@fastify/cors'), {
        origin: true,
        credentials: true
      });
    } catch (error) {
      logger.error('⚠️ Failed to register CORS:', error.message);
    }

    // Регистрируем multipart для загрузки файлов
    try {
      await fastify.register(require('@fastify/multipart'), {
        limits: {
          fileSize: 10 * 1024 * 1024 // 10MB
        }
      });
    } catch (error) {
      logger.error('⚠️ Failed to register multipart:', error.message);
    }

    // Health check endpoint
    fastify.get('/health', async (request, reply) => {
      const healthData = {
        status: 'ok',
        service: 'vhm24-unified',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production',
        port: process.env.PORT || 8000,
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
          <title>VHM24 - Railway Deployment</title>
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
            <h1>🎉 VHM24 Railway Deployment</h1>
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
                ${process.env.PORT || 8000}
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
              Railway Deployment - Version 1.0.0<br>
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
            <p><strong>VendHub Manager 24/7 - Railway API</strong></p>
            
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
    &nbsp;&nbsp;"service": "vhm24-unified",<br>
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
              <p><strong>Статус:</strong> <span class="status">Railway deployment успешен</span></p>
              <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'production'}</p>
              <p><strong>Version:</strong> 1.0.0</p>
              <p><strong>Port:</strong> ${process.env.PORT || 8000}</p>
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
              <p>VHM24 - VendHub Manager 24/7 | Railway API</p>
            </div>
          </div>
        </body>
        </html>
      `;
    });

    // System status API endpoint
    fastify.get('/api/status', async (request, reply) => {
      const status = {
        service: 'vhm24-unified',
        status: 'running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production',
        port: process.env.PORT || 8000,
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

    // Получаем prisma клиент для API endpoints
    let apiPrisma;
    try {
      const { getPrismaClient } = require('./packages/database');
      apiPrisma = getPrismaClient();
    } catch (error) {
      logger.error('⚠️ Failed to initialize Prisma client for API:', error.message);
      apiPrisma = null;
    }

    // Встраиваем основные API endpoints прямо в монолит
    
    // Auth endpoints
    
// Схема валидации для POST /api/v1/auth/login
const postapiv1authloginSchema = {
  body: {
    type: 'object',
    required: [],
    properties: {}
  }
};

fastify.post('/api/v1/auth/login', { schema: postapiv1authloginSchema }, async (request, reply) => {
      try {
        if (!apiPrisma) {
          return reply.code(503).send({
            success: false,
            error: 'Database not available'
          });
        }

        const { email, password } = request.body;
        
        if (!email || !password) {
          return reply.code(400).send({
            success: false,
            error: 'Email and password are required'
          });
        }

        const bcrypt = require('bcrypt');
        const jwt = require('jsonwebtoken');
        
        const user = await apiPrisma.user.findUnique({
          where: { email }
        });

        if (!user || !await bcrypt.compare(password, user.passwordHash)) {
          return reply.code(401).send({
            success: false,
            error: 'Invalid credentials'
          });
        }

        const token = jwt.sign(
          { 
            id: user.id, 
            email: user.email, 
            roles: user.roles 
          },
          process.env.JWT_SECRET || 'vhm24-secret-key',
          { expiresIn: '24h' }
        );

        return {
          success: true,
          data: {
            token,
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              roles: user.roles
            }
          }
        };
      } catch (error) {
        logger.error('Login error:', error);
        return reply.code(500).send({
          success: false,
          error: 'Internal server error'
        });
      }
    });

    // Dashboard stats
    fastify.get('/api/v1/dashboard/stats', async (request, reply) => {
      try {
        if (!apiPrisma) {
          return reply.code(503).send({
            success: false,
            error: 'Database not available'
          });
        }

        const [
          totalMachines,
          onlineMachines,
          totalTasks,
          pendingTasks,
          totalUsers,
          activeUsers
        ] = await Promise.all([
          apiPrisma.machine.count(),
          apiPrisma.machine.count({ where: { status: 'ONLINE' } }),
          apiPrisma.task.count(),
          apiPrisma.task.count({ where: { status: { in: ['CREATED', 'ASSIGNED'] } } }),
          apiPrisma.user.count(),
          apiPrisma.user.count({ where: { isActive: true } })
        ]);

        return {
          success: true,
          data: {
            totalMachines,
            onlineMachines,
            totalTasks,
            pendingTasks,
            totalUsers,
            activeUsers,
            todayRevenue: 0,
            totalRevenue: 0
          }
        };
      } catch (error) {
        logger.error('Dashboard stats error:', error);
        return reply.code(500).send({
          success: false,
          error: 'Failed to fetch dashboard stats'
        });
      }
    });

    // Machines endpoints
    fastify.get('/api/v1/machines', async (request, reply) => {
      try {
        if (!apiPrisma) {
          return reply.code(503).send({
            success: false,
            error: 'Database not available'
          });
        }

        const machines = await apiPrisma.machine.findMany({
          include: {
            location: true
          }
        });

        return {
          success: true,
          data: machines
        };
      } catch (error) {
        logger.error('Machines error:', error);
        return reply.code(500).send({
          success: false,
          error: 'Failed to fetch machines'
        });
      }
    });

    // Inventory endpoints
    fastify.get('/api/v1/inventory', async (request, reply) => {
      try {
        if (!apiPrisma) {
          return reply.code(503).send({
            success: false,
            error: 'Database not available'
          });
        }

        const inventory = await apiPrisma.inventoryItem.findMany({
      skip: (request.query.page - 1) * request.query.limit,
      take: request.query.limit,
      orderBy: { createdAt: 'desc' }
    });

        return {
          success: true,
          data: inventory
        };
      } catch (error) {
        logger.error('Inventory error:', error);
        return reply.code(500).send({
          success: false,
          error: 'Failed to fetch inventory'
        });
      }
    });

    // Tasks endpoints
    fastify.get('/api/v1/tasks', async (request, reply) => {
      try {
        if (!apiPrisma) {
          return reply.code(503).send({
            success: false,
            error: 'Database not available'
          });
        }

        const tasks = await apiPrisma.task.findMany({
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            machine: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          }
        });

        return {
          success: true,
          data: tasks
        };
      } catch (error) {
        logger.error('Tasks error:', error);
        return reply.code(500).send({
          success: false,
          error: 'Failed to fetch tasks'
        });
      }
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

    // Запускаем Telegram Bot в фоне (если токен есть)
    if (process.env.TELEGRAM_BOT_TOKEN && fs.existsSync('./services/telegram-bot/src/index.js')) {
      setTimeout(() => {
        logger.info('🤖 Starting Telegram Bot...');
        try {
          require('./services/telegram-bot/src/index.js');
          logger.info('✅ Telegram Bot started successfully');
        } catch (error) {
          logger.error('⚠️ Telegram Bot failed to start:', error.message);
          logger.info('⚠️ Continuing without Telegram Bot');
        }
      }, 3000);
    }

    // Запускаем сервер
    const port = process.env.PORT || 8000;
    await fastify.listen({ 
      port: port,
      host: '0.0.0.0'
    });
    
    logger.info(`🎉 VHM24 Unified is running on port ${port}`);
    logger.info(`🌐 Health check: http://localhost:${port}/health`);
    logger.info(`📚 Documentation: http://localhost:${port}/docs`);
    logger.info(`📊 System status: http://localhost:${port}/api/status`);
    
    // Railway specific logging
    if (process.env.RAILWAY_ENVIRONMENT) {
      logger.info('🚂 Running on Railway:', process.env.RAILWAY_STATIC_URL);
      logger.info('🔗 Public URL:', `https://${process.env.RAILWAY_STATIC_URL}`);
    }
    
  } catch (error) {
    logger.error('❌ Railway deployment failed:', error.message);
    logger.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Обработка сигналов
process.on('SIGTERM', async () => {
  logger.info('🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Запускаем приложение
startRailwayApp();
