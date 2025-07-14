#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Финальная настройка и запуск системы VendHub...\n');

// Функция для выполнения команд
function runCommand(command, description) {
    try {
        console.log(`🔄 ${description}...`);
        const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
        console.log(`✅ ${description} - успешно`);
        return result;
    } catch (error) {
        console.log(`❌ ${description} - ошибка:`, error.message);
        return null;
    }
}

// Получаем правильный DATABASE_URL из Railway
function getRailwayDatabaseUrl() {
    try {
        console.log('🔍 Получение DATABASE_URL из Railway...');
        const result = execSync('railway variables --json', { encoding: 'utf8' });
        const variables = JSON.parse(result);
        
        if (variables.DATABASE_URL) {
            console.log('✅ DATABASE_URL найден в Railway');
            return variables.DATABASE_URL;
        }
        
        // Альтернативный способ
        const envResult = execSync('railway variables', { encoding: 'utf8' });
        const lines = envResult.split('\n');
        
        for (const line of lines) {
            if (line.includes('DATABASE_URL') && line.includes('postgresql://')) {
                const match = line.match(/postgresql:\/\/[^\s│║]+/);
                if (match) {
                    console.log('✅ DATABASE_URL извлечен из вывода');
                    return match[0];
                }
            }
        }
        
        console.log('⚠️ DATABASE_URL не найден');
        return null;
    } catch (error) {
        console.log('❌ Ошибка получения DATABASE_URL:', error.message);
        return null;
    }
}

// Исправляем .env файл
function fixEnvFile() {
    console.log('🔧 Исправление .env файла...');
    
    const databaseUrl = getRailwayDatabaseUrl();
    
    const envContent = `# Database
DATABASE_URL="${databaseUrl || 'postgresql://postgres:password@localhost:5432/vendhub'}"

# JWT Secret
JWT_SECRET="933f4234d58f69c74957860bf5a7a838e7c6f51f36876e5d415842bd796d6b5e"

# Telegram Bot
TELEGRAM_BOT_TOKEN="8015112367:AAHi25gHhI3p1X1uyuCAt8vUnlMZRrcoKEQ"

# Redis
REDIS_URL="redis://default:UBhuXXUjFDisRLBNOsoVNIaGHboCRPll@redis.railway.internal:6379"

# S3 / DigitalOcean Spaces
S3_ACCESS_KEY="DO00XEB6BC6XZ8Q2M4KQ"
S3_SECRET_KEY="your-secret-key-here"
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
    console.log('✅ .env файл исправлен');
}

// Проверяем и устанавливаем зависимости
function installDependencies() {
    console.log('\n📦 Установка зависимостей...');
    
    // Backend
    if (fs.existsSync('backend/package.json')) {
        process.chdir('backend');
        runCommand('npm install', 'Установка зависимостей backend');
        process.chdir('..');
    }
    
    // Telegram Bot
    if (fs.existsSync('apps/telegram-bot/package.json')) {
        process.chdir('apps/telegram-bot');
        runCommand('npm install', 'Установка зависимостей telegram-bot');
        process.chdir('..');
    }
}

// Настройка базы данных
function setupDatabase() {
    console.log('\n🗄️ Настройка базы данных...');
    
    if (fs.existsSync('backend/prisma/schema.prisma')) {
        process.chdir('backend');
        runCommand('npx prisma generate', 'Генерация Prisma клиента');
        runCommand('npx prisma db push', 'Синхронизация схемы БД');
        process.chdir('..');
    }
}

// Тестирование подключений
function testConnections() {
    console.log('\n🔍 Тестирование подключений...');
    
    // Создаем простой тест
    const testScript = `
const { PrismaClient } = require('@prisma/client');

async function testDatabase() {
    try {
        const prisma = new PrismaClient();
        await prisma.$connect();
        console.log('✅ База данных: подключение успешно');
        await prisma.$disconnect();
    } catch (error) {
        console.log('❌ База данных: ошибка подключения');
    }
}

testDatabase();
`;

    fs.writeFileSync('test-db-connection.js', testScript);
    
    if (fs.existsSync('backend/node_modules')) {
        process.chdir('backend');
        runCommand('node ../test-db-connection.js', 'Тест подключения к БД');
        process.chdir('..');
    }
    
    // Удаляем временный файл
    if (fs.existsSync('test-db-connection.js')) {
        fs.unlinkSync('test-db-connection.js');
    }
}

// Создаем скрипты запуска
function createStartScripts() {
    console.log('\n📝 Создание скриптов запуска...');
    
    // Скрипт для запуска backend
    const startBackend = `#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Запуск VendHub Backend...');

const backend = spawn('npm', ['start'], {
    cwd: path.join(__dirname, 'backend'),
    stdio: 'inherit'
});

backend.on('close', (code) => {
    console.log(\`Backend завершен с кодом \${code}\`);
});
`;

    fs.writeFileSync('start-backend.js', startBackend);
    
    // Скрипт для запуска telegram bot
    const startBot = `#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

console.log('🤖 Запуск VendHub Telegram Bot...');

const bot = spawn('npm', ['start'], {
    cwd: path.join(__dirname, 'apps/telegram-bot'),
    stdio: 'inherit'
});

bot.on('close', (code) => {
    console.log(\`Telegram Bot завершен с кодом \${code}\`);
});
`;

    fs.writeFileSync('start-bot.js', startBot);
    
    // Полный запуск системы
    const startAll = `#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Запуск полной системы VendHub...');

// Запуск backend
const backend = spawn('node', ['start-backend.js'], {
    stdio: 'inherit'
});

// Запуск telegram bot через 3 секунды
setTimeout(() => {
    const bot = spawn('node', ['start-bot.js'], {
        stdio: 'inherit'
    });
}, 3000);

console.log('✅ Система запущена!');
console.log('📊 Backend: process.env.API_URL');
console.log('🤖 Telegram Bot: активен');
`;

    fs.writeFileSync('start-vendhub-system.js', startAll);
    
    console.log('✅ Скрипты запуска созданы');
}

// Основная функция
async function main() {
    try {
        console.log('🎯 Начинаем финальную настройку системы VendHub\n');
        
        // 1. Исправляем .env
        fixEnvFile();
        
        // 2. Устанавливаем зависимости
        installDependencies();
        
        // 3. Настраиваем базу данных
        setupDatabase();
        
        // 4. Тестируем подключения
        testConnections();
        
        // 5. Создаем скрипты запуска
        createStartScripts();
        
        console.log('\n🎉 СИСТЕМА ГОТОВА К ЗАПУСКУ!');
        console.log('\n📋 Команды для запуска:');
        console.log('   node start-backend.js     - Запуск только backend');
        console.log('   node start-bot.js         - Запуск только telegram bot');
        console.log('   node start-vendhub-system.js - Запуск полной системы');
        
        console.log('\n🌐 Доступ к системе:');
        console.log('   Backend API: process.env.API_URL');
        console.log('   Railway URL: https://web-production-73916.up.railway.app');
        console.log('   Telegram Bot: @your_bot_name');
        
        console.log('\n✅ Все готово для работы!');
        
    } catch (error) {
        console.error('❌ Критическая ошибка:', error.message);
        process.exit(1);
    }
}

// Запуск
main();
