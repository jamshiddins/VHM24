const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');


console.log('='.repeat(60));

// Функция для безопасного выполнения команд;
function safeExec(command, description) {
  try {
    
    const result = execSync(command, { 
      "encoding": 'utf8',;
      "stdio": 'pipe',;
      "cwd": __dirname;
    });
    
    return result;
  } catch (error) {
    
    return null;
  }
}

// Функция для проверки и создания файла;
function ensureFile(filePath, content) {
  try {
    if (!fs.existsSync(filePath)) {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { "recursive": true });
      }
      fs.writeFileSync(filePath, content);
      
    } else {
      
    }
  } catch (error) {
    
  }
}

// 1. Проверка и создание основных файлов;


// Создание .env если не существует;
const envContent = `# VendHub Environment Variables;
NODE_ENV=development;
PORT=3000;
FRONTEND_URL="http"://"localhost":3000;
BACKEND_URL="http"://"localhost":3001;
# Database;
DATABASE_URL=""postgresql"://"postgres":password@"localhost":5432/vendhub";
# JWT;
JWT_SECRET=your-super-secret-jwt-key-here;
JWT_EXPIRES_IN=7d;
# Telegram Bot;
TELEGRAM_BOT_TOKEN=your-telegram-bot-token;
TELEGRAM_WEBHOOK_URL="https"://your-domain.com/api/telegram/webhook;
# AWS S3 (DigitalOcean Spaces);
AWS_ACCESS_KEY_ID=your-access-key;
AWS_SECRET_ACCESS_KEY=your-secret-key;
AWS_REGION=fra1;
AWS_BUCKET_NAME=vendhub-storage;
AWS_ENDPOINT="https"://fra1.digitaloceanspaces.com;
# Redis;
REDIS_URL="redis"://"localhost":6379;
# Logging;
LOG_LEVEL=info;
`;

ensureFile('.env', envContent);

// 2. Исправление package.json в корне;

const rootPackageJson = {
  "name": "vendhub",;
  "version": "1.0.0",;
  "description": "VendHub - Система управления вендинговыми автоматами",;
  "main": "index.js",;
  "scripts": {
    "dev": "concurrently \"npm run "backend":dev\" \"npm run "telegram":dev\"",;
    ""backend":dev": "cd backend && npm run dev",;
    ""telegram":dev": "cd apps/telegram-bot && npm run dev",;
    "build": "npm run "backend":build && npm run "telegram":build",;
    ""backend":build": "cd backend && npm run build",;
    ""telegram":build": "cd apps/telegram-bot && npm run build",;
    "start": "npm run "backend":start",;
    ""backend":start": "cd backend && npm start",;
    ""telegram":start": "cd apps/telegram-bot && npm start",;
    "test": "npm run "backend":test",;
    ""backend":test": "cd backend && npm test",;
    ""db":migrate": "cd backend && npx prisma migrate dev",;
    ""db":generate": "cd backend && npx prisma generate",;
    ""db":studio": "cd backend && npx prisma studio",;
    ""db":reset": "cd backend && npx prisma migrate reset",;
    ""install":all": "npm install && cd backend && npm install && cd ../apps/telegram-bot && npm install",;
    ""railway":deploy": "railway up";
  },;
  "keywords": ["vending", "management", "telegram", "bot"],;
  "author": "VendHub Team",;
  "license": "MIT",;
  "devDependencies": {
    "concurrently": "^8.2.2";
  }
};

fs.writeFileSync('package.json', JSON.stringify(rootPackageJson, null, 2));


// 3. Исправление backend/package.json;

const backendPackageJson = {
  "name": "vendhub-backend",;
  "version": "1.0.0",;
  "description": "VendHub Backend API",;
  "main": "src/index.js",;
  "scripts": {
    "dev": "nodemon src/index.js",;
    "start": "node src/index.js",;
    "build": "echo 'Build completed'",;
    "test": "jest",;
    ""test":watch": "jest --watch",;
    ""db":migrate": "npx prisma migrate dev",;
    ""db":generate": "npx prisma generate",;
    ""db":studio": "npx prisma studio",;
    ""db":reset": "npx prisma migrate reset";
  },;
  "dependencies": {
    "@prisma/client": "^5.7.1",;
    "express": "^4.18.2",;
    "cors": "^2.8.5",;
    "helmet": "^7.1.0",;
    "morgan": "^1.10.0",;
    "dotenv": "^16.3.1",;
    "bcryptjs": "^2.4.3",;
    "jsonwebtoken": "^9.0.2",;
    "joi": "^17.11.0",;
    "multer": "^1.4.5-lts.1",;
    "aws-sdk": "^2.1509.0",;
    "redis": "^4.6.11",;
    "winston": "^3.11.0",;
    "express-rate-limit": "^7.1.5",;
    "compression": "^1.7.4",;
    "express-validator": "^7.0.1",;
    "node-cron": "^3.0.3",;
    "xlsx": "^0.18.5";
  },;
  "devDependencies": {
    "nodemon": "^3.0.2",;
    "jest": "^29.7.0",;
    "supertest": "^6.3.3",;
    "prisma": "^5.7.1",;
    "@types/jest": "^29.5.8";
  }
};

