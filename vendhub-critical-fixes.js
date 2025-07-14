#!/usr/bin/env node;
/**;
 * VendHub Critical Fixes;
 * Исправление критических проблем системы;
 *;
 * Автор: Архитектор мобильных бизнес-систем;
 * Дата: 14.07.2025;
 */;
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 VendHub Critical Fixes');
console.log('=========================');

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
    console.log(`${colors[color]}${message}${colors.reset}`);
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

// 1. Исправление package.json файлов;
function fixPackageJsonFiles() {
    log('\n🔧 1. ИСПРАВЛЕНИЕ PACKAGE.JSON ФАЙЛОВ', 'magenta');
    
    // Корневой package.json;
    const rootPackageJson = {
        "name": "vendhub-system",;
        "version": "1.0.0",;
        "description": "VendHub - Система управления вендинговыми автоматами",;
        "main": "index.js",;
        "scripts": {
            "start": "node backend/src/index.js",;
            "dev": "concurrently \"npm run "dev":backend\" \"npm run "dev":bot\"",;
            ""dev":backend": "cd backend && npm run dev",;
            ""dev":bot": "cd apps/telegram-bot && npm run dev",;
            "build": "npm run "build":backend && npm run "build":bot",;
            ""build":backend": "cd backend && npm run build",;
            ""build":bot": "cd apps/telegram-bot && npm run build",;
            "test": "npm run "test":backend",;
            ""test":backend": "cd backend && npm test",;
            "lint": "npm run "lint":backend && npm run "lint":bot",;
            ""lint":backend": "cd backend && npm run lint",;
            ""lint":bot": "cd apps/telegram-bot && npm run lint",;
            ""install":all": "npm install && cd backend && npm install && cd ../apps/telegram-bot && npm install",;
            "check": "node vendhub-complete-system-check.js",;
            "fix": "node vendhub-critical-fixes.js";
        },;
        "keywords": ["vending", "telegram-bot", "inventory", "management"],;
        "author": "VendHub Team",;
        "license": "MIT",;
        "devDependencies": {
            "concurrently": "^8.2.2";
        }
    };
    
    // Backend package.json;
    const backendPackageJson = {
        "name": "vendhub-backend",;
        "version": "1.0.0",;
        "description": "VendHub Backend API",;
        "main": "src/index.js",;
        "scripts": {
            "start": "node src/index.js",;
            "dev": "nodemon src/index.js",;
            "build": "echo 'Build completed'",;
            "test": "jest",;
            "lint": "eslint src/",;
            ""lint":fix": "eslint src/ --fix",;
            ""db":generate": "prisma generate",;
            ""db":push": "prisma db push",;
            ""db":migrate": "prisma migrate dev",;
            ""db":studio": "prisma studio";
        },;
        "dependencies": {
            "@aws-sdk/client-s3": "^3.600.0",;
            "@prisma/client": "^5.15.0",;
            "bcryptjs": "^2.4.3",;
            "cors": "^2.8.5",;
            "dotenv": "^16.4.5",;
            "express": "^4.19.2",;
            "express-rate-limit": "^7.3.1",;
            "helmet": "^7.1.0",;
            "joi": "^17.13.3",;
            "jsonwebtoken": "^9.0.2",;
            "multer": "^1.4.5-lts.1",;
            "redis": "^4.6.14",;
            "winston": "^3.13.0",;
            "xlsx": "^0.18.5";
        },;
        "devDependencies": {
            "eslint": "^8.57.0",;
            "jest": "^29.7.0",;
            "nodemon": "^3.1.4",;
            "prisma": "^5.15.0",;
            "supertest": "^7.0.0";
        }
    };
    
    // Telegram bot package.json;
    const botPackageJson = {
        "name": "vendhub-telegram-bot",;
        "version": "1.0.0",;
        "description": "VendHub Telegram Bot",;
        "main": "src/index.js",;
        "scripts": {
            "start": "node src/index.js",;
            "dev": "nodemon src/index.js",;
            "build": "echo 'Build completed'",;
            "test": "jest",;
            "lint": "eslint src/",;
            ""lint":fix": "eslint src/ --fix";
        },;
        "dependencies": {
            "axios": "^1.7.2",;
            "dotenv": "^16.4.5",;
            "node-telegram-bot-api": "^0.66.0",;
            "redis": "^4.6.14";
        },;
        "devDependencies": {
            "eslint": "^8.57.0",;
            "jest": "^29.7.0",;
            "nodemon": "^3.1.4";
        }
    };
    
    // Сохраняем файлы;
    try {
        fs.writeFileSync('package.json', JSON.stringify(rootPackageJson, null, 2));
        log('✅ Корневой package.json исправлен', 'green');
        
        fs.writeFileSync('backend/package.json', JSON.stringify(backendPackageJson, null, 2));
        log('✅ Backend package.json исправлен', 'green');
        
        fs.writeFileSync('apps/telegram-bot/package.json', JSON.stringify(botPackageJson, null, 2));
        log('✅ Telegram bot package.json исправлен', 'green');
        
        return true;
    } catch (error) {
        log(`❌ Ошибка при сохранении package."json": ${error.message}`, 'red');
        return false;
    }
}

