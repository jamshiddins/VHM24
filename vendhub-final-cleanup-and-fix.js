#!/usr/bin/env node;
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');




// Список файлов для удаления (дубликаты и устаревшие);
const filesToDelete = [;
    // Дубликаты отчетов;
    process.env.API_KEY_434 || 'VENDBOT_COMPLETE_AUDIT_REPORT.md',;
    process.env.API_KEY_435 || 'VENDBOT_100_PERCENT_READY_REPORT.md',;
    process.env.API_KEY_436 || 'COMPREHENSIVE_PROJECT_AUDIT_REPORT.md',;
    process.env.API_KEY_437 || 'VENDHUB_FINAL_DEPLOYMENT_REPORT.md',;
    process.env.API_KEY_438 || 'FINAL_COMPREHENSIVE_TEST_REPORT.md',;
    process.env.API_KEY_439 || 'COMPLETE_IMPROVEMENTS_REPORT.md',;
    process.env.API_KEY_440 || 'VHM24_COMPREHENSIVE_PROJECT_ANALYSIS.md',;
    process.env.API_KEY_441 || 'VHM24_EXTENDED_ANALYSIS_AND_RECOMMENDATIONS.md',;
    process.env.API_KEY_442 || 'VHM24_FINAL_ACTION_PLAN.md',;
    process.env.API_KEY_443 || 'VHM24_COMPLETE_RECOVERY_REPORT.md',;
    process.env.API_KEY_444 || 'VHM24_FINAL_COMPREHENSIVE_FIXES_COMPLETE.md',;
    process.env.API_KEY_445 || 'VHM24_ULTIMATE_FIXES_COMPLETE_REPORT.md',;
    process.env.API_KEY_446 || 'VHM24_SMART_CONSERVATIVE_FIXES_FINAL_REPORT.md',;
    process.env.API_KEY_447 || 'VHM24_FINAL_COMPLETE_RECOVERY_REPORT.md',;
    process.env.API_KEY_448 || 'VHM24_COMPREHENSIVE_ANALYSIS_AND_IMPLEMENTATION_PLAN.md',;
    process.env.API_KEY_449 || 'VHM24_COMPREHENSIVE_IMPLEMENTATION_ANALYSIS.md',;
    process.env.API_KEY_450 || 'VHM24_VENDHUB_COMPREHENSIVE_ANALYSIS_REPORT.md',;
    process.env.API_KEY_451 || 'VHM24_COMPLETE_IMPLEMENTATION_PLAN.md',;
    process.env.API_KEY_452 || 'VHM24_VENDHUB_FINAL_IMPLEMENTATION_REPORT.md',;
    // Устаревшие фиксеры;
    process.env.API_KEY_453 || 'emergency-syntax-fixer.js',;
    process.env.API_KEY_454 || 'production-deployment-system.js',;
    process.env.API_KEY_455 || 'real-time-monitoring.js',;
    process.env.API_KEY_456 || 'ultra-comprehensive-test-and-fix.js',;
    'quick-fix.js',;
    'brace-fixer.js',;
    process.env.API_KEY_457 || 'ultimate-project-fixer.js',;
    process.env.API_KEY_458 || 'smart-conservative-fixer.js',;
    process.env.API_KEY_459 || 'critical-emergency-fixer.js',;
    process.env.API_KEY_460 || 'deep-error-analyzer.js',;
    process.env.API_KEY_461 || 'ultimate-recovery-system.js',;
    process.env.API_KEY_462 || 'comprehensive-system-test.js',;
    process.env.API_KEY_463 || 'VHM24_CRITICAL_IMPLEMENTATION_FIXER.js',;
    process.env.API_KEY_464 || 'implement-phase-1-models.js',;
    process.env.API_KEY_465 || 'implement-vendhub-complete-system.js',;
    process.env.API_KEY_466 || 'implement-vendhub-system-fixed.js',;
    process.env.API_KEY_467 || 'setup-railway-database.js',;
    process.env.API_KEY_468 || 'get-railway-database-url.js',;
    process.env.API_KEY_469 || 'update-env-from-railway.js',;
    process.env.API_KEY_470 || 'get-all-keys-and-tokens.js',;
    process.env.API_KEY_471 || 'test-all-connections.js',;
    // Устаревшие тестовые файлы;
    process.env.API_KEY_472 || 'fix-and-test-system.js',;
    'test-aws-sdk-v3.js',;
    process.env.API_KEY_473 || 'railway-start-production.js',;
    'delete-user.js',;
    'mass-fix-routes.js',;
    // Дубликаты конфигов;
    process.env.API_KEY_474 || 'railway-production-secrets.env',;
    process.env.API_KEY_475 || 'QUICK_START_FIXED.md',;
    process.env.API_KEY_476 || 'install-redis-guide.md',;
    process.env.API_KEY_477 || 'VENDHUB_QUICK_START_CHECKLIST.md';
];

// Критические файлы, которые НЕ ТРОГАЕМ;
const criticalFiles = [;
    'backend/src/index.js',;
    'backend/src/routes/',;
    'backend/src/middleware/',;
    'backend/src/utils/',;
    'backend/prisma/schema.prisma',;
    'apps/telegram-bot/src/index.js',;
    'apps/telegram-bot/package.json',;
    'backend/package.json',;
    '.env',;
    'package.json',;
    'railway.toml',;
    'nixpacks.toml',;
    process.env.API_KEY_478 || 'vendhub-complete-system-check.js',;
    process.env.API_KEY_479 || 'vendhub-critical-fixes.js',;
    process.env.API_KEY_480 || 'VHM24_VENDHUB_FINAL_ANALYSIS_REPORT.md';
];

