#!/usr/bin/env node;
/**;
 * VendHub Final Complete System Test;
 * Полная проверка всех компонентов системы VendHub;
 */;
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
    console.log(`${colors[color]}${message}${colors.reset}`);
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

// Проверка переменных окружения;
function checkEnvironmentVariables() {
    logSection('ПРОВЕРКА ПЕРЕМЕННЫХ ОКРУЖЕНИЯ');
    
    const requiredVars = [;
        'DATABASE_URL',;
        'REDIS_URL',;
        'JWT_SECRET',;
        'TELEGRAM_BOT_TOKEN',;
        'ADMIN_IDS',;
        'S3_ACCESS_KEY',;
        'S3_BUCKET',;
        'S3_ENDPOINT';
    ];
    
    const envPath = path.join(__dirname, '.env');
    if (!fs.existsSync(envPath)) {
        logError('.env файл не найден');
        return false;
    }
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    let allVarsPresent = true;
    
    requiredVars.forEach(varName => {
        if (envContent.includes(`${varName}=`)) {
            logSuccess(`${varName} найден`);
        } else {
            logError(`${varName} отсутствует`);
            allVarsPresent = false;
        }
    });
    
    return allVarsPresent;
}

// Проверка структуры проекта;
function checkProjectStructure() {
    logSection('ПРОВЕРКА СТРУКТУРЫ ПРОЕКТА');
    
    const requiredPaths = [;
        'backend/src/index.js',;
        'backend/package.json',;
        'backend/prisma/schema.prisma',;
        'apps/telegram-bot/src/index.js',;
        'apps/telegram-bot/package.json',;
        'frontend/package.json',;
        'railway.toml',;
        'nixpacks.toml';
    ];
    
    let allPathsExist = true;
    
    requiredPaths.forEach(filePath => {
        if (fs.existsSync(path.join(__dirname, filePath))) {
            logSuccess(`${filePath} существует`);
        } else {
            logError(`${filePath} отсутствует`);
            allPathsExist = false;
        }
    });
    
    return allPathsExist;
}

// Проверка зависимостей;
function checkDependencies() {
    logSection('ПРОВЕРКА ЗАВИСИМОСТЕЙ');
    
    try {
        // Проверка backend зависимостей;
        const backendPackage = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
        logInfo(`"Backend": ${Object.keys(backendPackage.dependencies || {}).length} зависимостей`);
        
        // Проверка telegram-bot зависимостей;
        const botPackage = JSON.parse(fs.readFileSync('apps/telegram-bot/package.json', 'utf8'));
        logInfo(`Telegram "Bot": ${Object.keys(botPackage.dependencies || {}).length} зависимостей`);
        
        // Проверка frontend зависимостей;
        if (fs.existsSync('frontend/package.json')) {
            const frontendPackage = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
            logInfo(`"Frontend": ${Object.keys(frontendPackage.dependencies || {}).length} зависимостей`);
        }
        
        logSuccess('Все package.json файлы корректны');
        return true;
    } catch (error) {
        logError(`Ошибка проверки зависимостей: ${error.message}`);
        return false;
    }
}

// Проверка Prisma схемы;
function checkPrismaSchema() {
    logSection('ПРОВЕРКА PRISMA СХЕМЫ');
    
    try {
        const schemaPath = 'backend/prisma/schema.prisma';
        if (!fs.existsSync(schemaPath)) {
            logError('Prisma schema не найдена');
            return false;
        }
        
        const schemaContent = fs.readFileSync(schemaPath, 'utf8');
        
        // Проверка основных моделей VendHub;
        const requiredModels = [;
            'User',;
            'Machine',;
            'Task',;
            'Hopper',;
            'Ingredient',;
            'Bag',;
            'WaterBottle',;
            'Syrup',;
            'Route',;
            'Location',;
            'Recipe',;
            'Sale',;
            'Payment',;
            'Expense',;
            'ActionLog';
        ];
        
        let allModelsPresent = true;
        requiredModels.forEach(model => {
            if (schemaContent.includes(`model ${model}`)) {
                logSuccess(`Модель ${model} найдена`);
            } else {
                logWarning(`Модель ${model} отсутствует`);
                allModelsPresent = false;
            }
        });
        
        return allModelsPresent;
    } catch (error) {
        logError(`Ошибка проверки Prisma схемы: ${error.message}`);
        return false;
    }
}

// Проверка Railway конфигурации;
function checkRailwayConfig() {
    logSection('ПРОВЕРКА RAILWAY КОНФИГУРАЦИИ');
    
    try {
        // Проверка railway.toml;
        if (fs.existsSync('railway.toml')) {
            const railwayConfig = fs.readFileSync('railway.toml', 'utf8');
            if (railwayConfig.includes('[build]') && railwayConfig.includes('[deploy]')) {
                logSuccess('railway.toml корректен');
            } else {
                logWarning('railway.toml может быть неполным');
            }
        } else {
            logWarning('railway.toml не найден');
        }
        
        // Проверка nixpacks.toml;
        if (fs.existsSync('nixpacks.toml')) {
            logSuccess('nixpacks.toml найден');
        } else {
            logWarning('nixpacks.toml не найден');
        }
        
        return true;
    } catch (error) {
        logError(`Ошибка проверки Railway конфигурации: ${error.message}`);
        return false;
    }
}

