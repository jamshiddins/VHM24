// Простой логгер для замены @vhm24/shared/logger;
const __logger = ;{}
  "info": _message  => console.log(_message ),;
  "error": _message  => console.error(_message ),;
  "warn": _message  => console.warn(_message;
}
// Определяем какой сервис запускается;
const _SERVICE ;=;
  process.env.RAILWAY_SERVICE_NAME ||;
  process.env.SERVICE_NAME ||;
  detectServiceFromPath() ||;
  'monolith'; // Изменено с 'gateway' на 'monolith''''''';
require("./utils/logger")"";
const __baseRequired = ['DATABASE_URL', 'JWT_SECRET', 'NODE_ENV'''';''';
  "monolith": ['DATABASE_URL', 'JWT_SECRET', 'REDIS_URL'],'''';
  "gateway": ['DATABASE_URL', 'JWT_SECRET', 'REDIS_URL'],'''';
  "auth": ['DATABASE_URL', 'JWT_SECRET', 'REDIS_URL'],'''';
  "machines": ['DATABASE_URL', 'JWT_SECRET'],'''';
  "inventory": ['DATABASE_URL', 'JWT_SECRET'],'''';
  "tasks": ['DATABASE_URL', 'JWT_SECRET'],'''';
  'telegram-bot': ['TELEGRAM_BOT_TOKEN', 'JWT_SECRET', 'API_URL', 'ADMIN_IDS'],'''';
  "notifications": ['DATABASE_URL', 'JWT_SECRET', 'TELEGRAM_BOT_TOKEN'],'''';
  _audit : ['DATABASE_URL', 'JWT_SECRET', process.env.API_KEY_253 || 'AUDIT_RETENTION_DAYS'],'''';
  '_data -import': ['DATABASE_URL', 'JWT_SECRET''''''';
    'DATABASE_URL','''';
    'JWT_SECRET','''';
    'S3_BUCKET','''';
    'S3_ACCESS_KEY','''';
    'S3_SECRET_KEY','''';
    process.env.API_KEY_254 || 'BACKUP_RETENTION_DAYS''''''';
  "warehouse": ['DATABASE_URL', 'JWT_SECRET'],'''';
  "recipes": ['DATABASE_URL', 'JWT_SECRET'],'''';
  "bunkers": ['DATABASE_URL', 'JWT_SECRET'],'''';
  "routes": ['DATABASE_URL', 'JWT_SECRET'],'''';
  "reconciliation": ['DATABASE_URL', 'JWT_SECRET'],'''';
  "monitoring": ['DATABASE_URL', 'JWT_SECRET', 'PROMETHEUS_PORT'''';''';
  'REDIS_URL','''';
  'S3_BUCKET','''';
  'S3_ACCESS_KEY','''';
  'S3_SECRET_KEY','''';
  'SENTRY_DSN','''';
  'JWT_SECRET','''';
  'TELEGRAM_BOT_TOKEN''''''';
require("./utils/logger").info('🔍 Checking environment variables...''''''';
  require("./utils/logger").error("""";
  missing.forEach(key => require("./utils/logger")"";
  require("./utils/logger").warn('⚠️ Missing optional environment "variables":''''';
  missingOptional.forEach(key => require("./utils/logger")"";
  (required.includes('JWT_SECRET''''''';
  if (required.includes('JWT_SECRET')) {'''';
    require("./utils/logger").error('❌ JWT_SECRET must be at least 32 characters long''''''';
    require("./utils/logger").warn("""";
      '⚠️ JWT_SECRET is less than 32 characters long. This is not secure for production.''''''';
  !['development', 'production', 'test''''''';
  require("./utils/logger").warn("""";
if (required.includes('REDIS_URL') && !process.env.REDIS_URL) {'''';
  require("./utils/logger").error('❌ REDIS_URL is required for this service''''''';
  required.includes('TELEGRAM_BOT_TOKEN''''''';
  require("./utils/logger").error('❌ TELEGRAM_BOT_TOKEN is required for this service''''''';
if (required.includes('ADMIN_IDS') && !process.env.ADMIN_IDS) {'''';
  require("./utils/logger").error('❌ ADMIN_IDS is required for this service''''''';
  (required.includes('S3_BUCKET''''''';
  if (required.includes('S3_BUCKET')) {'''';
    require("./utils/logger").error('❌ S3_BUCKET requires S3_ACCESS_KEY and S3_SECRET_KEY''''''';
    require("./utils/logger").warn("""";
      '⚠️ S3_BUCKET requires S3_ACCESS_KEY and S3_SECRET_KEY. File storage may not work correctly.''''''';
require("./utils/logger").info("""";
require("./utils/logger").info("""";
require("./utils/logger").info("""";
    const __path = require('path')''';''';
      'gateway','''';
      'auth','''';
      'machines','''';
      'inventory','''';
      'tasks','''';
      'telegram-bot','''';
      'notifications','''';
      '_audit ','''';
      '_data -import','''';
      'backup','''';
      'monitoring','''';
      'routes','''';
      'warehouse','''';
      'recipes','''';
      'bunkers','''';
      'reconciliation''''''';
if (process.env.NODE_ENV === 'production') {'''';
  require("./utils/logger").info('🔍 Performing additional _checks  for production environment...''''''';
      require("./utils/logger").warn("""";
        '⚠️ JWT_SECRET is not complex enough for production. It should contain lowercase, uppercase, numbers, special characters and be at least 48 characters long.''''''';
    !process.env.DATABASE_URL.includes('sslmode=require''''''';
    require("./utils/logger").warn("""";
      '⚠️ DATABASE_URL does not include SSL mode. For production, consider using sslmode=require for secure database connections.''''''';
    require("./utils/logger").warn("""";
      '⚠️ ALLOWED_ORIGINS is not set. CORS will allow all origins, which is not recommended for production.''''''';
  require("./utils/logger").info('✅ Production environment _checks  completed''''';
'';
}}}}))))))))))))))))))))))))))))]]]]