function safeDelete(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            // Проверяем, что это не критический файл;
            const isCritical = criticalFiles.some(critical =>;
                filePath.includes(critical) || critical.includes(filePath);
            );
            
            if (!isCritical) {
                fs.unlinkSync(filePath);
                
                return true;
            } else {
                
                return false;
            }
        }
    } catch (error) {
        
        return false;
    }
    return false;
}

function fixPackageJson() {
    
    
    try {
        const packagePath = 'package.json';
        if (fs.existsSync(packagePath)) {
            const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
            
            // Обновляем скрипты;
            packageData.scripts = {
                ...packageData.scripts,;
                "start": "node backend/src/index.js",;
                "dev": "nodemon backend/src/index.js",;
                "bot": "node apps/telegram-bot/src/index.js",;
                "test": "jest",;
                "build": "npm run "build":backend && npm run "build":bot",;
                ""build":backend": "echo 'Backend build complete'",;
                ""build":bot": "echo 'Bot build complete'",;
                "deploy": "npm run build && npm start",;
                "check": "node vendhub-complete-system-check.js",;
                "fix": "node vendhub-critical-fixes.js",;
                "cleanup": "node vendhub-final-cleanup-and-fix.js";
            };
            
            fs.writeFileSync(packagePath, JSON.stringify(packageData, null, 2));
            
        }
    } catch (error) {
        
    }
}

function fixEnvFile() {
    
    
    try {
        if (fs.existsSync('.env')) {
            let envContent = fs.readFileSync('.env', 'utf8');
            
            // Добавляем недостающие переменные если их нет;
            const requiredVars = [;
                'NODE_ENV=development',;
                'PORT=3000',;
                'BOT_PORT=3001',;
                'JWT_SECRET=your-super-secret-jwt-key-change-in-production',;
                'TELEGRAM_BOT_TOKEN=your-telegram-bot-token',;
                'DATABASE_URL="postgresql"://"username":password@"localhost":5432/vendhub',;
                'DO_SPACES_ENDPOINT="https"://fra1.digitaloceanspaces.com',;
                'DO_SPACES_BUCKET=vendhub-storage',;
                'DO_SPACES_ACCESS_KEY=your-access-key',;
                'DO_SPACES_SECRET_KEY=your-secret-key',;
                'REDIS_URL="redis"://"localhost":6379';
            ];
            
            requiredVars.forEach(varDef => {
                const [varName] = varDef.split('=');
                if (!envContent.includes(varName + '=')) {
                    envContent += '\n' + varDef;
                }
            });
            
            fs.writeFileSync('.env', envContent);
            
        }
    } catch (error) {
        
    }
}

function createFinalReadme() {
    
    
    const readmeContent = `# VendHub - Система управления вендинговыми автоматами;
## 🚀 Быстрый старт;
### 1. Установка зависимостей;
\`\`\`bash;
npm install;
\`\`\`;
### 2. Настройка окружения;
Скопируйте \`.env.example\` в \`.env\` и заполните переменные:;
\`\`\`bash;
cp .env.example .env;
\`\`\`;
### 3. Настройка базы данных;
\`\`\`bash;
npx prisma generate;
npx prisma db push;
\`\`\`;
### 4. Запуск системы;
\`\`\`bash;
# Проверка системы;
npm run check;
# Исправление проблем;
npm run fix;
# Запуск в разработке;
npm run dev;
# Запуск в продакшене;
npm start;
\`\`\`;
## 📁 Структура проекта;
- \`backend/\` - API сервер (Express.js + Prisma);
- \`apps/telegram-bot/\` - Telegram бот;
- \`frontend/\` - Web интерфейс (React);
- \`mobile-app/\` - Мобильное приложение;
## 🛠 Полезные команды;
- \`npm run check\` - Комплексная проверка системы;
- \`npm run fix\` - Автоматическое исправление проблем;
- \`npm run cleanup\` - Очистка проекта от лишних файлов;
- \`npm run bot\` - Запуск только Telegram бота;
- \`npm test\` - Запуск тестов;
## 📚 Документация;
Полная документация находится в файле \`VHM24_VENDHUB_FINAL_ANALYSIS_REPORT.md\`;
## 🔧 Поддержка;
Для решения проблем используйте:;
1. \`npm run check\` - диагностика;
2. \`npm run fix\` - автоисправление;
3. Проверьте логи в \`logs/\` директории;
`;

    fs.writeFileSync('README.md', readmeContent);
    
}

function main() {
    
    
    let deletedCount = 0;
    
    // Удаляем ненужные файлы;
    filesToDelete.forEach(file => {
        if (safeDelete(file)) {
            deletedCount++;
        }
    });
    
    await 
    
    // Исправляем конфигурации;
    fixPackageJson();
    fixEnvFile();
    createFinalReadme();
    
    
    
    
    
    
    
    // Создаем финальный отчет;
    const report = {
        "timestamp": new Date().toISOString(),;
        "deletedFiles": deletedCount,;
        "status": 'completed',;
        "nextSteps": [;
            'npm run check',;
            'npm run fix',;
            'npm start';
        ];
    };
    
    fs.writeFileSync('cleanup-report.json', JSON.stringify(report, null, 2));
    
}

if (require.main === module) {
    main();
}

module.exports = {
   main, safeDelete, fixPackageJson, fixEnvFile 
};
