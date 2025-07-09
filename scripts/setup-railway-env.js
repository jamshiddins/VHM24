const { execSync } = require('child_process');

console.log('🚂 Настройка переменных окружения для Railway...\n');

// Переменные из вашего .env файла
const envVars = {
  // Безопасность
  JWT_SECRET: 'your-super-secret-jwt-key-change-this-in-production-12345678',
  ALLOWED_ORIGINS: 'https://your-app.railway.app,https://your-dashboard.railway.app',
  
  // База данных (уже есть в Railway)
  DATABASE_URL: 'postgresql://postgres:tcaqejEXLSdaUdMQXFqEDGBQvavWVbGy@metro.proxy.rlwy.net:36258/railway',
  AUTH_DATABASE_URL: 'postgresql://postgres:tcaqejEXLSdaUdMQXFqEDGBQvavWVbGy@metro.proxy.rlwy.net:36258/railway',
  
  // Redis (уже есть в Railway)
  REDIS_URL: 'redis://default:RgADgivPNrtbjDUQYGWfzkJnmwCEnPil@maglev.proxy.rlwy.net:56313',
  REDIS_TTL: '3600',
  
  // Telegram Bot
  TELEGRAM_BOT_TOKEN: '8015112367:AAHi25gHhI3p1X1uyuCAt8vUnlMZRrcoKEQ',
  ADMIN_IDS: '42283329',
  
  // Порты (Railway автоматически назначает PORT)
  GATEWAY_PORT: '8000',
  AUTH_PORT: '3001',
  MACHINES_PORT: '3002',
  INVENTORY_PORT: '3003',
  TASKS_PORT: '3004',
  BUNKERS_PORT: '3005',
  
  // API Configuration
  API_URL: 'https://your-app.railway.app/api/v1',
  
  // File Storage - НУЖНО ЗАМЕНИТЬ НА DIGITALOCEAN SPACES
  MAX_FILE_SIZE: '10485760',
  
  // Rate Limiting
  RATE_LIMIT_MAX: '100',
  RATE_LIMIT_WINDOW: '60000',
  
  // Session
  SESSION_EXPIRY: '86400000',
  
  // Environment
  NODE_ENV: 'production',
  
  // Monitoring
  PROMETHEUS_PORT: '9090',
  
  // Email
  SMTP_HOST: 'smtp.gmail.com',
  SMTP_PORT: '587',
  EMAIL_FROM: 'noreply@vhm24.ru',
  
  // Backup
  BACKUP_ENABLED: 'true',
  BACKUP_SCHEDULE: '0 2 * * *',
  BACKUP_RETENTION_DAYS: '30'
};

// DigitalOcean Spaces переменные (нужно будет добавить после создания)
const digitalOceanVars = {
  // DigitalOcean Spaces для файлов
  S3_ENDPOINT: 'https://fra1.digitaloceanspaces.com', // или другой регион
  S3_BUCKET: 'vhm24-uploads',
  S3_ACCESS_KEY: 'YOUR_DO_SPACES_ACCESS_KEY',
  S3_SECRET_KEY: 'YOUR_DO_SPACES_SECRET_KEY',
  S3_REGION: 'fra1', // или другой регион
  
  // Для бэкапов
  BACKUP_S3_BUCKET: 'vhm24-backups',
  BACKUP_S3_ACCESS_KEY: 'YOUR_DO_SPACES_ACCESS_KEY',
  BACKUP_S3_SECRET_KEY: 'YOUR_DO_SPACES_SECRET_KEY',
  BACKUP_S3_ENDPOINT: 'https://fra1.digitaloceanspaces.com'
};

function setRailwayVariable(key, value) {
  try {
    console.log(`Setting ${key}...`);
    execSync(`railway variables set ${key}="${value}"`, { stdio: 'pipe' });
    console.log(`✅ ${key} set successfully`);
  } catch (error) {
    console.error(`❌ Failed to set ${key}: ${error.message}`);
  }
}

console.log('🔧 Устанавливаем основные переменные...\n');

// Устанавливаем основные переменные
Object.entries(envVars).forEach(([key, value]) => {
  setRailwayVariable(key, value);
});

console.log('\n⚠️ ВАЖНО: Нужно настроить DigitalOcean Spaces переменные:');
console.log('После создания DigitalOcean Spaces выполните:');
console.log('');

Object.entries(digitalOceanVars).forEach(([key, value]) => {
  console.log(`railway variables set ${key}="${value}"`);
});

console.log('\n✅ Основные переменные установлены!');
console.log('\n📋 Следующие шаги:');
console.log('1. Создайте DigitalOcean Spaces (инструкции ниже)');
console.log('2. Установите DigitalOcean переменные');
console.log('3. Запустите деплой: railway up');
