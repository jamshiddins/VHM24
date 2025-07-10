/**
 * VHM24 Configuration Utility
 * Централизованная конфигурация с валидацией
 */

const joi = require('joi');

/**
 * Схема валидации environment переменных
 */
const envSchema = joi.object({
  // Основные настройки
  NODE_ENV: joi.string().valid('development', 'test', 'production').default('development'),
  PORT: joi.number().port().default(3000),
  HOST: joi.string().default('0.0.0.0'),
  
  // Сервис
  SERVICE_NAME: joi.string().required(),
  SERVICE_VERSION: joi.string().default('1.0.0'),
  
  // База данных
  DATABASE_URL: joi.string().uri().required(),
  DATABASE_POOL_SIZE: joi.number().min(1).max(50).default(10),
  
  // Redis
  REDIS_URL: joi.string().uri().required(),
  REDIS_POOL_SIZE: joi.number().min(1).max(20).default(5),
  
  // JWT
  JWT_SECRET: joi.string().min(32).required(),
  JWT_EXPIRES_IN: joi.string().default('7d'),
  JWT_REFRESH_EXPIRES_IN: joi.string().default('30d'),
  
  // CORS
  ALLOWED_ORIGINS: joi.string().default('http://localhost:3000,http://localhost:3001'),
  
  // Логирование
  LOG_LEVEL: joi.string().valid('debug', 'info', 'warn', 'error').default('info'),
  
  // Rate Limiting
  RATE_LIMIT_MAX: joi.number().min(1).default(100),
  RATE_LIMIT_WINDOW: joi.string().default('1 minute'),
  
  // Файлы
  UPLOAD_MAX_SIZE: joi.number().default(5242880), // 5MB
  UPLOAD_ALLOWED_TYPES: joi.string().default('image/jpeg,image/png,image/gif,application/pdf'),
  
  // Внешние сервисы
  TELEGRAM_BOT_TOKEN: joi.string().when('SERVICE_NAME', {
    is: 'telegram-bot',
    then: joi.required(),
    otherwise: joi.optional()
  }),
  
  // Мониторинг
  SENTRY_DSN: joi.string().uri().allow('').optional(),
  PROMETHEUS_ENABLED: joi.boolean().default(false),
  PROMETHEUS_PORT: joi.number().port().default(9090),
  
  // Email (если нужно)
  SMTP_HOST: joi.string().allow('').optional(),
  SMTP_PORT: joi.number().port().optional(),
  SMTP_USER: joi.string().allow('').optional(),
  SMTP_PASS: joi.string().allow('').optional(),
  
  // Webhook URLs
  WEBHOOK_SECRET: joi.string().optional(),
  
  // Backup
  BACKUP_ENABLED: joi.boolean().default(false),
  BACKUP_SCHEDULE: joi.string().default('0 2 * * *'), // Каждый день в 2:00
  BACKUP_RETENTION_DAYS: joi.number().min(1).default(7),
  
  // Health checks
  HEALTH_CHECK_TIMEOUT: joi.number().default(5000),
  
  // Graceful shutdown
  SHUTDOWN_TIMEOUT: joi.number().default(10000)
}).unknown(); // Разрешаем дополнительные переменные

/**
 * Валидация и парсинг environment переменных
 */
const validateEnv = () => {
  const { error, value: envVars } = envSchema.validate(process.env);

  if (error) {
    throw new Error(`Config validation error: ${error.message}`);
  }

  return envVars;
};

// Валидируем переменные при загрузке модуля
const env = validateEnv();

/**
 * Основная конфигурация приложения
 */
const config = {
  // Основные настройки
  env: env.NODE_ENV,
  isDev: env.NODE_ENV === 'development',
  isTest: env.NODE_ENV === 'test',
  isProd: env.NODE_ENV === 'production',
  
  // Сервер
  server: {
    host: env.HOST,
    port: env.PORT,
    name: env.SERVICE_NAME,
    version: env.SERVICE_VERSION
  },
  
  // База данных
  database: {
    url: env.DATABASE_URL,
    poolSize: env.DATABASE_POOL_SIZE,
    ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  },
  
  // Redis
  redis: {
    url: env.REDIS_URL,
    poolSize: env.REDIS_POOL_SIZE,
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: 3,
    lazyConnect: true
  },
  
  // JWT
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
    algorithm: 'HS256'
  },
  
  // CORS
  cors: {
    origins: env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Correlation-ID']
  },
  
  // Логирование
  logging: {
    level: env.LOG_LEVEL,
    pretty: env.NODE_ENV === 'development'
  },
  
  // Rate Limiting
  rateLimit: {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW,
    skipOnError: true
  },
  
  // Файлы
  upload: {
    maxSize: env.UPLOAD_MAX_SIZE,
    allowedTypes: env.UPLOAD_ALLOWED_TYPES.split(',').map(type => type.trim()),
    destination: './uploads'
  },
  
  // Внешние сервисы
  external: {
    telegram: {
      botToken: env.TELEGRAM_BOT_TOKEN
    }
  },
  
  // Мониторинг
  monitoring: {
    sentry: {
      dsn: env.SENTRY_DSN,
      enabled: !!env.SENTRY_DSN
    },
    prometheus: {
      enabled: env.PROMETHEUS_ENABLED,
      port: env.PROMETHEUS_PORT
    }
  },
  
  // Email
  email: {
    smtp: {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      auth: env.SMTP_USER && env.SMTP_PASS ? {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS
      } : null
    }
  },
  
  // Webhook
  webhook: {
    secret: env.WEBHOOK_SECRET
  },
  
  // Backup
  backup: {
    enabled: env.BACKUP_ENABLED,
    schedule: env.BACKUP_SCHEDULE,
    retentionDays: env.BACKUP_RETENTION_DAYS
  },
  
  // Health checks
  health: {
    timeout: env.HEALTH_CHECK_TIMEOUT
  },
  
  // Graceful shutdown
  shutdown: {
    timeout: env.SHUTDOWN_TIMEOUT
  }
};