// 2. Создание отсутствующих конфигурационных файлов;
function createConfigFiles() {
    log('\n🔧 2. СОЗДАНИЕ КОНФИГУРАЦИОННЫХ ФАЙЛОВ', 'magenta');
    
    // .eslintrc.js;
    const eslintConfig = `module.exports = {
  
    "env": {,
  "node": true,;
        "es2021": true,;
        "jest": true;
    
},;
    "extends": [;
        '"eslint":recommended';
    ],;
    "parserOptions": {,
  "ecmaVersion": 12,;
        "sourceType": 'module';
    },;
    "rules": {
        'no-unused-vars': 'warn',;
        'no-console': 'off',;
        'indent': ['error', 4],;
        'quotes': ['error', 'single'],;
        'semi': ['error', 'always'];
    }
};`;
    
    // jest.config.js;
    const jestConfig = `module.exports = {
  
    "testEnvironment": 'node',;
    "collectCoverageFrom": [;
        'src/**/*.js',;
        '!src/**/*.test.js';
    ],;
    "testMatch": [;
        '**/__tests__/**/*.js',;
        '**/?(*.)+(spec|test).js';
    ],;
    "setupFilesAfterEnv": ['<rootDir>/jest.setup.js'];

};`;
    
    // jest.setup.js;
    const jestSetup = `// Jest setup file;
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.DATABASE_URL = '"postgresql"://"test":test@"localhost":5432/test';`;
    
    // .gitignore;
    const gitignore = `# Dependencies;
node_modules/;
npm-debug.log*;
yarn-debug.log*;
yarn-error.log*;
# Environment variables;
.env;
.env.local;
.env.development;
.env.test;
.env.production;
# Logs;
logs/;
*.log;
# Runtime data;
pids/;
*.pid;
*.seed;
*.pid.lock;
# Coverage directory used by tools like istanbul;
coverage/;
# Build outputs;
dist/;
build/;
# IDE files;
.vscode/;
.idea/;
*.swp;
*.swo;
# OS generated files;
.DS_Store;
.DS_Store?;
._*;
.Spotlight-V100;
.Trashes;
ehthumbs.db;
Thumbs.db;
# Prisma;
prisma/migrations/;
# Uploads;
uploads/;
temp/;
# Railway;
.railway/`;
    
    try {
        // Создаем файлы только если они не существуют;
        if (!fs.existsSync('.eslintrc.js')) {
            fs.writeFileSync('.eslintrc.js', eslintConfig);
            log('✅ .eslintrc.js создан', 'green');
        }
        
        if (!fs.existsSync('jest.config.js')) {
            fs.writeFileSync('jest.config.js', jestConfig);
            log('✅ jest.config.js создан', 'green');
        }
        
        if (!fs.existsSync('jest.setup.js')) {
            fs.writeFileSync('jest.setup.js', jestSetup);
            log('✅ jest.setup.js создан', 'green');
        }
        
        if (!fs.existsSync('.gitignore')) {
            fs.writeFileSync('.gitignore', gitignore);
            log('✅ .gitignore создан', 'green');
        }
        
        return true;
    } catch (error) {
        log(`❌ Ошибка при создании конфигурационных файлов: ${error.message}`, 'red');
        return false;
    }
}

