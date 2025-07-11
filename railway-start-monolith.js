#!/usr/bin/env node

/**
 * VHM24 Railway Monolith Start Script
 * Запускает все сервисы в одном процессе для Railway
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

logger.info('🚂 VHM24 Railway Monolith Start...');
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

    child.on('close', code => {
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
    const schemaPath = path.join(
      __dirname,
      'packages/database/prisma/schema.prisma'
    );
    if (!fs.existsSync(schemaPath)) {
      throw new Error(
        'Prisma schema not found at packages/database/prisma/schema.prisma'
      );
    }

    logger.info('✅ Prisma schema found');

    // Генерируем Prisma клиент
    logger.info('🔧 Generating Prisma client...');
    await runCommand('npx', ['prisma', 'generate'], {
      cwd: path.join(__dirname, 'packages/database')
    });
    logger.info('✅ Prisma client generated');

    // Запускаем миграции
    logger.info('🔧 Running database migrations...');
    await runCommand('npx', ['prisma', 'migrate', 'deploy'], {
      cwd: path.join(__dirname, 'packages/database')
    });
    logger.info('✅ Database migrations completed');

    // Проверяем подключение к базе данных
    logger.info('🔧 Testing database connection...');
    const { getPrismaClient } = require('./packages/database');
    let prisma;

    try {
      prisma = getPrismaClient();
      await prisma.$connect();
      logger.info('✅ Database connection successful');

      // Проверяем наличие пользователей
      const userCount = await prisma.user.count();
      logger.info(`📊 Users in database: ${userCount}`);

      // Создаем администратора если нет пользователей
      if (userCount === 0) {
        logger.info('🔧 Creating default admin user...');
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
      }

      await prisma.$disconnect();
      logger.info('🎉 Database migration completed successfully!');
    } catch (error) {
      logger.error('❌ Database connection failed:', error.message);
      logger.info('⚠️ Continuing without database setup...');
    }

    logger.info('\n🚂 === MONOLITH APPLICATION START ===');

    // Создаем единый Fastify сервер
    const fastify = Fastify({
      logger: true,
      bodyLimit: 10485760 // 10MB
    });

    // Регистрируем CORS
    await fastify.register(require('@fastify/cors'), {
      origin: true,
      credentials: true
    });

    // Регистрируем multipart для загрузки файлов
    await fastify.register(require('@fastify/multipart'), {
      limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
      }
    });

    // Health check endpoint
    fastify.get('/health', async (request, reply) => {
      return {
        status: 'ok',
        service: 'vhm24-monolith',
        timestamp: new Date().toISOString(),
        database: 'connected'
      };
    });

    // API Documentation
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
          <p>VendHub Manager 24/7 - Production API</p>
          
          <div class="endpoint">
            <div class="method">GET /health</div>
            <p>Health check endpoint</p>
          </div>
          
          <div class="endpoint">
            <div class="method">GET /docs</div>
            <p>This documentation page</p>
          </div>
          
          <div class="endpoint">
            <div class="method">POST /api/v1/auth/login</div>
            <p>User authentication</p>
          </div>
          
          <div class="endpoint">
            <div class="method">GET /api/v1/dashboard/stats</div>
            <p>Dashboard statistics</p>
          </div>
          
          <div class="endpoint">
            <div class="method">GET /api/v1/machines</div>
            <p>List all machines</p>
          </div>
          
          <div class="endpoint">
            <div class="method">GET /api/v1/inventory</div>
            <p>Inventory management</p>
          </div>
          
          <div class="endpoint">
            <div class="method">GET /api/v1/tasks</div>
            <p>Task management</p>
          </div>
          
          <p><strong>Environment:</strong> ${process.env.NODE_ENV}</p>
          <p><strong>Version:</strong> 1.0.0</p>
        </body>
        </html>
      `;
    });

    // Получаем prisma клиент для API endpoints
    let apiPrisma;
    try {
      apiPrisma = getPrismaClient();
    } catch (error) {
      logger.error(
        '❌ Failed to initialize Prisma client for API:',
        error.message
      );
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

    fastify.post(
      '/api/v1/auth/login',
      { schema: postapiv1authloginSchema },
      async (request, reply) => {
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

          if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
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
      }
    );

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
          apiPrisma.task.count({
            where: { status: { in: ['CREATED', 'ASSIGNED'] } }
          }),
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

    // Запускаем Telegram Bot в фоне (если токен есть)
    if (process.env.TELEGRAM_BOT_TOKEN) {
      setTimeout(() => {
        logger.info('🤖 Starting Telegram Bot...');
        try {
          require('./services/telegram-bot/src/index.js');
          logger.info('✅ Telegram Bot started successfully');
        } catch (error) {
          logger.error('❌ Telegram Bot failed to start:', error.message);
        }
      }, 3000);
    }

    // Запускаем сервер
    const port = process.env.PORT || 8000;
    await fastify.listen({
      port: port,
      host: '0.0.0.0'
    });

    logger.info(`🎉 VHM24 Monolith is running on port ${port}`);
    logger.info(`🌐 Health check: http://localhost:${port}/health`);
    logger.info(`📚 Documentation: http://localhost:${port}/docs`);

    // Railway specific logging
    if (process.env.RAILWAY_ENVIRONMENT) {
      logger.info('🚂 Running on Railway:', process.env.RAILWAY_STATIC_URL);
      logger.info(
        '🔗 Public URL:',
        `https://${process.env.RAILWAY_STATIC_URL}`
      );
    }
  } catch (error) {
    logger.error('❌ Railway deployment failed:', error.message);
    logger.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Обработка сигналов
process.on('SIGTERM', () => {
  logger.info('🛑 Received SIGTERM, shutting down...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('🛑 Received SIGINT, shutting down...');
  process.exit(0);
});

process.on('uncaughtException', error => {
  logger.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled Rejection:', reason);
  process.exit(1);
});

// Запускаем приложение
startRailwayApp();
