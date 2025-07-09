const required = [
  'DATABASE_URL',
  'REDIS_URL',
  'JWT_SECRET',
  'TELEGRAM_BOT_TOKEN'
];

const optional = [
  'S3_BUCKET',
  'S3_ACCESS_KEY',
  'S3_SECRET_KEY',
  'SENTRY_DSN'
];

console.log('🔍 Checking environment variables...');

const missing = required.filter(key => !process.env[key]);
const missingOptional = optional.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error('❌ Missing required environment variables:');
  missing.forEach(key => console.error(`  - ${key}`));
  process.exit(1);
}

if (missingOptional.length > 0) {
  console.warn('⚠️ Missing optional environment variables:');
  missingOptional.forEach(key => console.warn(`  - ${key}`));
}

// Проверка JWT секрета
if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  console.error('❌ JWT_SECRET must be at least 32 characters long');
  process.exit(1);
}

// Проверка S3 конфигурации
if (process.env.S3_BUCKET && (!process.env.S3_ACCESS_KEY || !process.env.S3_SECRET_KEY)) {
  console.error('❌ S3_BUCKET requires S3_ACCESS_KEY and S3_SECRET_KEY');
  process.exit(1);
}

console.log('✅ All required environment variables are set');
console.log(`📊 ${required.length - missing.length}/${required.length} required variables configured`);
console.log(`📊 ${optional.length - missingOptional.length}/${optional.length} optional variables configured`);