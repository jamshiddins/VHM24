#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');



try {
    // Получаем все переменные окружения Railway
    
    const envOutput = execSync('railway variables', { encoding: 'utf8' });
    
    
    
    
    // Ищем DATABASE_URL
    const lines = envOutput.split('\n');
    let databaseUrl = '';
    
    for (const line of lines) {
        if (line.includes('DATABASE_URL')) {
            const match = line.match(/DATABASE_URL\s*=\s*(.+)/);
            if (match) {
                databaseUrl = match[1].trim();
                break;
            }
        }
    }
    
    if (!databaseUrl) {
        
        
        // Попробуем получить информацию о сервисах
        
        try {
            const servicesOutput = execSync('railway status', { encoding: 'utf8' });
            
            
        } catch (error) {
            
        }
        
        // Попробуем создать базу данных
        
        try {
            execSync('railway add postgresql', { encoding: 'utf8' });
            
            
            // Ждем немного и пробуем снова
            
            setTimeout(() => {
                try {
                    const newEnvOutput = execSync('railway variables', { encoding: 'utf8' });
                    
                    
                } catch (error) {
                    
                }
            }, 5000);
            
        } catch (error) {
            
        }
        
        return;
    }
    
    console.log('✅ Найден DATABASE_URL:', databaseUrl.substring(0, 50) + '...');
    
    // Обновляем .env файлы
    const envFiles = [
        '.env',
        'backend/.env',
        'apps/telegram-bot/.env'
    ];
    
    for (const envFile of envFiles) {
        if (fs.existsSync(envFile)) {
            let content = fs.readFileSync(envFile, 'utf8');
            
            // Заменяем или добавляем DATABASE_URL
            if (content.includes('DATABASE_URL=')) {
                content = content.replace(/DATABASE_URL=.*/g, `DATABASE_URL="${databaseUrl}"`);
            } else {
                content += `\nDATABASE_URL="${databaseUrl}"\n`;
            }
            
            fs.writeFileSync(envFile, content);
            
        }
    }
    
    // Также добавим другие важные переменные
    const additionalVars = {
        'JWT_SECRET': process.env.API_KEY_202 || '933f4234d58f69c74957860bf5a7a838e7c6f51f36876e5d415842bd796d6b5e',
        'TELEGRAM_BOT_TOKEN': '8015112367:AAHi25gHhI3p1X1uyuCAt8vUnlMZRrcoKEQ',
        'REDIS_URL': 'redis://default:UBhuXXUjFDisRLBNOsoVNIaGHboCRPll@redis.railway.internal:6379',
        'S3_ACCESS_KEY': process.env.API_KEY_203 || 'DO00XEB6BC6XZ8Q2M4KQ',
        'S3_SECRET_KEY': 'missing_secret_key',
        'S3_BUCKET': 'vhm24-uploads',
        'S3_ENDPOINT': 'https://fra1.digitaloceanspaces.com',
        'S3_REGION': 'fra1',
        'PORT': '3000',
        'NODE_ENV': 'development',
        process.env.API_KEY_204 || 'RAILWAY_PUBLIC_DOMAIN': process.env.API_KEY_205 || 'web-production-73916.up.railway.app',
        'ADMIN_IDS': '42283329'
    };
    
    // Обновляем основной .env файл
    let mainEnvContent = fs.readFileSync('.env', 'utf8');
    
    for (const [key, value] of Object.entries(additionalVars)) {
        if (!mainEnvContent.includes(`${key}=`)) {
            mainEnvContent += `${key}="${value}"\n`;
        }
    }
    
    fs.writeFileSync('.env', mainEnvContent);
    
    
    
    
} catch (error) {
    console.error('❌ Ошибка:', error.message);
    
    // Если Railway CLI не работает, создадим базовую конфигурацию
    
    
    const fallbackEnv = `# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/vendhub"

# JWT Secret
JWT_SECRET=process.env.API_KEY_206 || "933f4234d58f69c74957860bf5a7a838e7c6f51f36876e5d415842bd796d6b5e"

# Telegram Bot
TELEGRAM_BOT_TOKEN="8015112367:AAHi25gHhI3p1X1uyuCAt8vUnlMZRrcoKEQ"

# Redis
REDIS_URL="redis://default:UBhuXXUjFDisRLBNOsoVNIaGHboCRPll@redis.railway.internal:6379"

# S3 / DigitalOcean Spaces
S3_ACCESS_KEY=process.env.API_KEY_207 || "DO00XEB6BC6XZ8Q2M4KQ"
S3_SECRET_KEY="missing_secret_key"
S3_BUCKET="vhm24-uploads"
S3_BACKUP_BUCKET="vhm24-backups"
S3_ENDPOINT="https://fra1.digitaloceanspaces.com"
S3_REGION="fra1"

# Server
PORT=3000
NODE_ENV=development

# Railway
RAILWAY_PUBLIC_DOMAIN=process.env.API_KEY_208 || "web-production-73916.up.railway.app"
ADMIN_IDS="42283329"
`;

    fs.writeFileSync('.env', fallbackEnv);
    
}
