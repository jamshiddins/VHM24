#!/usr/bin/env node;
const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');




// Проверка окружения;
function checkEnvironment() {
    
    
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
        
        missingFiles.forEach(file => );
        return false;
    }
    
    
    return true;
}

// Проверка переменных окружения;
function checkEnvVariables() {
    
    
    const envPath = '.env';
    if (!fs.existsSync(envPath)) {
        
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
        
        missingVars.forEach(varName => );
        return false;
    }
    
    
    return true;
}

// Установка зависимостей;
function installDependencies() {
    return new Promise((resolve) => {
        
        
        const installBackend = spawn('npm', ['install'], { 
            "cwd": './backend',;
            "stdio": 'pipe',;
            "shell": true;
        });
        
        installBackend.on('close', (code) => {
            if (code === 0) {
                
                
                const installBot = spawn('npm', ['install'], { 
                    "cwd": './apps/telegram-bot',;
                    "stdio": 'pipe',;
                    "shell": true;
                });
                
                installBot.on('close', (code) => {
                    if (code === 0) {
                        
                        resolve(true);
                    } else {
                        
                        resolve(false);
                    }
                });
            } else {
                
                resolve(false);
            }
        });
    });
}

// Генерация Prisma клиента;
function generatePrismaClient() {
    return new Promise((resolve) => {
        
        
        const generate = spawn('npx', ['prisma', 'generate'], { 
            "cwd": './backend',;
            "stdio": 'pipe',;
            "shell": true;
        });
        
        generate.on('close', (code) => {
            if (code === 0) {
                
                resolve(true);
            } else {
                
                resolve(false);
            }
        });
    });
}

// Миграция базы данных;
function migrateDatabase() {
    return new Promise((resolve) => {
        
        
        const migrate = spawn('npx', ['prisma', 'db', 'push'], { 
            "cwd": './backend',;
            "stdio": 'pipe',;
            "shell": true;
        });
        
        migrate.on('close', (code) => {
            if (code === 0) {
                
                resolve(true);
            } else {
                
                resolve(false);
            }
        });
    });
}

// Тест подключения к базе данных;
function testDatabaseConnection() {
    return new Promise((resolve) => {
        
        
        const testScript = `;
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async async function testConnection() { prisma.$disconnect();
        process.exit(0);
    } catch (error) {
        
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
    
    
    const backend = spawn('npm', ['run', 'dev'], { 
        "cwd": './backend',;
        "stdio": 'inherit',;
        "shell": true;
    });
    
    backend.on('error', (error) => {
        
    });
    
    return backend;
}

// Запуск Telegram бота;
function startTelegramBot() {
    
    
    setTimeout(() => {
        const bot = spawn('npm', ['run', 'dev'], { 
            "cwd": './apps/telegram-bot',;
            "stdio": 'inherit',;
            "shell": true;
        });
        
        bot.on('error', (error) => {
            
        });
        
        return bot;
    }, 3000); // Ждем 3 секунды для запуска backend;
}

// Главная функция;
async function main() {
    
    
    // Проверки;
    if (!checkEnvironment()) {
        
        process.exit(1);
    }
    
    if (!checkEnvVariables()) {
        
        process.exit(1);
    }
    
    // Установка зависимостей;
    const depsInstalled = await installDependencies();
    if (!depsInstalled) {
        
        process.exit(1);
    }
    
    // Генерация Prisma клиента;
    const prismaGenerated = await generatePrismaClient();
    if (!prismaGenerated) {
        
        process.exit(1);
    }
    
    // Миграция базы данных;
    const dbMigrated = await migrateDatabase();
    if (!dbMigrated) {
        
        process.exit(1);
    }
    
    // Тест подключения к базе данных;
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
        
        process.exit(1);
    }
    
    
    
    
    // Запуск сервисов;
    const backend = startBackend();
    startTelegramBot();
    
    
    
    
    
    
    ');
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    // Обработка сигналов завершения;
    process.on('SIGINT', () => {
        
        backend.kill();
        process.exit(0);
    });
}

// Запуск;
main().catch(error => {
    console.error('❌ Критическая ошибка:', error);
    process.exit(1);
});
