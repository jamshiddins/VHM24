const logger = require('@vhm24/shared/logger');

/**
 * VHM24 Security Middleware
 * Критически важные middleware для безопасности всех сервисов
 */

const { PrismaClient } = require('@prisma/client');
const rateLimit = require('@fastify/rate-limit');
const helmet = require('@fastify/helmet');
const cors = require('@fastify/cors');
const jwt = require('@fastify/jwt');
const { 
  sanitizeInput, 
  isAllowedOrigin, 
  getRateLimitKey,
  maskSensitiveData 
} = require('../../shared-types/src/security');

const prisma = new PrismaClient();

/**
 * Безопасный обработчик ошибок
 * Заменяет все reply.code(err.statusCode || 500).send({
          error: err.name || 'Internal Server Error',
          message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
        }) на безопасные responses
 */
const securityErrorHandler = (error, request, reply) => {
  const isDev = process.env.NODE_ENV === 'development';
  
  // Логируем полную ошибку для разработки
  if (isDev) {
    logger.error('Security Error:', {
      error: error.message,
      stack: error.stack,
      url: request.url,
      method: request.method,
      headers: request.headers,
      body: request.body
    });
  } else {
    // В production логируем только основную информацию
    logger.error('Security Error:', {
      error: error.name || 'Internal Server Error',
      url: request.url,
      method: request.method,
      statusCode: error.statusCode || 500,
      timestamp: new Date().toISOString()
    });
  }

  // Определяем тип ошибки и соответствующий response
  let statusCode = error.statusCode || 500;
  let errorName = error.name || 'Internal Server Error';
  let message = 'An error occurred';

  // Специальная обработка для разных типов ошибок
  switch (error.name) {
    case 'ValidationError':
      statusCode = 400;
      message = isDev ? error.message : 'Invalid input data';
      break;
    case 'UnauthorizedError':
    case 'JsonWebTokenError':
    case 'TokenExpiredError':
      statusCode = 401;
      errorName = 'Unauthorized';
      message = 'Authentication required';
      break;
    case 'ForbiddenError':
      statusCode = 403;
      errorName = 'Forbidden';
      message = 'Access denied';
      break;
    case 'NotFoundError':
      statusCode = 404;
      errorName = 'Not Found';
      message = 'Resource not found';
      break;
    case 'ConflictError':
      statusCode = 409;
      errorName = 'Conflict';
      message = 'Resource conflict';
      break;
    case 'TooManyRequestsError':
      statusCode = 429;
      errorName = 'Too Many Requests';
      message = 'Rate limit exceeded';
      break;
    case 'PrismaClientKnownRequestError':
      statusCode = 400;
      errorName = 'Database Error';
      message = isDev ? error.message : 'Database operation failed';
      break;
    default:
      if (isDev) {
        message = error.message;
      }
  }

  // Безопасный response без раскрытия внутренней информации
  reply.code(statusCode).send({
    error: errorName,
    message: message,
    statusCode: statusCode,
    timestamp: new Date().toISOString(),
    path: request.url
  });
};

/**
 * Middleware аутентификации с проверкой активности пользователя
 */
const authenticate = async (request, reply) => {
  try {
    // Проверяем JWT токен
    await request.jwtVerify();
    
    // Проверяем существование и активность пользователя
    const user = await prisma.user.findUnique({
      where: { 
        id: request.user.id,
        isActive: true 
      },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true
      }
    });

    if (!user) {
      throw new Error('User not found or inactive');
    }

    // Обновляем время последней активности
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Добавляем пользователя в request
    request.user = user;
    
  } catch (err) {
    reply.code(401).send({
      error: 'Unauthorized',
      message: 'Authentication required',
      statusCode: 401,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Middleware авторизации по ролям
 */
const authorize = (allowedRoles = []) => {
  return async (request, reply) => {
    if (!request.user) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Authentication required',
        statusCode: 401
      });
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(request.user.role)) {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'Insufficient permissions',
        statusCode: 403
      });
    }
  };
};

/**
 * Middleware санитизации входных данных
 */
