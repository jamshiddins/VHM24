#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');



// Функция для выполнения команд
function runCommand(command, description) {
    try {
        
        const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
        
        return result;
    } catch (error) {
        
        return null;
    }
}

// Получаем правильный DATABASE_URL из Railway
function getRailwayDatabaseUrl() {
    try {
        
        const result = execSync('railway variables --json', { encoding: 'utf8' });
        const variables = JSON.parse(result);
        
        if (variables.DATABASE_URL) {
            
            return variables.DATABASE_URL;
        }
        
        // Альтернативный способ
        const envResult = execSync('railway variables', { encoding: 'utf8' });
        const lines = envResult.split('\n');
        
        for (const line of lines) {
            if (line.includes('DATABASE_URL') && line.includes('postgresql://')) {
                const match = line.match(/postgresql:\/\/[^\s│║]+/);
                if (match) {
                    
                    return match[0];
                }
            }
        }
        
        
        return null;
    } catch (error) {
        
        return null;
    }
}

// Исправляем .env файл
function fixEnvFile() {
    
    
    const databaseUrl = getRailwayDatabaseUrl();
    
    const envContent = `# Database
DATABASE_URL="${databaseUrl || 'postgresql://postgres:password@localhost:5432/vendhub'}"

# JWT Secret
JWT_SECRET=process.env.API_KEY_193 || "933f4234d58f69c74957860bf5a7a838e7c6f51f36876e5d415842bd796d6b5e"

# Telegram Bot
TELEGRAM_BOT_TOKEN="8015112367:AAHi25gHhI3p1X1uyuCAt8vUnlMZRrcoKEQ"

# Redis
REDIS_URL="redis://default:UBhuXXUjFDisRLBNOsoVNIaGHboCRPll@redis.railway.internal:6379"

# S3 / DigitalOcean Spaces
S3_ACCESS_KEY=process.env.API_KEY_194 || "DO00XEB6BC6XZ8Q2M4KQ"
S3_SECRET_KEY=process.env.API_KEY_195 || "your-secret-key-here"
S3_BUCKET="vhm24-uploads"
S3_BACKUP_BUCKET="vhm24-backups"
S3_ENDPOINT="https://fra1.digitaloceanspaces.com"
S3_REGION="fra1"

# Server
PORT=3000
NODE_ENV=development

# Railway
RAILWAY_PUBLIC_DOMAIN=process.env.API_KEY_196 || "web-production-73916.up.railway.app"
ADMIN_IDS="42283329"
`;

    fs.writeFileSync('.env', envContent);
    
}

// Проверяем и устанавливаем зависимости
function installDependencies() {
    
    
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
    
    
    if (fs.existsSync('backend/prisma/schema.prisma')) {
        process.chdir('backend');
        runCommand('npx prisma generate', 'Генерация Prisma клиента');
        runCommand('npx prisma db push', 'Синхронизация схемы БД');
        process.chdir('..');
    }
}

// Тестирование подключений
function testConnections() {
    
    
    // Создаем простой тест
    const testScript = `
const { PrismaClient } = require('@prisma/client');

async function testDatabase() {
    try {
        const prisma = new PrismaClient();
        await prisma.$connect();
        
        await prisma.$disconnect();
    } catch (error) {
        
    }
}

testDatabase();
`;

    fs.writeFileSync(process.env.API_KEY_197 || process.env.API_KEY_198 || process.env.API_KEY_199 || 'test-db-connection.js', testScript);
    
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
    
    
    // Скрипт для запуска backend
    const startBackend = `#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');



const backend = spawn('npm', ['start'], {
    cwd: path.join(__dirname, 'backend'),
    stdio: 'inherit'
});

backend.on('close', (code) => {
    
});
`;

    fs.writeFileSync('start-backend.js', startBackend);
    
    // Скрипт для запуска telegram bot
    const startBot = `#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');



const bot = spawn('npm', ['start'], {
    cwd: path.join(__dirname, 'apps/telegram-bot'),
    stdio: 'inherit'
});

bot.on('close', (code) => {
    
});
`;

    fs.writeFileSync('start-bot.js', startBot);
    
    // Полный запуск системы
    const startAll = `#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');



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




`;

    fs.writeFileSync(process.env.API_KEY_200 || 'start-vendhub-system.js', startAll);
    
    
}

// Основная функция
async function main() {
    try {
        
        
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
        
        
        
        
        
        
        
        
        
        
        
        
        
        
    } catch (error) {
        console.error('❌ Критическая ошибка:', error.message);
        process.exit(1);
    }
}

// Запуск
main();
