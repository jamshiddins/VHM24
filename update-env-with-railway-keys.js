#!/usr/bin/env node

/**
 * ОБНОВЛЕНИЕ .ENV С RAILWAY КЛЮЧАМИ
 * Извлекает все ключи из Railway и обновляет локальный .env файл
 */

const fs = require('fs');
const path = require('path');

// Данные из Railway variables (из вывода команды)
const railwayData = {
    DATABASE_URL: 'postgresql://postgres:LxeIDWcsIbMSPcVZiKXmIKqFnDQGaXHR@postgres.railway.internal:5432/railway',
    JWT_SECRET: '933f4234d58f69c74957860bf5a7a838e7c6f51f36876e5d415842bd796d6b5e',
    PUBLIC_URL: 'web-production-73916.up.railway.app',
    RAILWAY_PUBLIC_DOMAIN: 'web-production-73916.up.railway.app',
    TELEGRAM_BOT_TOKEN: '8015112367:AAHi25gHhI3p1X1uyuCAt8vUnlMZRrcoKEQ',
    REDIS_URL: 'redis://default:UBhuXXUjFDisRLBNOsoVNIaGHboCRPll@redis.railway.internal:6379',
    S3_ACCESS_KEY: 'DO00XEB6BC6XZ8Q2M4KQ',
    S3_BUCKET: 'vhm24-uploads',
    S3_BACKUP_BUCKET: 'vhm24-backups',
    S3_ENDPOINT: 'https://fra1.digitaloceanspaces.com',
    NODE_ENV: 'production',
    PORT: '8000'
};

console.log('🔄 ОБНОВЛЕНИЕ .ENV С RAILWAY КЛЮЧАМИ');

// Читаем текущий .env
let envContent = '';
if (fs.existsSync('.env')) {
    envContent = fs.readFileSync('.env', 'utf8');
    console.log('📖 Текущий .env файл прочитан');
} else {
    console.log('📝 Создание нового .env файла');
}

// Создаем новый .env контент
const newEnvContent = `# VHM24 Production Environment Variables
# Обновлено с Railway ключами: ${new Date().toISOString()}

# Database (Railway PostgreSQL)
DATABASE_URL="${railwayData.DATABASE_URL}"

# Authentication & Security
JWT_SECRET="${railwayData.JWT_SECRET}"
SESSION_SECRET="${railwayData.JWT_SECRET.substring(0, 32)}"
API_KEY="${railwayData.JWT_SECRET.substring(32, 64)}"
ENCRYPTION_KEY="${railwayData.JWT_SECRET.substring(16, 48)}"

# API Configuration
API_URL="https://${railwayData.PUBLIC_URL}"
PUBLIC_URL="${railwayData.PUBLIC_URL}"
PORT=${railwayData.PORT}
NODE_ENV="${railwayData.NODE_ENV}"

# Telegram Bot
TELEGRAM_BOT_TOKEN="${railwayData.TELEGRAM_BOT_TOKEN}"

# Redis (Railway)
REDIS_URL="${railwayData.REDIS_URL}"

# File Storage (DigitalOcean Spaces)
S3_ACCESS_KEY="${railwayData.S3_ACCESS_KEY}"
S3_SECRET_KEY="YOUR_S3_SECRET_KEY_HERE"
S3_BUCKET="${railwayData.S3_BUCKET}"
S3_BACKUP_BUCKET="${railwayData.S3_BACKUP_BUCKET}"
S3_ENDPOINT="${railwayData.S3_ENDPOINT}"
S3_REGION="fra1"

# File Upload
UPLOAD_DIR="uploads"
MAX_FILE_SIZE=10485760

# CORS
CORS_ORIGIN="https://${railwayData.PUBLIC_URL},http://localhost:3001"

# Logging
LOG_LEVEL="info"
LOG_FILE="logs/app.log"

# Payment Systems (настройте при необходимости)
MULTIKASSA_API_URL="https://api.multikassa.uz"
PAYME_API_URL="https://checkout.paycom.uz"
CLICK_API_URL="https://api.click.uz"
UZUM_API_URL="https://api.uzum.uz"

# Monitoring
HEALTH_CHECK_INTERVAL=30000
METRICS_ENABLED=true

# Railway Integration
RAILWAY_ENVIRONMENT="production"
RAILWAY_PUBLIC_DOMAIN="${railwayData.RAILWAY_PUBLIC_DOMAIN}"
`;

// Сохраняем обновленный .env
fs.writeFileSync('.env', newEnvContent);
console.log('✅ .env файл обновлен с Railway ключами');

// Создаем .env.example
const exampleContent = newEnvContent
    .replace(/="[^"]*"/g, '="your_value_here"')
    .replace(/DATABASE_URL="your_value_here"/, 'DATABASE_URL="postgresql://user:password@host:5432/database"')
    .replace(/JWT_SECRET="your_value_here"/, 'JWT_SECRET="your_jwt_secret_64_chars"')
    .replace(/API_URL="your_value_here"/, 'API_URL="https://your-app.railway.app"')
    .replace(/TELEGRAM_BOT_TOKEN="your_value_here"/, 'TELEGRAM_BOT_TOKEN="your_telegram_bot_token"');

fs.writeFileSync('.env.example', exampleContent);
console.log('✅ .env.example обновлен');

console.log('\n🎉 ОБНОВЛЕНИЕ ЗАВЕРШЕНО!');
console.log('\n📋 ОБНОВЛЕННЫЕ КЛЮЧИ:');
console.log(`🗄️ DATABASE_URL: ${railwayData.DATABASE_URL.substring(0, 50)}...`);
console.log(`🔑 JWT_SECRET: ${railwayData.JWT_SECRET.substring(0, 20)}...`);
console.log(`🌐 PUBLIC_URL: https://${railwayData.PUBLIC_URL}`);
console.log(`🤖 TELEGRAM_BOT_TOKEN: ${railwayData.TELEGRAM_BOT_TOKEN.substring(0, 20)}...`);
console.log(`📦 REDIS_URL: ${railwayData.REDIS_URL.substring(0, 30)}...`);

console.log('\n🚀 СЛЕДУЮЩИЕ ШАГИ:');
console.log('1. Протестируйте подключение: node test-railway-connection.js');
console.log('2. Запустите приложение: node start-production.js');
console.log('3. Деплой на Railway: railway up');
