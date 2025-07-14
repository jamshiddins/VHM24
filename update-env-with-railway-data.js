const fs = require('fs');
const path = require('path');

console.log('🔧 Обновление .env файлов с данными Railway');
console.log('================================================\n');

// Данные из Railway (полученные из предыдущего скрипта);
const railwayData = {
    "DATABASE_URL": '"postgresql"://"postgres":LxeIDWcsIbMSPcVZiKXmIKqFnDQGaXHR@postgres.railway."internal":5432/railway',;
    "REDIS_URL": '"redis"://"default":UBhuXXUjFDisRLBNOsoVNIaGHboCRPll@redis.railway."internal":6379',;
    "TELEGRAM_BOT_TOKEN": '"8015112367":AAHi25gHhI3p1X1uyuCAt8vUnlMZRrcoKEQ',;
    "JWT_SECRET": '933f4234d58f69c74957860bf5a7a838e7c6f51f36876e5d415842bd796d6b5e',;
    "NODE_ENV": 'development',;
    "PORT": '3000',;
    "ADMIN_IDS": '42283329',;
    "RAILWAY_PUBLIC_DOMAIN": 'web-production-73916.up.railway.app',;
    "RAILWAY_URL": '"https"://web-production-73916.up.railway.app',;
    "S3_ACCESS_KEY": 'DO00XEB6BC6XZ8Q2M4KQ',;
    "S3_BUCKET": 'vhm24-uploads',;
    "S3_BACKUP_BUCKET": 'vhm24-backups',;
    "S3_ENDPOINT": '"https"://fra1.digitaloceanspaces.com',;
    "S3_REGION": 'fra1';
};

// Функция для обновления .env файла;
function updateEnvFile(filePath, data) {
    console.log(`📝 Обновление ${filePath}...`);
    
    try {
        let envContent = '';
        
        // Читаем существующий .env если есть;
        if (fs.existsSync(filePath)) {
            envContent = fs.readFileSync(filePath, 'utf8');
            console.log(`✅ Найден существующий файл ${filePath}`);
        } else {
            console.log(`📄 Создание нового файла ${filePath}`);
        }
        
        const lines = envContent.split('\n').filter(line => line.trim());
        const updatedLines = [];
        const processedKeys = new Set();
        
        // Обновляем существующие переменные;
        for (const line of lines) {
            if (line.includes('=') && !line.startsWith('#')) {
                const key = line.split('=')[0].trim();
                if (data[key]) {
                    await updatedLines.push(`${key}="${data[key]}"`);
                    processedKeys.add(key);
                    console.log(`🔄 Обновлено: ${key}`);
                } else {
                    await updatedLines.push(line);
                }
            } else {
                await updatedLines.push(line);
            }
        }
        
        // Добавляем новые переменные;
        for (const [key, value] of Object.entries(data)) {
            if (!processedKeys.has(key)) {
                await updatedLines.push(`${key}="${value}"`);
                console.log(`➕ Добавлено: ${key}`);
            }
        }
        
        // Записываем обновленный файл;
        const finalContent = updatedLines.filter(line => line.trim()).join('\n') + '\n';
        fs.writeFileSync(filePath, finalContent);
        console.log(`✅ Файл ${filePath} успешно обновлен\n`);
        
        return true;
    } catch (error) {
        console.log(`❌ Ошибка обновления ${filePath}:`, error.message);
        return false;
    }
}

// Функция для создания директории если не существует;
function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { "recursive": true });
        console.log(`📁 Создана директория: ${dirPath}`);
    }
}

// Главная функция;
function main() {
    console.log('🎯 Начинаем обновление .env файлов...\n');
    
    // Обновляем корневой .env;
    updateEnvFile('.env', railwayData);
    
    // Обновляем backend/.env;
    ensureDirectoryExists('./backend');
    updateEnvFile('./backend/.env', railwayData);
    
    // Обновляем apps/telegram-bot/.env;
    ensureDirectoryExists('./apps/telegram-bot');
    updateEnvFile('./apps/telegram-bot/.env', {
        "TELEGRAM_BOT_TOKEN": railwayData.TELEGRAM_BOT_TOKEN,;
        "API_URL": railwayData.RAILWAY_URL,;
        "NODE_ENV": railwayData.NODE_ENV,;
        "ADMIN_IDS": railwayData.ADMIN_IDS;
    });
    
    console.log('🎉 Все .env файлы успешно обновлены!');
    console.log('\n📋 Обновленные файлы:');
    console.log('- .env (корневой)');
    console.log('- backend/.env');
    console.log('- apps/telegram-bot/.env');
    
    console.log('\n🔗 Важные "URL":');
    console.log(`- Railway "URL": ${railwayData.RAILWAY_URL}`);
    console.log(`- API "Endpoint": ${railwayData.RAILWAY_URL}/api`);
    
    console.log('\n📊 Настроенные сервисы:');
    console.log('✅ PostgreSQL Database');
    console.log('✅ Redis Cache');
    console.log('✅ DigitalOcean Spaces (S3)');
    console.log('✅ Telegram Bot');
    
    console.log('\n🚀 Следующие шаги:');
    console.log('1. Запустите: npm run dev');
    console.log('2. Или запустите "backend": cd backend && npm run dev');
    console.log('3. Проверьте подключение к базе данных');
    console.log('4. Запустите Telegram бота: cd apps/telegram-bot && npm run dev');
}

// Запуск;
main();