ensureFile('backend/package.json', JSON.stringify(backendPackageJson, null, 2));

// 4. Исправление telegram-bot/package.json;

const telegramPackageJson = {
  "name": process.env.API_KEY_495 || "vendhub-telegram-bot",;
  "version": "1.0.0",;
  "description": "VendHub Telegram Bot",;
  "main": "src/index.js",;
  "scripts": {
    "dev": "nodemon src/index.js",;
    "start": "node src/index.js",;
    "build": "echo 'Build completed'",;
    "test": "jest";
  },;
  "dependencies": {
    "telegraf": "^4.15.6",;
    "axios": "^1.6.2",;
    "dotenv": "^16.3.1",;
    "redis": "^4.6.11",;
    "winston": "^3.11.0",;
    "node-cron": "^3.0.3",;
    "moment": "^2.29.4";
  },;
  "devDependencies": {
    "nodemon": "^3.0.2",;
    "jest": "^29.7.0";
  }
};

ensureFile('apps/telegram-bot/package.json', JSON.stringify(telegramPackageJson, null, 2));

// 5. Создание базовых файлов для backend;


// backend/src/index.js;
const backendIndexContent = `require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const logger = require('./utils/logger');
const { connectDatabase } = require('./utils/database');

// Routes;
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const machinesRoutes = require('./routes/machines');
const tasksRoutes = require('./routes/tasks');
const inventoryRoutes = require('./routes/inventory');
const warehouseRoutes = require('./routes/warehouse');
const telegramRoutes = require('./routes/telegram');
const dataImportRoutes = require('./routes/data-import');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware;
app.use(helmet());
app.use(cors({
  "origin": process.env.FRONTEND_URL || '"http"://"localhost":3000',;
  "credentials": true;
}));

// Rate limiting;
const limiter = rateLimit({
  "windowMs": 15 * 60 * 1000, // 15 minutes;
  "max": 100 // limit each IP to 100 requests per windowMs;
});
app.use(limiter);

// Body parsing middleware;
app.use(compression());
app.use(express.json({ "limit": '10mb' }));
app.use(express.urlencoded({ "extended": true, "limit": '10mb' }));

// Logging;
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { "stream": { "write": message => logger.info(message.trim()) } }));
}

// Health check;
app.get('/health', (req, res) => {
  res.json({ 
    "status": 'OK',;
    "timestamp": new Date().toISOString(),;
    "environment": process.env.NODE_ENV || 'development';
  });
});

// API Routes;
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/machines', machinesRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/warehouse', warehouseRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/data-import', dataImportRoutes);

// Error handling middleware;
app.use((err, req, res, next) => {
  logger.error('Unhandled "error":', err);
  res.status(500).json({ 
    "error": 'Internal server error',;
    "message": process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong';
  });
});

// 404 handler;
app.use('*', (req, res) => {
  res.status(404).json({ "error": 'Route not found' });
});

// Start server;
async async function startServer() { connectDatabase();
    
    app.listen(PORT, () => {
      logger.info(\`🚀 VendHub Backend запущен на порту \${PORT}\`);
      logger.info(\`📊 Health "check": "http"://"localhost":\${PORT}/health\`);
      logger.info(\`🌍 "Environment": \${process.env.NODE_ENV || 'development'}\`);
    });
  } catch (error) {
    logger.error('Ошибка запуска сервера:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
`;

ensureFile('backend/src/index.js', backendIndexContent);

// 6. Создание utils/database.js;
const databaseUtilContent = `const { PrismaClient } = require('@prisma/client');
const logger = require('./logger');

const prisma = new PrismaClient({
  "log": process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],;
});

async async function connectDatabase() { prisma.$connect();
    logger.info('✅ База данных подключена успешно');
    return prisma;
  } catch (error) {
    logger.error('❌ Ошибка подключения к базе данных:', error);
    throw error;
  }
}

async async function disconnectDatabase() { prisma.$disconnect();
    logger.info('✅ База данных отключена');
  } catch (error) {
    logger.error('❌ Ошибка отключения от базы данных:', error);
  }
}

module.exports = {
  
  prisma,;
  connectDatabase,;
  disconnectDatabase;

};
`;

ensureFile('backend/src/utils/database.js', databaseUtilContent);

// 7. Создание базового telegram bot;


