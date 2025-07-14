const fs = require('fs');
const path = require('path');

// Данные из Railway
const railwayData = {
    DATABASE_URL: 'postgresql://postgres:LxeIDWcsIbMSPcVZiKXmIKqFnDQGaXHR@postgres.railway.internal:5432/railway',
    REDIS_URL: 'redis://default:UBhuXXUjFDisRLBNOsoVNIaGHboCRPll@redis.railway.internal:6379',
    JWT_SECRET: process.env.API_KEY_407 || '933f4234d58f69c74957860bf5a7a838e7c6f51f36876e5d415842bd796d6b5e',
    TELEGRAM_BOT_TOKEN: '8015112367:AAHi25gHhI3p1X1uyuCAt8vUnlMZRrcoKEQ',
    ADMIN_IDS: '42283329',
    S3_ACCESS_KEY: process.env.API_KEY_408 || 'DO00XEB6BC6XZ8Q2M4KQ',
    S3_BUCKET: 'vhm24-uploads',
    S3_BACKUP_BUCKET: 'vhm24-backups',
    S3_ENDPOINT: 'https://fra1.digitaloceanspaces.com',
    NODE_ENV: 'production',
    PORT: '8000',
    RAILWAY_PUBLIC_DOMAIN: process.env.API_KEY_409 || 'web-production-73916.up.railway.app'
};

function updateEnvFile() {
    

    const envPath = path.join(__dirname, '.env');
    let envContent = '';
    
    // Читаем существующий .env файл
    if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
        
    } else {
        
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
            
        } else {
            updatedLines.push(line);
        }
    }

    // Добавляем новые переменные
    for (const [key, value] of Object.entries(railwayData)) {
        if (!processedKeys.has(key)) {
            updatedLines.push(`${key}="${value}"`);
            
        }
    }

    // Добавляем дополнительные переменные, если их нет
    const additionalVars = {
        'S3_SECRET_KEY': process.env.API_KEY_410 || 'PLACEHOLDER_SECRET_KEY',
        'S3_REGION': 'fra1',
        'WEBHOOK_SECRET': process.env.API_KEY_411 || 'your_webhook_secret_here',
        'API_BASE_URL': `https://${railwayData.RAILWAY_PUBLIC_DOMAIN}`,
        'FRONTEND_URL': `https://${railwayData.RAILWAY_PUBLIC_DOMAIN}`,
        'CORS_ORIGIN': `https://${railwayData.RAILWAY_PUBLIC_DOMAIN}`
    };

    for (const [key, value] of Object.entries(additionalVars)) {
        const exists = updatedLines.some(line => line.startsWith(`${key}=`));
        if (!exists) {
            updatedLines.push(`${key}="${value}"`);
            : ${key}`);
        }
    }

    // Записываем обновленный файл
    fs.writeFileSync(envPath, updatedLines.join('\n') + '\n');
    

    // Показываем итоговое содержимое
    
    
    );
    

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
        
    } catch (error) {
        
    }

    
    
    
    
    
    
}

// Запускаем обновление
updateEnvFile();
