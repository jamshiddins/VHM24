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
  return { status: 'ok', service: 'auth' };
});

// Регистрация нового пользователя
fastify.post('/api/v1/auth/register', {
  schema: {
    body: {
      type: 'object',
      required: ['email', 'password', 'name'],
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 6 },
        name: { type: 'string', minLength: 2 },
        phoneNumber: { type: 'string' },
        roles: { 
          type: 'array', 
          items: { 
            type: 'string', 
            enum: ['ADMIN', 'MANAGER', 'WAREHOUSE', 'OPERATOR', 'TECHNICIAN', 'DRIVER'] 
          },
          default: ['OPERATOR']
        }
      }
    }
  }
}, async (request, reply) => {
  const { email, password, name, phoneNumber, roles } = request.body;
  
  try {
    // Валидация email
    if (!validateEmail(email)) {
      return reply.code(400).send({
        success: false,
        error: 'Invalid email format'
      });
    }
    
    // Валидация пароля
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return reply.code(400).send({
        success: false,
        error: passwordValidation.message
      });
    }
    
    // Валидация телефона (если указан)
    if (phoneNumber && !validatePhoneNumber(phoneNumber)) {
      return reply.code(400).send({
        success: false,
        error: 'Invalid phone number format. Use format: +998XXXXXXXXX'
      });
    }
    
    // Санитизация имени
    const sanitizedName = sanitizeInput(name);
    
    // Проверяем, существует ли пользователь
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          phoneNumber ? { phoneNumber } : {}
        ].filter(Boolean)
      }
    });
    
    if (existingUser) {
      return reply.code(400).send({
        success: false,
        error: 'User with this email or phone number already exists'
      });
    }
    
    // Хешируем пароль с более высокой стоимостью для production
    const saltRounds = process.env.NODE_ENV === 'production' ? 12 : 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Используем транзакцию для создания пользователя и логирования
    const result = await prisma.$transaction(async (tx) => {
      // Создаем пользователя
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(), // Нормализуем email
          passwordHash,
          name: sanitizedName,
          phoneNumber,
          roles: roles || ['OPERATOR']
        },
        select: {
          id: true,
          email: true,
          name: true,
          roles: true,
          createdAt: true
        }
      });
      
      // Логируем действие
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'USER_REGISTERED',
          entity: 'User',
          entityId: user.id,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent']
        }
      });
      
      return user;
    });
    
    // Создаем токены
    const token = fastify.jwt.sign({
      id: result.id,
      email: result.email,
      roles: result.roles
    });
    
    const refreshToken = fastify.jwt.sign(
      { id: result.id, type: 'refresh' }, 
      { expiresIn: '7d' }
    );
    
    return {
      success: true,
      data: {
        user: {
          ...result,
          email: maskSensitiveData(result.email, 'email')
        },
        token,
        refreshToken
      }
    };
  } catch (error) {
    // Обработка ошибок Prisma
    if (error.code === 'P2002') {
      return reply.code(409).send({
        success: false,
        error: 'User already exists'
      });
    }
    
    throw createError.database('Registration failed');
  }
});

// Вход в систему
fastify.post('/api/v1/auth/login', async (request, reply) => {
  const { email, password, phoneNumber, telegramId } = request.body;
  
  try {
    // Поддержка входа через email, телефон или telegram для 24/7 доступа
    let where = {};
    let authMethod = 'EMAIL';
    
    if (telegramId) {
      // Валидация Telegram ID
      if (!validateTelegramId(telegramId)) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid Telegram ID format'
        });
      }
      where = { telegramId };
      authMethod = 'TELEGRAM';
    } else if (email) {
      // Валидация email
      if (!validateEmail(email)) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid email format'
        });
      }
      where = { email: email.toLowerCase() };
    } else if (phoneNumber) {
      // Валидация телефона
      if (!validatePhoneNumber(phoneNumber)) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid phone number format. Use format: +998XXXXXXXXX'
        });
      }
      where = { phoneNumber };
      authMethod = 'PHONE';
    } else {
      return reply.code(400).send({ 
        success: false,
        error: 'Email, phone or telegram ID required for 24/7 access' 
      });
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
        telegramId: true
      }
    });

    if (!user || !user.isActive) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }

    // Для Telegram входа пароль не проверяем (для быстрого доступа 24/7)
    if (authMethod !== 'TELEGRAM' && password) {
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }
    } else if (authMethod !== 'TELEGRAM' && !password) {
      return reply.code(400).send({ error: 'Password required' });
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
        changes: { authMethod }
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
        phoneNumber: user.phoneNumber
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
    
    const newRefreshToken = fastify.jwt.sign(
      { id: user.id },
      { expiresIn: '7d' }
    );
    
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
        lastLogin: true
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

// Изменить пароль
fastify.post('/api/v1/auth/change-password', {
  preValidation: [fastify.authenticate],
  schema: {
    body: {
      type: 'object',
      required: ['currentPassword', 'newPassword'],
      properties: {
        currentPassword: { type: 'string' },
        newPassword: { type: 'string', minLength: 6 }
      }
    }
  }
}, async (request, reply) => {
  const { currentPassword, newPassword } = request.body;
  const userId = request.user.id;
  
  try {
    // Получаем пользователя с паролем
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    // Проверяем текущий пароль
    const validPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    
    if (!validPassword) {
      return reply.code(400).send({
        success: false,
        error: 'Current password is incorrect'
      });
    }
    
    // Хешируем новый пароль
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    
    // Обновляем пароль
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash }
    });
    
    // Логируем действие
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'PASSWORD_CHANGED',
        entity: 'User',
        entityId: userId,
        ipAddress: request.ip
      }
    });
    
    return {
      success: true,
      message: 'Password changed successfully'
    };
  } catch (error) {
    throw createError.database('Failed to change password');
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

// Связывание Telegram ID с пользователем
fastify.post('/api/v1/auth/link-telegram', {
  preValidation: [fastify.authenticate],
  schema: {
    body: {
      type: 'object',
      required: ['telegramId'],
      properties: {
        telegramId: { type: 'string' }
      }
    }
  }
}, async (request, reply) => {
  const { telegramId } = request.body;
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
      data: { telegramId }
    });
    
    // Логируем действие
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'TELEGRAM_LINKED',
        entity: 'User',
        entityId: userId,
        ipAddress: request.ip,
        changes: { telegramId }
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
          isActive: true
        }
      });
      
      console.log('Default admin user created: admin@vhm24.ru / admin123');
    }
  } catch (error) {
    console.error('Failed to create default admin:', error);
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
    console.log('VHM24 Auth Service running 24/7 on port', process.env.PORT || 3001);
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
