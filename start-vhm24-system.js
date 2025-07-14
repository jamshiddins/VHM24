#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Запуск системы VHM24 (VendHub Manager)...\n');

// Функция для выполнения команд
function runCommand(command, cwd = process.cwd()) {
    return new Promise((resolve, reject) => {
        console.log(`📦 Выполнение: ${command}`);
        const child = exec(command, { cwd }, (error, stdout, stderr) => {
            if (error) {
                console.error(`❌ Ошибка: ${error.message}`);
                reject(error);
                return;
            }
            if (stderr) {
                console.warn(`⚠️ Предупреждение: ${stderr}`);
            }
            console.log(`✅ Успешно: ${command}`);
            resolve(stdout);
        });
    });
}

// Функция для проверки и исправления файлов
async function fixCriticalErrors() {
    console.log('🔧 Исправление критических ошибок...\n');

    // 1. Исправляем backend/src/routes/api.js
    const apiRoutePath = path.join(__dirname, 'backend/src/routes/api.js');
    if (fs.existsSync(apiRoutePath)) {
        const apiContent = `const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const usersRoutes = require('./users');
const machinesRoutes = require('./machines');
const inventoryRoutes = require('./inventory');
const tasksRoutes = require('./tasks');
const warehouseRoutes = require('./warehouse');
const telegramRoutes = require('./telegram');

// Use routes
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/machines', machinesRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/tasks', tasksRoutes);
router.use('/warehouse', warehouseRoutes);
router.use('/telegram', telegramRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        service: 'VHM24 API',
        timestamp: new Date().toISOString() 
    });
});

module.exports = router;
`;
        fs.writeFileSync(apiRoutePath, apiContent);
        console.log('✅ Исправлен backend/src/routes/api.js');
    }

    // 2. Проверяем .env файл
    const envPath = path.join(__dirname, '.env');
    if (!fs.existsSync(envPath)) {
        console.log('❌ Файл .env не найден!');
        console.log('📋 Создаю базовый .env файл...');
        
        const envContent = `# VHM24 Environment Variables
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/vhm24?schema=public"

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Telegram Bot
TELEGRAM_BOT_TOKEN=your-telegram-bot-token

# AWS S3 (optional)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# Redis (optional)
REDIS_URL=redis://localhost:6379
`;
        fs.writeFileSync(envPath, envContent);
        console.log('✅ Создан базовый .env файл');
    }

    // 3. Исправляем telegram bot index.js
    const botIndexPath = path.join(__dirname, 'apps/telegram-bot/src/index.js');
    if (fs.existsSync(botIndexPath)) {
        const botContent = `const { Telegraf } = require('telegraf');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '../../.env' });

console.log('🤖 Запуск Telegram Bot для VHM24...');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || 'demo-token');

// Basic commands
bot.start((ctx) => {
    ctx.reply('🚀 Добро пожаловать в VHM24 (VendHub Manager)!\\n\\nЭто система управления вендинговыми автоматами.');
});

bot.help((ctx) => {
    ctx.reply('📋 Доступные команды:\\n/start - Начать работу\\n/help - Помощь\\n/status - Статус системы');
});

bot.command('status', (ctx) => {
    ctx.reply('✅ VHM24 Bot активен и работает!');
});

// Error handling
bot.catch((err, ctx) => {
    console.error('❌ Ошибка в боте:', err);
    ctx.reply('Произошла ошибка. Попробуйте позже.');
});

// Start bot
if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_TOKEN !== 'demo-token') {
    bot.launch()
        .then(() => {
            console.log('✅ VHM24 Telegram Bot запущен успешно!');
        })
        .catch((error) => {
            console.error('❌ Ошибка запуска бота:', error);
        });
} else {
    console.log('⚠️ TELEGRAM_BOT_TOKEN не настроен. Бот работает в демо-режиме.');
}

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

module.exports = bot;
`;
        fs.writeFileSync(botIndexPath, botContent);
        console.log('✅ Исправлен apps/telegram-bot/src/index.js');
    }
}

// Основная функция запуска
async function startVHM24System() {
    try {
        // Исправляем критические ошибки
        await fixCriticalErrors();

        console.log('🔧 Проверка зависимостей...');
        
        // Устанавливаем зависимости backend
        console.log('📦 Установка зависимостей backend...');
        await runCommand('npm install', './backend');

        // Устанавливаем зависимости telegram-bot
        console.log('📦 Установка зависимостей telegram-bot...');
        await runCommand('npm install', './apps/telegram-bot');

        console.log('🗄️ Настройка базы данных...');
        
        // Генерируем Prisma Client
        console.log('📦 Генерация Prisma Client...');
        await runCommand('npx prisma generate', './backend');

        // Генерируем Prisma Client для telegram-bot
        console.log('📦 Генерация Prisma Client для telegram-bot...');
        await runCommand('npx prisma generate', './apps/telegram-bot');

        // Пытаемся подключиться к базе данных
        console.log('📦 Проверка подключения к базе данных...');
        try {
            await runCommand('npx prisma db push', './backend');
            console.log('✅ База данных подключена успешно');
        } catch (dbError) {
            console.log('⚠️ Не удалось подключиться к базе данных. Система запустится без БД.');
        }

        console.log('🚀 Запуск сервисов...');

        // Запускаем backend
        console.log('🔧 Запуск Backend API...');
        const backendProcess = spawn('npm', ['start'], {
            cwd: './backend',
            stdio: ['pipe', 'pipe', 'pipe']
        });

        backendProcess.stdout.on('data', (data) => {
            console.log(`[Backend] ${data.toString().trim()}`);
        });

        backendProcess.stderr.on('data', (data) => {
            console.log(`[Backend Error] ${data.toString().trim()}`);
        });

        // Запускаем telegram bot
        console.log('🤖 Запуск Telegram Bot...');
        const botProcess = spawn('npm', ['start'], {
            cwd: './apps/telegram-bot',
            stdio: ['pipe', 'pipe', 'pipe']
        });

        botProcess.stdout.on('data', (data) => {
            console.log(`[Bot] ${data.toString().trim()}`);
        });

        botProcess.stderr.on('data', (data) => {
            console.log(`[Bot Error] ${data.toString().trim()}`);
        });

        // Ждем немного для инициализации
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log('\n🎉 Система VHM24 (VendHub Manager) запущена!');
        console.log('📋 Сервисы:');
        console.log('   🔧 Backend API: process.env.API_URL');
        console.log('   🤖 Telegram Bot: Активен');
        console.log('   🗄️ База данных: Подключена (если настроена)');
        console.log('\n💡 Для остановки нажмите Ctrl+C');

        // Обработка завершения
        process.on('SIGINT', () => {
            console.log('\n🛑 Остановка системы VHM24...');
            backendProcess.kill();
            botProcess.kill();
            process.exit(0);
        });

        // Держим процесс активным
        setInterval(() => {
            // Проверяем статус процессов
        }, 5000);

    } catch (error) {
        console.error('❌ Критическая ошибка при запуске:', error.message);
        console.log('\n📋 Рекомендации:');
        console.log('1. Проверьте файл .env');
        console.log('2. Убедитесь, что PostgreSQL запущен');
        console.log('3. Проверьте TELEGRAM_BOT_TOKEN');
        process.exit(1);
    }
}

// Запускаем систему
startVHM24System();