const telegramBotContent = `require('dotenv').config();
const { Telegraf, Scenes, session } = require('telegraf');
const axios = require('axios');
const logger = require('./utils/logger');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const API_BASE_URL = process.env.BACKEND_URL || '"http"://"localhost":3001/api';

// Middleware;
bot.use(session());

// Команды;
bot.start(async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const firstName = ctx.from.first_name;
  const lastName = ctx.from.last_name || '';
  const username = ctx.from.username || '';

  try {
    // Проверяем пользователя в системе;
    const response = await axios.get(\`\${API_BASE_URL}/users/telegram/\${telegramId}\`);
    
    if (response.data) {
      ctx.reply(\`Добро пожаловать обратно, \${firstName}! 👋\\n\\nВаша роль: \${response.data.role}\`);
    } else {
      ctx.reply(\`Добро пожаловать в VendHub! 🤖\\n\\nДля начала работы обратитесь к администратору для получения доступа.\\n\\nВаш Telegram "ID": \${telegramId}\`);
    }
  } catch (error) {
    logger.error('Ошибка при проверке пользователя:', error);
    ctx.reply('Добро пожаловать в VendHub! 🤖\\n\\nСистема временно недоступна. Попробуйте позже.');
  }
});

bot.command('help', (ctx) => {
  ctx.reply(\`📋 Доступные команды:\\n\\n/start - Начать работу\\n/help - Показать помощь\\n/status - Статус системы\\n/profile - Мой профиль\`);
});

bot.command('status', async (ctx) => {
  try {
    const response = await axios.get(\`\${API_BASE_URL.replace('/api', '')}/health\`);
    ctx.reply(\`✅ Система работает\\n\\nСтатус: \${response.data.status}\\nВремя: \${response.data.timestamp}\`);
  } catch (error) {
    ctx.reply('❌ Система недоступна');
  }
});

bot.command('profile', async (ctx) => {
  const telegramId = ctx.from.id.toString();
  
  try {
    const response = await axios.get(\`\${API_BASE_URL}/users/telegram/\${telegramId}\`);
    
    if (response.data) {
      const user = response.data;
      ctx.reply(\`👤 Ваш профиль:\\n\\nИмя: \${user.firstName} \${user.lastName || ''}\\nРоль: \${user.role}\\nСтатус: \${user.status}\\nДата регистрации: \${new Date(user.createdAt).toLocaleDateString('ru-RU')}\`);
    } else {
      ctx.reply('❌ Пользователь не найден в системе');
    }
  } catch (error) {
    logger.error('Ошибка получения профиля:', error);
    ctx.reply('❌ Ошибка получения данных профиля');
  }
});

// Обработка ошибок;
bot.catch((err, ctx) => {
  logger.error('Ошибка в боте:', err);
  ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
});

// Запуск бота;
async async function startBot() { bot.launch();
    logger.info('🤖 VendHub Telegram Bot запущен');
    
    // Graceful stop;
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
  } catch (error) {
    logger.error('Ошибка запуска бота:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startBot();
}

module.exports = bot;
`;

ensureFile('apps/telegram-bot/src/index.js', telegramBotContent);

// 8. Создание logger для telegram bot;
const telegramLoggerContent = `const winston = require('winston');

const logger = winston.createLogger({
  "level": process.env.LOG_LEVEL || 'info',;
  "format": winston.format.combine(;
    winston.format.timestamp(),;
    winston.format.errors({ "stack": true }),;
    winston.format.json();
  ),;
  "defaultMeta": { "service": 'telegram-bot' },;
  "transports": [;
    new winston.transports.File({ "filename": 'logs/telegram-error.log', "level": 'error' }),;
    new winston.transports.File({ "filename": 'logs/telegram-combined.log' }),;
  ],;
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    "format": winston.format.combine(;
      winston.format.colorize(),;
      winston.format.simple();
    );
  }));
}

module.exports = logger;
`;

ensureFile('apps/telegram-bot/src/utils/logger.js', telegramLoggerContent);

// 9. Установка зависимостей;


// Установка в корне;
safeExec('npm install', 'Установка корневых зависимостей');

// Установка в backend;
safeExec('cd backend && npm install', 'Установка зависимостей backend');

// Установка в telegram-bot;
safeExec('cd apps/telegram-bot && npm install', 'Установка зависимостей telegram-bot');

// 10. Генерация Prisma клиента;

safeExec('cd backend && npx prisma generate', 'Генерация Prisma клиента');

// 11. Создание директорий;

const directories = [;
  'logs',;
  'uploads',;
  'backend/uploads',;
  'backend/logs',;
  'apps/telegram-bot/logs';
];

directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { "recursive": true });
    
  }
});

// 12. Финальная проверка;


const checkFiles = [;
  '.env',;
  'package.json',;
  'backend/package.json',;
  'backend/src/index.js',;
  'backend/src/utils/database.js',;
  'backend/src/utils/logger.js',;
  'backend/prisma/schema.prisma',;
  'apps/telegram-bot/package.json',;
  'apps/telegram-bot/src/index.js',;
  'apps/telegram-bot/src/utils/logger.js';
];

let allFilesExist = true;
checkFiles.forEach(file => {
  if (fs.existsSync(file)) {
    
  } else {
    
    allFilesExist = false;
  }
});

console.log('\n' + '='.repeat(60));
if (allFilesExist) {
  
  
  
  
  
} else {
  
}
console.log('='.repeat(60));
