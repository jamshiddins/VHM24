#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Запуск полной системы VHM24 (VendHub Manager)...\n');

// Проверка .env файла
function checkEnvFile() {
    const envPath = path.join(__dirname, '.env');
    if (!fs.existsSync(envPath)) {
        
        
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
        
        
    }
}

// Функция для запуска процесса
function startProcess(name, command, args, cwd) {
    return new Promise((resolve, reject) => {
        
        
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
                
                resolve({ code, output, errorOutput });
            } else {
                
                reject(new Error(`${name} failed with code ${code}`));
            }
        });

        process.on('error', (error) => {
            
            reject(error);
        });

        // Возвращаем процесс для возможности его остановки
        return process;
    });
}

// Функция для установки зависимостей
async function installDependencies() {
    
    
    try {
        // Backend dependencies
        
        await startProcess('npm install (backend)', 'npm', ['install'], path.join(__dirname, 'backend'));
        
        // Telegram bot dependencies
        
        await startProcess('npm install (telegram-bot)', 'npm', ['install'], path.join(__dirname, 'apps', 'telegram-bot'));
        
        
    } catch (error) {
        
        
    }
}

// Функция для проверки базы данных
async function checkDatabase() {
    
    
    try {
        await startProcess('Prisma Generate', 'npx', ['prisma', 'generate'], path.join(__dirname, 'backend'));
        
        
        try {
            await startProcess('Prisma Push', 'npx', ['prisma', 'db', 'push'], path.join(__dirname, 'backend'));
            
        } catch (error) {
            
            
        }
    } catch (error) {
        
    }
    
    
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
        
        
        console.log('=' .repeat(50));
        
        
        
        console.log('=' .repeat(50));
        
        
        // Обработка сигналов для graceful shutdown
        process.on('SIGINT', () => {
            
            backendProcess.kill('SIGTERM');
            telegramProcess.kill('SIGTERM');
            process.exit(0);
        });
        
        process.on('SIGTERM', () => {
            
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
