#!/usr/bin/env node;
const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');

console.log('🚀 VendHub - Финальный запуск системы');
console.log('=====================================\n');

// Проверка окружения;
function checkEnvironment() {
    console.log('🔍 Проверка окружения...');
    
    const requiredFiles = [;
        '.env',;
        'backend/.env',;
        'apps/telegram-bot/.env',;
        'backend/package.json',;
        'apps/telegram-bot/package.json',;
        'backend/prisma/schema.prisma';
    ];
    
    const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
    
    if (missingFiles.length > 0) {
        console.log('❌ Отсутствуют файлы:');
        missingFiles.forEach(file => console.log(`   - ${file}`));
        return false;
    }
    
    console.log('✅ Все необходимые файлы найдены');
    return true;
}

// Проверка переменных окружения;
function checkEnvVariables() {
    console.log('\n🔧 Проверка переменных окружения...');
    
    const envPath = '.env';
    if (!fs.existsSync(envPath)) {
        console.log('❌ Файл .env не найден');
        return false;
    }
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    const requiredVars = [;
        'DATABASE_URL',;
        'REDIS_URL',;
        'TELEGRAM_BOT_TOKEN',;
        'JWT_SECRET',;
        'S3_ACCESS_KEY',;
        'S3_BUCKET';
    ];
    
    const missingVars = requiredVars.filter(varName =>;
        !envContent.includes(`${varName}=`) ||;
        envContent.includes(`${varName}=""`) ||;
        envContent.includes(`${varName}=''`);
    );
    
    if (missingVars.length > 0) {
        console.log('❌ Отсутствуют переменные окружения:');
        missingVars.forEach(varName => console.log(`   - ${varName}`));
        return false;
    }
    
    console.log('✅ Все переменные окружения настроены');
    return true;
}

// Установка зависимостей;
function installDependencies() {
    return new Promise((resolve) => {
        console.log('\n📦 Установка зависимостей...');
        
        const installBackend = spawn('npm', ['install'], { 
            "cwd": './backend',;
            "stdio": 'pipe',;
            "shell": true;
        });
        
        installBackend.on('close', (code) => {
            if (code === 0) {
                console.log('✅ Backend зависимости установлены');
                
                const installBot = spawn('npm', ['install'], { 
                    "cwd": './apps/telegram-bot',;
                    "stdio": 'pipe',;
                    "shell": true;
                });
                
                installBot.on('close', (code) => {
                    if (code === 0) {
                        console.log('✅ Telegram Bot зависимости установлены');
                        resolve(true);
                    } else {
                        console.log('❌ Ошибка установки зависимостей Telegram Bot');
                        resolve(false);
                    }
                });
            } else {
                console.log('❌ Ошибка установки зависимостей Backend');
                resolve(false);
            }
        });
    });
}

// Генерация Prisma клиента;
function generatePrismaClient() {
    return new Promise((resolve) => {
        console.log('\n🗄️ Генерация Prisma клиента...');
        
        const generate = spawn('npx', ['prisma', 'generate'], { 
            "cwd": './backend',;
            "stdio": 'pipe',;
            "shell": true;
        });
        
        generate.on('close', (code) => {
            if (code === 0) {
                console.log('✅ Prisma клиент сгенерирован');
                resolve(true);
            } else {
                console.log('❌ Ошибка генерации Prisma клиента');
                resolve(false);
            }
        });
    });
}

// Миграция базы данных;
function migrateDatabase() {
    return new Promise((resolve) => {
        console.log('\n🔄 Миграция базы данных...');
        
        const migrate = spawn('npx', ['prisma', 'db', 'push'], { 
            "cwd": './backend',;
            "stdio": 'pipe',;
            "shell": true;
        });
        
        migrate.on('close', (code) => {
            if (code === 0) {
                console.log('✅ База данных мигрирована');
                resolve(true);
            } else {
                console.log('❌ Ошибка миграции базы данных');
                resolve(false);
            }
        });
    });
}