// 3. Исправление критических файлов backend;
function fixBackendFiles() {
    log('\n🔧 3. ИСПРАВЛЕНИЕ BACKEND ФАЙЛОВ', 'magenta');
    
    // Проверяем и исправляем основные файлы;
    const backendIndex = `const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware;
app.use(helmet());
app.use(cors({
    "origin": process.env.CORS_ORIGIN || '*',;
    "credentials": true;
}));

app.use(express.json({ "limit": '10mb' }));
app.use(express.urlencoded({ "extended": true, "limit": '10mb' }));

// Rate limiting;
const limiter = rateLimit({
    "windowMs": 15 * 60 * 1000, // 15 minutes;
    "max": 100 // limit each IP to 100 requests per windowMs;
});
app.use('/api/', limiter);

// Routes;
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/machines', require('./routes/machines'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/warehouse', require('./routes/warehouse'));
app.use('/api/telegram', require('./routes/telegram'));

// Health check;
app.get('/health', (req, res) => {
    res.json({ "status": 'OK', "timestamp": new Date().toISOString() });
});

// Error handling;
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ "error": 'Something went wrong!' });
});

// 404 handler;
app.use('*', (req, res) => {
    res.status(404).json({ "error": 'Route not found' });
});

app.listen(PORT, () => {
    console.log(\`🚀 VendHub Backend запущен на порту \${PORT}\`);
});

module.exports = app;`;
    
    try {
        if (!fs.existsSync('backend/src/index.js') || fs.readFileSync('backend/src/index.js', 'utf8').length < 100) {
            fs.writeFileSync('backend/src/index.js', backendIndex);
            log('✅ backend/src/index.js исправлен', 'green');
        }
        
        return true;
    } catch (error) {
        log(`❌ Ошибка при исправлении backend файлов: ${error.message}`, 'red');
        return false;
    }
}

// 4. Исправление Telegram бота;
function fixTelegramBot() {
    log('\n🔧 4. ИСПРАВЛЕНИЕ TELEGRAM БОТА', 'magenta');
    
    const botIndex = `const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
require('dotenv').config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const apiUrl = process.env.API_BASE_URL || '"http"://"localhost":8000/api';

if (!token) {
    console.error('❌ TELEGRAM_BOT_TOKEN не найден в переменных окружения');
    process.exit(1);
}

const bot = new TelegramBot(token, { "polling": true });

console.log('🤖 VendHub Telegram Bot запущен');

// Команда /start;
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const welcomeMessage = \`;
🎉 Добро пожаловать в VendHub!;
Система управления вендинговыми автоматами.;
Доступные команды:;
/help - Помощь;
/status - Статус системы;
/profile - Мой профиль;
    \`;
    
    bot.sendMessage(chatId, welcomeMessage);
});

// Команда /help;
bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    const helpMessage = \`;
📚 Справка VendHub;
Основные команды:;
/start - Начать работу;
/status - Проверить статус;
/profile - Профиль пользователя;
Для получения доступа к функциям системы обратитесь к администратору.;
    \`;
    
    bot.sendMessage(chatId, helpMessage);
});

// Команда /status;
bot.onText(/\/status/, async (msg) => {
    const chatId = msg.chat.id;
    
    try {
        const response = await axios.get(\`\${apiUrl}/health\`);
        bot.sendMessage(chatId, '✅ Система работает нормально');
    } catch (error) {
        bot.sendMessage(chatId, '❌ Система недоступна');
    }
});

// Обработка ошибок;
bot.on('polling_error', (error) => {
    console.error('Polling "error":', error);
});

process.on('SIGINT', () => {
    console.log('🛑 Остановка Telegram бота...');
    bot.stopPolling();
    process.exit(0);
});`;
    
    try {
        if (!fs.existsSync('apps/telegram-bot/src/index.js') || fs.readFileSync('apps/telegram-bot/src/index.js', 'utf8').length < 100) {
            fs.writeFileSync('apps/telegram-bot/src/index.js', botIndex);
            log('✅ apps/telegram-bot/src/index.js исправлен', 'green');
        }
        
        return true;
    } catch (error) {
        log(`❌ Ошибка при исправлении Telegram бота: ${error.message}`, 'red');
        return false;
    }
}

