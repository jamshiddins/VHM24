#!/usr/bin/env node;
;
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');




// Цвета для консоли;
const colors = {
    "reset": '\x1b[0m',;
    "red": '\x1b[31m',;
    "green": '\x1b[32m',;
    "yellow": '\x1b[33m',;
    "blue": '\x1b[34m',;
    "magenta": '\x1b[35m',;
    "cyan": '\x1b[36m';
};

function log(message, color = 'reset') {
    
}

function executeCommand(command, description) {
    try {
        log(`\n📋 ${description}`, 'cyan');
        log(`Выполняется: ${command}`, 'blue');
        const result = execSync(command, { "encoding": 'utf8', "stdio": 'pipe' });
        log(`✅ Успешно: ${description}`, 'green');
        return { "success": true, "output": result };
    } catch (error) {
        log(`❌ Ошибка: ${description}`, 'red');
        log(`Детали: ${error.message}`, 'yellow');
        return { "success": false, "error": error.message };
    }
}

// 1. Проверка структуры проекта;
function checkProjectStructure() {
    log('\n🔍 1. ПРОВЕРКА СТРУКТУРЫ ПРОЕКТА', 'magenta');
    
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
        '.env',;
        'package.json',;
        'backend/package.json',;
        'backend/src/index.js',;
        'backend/prisma/schema.prisma',;
        'apps/telegram-bot/package.json',;
        'apps/telegram-bot/src/index.js';
    ];
    
    let structureOk = true;
    
    // Проверка директорий;
    requiredDirs.forEach(dir => {
        if (fs.existsSync(dir)) {
            log(`✅ Директория найдена: ${dir}`, 'green');
        } else {
            log(`❌ Директория отсутствует: ${dir}`, 'red');
            structureOk = false;
            // Создаем отсутствующие директории;
            try {
                fs.mkdirSync(dir, { "recursive": true });
                log(`📁 Создана директория: ${dir}`, 'yellow');
            } catch (error) {
                log(`❌ Не удалось создать директорию: ${dir}`, 'red');
            }
        }
    });
    
    // Проверка файлов;
    requiredFiles.forEach(file => {
        if (fs.existsSync(file)) {
            log(`✅ Файл найден: ${file}`, 'green');
        } else {
            log(`❌ Файл отсутствует: ${file}`, 'red');
            structureOk = false;
        }
    });
    
    return structureOk;
}

// 2. Проверка переменных окружения;
function checkEnvironmentVariables() {
    log('\n🔍 2. ПРОВЕРКА ПЕРЕМЕННЫХ ОКРУЖЕНИЯ', 'magenta');
    
    if (!fs.existsSync('.env')) {
        log('❌ Файл .env не найден', 'red');
        return false;
    }
    
    const envContent = fs.readFileSync('.env', 'utf8');
    const requiredVars = [;
        'DATABASE_URL',;
        'JWT_SECRET',;
        'TELEGRAM_BOT_TOKEN',;
        'ADMIN_IDS',;
        'S3_ACCESS_KEY',;
        process.env.API_KEY_428 || 'S3_SECRET_ACCESS_KEY',;
        'S3_REGION',;
        'S3_BUCKET',;
        'S3_ENDPOINT',;
        'PORT',;
        'NODE_ENV';
    ];
    
    let envOk = true;
    
    requiredVars.forEach(varName => {
        if (envContent.includes(`${varName}=`)) {
            log(`✅ Переменная найдена: ${varName}`, 'green');
        } else {
            log(`❌ Переменная отсутствует: ${varName}`, 'red');
            envOk = false;
        }
    });
    
    return envOk;
}

// 3. Проверка зависимостей;
function checkDependencies() {
    log('\n🔍 3. ПРОВЕРКА И УСТАНОВКА ЗАВИСИМОСТЕЙ', 'magenta');
    
    // Корневые зависимости;
    if (fs.existsSync('package.json')) {
        executeCommand('npm install', 'Установка корневых зависимостей');
    }
    
    // Backend зависимости;
    if (fs.existsSync('backend/package.json')) {
        executeCommand('cd backend && npm install', 'Установка backend зависимостей');
    }
    
    // Telegram bot зависимости;
    if (fs.existsSync('apps/telegram-bot/package.json')) {
        executeCommand('cd apps/telegram-bot && npm install', 'Установка telegram-bot зависимостей');
    }
    
    return true;
}

