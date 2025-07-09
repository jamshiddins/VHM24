/**
 * VHM24 Error Handler Middleware
 * Централизованная обработка ошибок для всех сервисов
 */

const { securityErrorHandler } = require('./security');

/**
 * Кастомные классы ошибок
 */
class AppError extends Error {
  constructor(message, statusCode = 500, name = 'AppError') {
    super(message);
    this.name = name;
    this.statusCode = statusCode;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = []) {
    super(message, 400, 'ValidationError');
    this.details = details;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UnauthorizedError');
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'ForbiddenError');
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NotFoundError');
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'ConflictError');
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429, 'TooManyRequestsError');
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Database operation failed') {
    super(message, 500, 'DatabaseError');
  }
}

class ExternalServiceError extends AppError {
  constructor(message = 'External service unavailable') {
    super(message, 503, 'ExternalServiceError');
  }
}

/**
 * Обработчик Prisma ошибок
 */
const handlePrismaError = (error) => {
  const isDev = process.env.NODE_ENV === 'development';
  
  switch (error.code) {
    case 'P2002':
      // Unique constraint violation
      const field = error.meta?.target?.[0] || 'field';
      return new ConflictError(`${field} already exists`);
      
    case 'P2025':
      // Record not found
      return new NotFoundError('Record not found');
      
    case 'P2003':
      // Foreign key constraint violation
      return new ValidationError('Invalid reference to related record');
      
    case 'P2014':
      // Required relation violation
      return new ValidationError('Required relation is missing');
      
    case 'P2021':
      // Table does not exist
      return new DatabaseError(isDev ? error.message : 'Database schema error');
      
    case 'P2022':
      // Column does not exist
      return new DatabaseError(isDev ? error.message : 'Database schema error');
      
    default:
      return new DatabaseError(isDev ? error.message : 'Database operation failed');
  }
};

/**
 * Обработчик JWT ошибок
 */
const handleJWTError = (error) => {
  switch (error.name) {
    case 'JsonWebTokenError':
      return new AuthenticationError('Invalid token');
      
    case 'TokenExpiredError':
      return new AuthenticationError('Token expired');
      
    case 'NotBeforeError':
      return new AuthenticationError('Token not active');
      
    default:
      return new AuthenticationError('Authentication failed');
  }
};

/**
 * Обработчик Fastify ошибок
 */
const handleFastifyError = (error) => {
  const isDev = process.env.NODE_ENV === 'development';
  
  switch (error.code) {
    case 'FST_ERR_VALIDATION':
      return new ValidationError('Request validation failed', error.validation);
      
    case 'FST_ERR_NOT_FOUND':
      return new NotFoundError('Route not found');
      
    case 'FST_ERR_BAD_STATUS_CODE':
      return new AppError(isDev ? error.message : 'Invalid response', 500);
      
    case 'FST_ERR_ASYNC_CONSTRAINT':
      return new AppError(isDev ? error.message : 'Server constraint violation', 500);
      
    default:
      return new AppError(isDev ? error.message : 'Server error', error.statusCode || 500);
  }
};

/**
 * Главный обработчик ошибок
 */
const errorHandler = (error, request, reply) => {
  let processedError = error;

  // Обрабатываем различные типы ошибок
  if (error.name === 'PrismaClientKnownRequestError') {
    processedError = handlePrismaError(error);
  } else if (error.name?.includes('JsonWebToken') || error.name?.includes('Token')) {
    processedError = handleJWTError(error);
  } else if (error.code?.startsWith('FST_')) {
    processedError = handleFastifyError(error);
  } else if (!error.isOperational) {
    // Неожиданная ошибка - логируем полностью и возвращаем общую ошибку
    console.error('Unexpected Error:', {
      error: error.message,
      stack: error.stack,
      url: request.url,
      method: request.method,
      timestamp: new Date().toISOString()
    });
    
    processedError = new AppError(
      process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      500
    );
  }

  // Используем безопасный обработчик ошибок
  securityErrorHandler(processedError, request, reply);
};

/**
 * Async wrapper для обработки ошибок в async функциях
 */
const asyncHandler = (fn) => {
  return (request, reply) => {
    Promise.resolve(fn(request, reply)).catch((error) => {
      errorHandler(error, request, reply);
    });
  };
};

/**
 * Middleware для обработки 404 ошибок
 */
const notFoundHandler = (request, reply) => {
  reply.code(404).send({
    error: 'Not Found',
    message: `Route ${request.method} ${request.url} not found`,
    statusCode: 404,
    timestamp: new Date().toISOString()
  });
};

/**
 * Обработчик необработанных Promise rejections
 */
const handleUnhandledRejection = (reason, promise) => {
  console.error('Unhandled Promise Rejection:', {
    reason: reason.message || reason,
    stack: reason.stack,
    promise: promise,
    timestamp: new Date().toISOString()
  });
  
  // В production можно добавить отправку в систему мониторинга
  if (process.env.NODE_ENV === 'production') {
    // Отправляем в систему мониторинга (например, Sentry)
    // sentry.captureException(reason);
  }
};

/**
 * Обработчик необработанных исключений
 */
const handleUncaughtException = (error) => {
  console.error('Uncaught Exception:', {
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
  
  // В production можно добавить отправку в систему мониторинга
  if (process.env.NODE_ENV === 'production') {
    // Отправляем в систему мониторинга
    // sentry.captureException(error);
    
    // Graceful shutdown
    process.exit(1);
  }
};

/**
 * Настройка глобальных обработчиков ошибок
 */
const setupGlobalErrorHandlers = () => {
  process.on('unhandledRejection', handleUnhandledRejection);
  process.on('uncaughtException', handleUncaughtException);
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
  });
  
  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
  });
};

/**
 * Регистрация обработчиков ошибок в Fastify
 */
const registerErrorHandlers = (fastify) => {
  // Основной обработчик ошибок
  fastify.setErrorHandler(errorHandler);
  
  // Обработчик 404
  fastify.setNotFoundHandler(notFoundHandler);
  
  // Хук для логирования ошибок
  fastify.addHook('onError', async (request, reply, error) => {
    const logLevel = error.statusCode >= 500 ? 'error' : 'warn';
    
    console[logLevel]('Request Error:', {
      error: error.message,
      statusCode: error.statusCode,
      method: request.method,
      url: request.url,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      userId: request.user?.id,
      timestamp: new Date().toISOString()
    });
  });
};

/**
 * Утилиты для создания ошибок
 */
const createError = {
  validation: (message, details) => new ValidationError(message, details),
  authentication: (message) => new AuthenticationError(message),
  authorization: (message) => new AuthorizationError(message),
  notFound: (message) => new NotFoundError(message),
  conflict: (message) => new ConflictError(message),
  rateLimit: (message) => new RateLimitError(message),
  database: (message) => new DatabaseError(message),
  externalService: (message) => new ExternalServiceError(message),
  app: (message, statusCode, name) => new AppError(message, statusCode, name)
};

/**
 * Проверка является ли ошибка операционной
 */
const isOperationalError = (error) => {
  return error instanceof AppError && error.isOperational;
};

module.exports = {
  // Классы ошибок
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError,
  
  // Обработчики
  errorHandler,
  asyncHandler,
  notFoundHandler,
  registerErrorHandlers,
  setupGlobalErrorHandlers,
  
  // Утилиты
  createError,
  isOperationalError,
  handlePrismaError,
  handleJWTError,
  handleFastifyError
};
