#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Запуск полной системы VHM24 (VendHub Manager)...\n');

// Проверка .env файла
function checkEnvFile() {
    const envPath = path.join(__dirname, '.env');
    if (!fs.existsSync(envPath)) {
        console.log('⚠️ Файл .env не найден. Создаем базовый...');
        
        const defaultEnv = `# VHM24 Environment Variables
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/vhm24"

# JWT
JWT_SECRET=your-super-secret-jwt-key-here

# Telegram Bot
TELEGRAM_BOT_TOKEN=your-telegram-bot-token-here

# API
API_BASE_URL=process.env.API_URL/api

# AWS S3 (optional)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=vhm24-uploads

# Redis (optional)
REDIS_URL=redis://localhost:6379
`;
        
        fs.writeFileSync(envPath, defaultEnv);
        console.log('✅ Создан базовый .env файл');
        console.log('📝 Пожалуйста, отредактируйте .env файл с вашими настройками\n');
    }
}

// Функция для запуска процесса
function startProcess(name, command, args, cwd) {
    return new Promise((resolve, reject) => {
        console.log(`🔄 Запуск ${name}...`);
        
        const process = spawn(command, args, {
            cwd: cwd || __dirname,
            stdio: 'pipe',
            shell: true
        });

        let output = '';
        let errorOutput = '';

        process.stdout.on('data', (data) => {
            const text = data.toString();
            output += text;
            console.log(`[${name}] ${text.trim()}`);
        });

        process.stderr.on('data', (data) => {
            const text = data.toString();
            errorOutput += text;
            console.log(`[${name}] ❌ ${text.trim()}`);
        });

        process.on('close', (code) => {
            if (code === 0) {
                console.log(`✅ ${name} запущен успешно`);
                resolve({ code, output, errorOutput });
            } else {
                console.log(`❌ ${name} завершился с кодом ${code}`);
                reject(new Error(`${name} failed with code ${code}`));
            }
        });

        process.on('error', (error) => {
            console.log(`❌ Ошибка запуска ${name}:`, error.message);
            reject(error);
        });

        // Возвращаем процесс для возможности его остановки
        return process;
    });
}

// Функция для установки зависимостей
async function installDependencies() {
    console.log('📦 Установка зависимостей...\n');
    
    try {
        // Backend dependencies
        console.log('📦 Установка зависимостей backend...');
        await startProcess('npm install (backend)', 'npm', ['install'], path.join(__dirname, 'backend'));
        
        // Telegram bot dependencies
        console.log('📦 Установка зависимостей telegram-bot...');
        await startProcess('npm install (telegram-bot)', 'npm', ['install'], path.join(__dirname, 'apps', 'telegram-bot'));
        
        console.log('✅ Все зависимости установлены\n');
    } catch (error) {
        console.log('⚠️ Ошибка установки зависимостей:', error.message);
        console.log('🔄 Продолжаем запуск...\n');
    }
}

// Функция для проверки базы данных
async function checkDatabase() {
    console.log('🗄️ Проверка базы данных...');
    
    try {
        await startProcess('Prisma Generate', 'npx', ['prisma', 'generate'], path.join(__dirname, 'backend'));
        console.log('✅ Prisma схема сгенерирована');
        
        try {
            await startProcess('Prisma Push', 'npx', ['prisma', 'db', 'push'], path.join(__dirname, 'backend'));
            console.log('✅ База данных синхронизирована');
        } catch (error) {
            console.log('⚠️ Не удалось синхронизировать базу данных');
            console.log('💡 Убедитесь, что DATABASE_URL правильно настроен в .env');
        }
    } catch (error) {
        console.log('⚠️ Ошибка работы с базой данных:', error.message);
    }
    
    console.log('');
}

// Основная функция запуска
async function startSystem() {
    try {
        console.log('🎯 VHM24 (VendHub Manager) - Система управления вендинговыми автоматами');
        console.log('=' .repeat(70));
        
        // Проверка .env
        checkEnvFile();
        
        // Установка зависимостей
        await installDependencies();
        
        // Проверка базы данных
        await checkDatabase();
        
        console.log('🚀 Запуск сервисов...\n');
        
        // Запуск backend сервера
        const backendProcess = spawn('npm', ['start'], {
            cwd: path.join(__dirname, 'backend'),
            stdio: 'pipe',
            shell: true
        });
        
        backendProcess.stdout.on('data', (data) => {
            console.log(`[Backend] ${data.toString().trim()}`);
        });
        
        backendProcess.stderr.on('data', (data) => {
            console.log(`[Backend] ❌ ${data.toString().trim()}`);
        });
        
        // Ждем немного для запуска backend
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Запуск Telegram бота
        const telegramProcess = spawn('npm', ['start'], {
            cwd: path.join(__dirname, 'apps', 'telegram-bot'),
            stdio: 'pipe',
            shell: true
        });
        
        telegramProcess.stdout.on('data', (data) => {
            console.log(`[Telegram Bot] ${data.toString().trim()}`);
        });
        
        telegramProcess.stderr.on('data', (data) => {
            console.log(`[Telegram Bot] ❌ ${data.toString().trim()}`);
        });
        
        console.log('\n🎉 Система VHM24 запущена!');
        console.log('=' .repeat(50));
        console.log('🌐 Backend API: process.env.API_URL');
        console.log('🤖 Telegram Bot: Активен');
        console.log('📊 Админ панель: process.env.API_URL/admin');
        console.log('=' .repeat(50));
        console.log('\n💡 Для остановки нажмите Ctrl+C\n');
        
        // Обработка сигналов для graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n🛑 Остановка системы...');
            backendProcess.kill('SIGTERM');
            telegramProcess.kill('SIGTERM');
            process.exit(0);
        });
        
        process.on('SIGTERM', () => {
            console.log('\n🛑 Остановка системы...');
            backendProcess.kill('SIGTERM');
            telegramProcess.kill('SIGTERM');
            process.exit(0);
        });
        
    } catch (error) {
        console.error('❌ Ошибка запуска системы:', error.message);
        process.exit(1);
    }
}

// Запуск системы
if (require.main === module) {
    startSystem();
}

module.exports = { startSystem };