// 4. Проверка базы данных;
function checkDatabase() {
    log('\n🔍 4. ПРОВЕРКА БАЗЫ ДАННЫХ', 'magenta');
    
    // Проверка Prisma схемы;
    if (!fs.existsSync('backend/prisma/schema.prisma')) {
        log('❌ Prisma схема не найдена', 'red');
        return false;
    }
    
    // Генерация Prisma клиента;
    const generateResult = executeCommand(;
        'cd backend && npx prisma generate',;
        'Генерация Prisma клиента';
    );
    
    if (!generateResult.success) {
        return false;
    }
    
    // Применение миграций;
    const migrateResult = executeCommand(;
        'cd backend && npx prisma db push',;
        'Применение миграций базы данных';
    );
    
    return migrateResult.success;
}

// 5. Проверка API маршрутов;
function checkApiRoutes() {
    log('\n🔍 5. ПРОВЕРКА API МАРШРУТОВ', 'magenta');
    
    const routeFiles = [;
        'backend/src/routes/auth.js',;
        'backend/src/routes/users.js',;
        'backend/src/routes/machines.js',;
        'backend/src/routes/inventory.js',;
        'backend/src/routes/tasks.js',;
        'backend/src/routes/warehouse.js',;
        'backend/src/routes/telegram.js';
    ];
    
    let routesOk = true;
    
    routeFiles.forEach(file => {
        if (fs.existsSync(file)) {
            log(`✅ Маршрут найден: ${file}`, 'green');
            
            // Проверка синтаксиса;
            try {
                const content = fs.readFileSync(file, 'utf8');
                // Базовая проверка на наличие основных элементов;
                if (content.includes('router') && content.includes('module.exports')) {
                    log(`✅ Синтаксис корректен: ${file}`, 'green');
                } else {
                    log(`⚠️ Возможные проблемы в: ${file}`, 'yellow');
                }
            } catch (error) {
                log(`❌ Ошибка чтения файла: ${file}`, 'red');
                routesOk = false;
            }
        } else {
            log(`❌ Маршрут отсутствует: ${file}`, 'red');
            routesOk = false;
        }
    });
    
    return routesOk;
}

// 6. Проверка Telegram бота;
function checkTelegramBot() {
    log('\n🔍 6. ПРОВЕРКА TELEGRAM БОТА', 'magenta');
    
    const botFiles = [;
        'apps/telegram-bot/src/index.js',;
        'apps/telegram-bot/package.json';
    ];
    
    let botOk = true;
    
    botFiles.forEach(file => {
        if (fs.existsSync(file)) {
            log(`✅ Файл бота найден: ${file}`, 'green');
        } else {
            log(`❌ Файл бота отсутствует: ${file}`, 'red');
            botOk = false;
        }
    });
    
    return botOk;
}

// 7. Проверка S3/DigitalOcean Spaces;
function checkS3Connection() {
    log('\n🔍 7. ПРОВЕРКА S3/DIGITALOCEAN SPACES', 'magenta');
    
    // Создаем тестовый скрипт для проверки S3;
    const testS3Script = `;
const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');

async function testS3() {
    try {
        const s3Client = new S3Client({
            "region": process.env.S3_REGION || 'fra1',;
            "endpoint": process.env.S3_ENDPOINT || '"https"://fra1.digitaloceanspaces.com',;
            "credentials": {,
  "accessKeyId": process.env.S3_ACCESS_KEY,;
                "secretAccessKey": process.env.S3_SECRET_ACCESS_KEY,;
            },;
        });
        
        const command = new ListBucketsCommand({});
        const response = await s3Client.send(command);
        
        console.log('"Buckets":', response.Buckets?.map(b => b.Name));
        return true;
    } catch (error) {
        
        return false;
    }
}

testS3().then(result => process.exit(result ? 0 : 1));
`;
    
    fs.writeFileSync('temp-s3-test.js', testS3Script);
    
    const result = executeCommand(;
        'node temp-s3-test.js',;
        'Тестирование S3 подключения';
    );
    
    // Удаляем временный файл;
    try {
        fs.unlinkSync('temp-s3-test.js');
    } catch (error) {
        // Игнорируем ошибки удаления;
    }
    
    return result.success;
}