const sanitizeInputs = async (request, reply) => {
  // Санитизация query параметров
  if (request.query) {
    for (const [key, value] of Object.entries(request.query)) {
      if (typeof value === 'string') {
        request.query[key] = sanitizeInput(value);
      }
    }
  }

  // Санитизация body данных
  if (request.body && typeof request.body === 'object') {
    const visited = new WeakSet(); // Защита от циклических ссылок
    
    const sanitizeObject = (obj, depth = 0) => {
      // Защита от слишком глубокой вложенности
      if (depth > 10) {
        return;
      }
      
      // Защита от циклических ссылок
      if (visited.has(obj)) {
        return;
      }
      visited.add(obj);
      
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
          obj[key] = sanitizeInput(value);
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          sanitizeObject(value, depth + 1);
        } else if (Array.isArray(value)) {
          // Обрабатываем массивы отдельно
          value.forEach((item, index) => {
            if (typeof item === 'string') {
              value[index] = sanitizeInput(item);
            } else if (typeof item === 'object' && item !== null) {
              sanitizeObject(item, depth + 1);
            }
          });
        }
      }
    };
    
    sanitizeObject(request.body);
  }
};

/**
 * Настройка CORS с безопасными origins
 */
const setupCORS = (fastify, options = {}) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:3001'];

  return fastify.register(cors, {
    origin: (origin, callback) => {
      // Разрешаем запросы без origin (например, мобильные приложения)
      if (!origin) return callback(null, true);
      
      if (isAllowedOrigin(origin, allowedOrigins)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    ...options
  });
};

/**
 * Настройка Helmet для защиты заголовков
 */
const setupHelmet = (fastify, options = {}) => {
  return fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    ...options
  });
};

/**
 * Настройка Rate Limiting
 */
const setupRateLimit = (fastify, options = {}) => {
  return fastify.register(rateLimit, {
    max: options.max || 100, // максимум запросов
    timeWindow: options.timeWindow || '1 minute', // временное окно
    skipOnError: true, // пропускать при ошибках Redis
    keyGenerator: (request) => {
      // Используем IP + User ID для аутентифицированных пользователей
      const ip = request.ip;
      const userId = request.user?.id;
      return userId ? `${ip}:${userId}` : ip;
    },
    errorResponseBuilder: (request, context) => {
      return {
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${Math.round(context.ttl / 1000)} seconds.`,
        statusCode: 429,
        retryAfter: Math.round(context.ttl / 1000)
      };
    },
    ...options
  });
};

/**
 * Настройка JWT
 */
const setupJWT = (fastify, options = {}) => {
  const jwtSecret = process.env.JWT_SECRET;
  
  if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }

  return fastify.register(jwt, {
    secret: jwtSecret,
    sign: {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    },
    verify: {
      maxAge: process.env.JWT_EXPIRES_IN || '7d'
    },
    ...options
  });
};

/**
 * Middleware логирования безопасных событий
 */
const securityLogger = async (request, reply) => {
  const startTime = Date.now();
  
  // Логируем запрос (без чувствительных данных)
  const logData = {
    method: request.method,
    url: request.url,
    ip: request.ip,
    userAgent: request.headers['user-agent'],
    userId: request.user?.id,
    timestamp: new Date().toISOString()
  };

  // Маскируем чувствительные данные в query и body
  if (request.query) {
    logData.query = { ...request.query };
    if (logData.query.password) logData.query.password = '***';
    if (logData.query.token) logData.query.token = '***';
  }

  logger.info('Security Request:', logData);

  // В Fastify 5.x используем reply.hijack() для логирования response
  const originalSend = reply.send;
  reply.send = function(payload) {
    const duration = Date.now() - startTime;
    logger.info('Security Response:', {
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      duration: `${duration}ms`,
      userId: request.user?.id,
      timestamp: new Date().toISOString()
    });
    return originalSend.call(this, payload);
  };
};

/**
 * Проверка здоровья сервиса
 */
const healthCheck = async (request, reply) => {
  try {
    // Проверяем подключение к базе данных
    await prisma.$queryRaw`SELECT 1`;
    
    reply.send({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: process.env.SERVICE_NAME || 'unknown',
      version: process.env.SERVICE_VERSION || '1.0.0',
      uptime: process.uptime()
    });
  } catch (error) {
    reply.code(503).send({
      status: 'unhealthy',
      error: 'Database connection failed',
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  securityErrorHandler,
  authenticate,
  authorize,
  sanitizeInputs,
  setupCORS,
  setupHelmet,
  setupRateLimit,
  setupJWT,
  securityLogger,
  healthCheck
};
