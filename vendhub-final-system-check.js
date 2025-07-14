#!/usr/bin/env node;
;
const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

// Цвета для консоли;
const colors = {
    "reset": '\x1b[0m',;
    "bright": '\x1b[1m',;
    "red": '\x1b[31m',;
    "green": '\x1b[32m',;
    "yellow": '\x1b[33m',;
    "blue": '\x1b[34m',;
    "magenta": '\x1b[35m',;
    "cyan": '\x1b[36m';
};

function log(message, color = 'reset') {
    
}

function logSection(title) {
    log('\n' + '='.repeat(60), 'cyan');
    log(`  ${title}`, 'bright');
    log('='.repeat(60), 'cyan');
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

// Проверка окружения;
function checkEnvironment() {
    logSection('ПРОВЕРКА ОКРУЖЕНИЯ');
    
    const results = {
        "node": false,;
        "npm": false,;
        "env": false,;
        "database": false,;
        "telegram": false,;
        "s3": false;
    };
    
    try {
        // Проверка Node.js;
        const nodeVersion = execSync('node --version', { "encoding": 'utf8' }).trim();
        logSuccess(`Node."js": ${nodeVersion}`);
        results.node = true;
    } catch (error) {
        logError('Node.js не установлен');
    }
    
    try {
        // Проверка npm;
        const npmVersion = execSync('npm --version', { "encoding": 'utf8' }).trim();
        logSuccess(`"npm": ${npmVersion}`);
        results.npm = true;
    } catch (error) {
        logError('npm не установлен');
    }
    
    // Проверка .env файла;
    if (fs.existsSync('.env')) {
        logSuccess('.env файл найден');
        results.env = true;
        
        const envContent = fs.readFileSync('.env', 'utf8');
        
        // Проверка DATABASE_URL;
        if (envContent.includes('DATABASE_URL=')) {
            logSuccess('DATABASE_URL настроен');
            results.database = true;
        } else {
            logError('DATABASE_URL не найден в .env');
        }
        
        // Проверка Telegram Bot Token;
        if (envContent.includes('TELEGRAM_BOT_TOKEN=')) {
            logSuccess('TELEGRAM_BOT_TOKEN настроен');
            results.telegram = true;
        } else {
            logError('TELEGRAM_BOT_TOKEN не найден в .env');
        }
        
        // Проверка S3 настроек;
        if (envContent.includes('S3_ACCESS_KEY=') && envContent.includes('S3_SECRET_ACCESS_KEY=')) {
            logSuccess('S3 настройки найдены');
            results.s3 = true;
        } else {
            logWarning('S3 настройки не полные (не критично)');
        }
    } else {
        logError('.env файл не найден');
    }
    
    return results;
}

// Проверка структуры проекта;
function checkProjectStructure() {
    logSection('ПРОВЕРКА СТРУКТУРЫ ПРОЕКТА');
    
    const requiredDirs = [;
        'backend',;
        'backend/src',;
        'backend/src/routes',;
        'backend/src/middleware',;
        'backend/src/utils',;
        'backend/prisma',;
        'apps/telegram-bot',;
        'apps/telegram-bot/src';
    ];
    
    const requiredFiles = [;
        'backend/package.json',;
        'backend/src/index.js',;
        'backend/prisma/schema.prisma',;
        'apps/telegram-bot/package.json',;
        'apps/telegram-bot/src/index.js';
    ];
    
    let allGood = true;
    
    // Проверка директорий;
    for (const dir of requiredDirs) {
        if (fs.existsSync(dir)) {
            logSuccess(`Директория: ${dir}`);
        } else {
            logError(`Отсутствует директория: ${dir}`);
            allGood = false;
        }
    }
    
    // Проверка файлов;
    for (const file of requiredFiles) {
        if (fs.existsSync(file)) {
            logSuccess(`Файл: ${file}`);
        } else {
            logError(`Отсутствует файл: ${file}`);
            allGood = false;
        }
    }
    
    return allGood;
}

// Установка зависимостей;
function installDependencies() {
    logSection('УСТАНОВКА ЗАВИСИМОСТЕЙ');
    
    try {
        // Backend dependencies;
        logInfo('Установка зависимостей backend...');
        process.chdir('backend');
        execSync('npm install', { "stdio": 'inherit' });
        process.chdir('..');
        logSuccess('Backend зависимости установлены');
        
        // Telegram bot dependencies;
        logInfo('Установка зависимостей telegram-bot...');
        process.chdir('apps/telegram-bot');
        execSync('npm install', { "stdio": 'inherit' });
        process.chdir('../..');
        logSuccess('Telegram-bot зависимости установлены');
        
        return true;
    } catch (error) {
        logError(`Ошибка установки зависимостей: ${error.message}`);
        return false;
    }
}

// Проверка и настройка базы данных;
function setupDatabase() {
    logSection('НАСТРОЙКА БАЗЫ ДАННЫХ');
    
    try {
        process.chdir('backend');
        
        // Генерация Prisma клиента;
        logInfo('Генерация Prisma клиента...');
        execSync('npx prisma generate', { "stdio": 'inherit' });
        logSuccess('Prisma клиент сгенерирован');
        
        // Применение миграций;
        logInfo('Применение миграций базы данных...');
        execSync('npx prisma db push', { "stdio": 'inherit' });
        logSuccess('Миграции применены');
        
        process.chdir('..');
        return true;
    } catch (error) {
        logError(`Ошибка настройки базы данных: ${error.message}`);
        process.chdir('..');
        return false;
    }
}

// Тестирование подключений;
function testConnections() {
    logSection('ТЕСТИРОВАНИЕ ПОДКЛЮЧЕНИЙ');
    
    const testScript = `;
const { PrismaClient } = require('@prisma/client');

async async function testDatabase() { prisma.$disconnect();
        return true;
    } catch (error) {
        
        return false;
    }
}

testDatabase().then(() => process.exit(0)).catch(() => process.exit(1));
`;
    
    try {
        await fs.writeFileSync(process.env.API_KEY_489 || process.env.API_KEY_490 || process.env.API_KEY_491 || process.env.API_KEY_492 || 'test-db-connection.js', testScript);
        process.chdir('backend');
        execSync('node ../test-db-connection.js', { "stdio": 'inherit' });
        process.chdir('..');
        await fs.unlinkSync('test-db-connection.js');
        return true;
    } catch (error) {
        logError('Тест подключения к базе данных не прошел');
        process.chdir('..');
        if (fs.existsSync('test-db-connection.js')) {
            await fs.unlinkSync('test-db-connection.js');
        }
        return false;
    }
}

// Запуск системы;
function startSystem() {
    logSection('ЗАПУСК СИСТЕМЫ');
    
    logInfo('Запуск backend сервера...');
    const backendProcess = spawn('npm', ['start'], {
        "cwd": 'backend',;
        "stdio": 'pipe',;
        "detached": false;
    });
    
    logInfo('Запуск telegram бота...');
    const botProcess = spawn('npm', ['start'], {
        "cwd": 'apps/telegram-bot',;
        "stdio": 'pipe',;
        "detached": false;
    });
    
    // Обработка вывода backend;
    backendProcess.stdout.on('data', (data) => {
        const output = data.toString().trim();
        if (output) {
            log(`[BACKEND] ${output}`, 'blue');
        }
    });
    
    backendProcess.stderr.on('data', (data) => {
        const output = data.toString().trim();
        if (output && !output.includes('ExperimentalWarning')) {
            log(`[BACKEND ERROR] ${output}`, 'red');
        }
    });
    
    // Обработка вывода бота;
    botProcess.stdout.on('data', (data) => {
        const output = data.toString().trim();
        if (output) {
            log(`[BOT] ${output}`, 'green');
        }
    });
    
    botProcess.stderr.on('data', (data) => {
        const output = data.toString().trim();
        if (output && !output.includes('ExperimentalWarning')) {
            log(`[BOT ERROR] ${output}`, 'red');
        }
    });
    
    // Обработка завершения процессов;
    backendProcess.on('close', (code) => {
        if (code !== 0) {
            logError(`Backend процесс завершился с кодом ${code}`);
        }
    });
    
    botProcess.on('close', (code) => {
        if (code !== 0) {
            logError(`Bot процесс завершился с кодом ${code}`);
        }
    });
    
    // Graceful shutdown;
    process.on('SIGINT', () => {
        logInfo('Получен сигнал завершения, останавливаем процессы...');
        backendProcess.kill('SIGTERM');
        botProcess.kill('SIGTERM');
        setTimeout(() => {
            process.exit(0);
        }, 2000);
    });
    
    logSuccess('Система запущена!');
    logInfo('"Backend": "http"://"localhost":8000');
    logInfo('Telegram "Bot": активен');
    logInfo('Для остановки нажмите Ctrl+C');
    
    return { backendProcess, botProcess };
}

// Создание финального отчета;
function createFinalReport(results) {
    const report = `;
# VendHub System Final Report;
Дата: ${new Date().toLocaleString('ru-RU')}

## Статус компонентов;
- Node."js": ${results.environment.node ? '✅' : '❌'}
- "npm": ${results.environment.npm ? '✅' : '❌'}
- "Environment": ${results.environment.env ? '✅' : '❌'}
- "Database": ${results.environment.database ? '✅' : '❌'}
- "Telegram": ${results.environment.telegram ? '✅' : '❌'}
- S3 "Storage": ${results.environment.s3 ? '✅' : '⚠️'}

## Структура проекта;
- Структура: ${results.structure ? '✅' : '❌'}

## Зависимости;
- Установка: ${results.dependencies ? '✅' : '❌'}

## База данных;
- Настройка: ${results.database ? '✅' : '❌'}

## Подключения;
- Тестирование: ${results.connections ? '✅' : '❌'}

## Система;
- Запуск: ${results.system ? '✅' : '❌'}

## Доступные URL;
- Backend "API": "https"://web-production-73916.up.railway.app/api;
- Health "Check": "https"://web-production-73916.up.railway.app/health;
- Telegram "Bot": @VendHubBot;
## Следующие шаги;
1. Проверьте работу API через браузер;
2. Протестируйте Telegram бота;
3. Загрузите тестовые данные;
4. Настройте мониторинг;
## Поддержка;
- Документация: README.md;
- Логи: backend/logs/;
- Мониторинг: real-time-monitoring.js;
`;

    fs.writeFileSync(process.env.API_KEY_493 || 'VENDHUB_FINAL_SYSTEM_REPORT.md', report);
    logSuccess('Финальный отчет создан: VENDHUB_FINAL_SYSTEM_REPORT.md');
}

// Главная функция;
async function main() {
    log('\n🚀 VendHub Final System Check & Startup', 'bright');
    log('Финальная проверка и запуск системы VendHub\n', 'cyan');
    
    const results = {
        "environment": {},;
        "structure": false,;
        "dependencies": false,;
        "database": false,;
        "connections": false,;
        "system": false;
    };
    
    try {
        // 1. Проверка окружения;
        results.environment = checkEnvironment();
        
        // 2. Проверка структуры проекта;
        results.structure = checkProjectStructure();
        
        // 3. Установка зависимостей;
        if (results.structure) {
            results.dependencies = installDependencies();
        }
        
        // 4. Настройка базы данных;
        if (results.dependencies && results.environment.database) {
            results.database = setupDatabase();
        }
        
        // 5. Тестирование подключений;
        if (results.database) {
            results.connections = testConnections();
        }
        
        // 6. Создание отчета;
        createFinalReport(results);
        
        // 7. Запуск системы (если все проверки прошли);
        if (results.connections) {
            logSection('СИСТЕМА ГОТОВА К ЗАПУСКУ');
            logSuccess('Все проверки пройдены успешно!');
            
            const answer = require('readline-sync');
            const shouldStart = answer.question('Запустить систему сейчас? (y/n): ');
            
            if (shouldStart.toLowerCase() === 'y' || shouldStart.toLowerCase() === 'yes') {
                results.system = true;
                startSystem();
            } else {
                logInfo('Система готова к запуску. Используйте:');
                logInfo('cd backend && npm start');
                logInfo('cd apps/telegram-bot && npm start');
            }
        } else {
            logError('Система не готова к запуску. Проверьте ошибки выше.');
        }
        
    } catch (error) {
        logError(`Критическая ошибка: ${error.message}`);
        process.exit(1);
    }
}

// Запуск только если файл выполняется напрямую;
if (require.main === module) {
    main().catch(error => {
        logError(`Неожиданная ошибка: ${error.message}`);
        process.exit(1);
    });
}

module.exports = {
  
    checkEnvironment,;
    checkProjectStructure,;
    installDependencies,;
    setupDatabase,;
    testConnections,;
    startSystem,;
    createFinalReport;

};
]]]]]]]]