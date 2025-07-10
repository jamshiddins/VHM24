// Простой логгер для замены @vhm24/shared/logger
const logger = {
  info: (message) => console.log(message),
  error: (message) => console.error(message),
  warn: (message) => console.warn(message)
};

// Определяем какой сервис запускается
const SERVICE = process.env.RAILWAY_SERVICE_NAME || 
               process.env.SERVICE_NAME || 
               detectServiceFromPath() ||
               'monolith'; // Изменено с 'gateway' на 'monolith'

logger.info(`🎯 Checking environment variables for service: ${SERVICE}`);

// Базовые требования для всех сервисов
const baseRequired = [
  'DATABASE_URL',
  'JWT_SECRET',
  'NODE_ENV'
];

// Специфичные требования для каждого сервиса
const serviceRequirements = {
  'monolith': ['DATABASE_URL', 'JWT_SECRET', 'REDIS_URL'], 
  'gateway': ['DATABASE_URL', 'JWT_SECRET', 'REDIS_URL'],
  'auth': ['DATABASE_URL', 'JWT_SECRET', 'REDIS_URL'],
  'machines': ['DATABASE_URL', 'JWT_SECRET'],
  'inventory': ['DATABASE_URL', 'JWT_SECRET'],
  'tasks': ['DATABASE_URL', 'JWT_SECRET'],
  'telegram-bot': ['TELEGRAM_BOT_TOKEN', 'JWT_SECRET', 'API_URL', 'ADMIN_IDS'],
  'notifications': ['DATABASE_URL', 'JWT_SECRET', 'TELEGRAM_BOT_TOKEN'],
  'audit': ['DATABASE_URL', 'JWT_SECRET', 'AUDIT_RETENTION_DAYS'],
  'data-import': ['DATABASE_URL', 'JWT_SECRET'],
  'backup': ['DATABASE_URL', 'JWT_SECRET', 'S3_BUCKET', 'S3_ACCESS_KEY', 'S3_SECRET_KEY', 'BACKUP_RETENTION_DAYS'],
  'warehouse': ['DATABASE_URL', 'JWT_SECRET'],
  'recipes': ['DATABASE_URL', 'JWT_SECRET'],
  'bunkers': ['DATABASE_URL', 'JWT_SECRET'],
  'routes': ['DATABASE_URL', 'JWT_SECRET'],
  'reconciliation': ['DATABASE_URL', 'JWT_SECRET'],
  'monitoring': ['DATABASE_URL', 'JWT_SECRET', 'PROMETHEUS_PORT']
};

// Определяем требования для текущего сервиса
const required = serviceRequirements[SERVICE] || baseRequired;

const optional = [
  'REDIS_URL',
  'S3_BUCKET',
  'S3_ACCESS_KEY',
  'S3_SECRET_KEY',
  'SENTRY_DSN',
  'JWT_SECRET',
  'TELEGRAM_BOT_TOKEN'
].filter(key => !required.includes(key)); // Исключаем те, что уже в required

logger.info('🔍 Checking environment variables...');

const missing = required.filter(key => !process.env[key]);
const missingOptional = optional.filter(key => !process.env[key]);

if (missing.length > 0) {
  logger.error(`❌ Missing required environment variables for service ${SERVICE}:`);
  missing.forEach(key => logger.error(`  - ${key}`));
  process.exit(1);
}

if (missingOptional.length > 0) {
  logger.warn('⚠️ Missing optional environment variables:');
  missingOptional.forEach(key => logger.warn(`  - ${key}`));
}

// Проверка JWT секрета только если он требуется или присутствует
if ((required.includes('JWT_SECRET') || process.env.JWT_SECRET) && 
    process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  if (required.includes('JWT_SECRET')) {
    logger.error('❌ JWT_SECRET must be at least 32 characters long');
    process.exit(1);
  } else {
    logger.warn('⚠️ JWT_SECRET is less than 32 characters long. This is not secure for production.');
  }
}

