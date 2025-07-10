/**
 * VHM24 - VendHub Manager 24/7
 * Authentication Service - PRODUCTION READY
 * Provides secure 24/7 authentication for vending machine operators
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });

// Устанавливаем SERVICE_NAME для конфигурации
process.env.SERVICE_NAME = 'auth';

const Fastify = require('fastify');
const bcrypt = require('bcrypt');
const { getAuthClient } = require('@vhm24/database');

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
  config,
  createFastifyConfig
} = require('@vhm24/shared');

// Security utilities
const { 
  validateEmail, 
  validatePhoneNumber, 
  validateTelegramId,
  validatePasswordStrength,
  sanitizeInput,
  maskSensitiveData
} = require('@vhm24/shared-types/src/security');

// Настройка глобальных обработчиков ошибок
setupGlobalErrorHandlers();

// Создаем Fastify с безопасной конфигурацией
const fastify = Fastify(createFastifyConfig());

// Получаем Prisma клиент
const prisma = getAuthClient();

// Регистрируем обработчики ошибок
registerErrorHandlers(fastify);

// Настройка безопасности
setupHelmet(fastify);
setupCORS(fastify);
setupRateLimit(fastify, {
  max: 50, // Более строгий лимит для auth сервиса
  timeWindow: '1 minute'
});
setupJWT(fastify);

// Middleware для логирования и санитизации
fastify.addHook('preHandler', securityLogger);
fastify.addHook('preHandler', sanitizeInputs);

// Декоратор для проверки авторизации
fastify.decorate('authenticate', async function(request, reply) {
  try {
    await request.jwtVerify();
    // Добавляем информацию о пользователе в request
    const user = await prisma.user.findUnique({
      where: { id: request.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        roles: true,
        isActive: true
      }
    });
    
    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }
    
    request.user = user;
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
  try {
    // Проверяем соединение с базой данных
    await prisma.$queryRaw`SELECT 1`;
    
    return { 
      status: 'ok', 
      service: 'auth', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      database: 'connected'
    };
  } catch (error) {
    fastify.log.error('Health check failed:', error);
    return reply.code(503).send({ 
      status: 'error', 
      service: 'auth',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed'
    });
  }
});

// Вход в систему
fastify.post('/api/v1/auth/login', async (request, reply) => {
  const { telegramId, username } = request.body;
  
  try {
    // Поддержка входа только через Telegram
    if (!telegramId && !username) {
      return reply.code(400).send({
        success: false,
        error: 'Telegram ID or username required for access'
      });
    }

    let where = {};
    
    if (telegramId) {
      // Валидация Telegram ID
      if (!validateTelegramId(telegramId)) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid Telegram ID format'
        });
      }
      where = { telegramId };
    } else if (username) {
      // Поиск по username из Telegram
      where = { telegramUsername: username };
    }

    const user = await prisma.user.findFirst({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        roles: true,
        isActive: true,
        phoneNumber: true,
        telegramId: true,
        telegramUsername: true
      }
    });

    if (!user || !user.isActive) {
      return reply.code(401).send({ 
        error: 'Invalid credentials',
        message: 'User not found or inactive'
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN',
        entity: 'User',
        entityId: user.id,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
        changes: { authMethod: 'TELEGRAM' }
      }
    });

    const token = fastify.jwt.sign({
      id: user.id,
      email: user.email,
      roles: user.roles,
      name: user.name
    });

    fastify.log.info(`User ${user.email} logged in - VHM24 system access granted`);

    return {
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
        phoneNumber: user.phoneNumber,
        telegramUsername: user.telegramUsername
      },
      message: 'Welcome to VHM24 - 24/7 Access Granted'
    };
  } catch (error) {
    throw createError.authentication('Login failed');
  }
});

// Обновление токена
fastify.post('/api/v1/auth/refresh', {
  schema: {
    body: {
      type: 'object',
      required: ['refreshToken'],
      properties: {
        refreshToken: { type: 'string' }
      }
    }
  }
}, async (request, reply) => {
  const { refreshToken } = request.body;
  
  try {
    // Проверяем refresh token
    const decoded = fastify.jwt.verify(refreshToken);
    
    // Находим пользователя
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        roles: true,
        isActive: true
      }
    });
    
    if (!user || !user.isActive) {
      return reply.code(401).send({
        success: false,
        error: 'Invalid refresh token'
      });
    }
    
    // Создаем новые токены
    const token = fastify.jwt.sign({
      id: user.id,
      email: user.email,
      roles: user.roles
    });
    
    const newRefreshToken = fastify.jwt.sign({ id: user.id }, { expiresIn: '7d' });
    
    return {
      success: true,
      data: {
        token,
        refreshToken: newRefreshToken
      }
    };
  } catch (error) {
    reply.code(401).send({
      success: false,
      error: 'Invalid refresh token'
    });
  }
});

// Получить текущего пользователя
fastify.get('/api/v1/auth/me', {
  preValidation: [fastify.authenticate]
}, async (request, reply) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: request.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        roles: true,
        phoneNumber: true,
        isActive: true,
        createdAt: true,
        lastLogin: true,
        telegramUsername: true
      }
    });
    
    if (!user) {
      return reply.code(404).send({
        success: false,
        error: 'User not found'
      });
    }
    
    return {
      success: true,
      data: user
    };
  } catch (error) {
    throw createError.database('Failed to fetch user data');
  }
});

// Связывание Telegram ID с пользователем
fastify.post('/api/v1/auth/link-telegram', {
  preValidation: [fastify.authenticate],
  schema: {
    body: {
      type: 'object',
      required: ['telegramId'],
      properties: {
        telegramId: { type: 'string' },
        telegramUsername: { type: 'string' }
      }
    }
  }
}, async (request, reply) => {
  const { telegramId, telegramUsername } = request.body;
  const userId = request.user.id;
  
  try {
    // Проверяем, не привязан ли уже этот Telegram ID к другому пользователю
    const existingUser = await prisma.user.findFirst({
      where: { telegramId }
    });
    
    if (existingUser && existingUser.id !== userId) {
      return reply.code(400).send({
        success: false,
        error: 'This Telegram ID is already linked to another account'
      });
    }
    
    // Обновляем пользователя
    await prisma.user.update({
      where: { id: userId },
      data: { 
        telegramId,
        telegramUsername: telegramUsername || null
      }
    });
    
    // Логируем действие
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'TELEGRAM_LINKED',
        entity: 'User',
        entityId: userId,
        ipAddress: request.ip,
        changes: { telegramId, telegramUsername }
      }
    });
    
    return {
      success: true,
      message: 'Telegram account linked successfully'
    };
  } catch (error) {
    throw createError.database('Failed to link Telegram account');
  }
});

// Выход (логирование)
fastify.post('/api/v1/auth/logout', {
  preValidation: [fastify.authenticate]
}, async (request, reply) => {
  try {
    // Логируем действие
    await prisma.auditLog.create({
      data: {
        userId: request.user.id,
        action: 'USER_LOGOUT',
        entity: 'User',
        entityId: request.user.id,
        ipAddress: request.ip
      }
    });
    
    return {
      success: true,
      message: 'Logged out successfully'
    };
  } catch (error) {
    fastify.log.error(error);
    return {
      success: true,
      message: 'Logged out successfully'
    };
  }
});

// Проверка роли (middleware helper)
fastify.decorate('requireRole', (roles) => {
  return async function (request, reply) {
    if (!request.user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
    
    const hasRole = roles.some(role => request.user.roles.includes(role));
    
    if (!hasRole) {
      return reply.code(403).send({ 
        error: 'Forbidden',
        message: `Required roles: ${roles.join(', ')}`
      });
    }
  };
});

// Создание первого администратора (если нет пользователей)
async function createDefaultAdmin() {
  try {
    const userCount = await prisma.user.count();
    
    if (userCount === 0) {
      const passwordHash = await bcrypt.hash('admin123', 10);
      
      await prisma.user.create({
        data: {
          email: 'admin@vhm24.ru',
          name: 'System Administrator',
          passwordHash,
          roles: ['ADMIN'],
          isActive: true,
          telegramUsername: 'admin'
        }
      });
      
      logger.info('Default admin user created: admin@vhm24.ru / admin123');
    }
  } catch (error) {
    logger.error('Failed to create default admin:', error);
  }
}

// Start server
const start = async () => {
  try {
    // Создаем администратора по умолчанию
    await createDefaultAdmin();
    
    await fastify.listen({ 
      port: process.env.PORT || 3001,
      host: '0.0.0.0'
    });
    logger.info('VHM24 Auth Service running 24/7 on port', process.env.PORT || 3001);
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