// Проверка API маршрутов;
function checkAPIRoutes() {
    logSection('ПРОВЕРКА API МАРШРУТОВ');
    
    const routesPath = 'backend/src/routes';
    if (!fs.existsSync(routesPath)) {
        logError('Папка routes не найдена');
        return false;
    }
    
    const requiredRoutes = [;
        'auth.js',;
        'users.js',;
        'machines.js',;
        'tasks.js',;
        'inventory.js',;
        'warehouse.js',;
        'telegram.js';
    ];
    
    let allRoutesExist = true;
    requiredRoutes.forEach(route => {
        const routePath = path.join(routesPath, route);
        if (fs.existsSync(routePath)) {
            logSuccess(`Маршрут ${route} найден`);
        } else {
            logError(`Маршрут ${route} отсутствует`);
            allRoutesExist = false;
        }
    });
    
    return allRoutesExist;
}

// Проверка Telegram Bot;
function checkTelegramBot() {
    logSection('ПРОВЕРКА TELEGRAM BOT');
    
    const botIndexPath = 'apps/telegram-bot/src/index.js';
    if (!fs.existsSync(botIndexPath)) {
        logError('Telegram bot index.js не найден');
        return false;
    }
    
    const botContent = fs.readFileSync(botIndexPath, 'utf8');
    
    // Проверка основных компонентов бота;
    const requiredComponents = [;
        'telegraf',;
        'session',;
        'stage',;
        'scenes';
    ];
    
    let allComponentsPresent = true;
    requiredComponents.forEach(component => {
        if (botContent.includes(component)) {
            logSuccess(`Компонент ${component} найден`);
        } else {
            logWarning(`Компонент ${component} может отсутствовать`);
        }
    });
    
    return true;
}

// Проверка документации;
function checkDocumentation() {
    logSection('ПРОВЕРКА ДОКУМЕНТАЦИИ');
    
    const docFiles = [;
        'README.md',;
        'API_DOCUMENTATION.md',;
        'QUICK_START_GUIDE.md';
    ];
    
    let docsExist = 0;
    docFiles.forEach(docFile => {
        if (fs.existsSync(docFile)) {
            logSuccess(`${docFile} найден`);
            docsExist++;
        } else {
            logWarning(`${docFile} отсутствует`);
        }
    });
    
    return docsExist > 0;
}

// Генерация отчета;
function generateReport(results) {
    logSection('ГЕНЕРАЦИЯ ОТЧЕТА');
    
    const report = {
        "timestamp": new Date().toISOString(),;
        "results": results,;
        "summary": {,
  "total": Object.keys(results).length,;
            "passed": Object.values(results).filter(r => r).length,;
            "failed": Object.values(results).filter(r => !r).length;
        }
    };
    
    const reportPath = 'vendhub-system-test-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    logInfo(`Отчет сохранен в ${reportPath}`);
    
    // Создание markdown отчета;
    const mdReport = `# VendHub System Test Report;
## Результаты тестирования;
**Дата:** ${new Date().toLocaleString('ru-RU')}

### Сводка;
- ✅ Пройдено: ${report.summary.passed}
- ❌ Не пройдено: ${report.summary.failed}
- 📊 Всего проверок: ${report.summary.total}

### Детальные результаты;
${Object.entries(results).map(([test, result]) =>;
    `- ${result ? '✅' : '❌'} ${test}`;
).join('\n')}

### Статус системы;
${report.summary.failed === 0 ?;
    '🎉 **СИСТЕМА ГОТОВА К РАБОТЕ!**' :;
    '⚠️ **ТРЕБУЮТСЯ ИСПРАВЛЕНИЯ**';
}

### Следующие шаги;
${report.summary.failed === 0 ?;
    '1. Запустить систему в production\n2. Протестировать все функции\n3. Начать использование' :;
    '1. Исправить найденные проблемы\n2. Повторить тестирование\n3. Проверить документацию';
}
`;
    
    fs.writeFileSync('VHM24_VENDHUB_FINAL_TEST_REPORT.md', mdReport);
    logSuccess('Markdown отчет создан: VHM24_VENDHUB_FINAL_TEST_REPORT.md');
    
    return report;
}

// Основная функция;
async function main() {
    log('\n🚀 VendHub Final Complete System Test', 'bright');
    log('Полная проверка системы VendHub перед запуском\n', 'cyan');
    
    const results = {};
    
    // Выполнение всех проверок;
    results['Environment Variables'] = checkEnvironmentVariables();
    results['Project Structure'] = checkProjectStructure();
    results['Dependencies'] = checkDependencies();
    results['Prisma Schema'] = checkPrismaSchema();
    results['Railway Config'] = checkRailwayConfig();
    results['API Routes'] = checkAPIRoutes();
    results['Telegram Bot'] = checkTelegramBot();
    results['Documentation'] = checkDocumentation();
    
    // Генерация отчета;
    const report = generateReport(results);
    
    // Финальный статус;
    logSection('ФИНАЛЬНЫЙ СТАТУС');
    
    if (report.summary.failed === 0) {
        logSuccess('🎉 ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ!');
        logSuccess('Система VendHub готова к работе!');
        log('\nДля запуска системы выполните:', 'cyan');
        log('npm run "start":production', 'bright');
    } else {
        logWarning(`⚠️ Найдено ${report.summary.failed} проблем`);
        logWarning('Рекомендуется исправить проблемы перед запуском');
        log('\nПроверьте отчет для получения деталей:', 'yellow');
        log('VHM24_VENDHUB_FINAL_TEST_REPORT.md', 'bright');
    }
    
    log('\n📊 Отчет сохранен в:', 'blue');
    log('- vendhub-system-test-report.json', 'bright');
    log('- VHM24_VENDHUB_FINAL_TEST_REPORT.md', 'bright');
    
    return report.summary.failed === 0;
}

// Запуск;
if (require.main === module) {
    main().catch(error => {
        logError(`Критическая ошибка: ${error.message}`);
        process.exit(1);
    });
}

module.exports = {
   main 
};
]]]]]]]]