/**
 * Получение конфигурации по пути
 */
const get = (path, defaultValue = undefined) => {
  const keys = path.split('.');
  let current = config;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return defaultValue;
    }
  }
  
  return current;
};

/**
 * Проверка обязательных конфигураций для сервиса
 */
const validateServiceConfig = (serviceName) => {
  const requiredConfigs = {
    'auth': ['jwt.secret', 'database.url'],
    'gateway': ['jwt.secret', 'cors.origins'],
    'machines': ['database.url'],
    'inventory': ['database.url'],
    'tasks': ['database.url'],
    'telegram-bot': ['external.telegram.botToken', 'database.url'],
    'notifications': ['database.url'],
    'monitoring': ['database.url'],
    'backup': ['database.url']
  };
  
  const required = requiredConfigs[serviceName] || [];
  const missing = [];
  
  for (const configPath of required) {
    if (get(configPath) === undefined) {
      missing.push(configPath);
    }
  }
  
  if (missing.length > 0) {
    throw new Error(`Missing required configuration for ${serviceName}: ${missing.join(', ')}`);
  }
  
  return true;
};

/**
 * Создание конфигурации для Fastify
 */
const createFastifyConfig = () => {
  return {
    logger: config.logging.pretty ? {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'UTC:yyyy-mm-dd HH:MM:ss.l'
        }
      }
    } : true,
    
    trustProxy: config.isProd,
    
    // Настройки для production
    ...(config.isProd && {
      keepAliveTimeout: 30000,
      requestTimeout: 30000,
      bodyLimit: config.upload.maxSize
    })
  };
};

/**
 * Создание конфигурации для Prisma
 */
const createPrismaConfig = () => {
  return {
    datasources: {
      db: {
        url: config.database.url
      }
    },
    log: config.isDev ? ['query', 'info', 'warn', 'error'] : ['warn', 'error']
  };
};

/**
 * Создание конфигурации для Redis
 */
const createRedisConfig = () => {
  return {
    ...config.redis,
    // Дополнительные настройки для production
    ...(config.isProd && {
      connectTimeout: 10000,
      commandTimeout: 5000,
      enableOfflineQueue: false
    })
  };
};

/**
 * Вывод конфигурации в консоль (без секретов)
 */
const printConfig = () => {
  const safeToPrint = { ...config };
  
  // Маскируем секретные данные
  if (safeToPrint.jwt) safeToPrint.jwt.secret = '***';
  if (safeToPrint.database) safeToPrint.database.url = safeToPrint.database.url.replace(/:\/\/.*@/, '://***@');
  if (safeToPrint.redis) safeToPrint.redis.url = safeToPrint.redis.url.replace(/:\/\/.*@/, '://***@');
  if (safeToPrint.external?.telegram) safeToPrint.external.telegram.botToken = '***';
  if (safeToPrint.email?.smtp?.auth) {
    safeToPrint.email.smtp.auth.user = '***';
    safeToPrint.email.smtp.auth.pass = '***';
  }
  
  logger.info('Configuration loaded:', JSON.stringify(safeToPrint, null, 2));
};

/**
 * Проверка готовности конфигурации
 */
const isReady = () => {
  try {
    validateServiceConfig(config.server.name);
    return true;
  } catch (error) {
    logger.error('Configuration not ready:', error.message);
    return false;
  }
};

/**
 * Получение переменных окружения для конкретного сервиса
 */
const getServiceEnv = (serviceName) => {
  const serviceEnvs = {
    'auth': {
      SERVICE_NAME: 'auth',
      PORT: 3001
    },
    'gateway': {
      SERVICE_NAME: 'gateway',
      PORT: 8000
    },
    'machines': {
      SERVICE_NAME: 'machines',
      PORT: 3002
    },
    'inventory': {
      SERVICE_NAME: 'inventory',
      PORT: 3003
    },
    'tasks': {
      SERVICE_NAME: 'tasks',
      PORT: 3004
    },
    'telegram-bot': {
      SERVICE_NAME: 'telegram-bot',
      PORT: 3005
    },
    'notifications': {
      SERVICE_NAME: 'notifications',
      PORT: 3006
    },
    'monitoring': {
      SERVICE_NAME: 'monitoring',
      PORT: 3007
    },
    'backup': {
      SERVICE_NAME: 'backup',
      PORT: 3008
    }
  };
  
  return serviceEnvs[serviceName] || {};
};

module.exports = {
  // Основная конфигурация
  config,
  
  // Функции доступа
  get,
  
  // Валидация
  validateServiceConfig,
  isReady,
  
  // Создание конфигураций для библиотек
  createFastifyConfig,
  createPrismaConfig,
  createRedisConfig,
  
  // Утилиты
  printConfig,
  getServiceEnv,
  
  // Прямой доступ к env
  env
};
