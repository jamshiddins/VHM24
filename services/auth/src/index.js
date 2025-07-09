/**
 * VHM24 - VendHub Manager 24/7
 * Authentication Service
 * Provides 24/7 authentication for vending machine operators
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const Fastify = require('fastify');
const cors = require('@fastify/cors');
const jwt = require('@fastify/jwt');
const bcrypt = require('bcrypt');
const { getAuthClient } = require('@vhm24/database');

const prisma = getAuthClient();
const fastify = Fastify({ logger: true });

// Plugins
fastify.register(cors, {
  origin: true,
  credentials: true
});

fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'your-secret-key',
  sign: {
    expiresIn: '24h'
  }
});

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
    // Проверяем, существует ли пользователь
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return reply.code(400).send({
        success: false,
        error: 'User with this email already exists'
      });
    }
    
    // Хешируем пароль
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Создаем пользователя
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
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
    
    // Создаем токен
    const token = fastify.jwt.sign({
      id: user.id,
      email: user.email,
      roles: user.roles
    });
    
    // Логируем действие
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_REGISTERED',
        entity: 'User',
        entityId: user.id,
        ipAddress: request.ip
      }
    });
    
    return {
      success: true,
      data: {
        user,
        token,
        refreshToken: fastify.jwt.sign({ id: user.id }, { expiresIn: '7d' })
      }
    };
  } catch (error) {
    fastify.log.error(error);
    reply.code(500).send({
      success: false,
      error: 'Failed to register user'
    });
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
      where = { telegramId };
      authMethod = 'TELEGRAM';
    } else if (email) {
      where = { email };
    } else if (phoneNumber) {
      where = { phoneNumber };
      authMethod = 'PHONE';
    } else {
      return reply.code(400).send({ 
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
    fastify.log.error(error);
    return reply.code(500).send({ error: 'Internal server error' });
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
    fastify.log.error(error);
    reply.code(500).send({
      success: false,
      error: 'Failed to fetch user'
    });
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
    fastify.log.error(error);
    reply.code(500).send({
      success: false,
      error: 'Failed to change password'
    });
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
    fastify.log.error(error);
    reply.code(500).send({
      success: false,
      error: 'Failed to link Telegram account'
    });
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
