const fs = require('fs');
const path = require('path');

// Данные из Railway
const railwayData = {
    DATABASE_URL: 'postgresql://postgres:LxeIDWcsIbMSPcVZiKXmIKqFnDQGaXHR@postgres.railway.internal:5432/railway',
    REDIS_URL: 'redis://default:UBhuXXUjFDisRLBNOsoVNIaGHboCRPll@redis.railway.internal:6379',
    JWT_SECRET: '933f4234d58f69c74957860bf5a7a838e7c6f51f36876e5d415842bd796d6b5e',
    TELEGRAM_BOT_TOKEN: '8015112367:AAHi25gHhI3p1X1uyuCAt8vUnlMZRrcoKEQ',
    ADMIN_IDS: '42283329',
    S3_ACCESS_KEY: 'DO00XEB6BC6XZ8Q2M4KQ',
    S3_BUCKET: 'vhm24-uploads',
    S3_BACKUP_BUCKET: 'vhm24-backups',
    S3_ENDPOINT: 'https://fra1.digitaloceanspaces.com',
    NODE_ENV: 'production',
    PORT: '8000',
    RAILWAY_PUBLIC_DOMAIN: 'web-production-73916.up.railway.app'
};

function updateEnvFile() {
    console.log('🔧 Обновление .env файла с данными Railway...\n');

    const envPath = path.join(__dirname, '.env');
    let envContent = '';
    
    // Читаем существующий .env файл
    if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
        console.log('✅ Существующий .env файл найден');
    } else {
        console.log('📝 Создаем новый .env файл');
    }

    const lines = envContent.split('\n').filter(line => line.trim() !== '');
    const updatedLines = [];
    const processedKeys = new Set();

    // Обновляем существующие переменные
    for (const line of lines) {
        const [key] = line.split('=');
        if (key && railwayData[key]) {
            updatedLines.push(`${key}="${railwayData[key]}"`);
            processedKeys.add(key);
            console.log(`🔄 Обновлено: ${key}`);
        } else {
            updatedLines.push(line);
        }
    }

    // Добавляем новые переменные
    for (const [key, value] of Object.entries(railwayData)) {
        if (!processedKeys.has(key)) {
            updatedLines.push(`${key}="${value}"`);
            console.log(`➕ Добавлено: ${key}`);
        }
    }

    // Добавляем дополнительные переменные, если их нет
    const additionalVars = {
        'S3_SECRET_KEY': 'PLACEHOLDER_SECRET_KEY',
        'S3_REGION': 'fra1',
        'WEBHOOK_SECRET': 'your_webhook_secret_here',
        'API_BASE_URL': `https://${railwayData.RAILWAY_PUBLIC_DOMAIN}`,
        'FRONTEND_URL': `https://${railwayData.RAILWAY_PUBLIC_DOMAIN}`,
        'CORS_ORIGIN': `https://${railwayData.RAILWAY_PUBLIC_DOMAIN}`
    };

    for (const [key, value] of Object.entries(additionalVars)) {
        const exists = updatedLines.some(line => line.startsWith(`${key}=`));
        if (!exists) {
            updatedLines.push(`${key}="${value}"`);
            console.log(`➕ Добавлено (дополнительно): ${key}`);
        }
    }

    // Записываем обновленный файл
    fs.writeFileSync(envPath, updatedLines.join('\n') + '\n');
    console.log('\n✅ Файл .env успешно обновлен!');

    // Показываем итоговое содержимое
    console.log('\n📋 Итоговое содержимое .env:');
    console.log('=' * 50);
    console.log(fs.readFileSync(envPath, 'utf8'));
    console.log('=' * 50);

    // Создаем также файл для Telegram бота
    const telegramEnvPath = path.join(__dirname, 'apps', 'telegram-bot', '.env');
    const telegramEnvContent = [
        `TELEGRAM_BOT_TOKEN="${railwayData.TELEGRAM_BOT_TOKEN}"`,
        `API_BASE_URL="https://${railwayData.RAILWAY_PUBLIC_DOMAIN}"`,
        `ADMIN_IDS="${railwayData.ADMIN_IDS}"`,
        `NODE_ENV="${railwayData.NODE_ENV}"`
    ].join('\n') + '\n';

    try {
        fs.writeFileSync(telegramEnvPath, telegramEnvContent);
        console.log('✅ Файл apps/telegram-bot/.env обновлен');
    } catch (error) {
        console.log('⚠️ Не удалось обновить apps/telegram-bot/.env:', error.message);
    }

    console.log('\n🎉 Все переменные окружения настроены!');
    console.log('\n📝 Следующие шаги:');
    console.log('1. Обновите S3_SECRET_KEY в .env файле');
    console.log('2. Проверьте подключение к базе данных');
    console.log('3. Запустите миграции Prisma');
    console.log('4. Протестируйте систему');
}

// Запускаем обновление
updateEnvFile();
