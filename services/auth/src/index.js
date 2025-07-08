const Fastify = require('fastify');
const cors = require('@fastify/cors');
const jwt = require('@fastify/jwt');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
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
    reply.code(401).send({ error: 'Unauthorized' });
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
fastify.post('/api/v1/auth/login', {
  schema: {
    body: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string' }
      }
    }
  }
}, async (request, reply) => {
  const { email, password } = request.body;
  
  try {
    // Находим пользователя
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      return reply.code(401).send({
        success: false,
        error: 'Invalid email or password'
      });
    }
    
    // Проверяем пароль
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    
    if (!validPassword) {
      return reply.code(401).send({
        success: false,
        error: 'Invalid email or password'
      });
    }
    
    // Проверяем, активен ли пользователь
    if (!user.isActive) {
      return reply.code(403).send({
        success: false,
        error: 'Account is deactivated'
      });
    }
    
    // Обновляем время последнего входа
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });
    
    // Создаем токены
    const token = fastify.jwt.sign({
      id: user.id,
      email: user.email,
      roles: user.roles
    });
    
    const refreshToken = fastify.jwt.sign(
      { id: user.id },
      { expiresIn: '7d' }
    );
    
    // Логируем действие
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN',
        entity: 'User',
        entityId: user.id,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent']
      }
    });
    
    return {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: user.roles
        },
        token,
        refreshToken
      }
    };
  } catch (error) {
    fastify.log.error(error);
    reply.code(500).send({
      success: false,
      error: 'Failed to login'
    });
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
    console.log('Auth service is running on port', process.env.PORT || 3001);
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
