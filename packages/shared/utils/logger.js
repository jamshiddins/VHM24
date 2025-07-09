/**
 * VHM24 Logger Utility
 * Централизованное логирование с Pino
 */

const pino = require('pino');

/**
 * Создание logger с настройками
 */
const createLogger = (options = {}) => {
  const isDev = process.env.NODE_ENV === 'development';
  const serviceName = process.env.SERVICE_NAME || 'unknown';
  
  const loggerConfig = {
    name: serviceName,
    level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
    
    // Базовые поля для всех логов
    base: {
      service: serviceName,
      version: process.env.SERVICE_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      pid: process.pid,
      hostname: require('os').hostname()
    },
    
    // Форматирование времени
    timestamp: pino.stdTimeFunctions.isoTime,
    
    // Настройки для development
    ...(isDev && {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'UTC:yyyy-mm-dd HH:MM:ss.l',
          ignore: 'pid,hostname',
          messageFormat: '[{service}] {msg}',
          levelFirst: true
        }
      }
    }),
    
    // Дополнительные опции
    ...options
  };

  return pino(loggerConfig);
};

// Создаем основной logger
const logger = createLogger();

/**
 * Middleware для логирования HTTP запросов
 */
const httpLogger = (options = {}) => {
  return async (request, reply) => {
    const startTime = Date.now();
    
    // Логируем входящий запрос
    logger.info({
      type: 'http_request',
      method: request.method,
      url: request.url,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
      userId: request.user?.id,
      correlationId: request.headers['x-correlation-id'] || generateCorrelationId()
    }, `${request.method} ${request.url}`);

    // Добавляем correlation ID в response headers
    const correlationId = request.headers['x-correlation-id'] || generateCorrelationId();
    reply.header('x-correlation-id', correlationId);

    // Логируем response после завершения
    reply.addHook('onSend', async (request, reply, payload) => {
      const duration = Date.now() - startTime;
      const logLevel = reply.statusCode >= 400 ? 'warn' : 'info';
      
      logger[logLevel]({
        type: 'http_response',
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        duration: `${duration}ms`,
        userId: request.user?.id,
        correlationId,
        responseSize: payload ? Buffer.byteLength(payload) : 0
      }, `${request.method} ${request.url} ${reply.statusCode} ${duration}ms`);
    });
  };
};

/**
 * Генерация correlation ID для трассировки запросов
 */
const generateCorrelationId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Логирование ошибок с контекстом
 */
const logError = (error, context = {}) => {
  const errorInfo = {
    type: 'error',
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      statusCode: error.statusCode
    },
    context,
    timestamp: new Date().toISOString()
  };

  if (error.statusCode && error.statusCode < 500) {
    logger.warn(errorInfo, error.message);
  } else {
    logger.error(errorInfo, error.message);
  }
};

/**
 * Логирование безопасных событий
 */
const logSecurityEvent = (event, details = {}) => {
  logger.warn({
    type: 'security_event',
    event,
    details,
    timestamp: new Date().toISOString()
  }, `Security event: ${event}`);
};

/**
 * Логирование бизнес-событий
 */
const logBusinessEvent = (event, data = {}) => {
  logger.info({
    type: 'business_event',
    event,
    data,
    timestamp: new Date().toISOString()
  }, `Business event: ${event}`);
};

/**
 * Логирование производительности
 */
const logPerformance = (operation, duration, metadata = {}) => {
  const logLevel = duration > 1000 ? 'warn' : 'info'; // Предупреждение если операция > 1 сек
  
  logger[logLevel]({
    type: 'performance',
    operation,
    duration: `${duration}ms`,
    metadata,
    timestamp: new Date().toISOString()
  }, `Performance: ${operation} took ${duration}ms`);
};

/**
 * Создание child logger с дополнительным контекстом
 */
const createChildLogger = (context) => {
  return logger.child(context);
};

/**
 * Структурированное логирование для различных типов событий
 */
const structuredLog = {
  // Аутентификация
  auth: {
    login: (userId, success = true, details = {}) => {
      logger.info({
        type: 'auth_login',
        userId,
        success,
        details,
        timestamp: new Date().toISOString()
      }, `User ${success ? 'logged in' : 'login failed'}: ${userId}`);
    },
    
    logout: (userId) => {
      logger.info({
        type: 'auth_logout',
        userId,
        timestamp: new Date().toISOString()
      }, `User logged out: ${userId}`);
    },
    
    tokenRefresh: (userId) => {
      logger.info({
        type: 'auth_token_refresh',
        userId,
        timestamp: new Date().toISOString()
      }, `Token refreshed for user: ${userId}`);
    }
  },

  // База данных
  database: {
    query: (query, duration, success = true) => {
      const logLevel = duration > 500 ? 'warn' : 'debug';
      logger[logLevel]({
        type: 'database_query',
        query: query.substring(0, 100), // Ограничиваем длину
        duration: `${duration}ms`,
        success,
        timestamp: new Date().toISOString()
      }, `Database query ${success ? 'completed' : 'failed'} in ${duration}ms`);
    },
    
    migration: (migration, success = true) => {
      logger.info({
        type: 'database_migration',
        migration,
        success,
        timestamp: new Date().toISOString()
      }, `Database migration ${success ? 'completed' : 'failed'}: ${migration}`);
    }
  },

  // Внешние сервисы
  external: {
    apiCall: (service, endpoint, duration, statusCode) => {
      const logLevel = statusCode >= 400 ? 'warn' : 'info';
      logger[logLevel]({
        type: 'external_api_call',
        service,
        endpoint,
        duration: `${duration}ms`,
        statusCode,
        timestamp: new Date().toISOString()
      }, `External API call to ${service}${endpoint} returned ${statusCode} in ${duration}ms`);
    }
  },

  // Кеш
  cache: {
    hit: (key) => {
      logger.debug({
        type: 'cache_hit',
        key,
        timestamp: new Date().toISOString()
      }, `Cache hit: ${key}`);
    },
    
    miss: (key) => {
      logger.debug({
        type: 'cache_miss',
        key,
        timestamp: new Date().toISOString()
      }, `Cache miss: ${key}`);
    },
    
    set: (key, ttl) => {
      logger.debug({
        type: 'cache_set',
        key,
        ttl,
        timestamp: new Date().toISOString()
      }, `Cache set: ${key} (TTL: ${ttl}s)`);
    }
  }
};

/**
 * Утилита для измерения времени выполнения
 */
const timeExecution = async (operation, fn, context = {}) => {
  const startTime = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - startTime;
    logPerformance(operation, duration, { ...context, success: true });
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logPerformance(operation, duration, { ...context, success: false, error: error.message });
    throw error;
  }
};

module.exports = {
  // Основной logger
  logger,
  
  // Создание logger
  createLogger,
  createChildLogger,
  
  // Middleware
  httpLogger,
  
  // Специализированное логирование
  logError,
  logSecurityEvent,
  logBusinessEvent,
  logPerformance,
  structuredLog,
  
  // Утилиты
  timeExecution,
  generateCorrelationId
};
