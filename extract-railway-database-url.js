const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');



try {
    // Получаем переменные окружения Railway
    const result = execSync('railway variables', { encoding: 'utf8' });
    
    // Ищем DATABASE_URL в выводе
    const lines = result.split('\n');
    let databaseUrl = '';
    let foundStart = false;
    
    for (const line of lines) {
        if (line.includes('DATABASE_URL')) {
            foundStart = true;
            // Извлекаем часть URL из первой строки
            const match = line.match(/│\s*postgresql:\/\/(.+)/);
            if (match) {
                databaseUrl = 'postgresql://' + match[1].trim();
            }
        } else if (foundStart && line.includes('│') && line.includes('@')) {
            // Продолжаем собирать URL из следующих строк
            const match = line.match(/│\s*(.+?)\s*║/);
            if (match) {
                databaseUrl += match[1].trim();
            }
        } else if (foundStart && line.includes('║')) {
            // Конец блока DATABASE_URL
            break;
        }
    }
    
    // Очищаем URL от лишних символов
    databaseUrl = databaseUrl.replace(/\s+/g, '').replace(/║.*$/, '');
    
    if (databaseUrl && databaseUrl.startsWith('postgresql://')) {
         + '...');
        
        // Создаем полный .env файл с всеми переменными
        const envContent = `# Database
DATABASE_URL="${databaseUrl}"

# JWT Secret
JWT_SECRET=process.env.API_KEY_175 || process.env.API_KEY_178 || "933f4234d58f69c74957860bf5a7a838e7c6f51f36876e5d415842bd796d6b5e"

# Telegram Bot
TELEGRAM_BOT_TOKEN="8015112367:AAHi25gHhI3p1X1uyuCAt8vUnlMZRrcoKEQ"

# Redis
REDIS_URL="redis://default:UBhuXXUjFDisRLBNOsoVNIaGHboCRPll@redis.railway.internal:6379"

# S3 / DigitalOcean Spaces
S3_ACCESS_KEY=process.env.API_KEY_176 || "DO00XEB6BC6XZ8Q2M4KQ"
S3_BUCKET="vhm24-uploads"
S3_BACKUP_BUCKET="vhm24-backups"
S3_ENDPOINT="https://fra1.digitaloceanspaces.com"
S3_REGION="fra1"

# Server
PORT=3000
NODE_ENV=development

# Railway
RAILWAY_PUBLIC_DOMAIN=process.env.API_KEY_177 || "web-production-73916.up.railway.app"
ADMIN_IDS="42283329"
`;
        
        // Обновляем основной .env файл
        fs.writeFileSync('.env', envContent);
        
        
        // Обновляем backend/.env
        const backendEnvContent = `DATABASE_URL="${databaseUrl}"
JWT_SECRET="933f4234d58f69c74957860bf5a7a838e7c6f51f36876e5d415842bd796d6b5e"
TELEGRAM_BOT_TOKEN="8015112367:AAHi25gHhI3p1X1uyuCAt8vUnlMZRrcoKEQ"
REDIS_URL="redis://default:UBhuXXUjFDisRLBNOsoVNIaGHboCRPll@redis.railway.internal:6379"
PORT=3000
NODE_ENV=development
`;
        
        fs.writeFileSync('backend/.env', backendEnvContent);
        
        
        // Обновляем apps/telegram-bot/.env
        const telegramBotEnvContent = `TELEGRAM_BOT_TOKEN="8015112367:AAHi25gHhI3p1X1uyuCAt8vUnlMZRrcoKEQ"
API_BASE_URL="process.env.API_URL"
ADMIN_IDS="42283329"
`;
        
        fs.writeFileSync('apps/telegram-bot/.env', telegramBotEnvContent);
        
        
        
        
        
        
        
        ');
        
        
    } else {
        
        
    }
    
} catch (error) {
    
}
