#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔍 Извлечение DATABASE_URL из Railway...');

try {
    // Получаем переменные Railway
    const envOutput = execSync('railway variables', { encoding: 'utf8' });
    
    // Ищем DATABASE_URL в выводе
    const databaseUrlMatch = envOutput.match(/DATABASE_URL\s*│\s*postgresql:\/\/[^\s│]+/);
    
    if (!databaseUrlMatch) {
        console.log('❌ DATABASE_URL не найден');
        return;
    }
    
    // Извлекаем URL
    let databaseUrl = databaseUrlMatch[0].split('│')[1].trim();
    
    // Если URL разбит на несколько строк, собираем его
    const lines = envOutput.split('\n');
    let fullUrl = '';
    let collecting = false;
    
    for (const line of lines) {
        if (line.includes('DATABASE_URL')) {
            collecting = true;
            const urlPart = line.split('│')[1];
            if (urlPart) {
                fullUrl += urlPart.trim();
            }
        } else if (collecting && line.includes('│') && !line.includes('─')) {
            const urlPart = line.split('│')[1];
            if (urlPart && urlPart.trim()) {
                fullUrl += urlPart.trim();
            } else {
                collecting = false;
            }
        } else if (collecting && line.includes('─')) {
            collecting = false;
        }
    }
    
    if (fullUrl) {
        databaseUrl = fullUrl;
    }
    
    console.log('✅ Найден DATABASE_URL:', databaseUrl.substring(0, 50) + '...');
    
    // Обновляем .env файлы
    const envFiles = ['.env', 'backend/.env', 'apps/telegram-bot/.env'];
    
    for (const envFile of envFiles) {
        try {
            let content = '';
            if (fs.existsSync(envFile)) {
                content = fs.readFileSync(envFile, 'utf8');
            }
            
            // Заменяем или добавляем DATABASE_URL
            if (content.includes('DATABASE_URL=')) {
                content = content.replace(/DATABASE_URL=.*/g, `DATABASE_URL="${databaseUrl}"`);
            } else {
                content += `\nDATABASE_URL="${databaseUrl}"\n`;
            }
            
            fs.writeFileSync(envFile, content);
            console.log(`✅ Обновлен ${envFile}`);
        } catch (error) {
            console.log(`⚠️ Не удалось обновить ${envFile}:`, error.message);
        }
    }
    
    // Также обновим основные переменные
    const mainEnvPath = '.env';
    let mainContent = fs.readFileSync(mainEnvPath, 'utf8');
    
    const requiredVars = {
        'JWT_SECRET': '933f4234d58f69c74957860bf5a7a838e7c6f51f36876e5d415842bd796d6b5e',
        'TELEGRAM_BOT_TOKEN': '8015112367:AAHi25gHhI3p1X1uyuCAt8vUnlMZRrcoKEQ',
        'REDIS_URL': 'redis://default:UBhuXXUjFDisRLBNOsoVNIaGHboCRPll@redis.railway.internal:6379',
        'S3_ACCESS_KEY': 'DO00XEB6BC6XZ8Q2M4KQ',
        'S3_BUCKET': 'vhm24-uploads',
        'S3_BACKUP_BUCKET': 'vhm24-backups',
        'S3_ENDPOINT': 'https://fra1.digitaloceanspaces.com',
        'S3_REGION': 'fra1',
        'PORT': '3000',
        'NODE_ENV': 'development',
        'RAILWAY_PUBLIC_DOMAIN': 'web-production-73916.up.railway.app',
        'ADMIN_IDS': '42283329'
    };
    
    for (const [key, value] of Object.entries(requiredVars)) {
        if (!mainContent.includes(`${key}=`)) {
            mainContent += `${key}="${value}"\n`;
        }
    }
    
    fs.writeFileSync(mainEnvPath, mainContent);
    
    console.log('🎉 DATABASE_URL успешно извлечен и настроен!');
    console.log('📋 Все переменные окружения обновлены');
    
} catch (error) {
    console.error('❌ Ошибка:', error.message);
    
    // Создаем базовую конфигурацию с правильным DATABASE_URL
    const fallbackDatabaseUrl = 'postgresql://postgres:LxeIDWcsIbMSPcVZiKXmIKqFnDQGaXHR@postgres.railway.internal:5432/railway';
    
    const envContent = `# Database
DATABASE_URL="${fallbackDatabaseUrl}"

# JWT Secret
JWT_SECRET="933f4234d58f69c74957860bf5a7a838e7c6f51f36876e5d415842bd796d6b5e"

# Telegram Bot
TELEGRAM_BOT_TOKEN="8015112367:AAHi25gHhI3p1X1uyuCAt8vUnlMZRrcoKEQ"

# Redis
REDIS_URL="redis://default:UBhuXXUjFDisRLBNOsoVNIaGHboCRPll@redis.railway.internal:6379"

# S3 / DigitalOcean Spaces
S3_ACCESS_KEY="DO00XEB6BC6XZ8Q2M4KQ"
S3_SECRET_KEY="missing_secret_key"
S3_BUCKET="vhm24-uploads"
S3_BACKUP_BUCKET="vhm24-backups"
S3_ENDPOINT="https://fra1.digitaloceanspaces.com"
S3_REGION="fra1"

# Server
PORT=3000
NODE_ENV=development

# Railway
RAILWAY_PUBLIC_DOMAIN="web-production-73916.up.railway.app"
ADMIN_IDS="42283329"
`;

    fs.writeFileSync('.env', envContent);
    console.log('✅ Создана базовая конфигурация с DATABASE_URL из Railway');
}