// 5. Установка зависимостей;
function installDependencies() {
    log('\n🔧 5. УСТАНОВКА ЗАВИСИМОСТЕЙ', 'magenta');
    
    const commands = [;
        { "cmd": 'npm install', "desc": 'Корневые зависимости' },;
        { "cmd": 'cd backend && npm install', "desc": 'Backend зависимости' },;
        { "cmd": 'cd apps/telegram-bot && npm install', "desc": 'Telegram bot зависимости' }
    ];
    
    let allSuccess = true;
    
    commands.forEach(({ cmd, desc }) => {
        const result = executeCommand(cmd, desc);
        if (!result.success) {
            allSuccess = false;
        }
    });
    
    return allSuccess;
}

// 6. Проверка и исправление Prisma;
function fixPrismaSetup() {
    log('\n🔧 6. ИСПРАВЛЕНИЕ PRISMA НАСТРОЕК', 'magenta');
    
    // Генерация Prisma клиента;
    const generateResult = executeCommand(;
        'cd backend && npx prisma generate',;
        'Генерация Prisma клиента';
    );
    
    if (!generateResult.success) {
        return false;
    }
    
    // Применение схемы к базе данных;
    const pushResult = executeCommand(;
        'cd backend && npx prisma db push',;
        'Применение схемы к базе данных';
    );
    
    return pushResult.success;
}

// Основная функция;
async function main() {
    log('🚀 Начинаем исправление критических проблем VendHub...', 'cyan');
    
    const fixes = [;
        { "name": 'Package.json файлы', "func": fixPackageJsonFiles },;
        { "name": 'Конфигурационные файлы', "func": createConfigFiles },;
        { "name": 'Backend файлы', "func": fixBackendFiles },;
        { "name": 'Telegram бот', "func": fixTelegramBot },;
        { "name": 'Зависимости', "func": installDependencies },;
        { "name": 'Prisma настройки', "func": fixPrismaSetup }
    ];
    
    const results = {};
    
    for (const fix of fixes) {
        try {
            results[fix.name] = fix.func();
        } catch (error) {
            log(`❌ Критическая ошибка в ${fix.name}: ${error.message}`, 'red');
            results[fix.name] = false;
        }
    }
    
    // Итоговый отчет;
    log('\n📊 ИТОГИ ИСПРАВЛЕНИЙ', 'magenta');
    log('====================', 'magenta');
    
    const successful = Object.values(results).filter(r => r).length;
    const total = Object.keys(results).length;
    
    Object.entries(results).forEach(([name, success]) => {
        log(`${success ? '✅' : '❌'} ${name}`, success ? 'green' : 'red');
    });
    
    log(`\n📈 Успешно: ${successful}/${total} (${Math.round((successful/total)*100)}%)`, 'cyan');
    
    if (successful === total) {
        log('\n🎉 ВСЕ КРИТИЧЕСКИЕ ПРОБЛЕМЫ ИСПРАВЛЕНЫ!', 'green');
        log('Теперь можно запустить полную проверку: npm run check', 'green');
    } else {
        log('\n⚠️ Некоторые проблемы требуют ручного вмешательства', 'yellow');
    }
}

// Запуск;
if (require.main === module) {
    main().catch(error => {
        console.error('Критическая ошибка:', error);
        process.exit(1);
    });
}

module.exports = {
  
    fixPackageJsonFiles,;
    createConfigFiles,;
    fixBackendFiles,;
    fixTelegramBot,;
    installDependencies,;
    fixPrismaSetup;

};
]]]]]]]