// Проверка NODE_ENV
if (process.env.NODE_ENV && !['development', 'production', 'test'].includes(process.env.NODE_ENV)) {
  logger.warn(`⚠️ NODE_ENV has invalid value: ${process.env.NODE_ENV}. Valid values are: development, production, test`);
}

// Проверка REDIS_URL если он требуется
if (required.includes('REDIS_URL') && !process.env.REDIS_URL) {
  logger.error('❌ REDIS_URL is required for this service');
  process.exit(1);
}

// Проверка TELEGRAM_BOT_TOKEN если он требуется
if (required.includes('TELEGRAM_BOT_TOKEN') && !process.env.TELEGRAM_BOT_TOKEN) {
  logger.error('❌ TELEGRAM_BOT_TOKEN is required for this service');
  process.exit(1);
}

// Проверка ADMIN_IDS если он требуется
if (required.includes('ADMIN_IDS') && !process.env.ADMIN_IDS) {
  logger.error('❌ ADMIN_IDS is required for this service');
  process.exit(1);
}

// Проверка S3 конфигурации только если она требуется или присутствует
if ((required.includes('S3_BUCKET') || process.env.S3_BUCKET) && 
    process.env.S3_BUCKET && (!process.env.S3_ACCESS_KEY || !process.env.S3_SECRET_KEY)) {
  if (required.includes('S3_BUCKET')) {
    logger.error('❌ S3_BUCKET requires S3_ACCESS_KEY and S3_SECRET_KEY');
    process.exit(1);
  } else {
    logger.warn('⚠️ S3_BUCKET requires S3_ACCESS_KEY and S3_SECRET_KEY. File storage may not work correctly.');
  }
}

logger.info(`✅ All required environment variables for service ${SERVICE} are set`);
logger.info(`📊 ${required.length - missing.length}/${required.length} required variables configured`);
logger.info(`📊 ${optional.length - missingOptional.length}/${optional.length} optional variables configured`);

// Функция для определения сервиса из пути
function detectServiceFromPath() {
  try {
    const path = require('path');
    const cwd = process.cwd();
    const services = [
      'gateway', 'auth', 'machines', 'inventory', 'tasks', 'telegram-bot', 
      'notifications', 'audit', 'data-import', 'backup', 'monitoring', 
      'routes', 'warehouse', 'recipes', 'bunkers', 'reconciliation'
    ];
    
    const servicePath = cwd.split(path.sep).find(part => services.includes(part));
    return servicePath;
  } catch (error) {
    return null;
  }
}

// Проверка переменных окружения для production
if (process.env.NODE_ENV === 'production') {
  logger.info('🔍 Performing additional checks for production environment...');
  
  // Проверка JWT_SECRET на сложность
  if (process.env.JWT_SECRET) {
    const hasLowerCase = /[a-z]/.test(process.env.JWT_SECRET);
    const hasUpperCase = /[A-Z]/.test(process.env.JWT_SECRET);
    const hasNumber = /[0-9]/.test(process.env.JWT_SECRET);
    const hasSpecial = /[^a-zA-Z0-9]/.test(process.env.JWT_SECRET);
    
    if (!(hasLowerCase && hasUpperCase && hasNumber && hasSpecial) && process.env.JWT_SECRET.length < 48) {
      logger.warn('⚠️ JWT_SECRET is not complex enough for production. It should contain lowercase, uppercase, numbers, special characters and be at least 48 characters long.');
    }
  }
  
  // Проверка DATABASE_URL на использование SSL
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('sslmode=require')) {
    logger.warn('⚠️ DATABASE_URL does not include SSL mode. For production, consider using sslmode=require for secure database connections.');
  }
  
  // Проверка ALLOWED_ORIGINS
  if (!process.env.ALLOWED_ORIGINS) {
    logger.warn('⚠️ ALLOWED_ORIGINS is not set. CORS will allow all origins, which is not recommended for production.');
  }
  
  logger.info('✅ Production environment checks completed');
}
