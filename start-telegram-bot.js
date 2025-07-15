/**
 * Скрипт для запуска Telegram-бота без подключения к базе данных
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');

// Устанавливаем переменные окружения
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZ';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./dev.db';
process.env.SKIP_DATABASE = 'true';
process.env.API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

// Создаем директорию логов, если она не существует
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Настраиваем логирование
const logFile = path.join(logDir, `telegram-bot-${new Date().toISOString().replace(/:/g, '-')}.log`);
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

// Функция для логирования
function log(message) {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] ${message}`;
  
  console.log(formattedMessage);
  logStream.write(formattedMessage + '\n');
}

log('🚀 Запуск Telegram-бота в режиме без базы данных...');
log(`📊 Переменные окружения:`);
log(`   NODE_ENV: ${process.env.NODE_ENV}`);
log(`   TELEGRAM_BOT_TOKEN: ${process.env.TELEGRAM_BOT_TOKEN.substring(0, 10)}...`);
log(`   API_BASE_URL: ${process.env.API_BASE_URL}`);
log(`   SKIP_DATABASE: ${process.env.SKIP_DATABASE}`);

// Мокаем модуль @prisma/client
const mockPrismaClient = {
  $connect: () => {
    log('✅ Подключение к базе данных (мок)');
    return Promise.resolve();
  },
  $disconnect: () => {
    log('✅ Отключение от базы данных (мок)');
    return Promise.resolve();
  },
  $transaction: (callback) => {
    log('✅ Транзакция (мок)');
    return callback(mockPrismaClient);
  },
  user: {
    findUnique: (args) => {
      log(`📊 user.findUnique: ${JSON.stringify(args)}`);
      // Возвращаем тестового пользователя для администратора
      if (args.where && args.where.telegramId === '123456789') {
        return Promise.resolve({
          id: 'admin-id',
          telegramId: '123456789',
          name: 'Admin User',
          role: 'ADMIN',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      return Promise.resolve(null);
    },
    findMany: () => {
      log('📊 user.findMany');
      return Promise.resolve([
        {
          id: 'admin-id',
          telegramId: '123456789',
          name: 'Admin User',
          role: 'ADMIN',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'operator-id',
          telegramId: '987654321',
          name: 'Operator User',
          role: 'OPERATOR',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
    },
    create: (data) => {
      log(`📊 user.create: ${JSON.stringify(data)}`);
      return Promise.resolve({ id: 'new-user-id', ...data.data });
    },
    update: (data) => {
      log(`📊 user.update: ${JSON.stringify(data)}`);
      return Promise.resolve({ id: data.where.id, ...data.data });
    },
    delete: (data) => {
      log(`📊 user.delete: ${JSON.stringify(data)}`);
      return Promise.resolve({ id: data.where.id });
    },
  },
  machine: {
    findUnique: (args) => {
      log(`📊 machine.findUnique: ${JSON.stringify(args)}`);
      return Promise.resolve(null);
    },
    findMany: () => {
      log('📊 machine.findMany');
      return Promise.resolve([
        {
          id: 'machine-1',
          internalCode: 'M001',
          name: 'Автомат 1',
          location: 'Офис 1',
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'machine-2',
          internalCode: 'M002',
          name: 'Автомат 2',
          location: 'Офис 2',
          status: 'MAINTENANCE',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
    },
    create: (data) => {
      log(`📊 machine.create: ${JSON.stringify(data)}`);
      return Promise.resolve({ id: 'new-machine-id', ...data.data });
    },
    update: (data) => {
      log(`📊 machine.update: ${JSON.stringify(data)}`);
      return Promise.resolve({ id: data.where.id, ...data.data });
    },
    delete: (data) => {
      log(`📊 machine.delete: ${JSON.stringify(data)}`);
      return Promise.resolve({ id: data.where.id });
    },
  },
  task: {
    findUnique: (args) => {
      log(`📊 task.findUnique: ${JSON.stringify(args)}`);
      return Promise.resolve(null);
    },
    findMany: () => {
      log('📊 task.findMany');
      return Promise.resolve([
        {
          id: 'task-1',
          type: 'INGREDIENTS',
          status: 'PENDING',
          machineId: 'machine-1',
          assignedToId: 'operator-id',
          createdById: 'admin-id',
          deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
          description: 'Заменить ингредиенты',
          createdAt: new Date(),
          updatedAt: new Date(),
          machine: {
            id: 'machine-1',
            internalCode: 'M001',
            name: 'Автомат 1',
            location: 'Офис 1'
          }
        }
      ]);
    },
    create: (data) => {
      log(`📊 task.create: ${JSON.stringify(data)}`);
      return Promise.resolve({ id: 'new-task-id', ...data.data });
    },
    update: (data) => {
      log(`📊 task.update: ${JSON.stringify(data)}`);
      return Promise.resolve({ id: data.where.id, ...data.data });
    },
    delete: (data) => {
      log(`📊 task.delete: ${JSON.stringify(data)}`);
      return Promise.resolve({ id: data.where.id });
    },
  },
  importRecord: {
    create: (data) => {
      log(`📊 importRecord.create: ${JSON.stringify(data)}`);
      return Promise.resolve({ id: 'mock-id', ...data.data });
    },
  },
  ingredient: {
    findMany: () => {
      log('📊 ingredient.findMany');
      return Promise.resolve([
        { id: 'ing-1', name: 'Кофе', unit: 'г', inStock: 1000 },
        { id: 'ing-2', name: 'Сахар', unit: 'г', inStock: 2000 },
        { id: 'ing-3', name: 'Молоко', unit: 'мл', inStock: 3000 }
      ]);
    },
    findFirst: () => {
      log('📊 ingredient.findFirst');
      return Promise.resolve({ id: 'ing-1', name: 'Кофе', unit: 'г', inStock: 1000 });
    }
  },
  checklist: {
    findMany: () => {
      log('📊 checklist.findMany');
      return Promise.resolve([
        { 
          id: 'cl-1', 
          name: 'Стандартный чек-лист', 
          items: [
            { id: 'cli-1', text: 'Проверить наличие ингредиентов', order: 1 },
            { id: 'cli-2', text: 'Проверить чистоту автомата', order: 2 },
            { id: 'cli-3', text: 'Проверить работу системы оплаты', order: 3 }
          ]
        }
      ]);
    }
  }
};

// Мокаем модуль @prisma/client
require.cache[require.resolve('@prisma/client')] = {
  exports: {
    PrismaClient: function() {
      log('🔄 Создание экземпляра PrismaClient (мок)');
      return mockPrismaClient;
    }
  }
};

// Обработка сигналов завершения
process.on('SIGINT', () => {
  log('Получен сигнал SIGINT, завершение работы...');
  logStream.end();
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('Получен сигнал SIGTERM, завершение работы...');
  logStream.end();
  process.exit(0);
});

// Запускаем бота
log('🚀 Запуск Telegram-бота...');
require('./apps/telegram-bot/src/index');