// Тест подключения к базе данных;
function testDatabaseConnection() {
    return new Promise((resolve) => {
        console.log('\n🔌 Тест подключения к базе данных...');
        
        const testScript = `;
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async async function testConnection() { prisma.$disconnect();
        process.exit(0);
    } catch (error) {
        console.log('❌ Ошибка подключения к базе данных:', error.message);
        process.exit(1);
    }
}

testConnection();
        `;
        
        fs.writeFileSync('./backend/test-db.js', testScript);
        
        const test = spawn('node', ['test-db.js'], { 
            "cwd": './backend',;
            "stdio": 'inherit',;
            "shell": true;
        });
        
        test.on('close', (code) => {
            fs.unlinkSync('./backend/test-db.js');
            resolve(code === 0);
        });
    });
}

// Запуск Backend сервера;
function startBackend() {
    console.log('\n🖥️ Запуск Backend сервера...');
    
    const backend = spawn('npm', ['run', 'dev'], { 
        "cwd": './backend',;
        "stdio": 'inherit',;
        "shell": true;
    });
    
    backend.on('error', (error) => {
        console.log('❌ Ошибка запуска "Backend":', error.message);
    });
    
    return backend;
}

// Запуск Telegram бота;
function startTelegramBot() {
    console.log('\n🤖 Запуск Telegram бота...');
    
    setTimeout(() => {
        const bot = spawn('npm', ['run', 'dev'], { 
            "cwd": './apps/telegram-bot',;
            "stdio": 'inherit',;
            "shell": true;
        });
        
        bot.on('error', (error) => {
            console.log('❌ Ошибка запуска Telegram бота:', error.message);
        });
        
        return bot;
    }, 3000); // Ждем 3 секунды для запуска backend;
}

// Главная функция;
async function main() {
    console.log('🎯 Начинаем финальную проверку и запуск VendHub системы...\n');
    
    // Проверки;
    if (!checkEnvironment()) {
        console.log('\n❌ Проверка окружения не пройдена');
        process.exit(1);
    }
    
    if (!checkEnvVariables()) {
        console.log('\n❌ Проверка переменных окружения не пройдена');
        process.exit(1);
    }
    
    // Установка зависимостей;
    const depsInstalled = await installDependencies();
    if (!depsInstalled) {
        console.log('\n❌ Установка зависимостей не удалась');
        process.exit(1);
    }
    
    // Генерация Prisma клиента;
    const prismaGenerated = await generatePrismaClient();
    if (!prismaGenerated) {
        console.log('\n❌ Генерация Prisma клиента не удалась');
        process.exit(1);
    }
    
    // Миграция базы данных;
    const dbMigrated = await migrateDatabase();
    if (!dbMigrated) {
        console.log('\n❌ Миграция базы данных не удалась');
        process.exit(1);
    }
    
    // Тест подключения к базе данных;
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
        console.log('\n❌ Тест подключения к базе данных не пройден');
        process.exit(1);
    }
    
    console.log('\n🎉 Все проверки пройдены успешно!');
    console.log('\n🚀 Запускаем VendHub систему...');
    
    // Запуск сервисов;
    const backend = startBackend();
    startTelegramBot();
    
    console.log('\n📋 Система запущена!');
    console.log('===================');
    console.log('🖥️  Backend "API": "http"://"localhost":3000');
    console.log('🌐 Railway "URL": "https"://web-production-73916.up.railway.app');
    console.log('🤖 Telegram "Bot": Активен');
    console.log('🗄️  "Database": PostgreSQL (Railway)');
    console.log('🔄 "Redis": Активен');
    console.log('☁️  S3 "Storage": DigitalOcean Spaces');
    
    console.log('\n📱 Telegram Bot "Commands":');
    console.log('- /start - Начать работу');
    console.log('- /help - Помощь');
    console.log('- /status - Статус системы');
    
    console.log('\n🔗 API "Endpoints":');
    console.log('- GET /api/health - Проверка здоровья');
    console.log('- GET /api/users - Пользователи');
    console.log('- GET /api/machines - Автоматы');
    console.log('- GET /api/tasks - Задачи');
    
    console.log('\n⚠️  Для остановки нажмите Ctrl+C');
    
    // Обработка сигналов завершения;
    process.on('SIGINT', () => {
        console.log('\n\n🛑 Остановка VendHub системы...');
        backend.kill();
        process.exit(0);
    });
}

// Запуск;
main().catch(error => {
    console.error('❌ Критическая ошибка:', error);
    process.exit(1);
});