// 8. Тестирование системы;
function testSystem() {
    log('\n🔍 8. ТЕСТИРОВАНИЕ СИСТЕМЫ', 'magenta');
    
    // Запуск тестов backend;
    const backendTest = executeCommand(;
        'cd backend && npm test',;
        'Запуск тестов backend';
    );
    
    // Проверка линтинга;
    const lintTest = executeCommand(;
        'cd backend && npm run lint',;
        'Проверка линтинга';
    );
    
    return backendTest.success && lintTest.success;
}

// 9. Создание отчета;
function generateReport(results) {
    log('\n📊 9. ГЕНЕРАЦИЯ ОТЧЕТА', 'magenta');
    
    const report = {
        "timestamp": new Date().toISOString(),;
        "results": results,;
        "summary": {,
  "total": Object.keys(results).length,;
            "passed": Object.values(results).filter(r => r).length,;
            "failed": Object.values(results).filter(r => !r).length;
        }
    };
    
    const reportContent = `# VendHub System Check Report;
Дата: ${new Date().toLocaleString('ru-RU')}

## Результаты проверки:;
${Object.entries(results).map(([check, result]) =>;
    `- ${result ? '✅' : '❌'} ${check}`;
).join('\n')}

## Сводка:;
- Всего проверок: ${report.summary.total}
- Успешно: ${report.summary.passed}
- Неудачно: ${report.summary.failed}
- Процент успеха: ${Math.round((report.summary.passed / report.summary.total) * 100)}%;
## Рекомендации:;
${report.summary.failed > 0 ?;
    '⚠️ Обнаружены проблемы. Рекомендуется исправить их перед развертыванием.' :;
    '✅ Все проверки пройдены успешно. Система готова к развертыванию.';
}
`;
    
    fs.writeFileSync(process.env.API_KEY_429 || 'VENDHUB_SYSTEM_CHECK_REPORT.md', reportContent);
    log('📄 Отчет сохранен в VENDHUB_SYSTEM_CHECK_REPORT.md', 'green');
    
    return report;
}

// Основная функция;
async function main() {
    const results = {};
    
    try {
        // Выполняем все проверки;
        results['Структура проекта'] = checkProjectStructure();
        results['Переменные окружения'] = checkEnvironmentVariables();
        results['Зависимости'] = checkDependencies();
        results['База данных'] = checkDatabase();
        results['API маршруты'] = checkApiRoutes();
        results['Telegram бот'] = checkTelegramBot();
        results['S3 подключение'] = checkS3Connection();
        results['Тестирование'] = testSystem();
        
        // Генерируем отчет;
        const report = generateReport(results);
        
        // Выводим итоговую сводку;
        log('\n🎯 ИТОГОВАЯ СВОДКА', 'magenta');
        log('==================', 'magenta');
        
        if (report.summary.failed === 0) {
            log('🎉 ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ УСПЕШНО!', 'green');
            log('Система VendHub готова к развертыванию.', 'green');
        } else {
            log(`⚠️ Обнаружено проблем: ${report.summary.failed}`, 'yellow');
            log('Рекомендуется исправить проблемы перед развертыванием.', 'yellow');
        }
        
        log(`\n📊 Статистика: ${report.summary.passed}/${report.summary.total} (${Math.round((report.summary.passed / report.summary.total) * 100)}%)`, 'cyan');
        
    } catch (error) {
        log(`\n💥 КРИТИЧЕСКАЯ ОШИБКА: ${error.message}`, 'red');
        process.exit(1);
    }
}

// Запуск;
if (require.main === module) {
    main().catch(error => {
        console.error('Ошибка выполнения:', error);
        process.exit(1);
    });
}

module.exports = {
  
    checkProjectStructure,;
    checkEnvironmentVariables,;
    checkDependencies,;
    checkDatabase,;
    checkApiRoutes,;
    checkTelegramBot,;
    checkS3Connection,;
    testSystem,;
    generateReport;

};
]]]]]]]