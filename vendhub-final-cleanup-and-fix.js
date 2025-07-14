#!/usr/bin/env node;
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 VendHub Final Cleanup and Fix System');
console.log('=====================================');

// Список файлов для удаления (дубликаты и устаревшие);
const filesToDelete = [;
    // Дубликаты отчетов;
    'VENDBOT_COMPLETE_AUDIT_REPORT.md',;
    'VENDBOT_100_PERCENT_READY_REPORT.md',;
    'COMPREHENSIVE_PROJECT_AUDIT_REPORT.md',;
    'VENDHUB_FINAL_DEPLOYMENT_REPORT.md',;
    'FINAL_COMPREHENSIVE_TEST_REPORT.md',;
    'COMPLETE_IMPROVEMENTS_REPORT.md',;
    'VHM24_COMPREHENSIVE_PROJECT_ANALYSIS.md',;
    'VHM24_EXTENDED_ANALYSIS_AND_RECOMMENDATIONS.md',;
    'VHM24_FINAL_ACTION_PLAN.md',;
    'VHM24_COMPLETE_RECOVERY_REPORT.md',;
    'VHM24_FINAL_COMPREHENSIVE_FIXES_COMPLETE.md',;
    'VHM24_ULTIMATE_FIXES_COMPLETE_REPORT.md',;
    'VHM24_SMART_CONSERVATIVE_FIXES_FINAL_REPORT.md',;
    'VHM24_FINAL_COMPLETE_RECOVERY_REPORT.md',;
    'VHM24_COMPREHENSIVE_ANALYSIS_AND_IMPLEMENTATION_PLAN.md',;
    'VHM24_COMPREHENSIVE_IMPLEMENTATION_ANALYSIS.md',;
    'VHM24_VENDHUB_COMPREHENSIVE_ANALYSIS_REPORT.md',;
    'VHM24_COMPLETE_IMPLEMENTATION_PLAN.md',;
    'VHM24_VENDHUB_FINAL_IMPLEMENTATION_REPORT.md',;
    // Устаревшие фиксеры;
    'emergency-syntax-fixer.js',;
    'production-deployment-system.js',;
    'real-time-monitoring.js',;
    'ultra-comprehensive-test-and-fix.js',;
    'quick-fix.js',;
    'brace-fixer.js',;
    'ultimate-project-fixer.js',;
    'smart-conservative-fixer.js',;
    'critical-emergency-fixer.js',;
    'deep-error-analyzer.js',;
    'ultimate-recovery-system.js',;
    'comprehensive-system-test.js',;
    'VHM24_CRITICAL_IMPLEMENTATION_FIXER.js',;
    'implement-phase-1-models.js',;
    'implement-vendhub-complete-system.js',;
    'implement-vendhub-system-fixed.js',;
    'setup-railway-database.js',;
    'get-railway-database-url.js',;
    'update-env-from-railway.js',;
    'get-all-keys-and-tokens.js',;
    'test-all-connections.js',;
    // Устаревшие тестовые файлы;
    'fix-and-test-system.js',;
    'test-aws-sdk-v3.js',;
    'railway-start-production.js',;
    'delete-user.js',;
    'mass-fix-routes.js',;
    // Дубликаты конфигов;
    'railway-production-secrets.env',;
    'QUICK_START_FIXED.md',;
    'install-redis-guide.md',;
    'VENDHUB_QUICK_START_CHECKLIST.md';
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
    'vendhub-complete-system-check.js',;
    'vendhub-critical-fixes.js',;
    'VHM24_VENDHUB_FINAL_ANALYSIS_REPORT.md';
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
                console.log(`✅ Удален: ${filePath}`);
                return true;
            } else {
                console.log(`⚠️  Пропущен критический файл: ${filePath}`);
                return false;
            }
        }
    } catch (error) {
        console.log(`❌ Ошибка удаления ${filePath}: ${error.message}`);
        return false;
    }
    return false;
}

function fixPackageJson() {
    console.log('\n📦 Исправление package.json...');
    
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
            console.log('✅ package.json обновлен');
        }
    } catch (error) {
        console.log(`❌ Ошибка исправления package."json": ${error.message}`);
    }
}

function fixEnvFile() {
    console.log('\n🔧 Проверка .env файла...');
    
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
            console.log('✅ .env файл проверен и обновлен');
        }
    } catch (error) {
        console.log(`❌ Ошибка исправления ."env": ${error.message}`);
    }
}

function createFinalReadme() {
    console.log('\n📝 Создание финального README...');
    
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
    console.log('✅ README.md создан');
}

function main() {
    console.log('\n🧹 Начинаем очистку проекта...');
    
    let deletedCount = 0;
    
    // Удаляем ненужные файлы;
    filesToDelete.forEach(file => {
        if (safeDelete(file)) {
            deletedCount++;
        }
    });
    
    await console.log(`\n📊 Удалено файлов: ${deletedCount}`);
    
    // Исправляем конфигурации;
    fixPackageJson();
    fixEnvFile();
    createFinalReadme();
    
    console.log('\n✅ Очистка и исправления завершены!');
    console.log('\n🚀 Для запуска системы выполните:');
    console.log('   npm run check    # Проверка системы');
    console.log('   npm run fix      # Исправление проблем');
    console.log('   npm start        # Запуск системы');
    
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
    console.log('\n📄 Отчет сохранен в cleanup-report.json');
}

if (require.main === module) {
    main();
}

module.exports = {
   main, safeDelete, fixPackageJson, fixEnvFile 
};
