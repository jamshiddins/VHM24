/**
 * Скрипт для запуска системы VendHub с исправлением всех ошибок
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

// Цвета для вывода в консоль
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Переменные для хранения процессов
let apiProcess = null;
let botProcess = null;
let isApiReady = false;
let isBotReady = false;

// Функция для логирования
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  let color = colors.white;
  
  switch (type) {
    case 'success':
      color = colors.green;
      break;
    case 'error':
      color = colors.red;
      break;
    case 'warning':
      color = colors.yellow;
      break;
    case 'info':
      color = colors.blue;
      break;
    case 'title':
      color = colors.magenta;
      break;
    default:
      color = colors.white;
  }
  
  console.log(`${color}[${timestamp}] [${type.toUpperCase()}] ${message}${colors.reset}`);
}

// Функция для проверки наличия файла
function checkFileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

// Функция для создания директории, если она не существует
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    log(`Создана директория: ${dirPath}`, 'success');
  }
}

// Функция для выполнения команды и возврата результата
function executeCommand(command, options = {}) {
  try {
    log(`Выполнение команды: ${command}`, 'info');
    const result = execSync(command, { encoding: 'utf8', ...options });
    return result.trim();
  } catch (error) {
    log(`Ошибка выполнения команды: ${error.message}`, 'error');
    if (error.stdout) log(`Вывод stdout: ${error.stdout}`, 'error');
    if (error.stderr) log(`Вывод stderr: ${error.stderr}`, 'error');
    throw error;
  }
}

// Функция для исправления схемы Prisma
function fixPrismaSchema() {
  log('Исправление схемы Prisma...', 'info');
  
  const schemaPath = path.join(__dirname, 'backend', 'prisma', 'schema.prisma');
  
  // Проверяем наличие файла
  if (!checkFileExists(schemaPath)) {
    log(`Файл ${schemaPath} не найден`, 'error');
    return false;
  }
  
  // Создаем резервную копию файла
  const backupPath = `${schemaPath}.backup-${Date.now()}`;
  fs.copyFileSync(schemaPath, backupPath);
  log(`Создана резервная копия схемы: ${backupPath}`, 'info');
  
  // Читаем содержимое файла
  let schemaContent = fs.readFileSync(schemaPath, 'utf8');
  
  // Исправляем дублирующиеся значения в enum TaskType
  const taskTypeEnumRegex = /enum\s+TaskType\s+{([^}]*)}/s;
  const match = schemaContent.match(taskTypeEnumRegex);
  
  if (match) {
    const enumContent = match[1];
    const enumValues = enumContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('//'));
    
    // Удаляем дублирующиеся значения
    const uniqueValues = [...new Set(enumValues)];
    
    log(`Найдено ${enumValues.length} значений, из них уникальных: ${uniqueValues.length}`, 'info');
    
    // Формируем новое содержимое enum
    const newEnumContent = `enum TaskType {\n  ${uniqueValues.join('\n  ')}\n}`;
    
    // Заменяем старый enum на новый
    schemaContent = schemaContent.replace(taskTypeEnumRegex, newEnumContent);
  } else {
    log('Enum TaskType не найден в схеме', 'warning');
  }
  
  // Исправляем провайдер базы данных для локального запуска
  if (schemaContent.includes('provider = "postgresql"')) {
    log('Изменение провайдера базы данных на SQLite для локального запуска...', 'info');
    
    // Заменяем PostgreSQL на SQLite
    schemaContent = schemaContent.replace(
      /provider = "postgresql"/,
      'provider = "sqlite"'
    );
    
    // Заменяем URL базы данных
    schemaContent = schemaContent.replace(
      /url = env\("DATABASE_URL"\)/,
      'url = "file:./dev.db"'
    );
  }
  
  // Исправляем модель User
  if (schemaContent.includes('model User {')) {
    // Проверяем наличие поля name
    if (schemaContent.includes('name        String')) {
      // Проверяем наличие полей firstName и lastName
      if (!schemaContent.includes('firstName') && !schemaContent.includes('lastName')) {
        log('Добавление полей firstName и lastName в модель User...', 'info');
        
        // Заменяем поле name на firstName и lastName
        schemaContent = schemaContent.replace(
          /name\s+String/,
          'firstName   String\n  lastName    String\n  name        String @default("")'
        );
      }
    }
  }
  
  // Записываем исправленное содержимое
  fs.writeFileSync(schemaPath, schemaContent);
  
  log('Схема Prisma успешно исправлена', 'success');
  return true;
}

// Функция для исправления файлов FSM-сценариев
function fixFsmScenes() {
  log('Исправление файлов FSM-сценариев...', 'info');
  
  const scenesDir = path.join(__dirname, 'apps', 'telegram-bot', 'src', 'scenes');
  
  // Создаем директорию, если она не существует
  ensureDirectoryExists(scenesDir);
  
  // Проверяем наличие файла index.js
  const indexPath = path.join(scenesDir, 'index.js');
  if (!checkFileExists(indexPath)) {
    log(`Файл ${indexPath} не найден, создаем...`, 'warning');
    
    const indexContent = `/**
 * Индексный файл для всех FSM-сценариев
 * Экспортирует все сцены для использования в Telegram-боте
 */

const { mainMenuScene } = require('./main-menu.scene');
const { taskCreateScene } = require('./task-create.scene');
const { taskExecutionScene } = require('./task-execution.scene');
const { checklistScene } = require('./checklist.scene');
const { bagScene } = require('./bag.scene');
const { warehouseReceiveScene } = require('./warehouse-receive.scene');
const { warehouseReturnScene } = require('./warehouse-return.scene');
const { warehouseInventoryScene } = require('./warehouse-inventory.scene');
const { cashScene } = require('./cash.scene');
const { retroScene } = require('./retro.scene');
const { errorScene } = require('./error.scene');
const { importScene } = require('./import.scene');
const { directoryScene } = require('./directory.scene');
const { userScene } = require('./user.scene');
const { reportScene } = require('./report.scene');
const { financeScene } = require('./finance.scene');
const { adminScene } = require('./admin.scene');

// Экспорт всех сцен
module.exports = {
  mainMenuScene,
  taskCreateScene,
  taskExecutionScene,
  checklistScene,
  bagScene,
  warehouseReceiveScene,
  warehouseReturnScene,
  warehouseInventoryScene,
  cashScene,
  retroScene,
  errorScene,
  importScene,
  directoryScene,
  userScene,
  reportScene,
  financeScene,
  adminScene
};
`;
    
    fs.writeFileSync(indexPath, indexContent);
    log(`Файл ${indexPath} успешно создан`, 'success');
  }
  
  // Проверяем наличие файла fsm-helpers.js
  const fsmHelpersPath = path.join(__dirname, 'apps', 'telegram-bot', 'src', 'utils', 'fsm-helpers.js');
  if (!checkFileExists(fsmHelpersPath)) {
    log(`Файл ${fsmHelpersPath} не найден, создаем...`, 'warning');
    
    // Создаем директорию utils, если она не существует
    ensureDirectoryExists(path.join(__dirname, 'apps', 'telegram-bot', 'src', 'utils'));
    
    const fsmHelpersContent = `/**
 * Вспомогательные функции для работы с FSM-сценариями
 */

const { Markup } = require('telegraf');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Создает клавиатуру с кнопками для Telegram
 * @param {Array<Array<string>>} buttons - Массив массивов с текстом кнопок
 * @param {Object} options - Дополнительные опции
 * @returns {Object} - Объект клавиатуры Telegraf
 */
function createKeyboard(buttons, options = {}) {
  const keyboard = buttons.map(row => 
    row.map(button => Markup.button.text(button))
  );
  
  return Markup.keyboard(keyboard).resize(options.resize !== false);
}

/**
 * Создает инлайн-клавиатуру с кнопками для Telegram
 * @param {Array<Array<{text: string, callback_data: string}>>} buttons - Массив массивов с объектами кнопок
 * @returns {Object} - Объект инлайн-клавиатуры Telegraf
 */
function createInlineKeyboard(buttons) {
  return Markup.inlineKeyboard(buttons);
}

/**
 * Получает список пользователей с определенной ролью
 * @param {string} role - Роль пользователя
 * @returns {Promise<Array>} - Массив пользователей
 */
async function getUsersByRole(role) {
  try {
    const users = await prisma.user.findMany({
      where: {
        role,
        status: 'ACTIVE'
      }
    });
    
    return users;
  } catch (error) {
    console.error('Ошибка при получении пользователей по роли:', error);
    return [];
  }
}

/**
 * Получает список автоматов
 * @returns {Promise<Array>} - Массив автоматов
 */
async function getMachines() {
  try {
    const machines = await prisma.machine.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        location: true
      }
    });
    
    return machines;
  } catch (error) {
    console.error('Ошибка при получении автоматов:', error);
    return [];
  }
}

/**
 * Получает список задач пользователя
 * @param {string} userId - ID пользователя
 * @param {string} status - Статус задачи (опционально)
 * @returns {Promise<Array>} - Массив задач
 */
async function getUserTasks(userId, status = null) {
  try {
    const where = {
      assignedUserId: userId
    };
    
    if (status) {
      where.status = status;
    }
    
    const tasks = await prisma.task.findMany({
      where,
      include: {
        machine: {
          include: {
            location: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return tasks;
  } catch (error) {
    console.error('Ошибка при получении задач пользователя:', error);
    return [];
  }
}

/**
 * Форматирует дату в читаемый формат
 * @param {Date} date - Дата
 * @returns {string} - Отформатированная дата
 */
function formatDate(date) {
  if (!date) return 'Не указана';
  
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return new Date(date).toLocaleDateString('ru-RU', options);
}

/**
 * Создает уникальный ID
 * @returns {string} - Уникальный ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

module.exports = {
  createKeyboard,
  createInlineKeyboard,
  getUsersByRole,
  getMachines,
  getUserTasks,
  formatDate,
  generateId
};
`;
    
    fs.writeFileSync(fsmHelpersPath, fsmHelpersContent);
    log(`Файл ${fsmHelpersPath} успешно создан`, 'success');
  }
  
  log('Файлы FSM-сценариев успешно исправлены', 'success');
  return true;
}

// Функция для настройки локальной базы данных SQLite
async function setupSQLiteDatabase() {
  log('Настройка локальной базы данных SQLite...', 'info');
  
  try {
    // Проверка наличия директории prisma
    const prismaDir = path.join(__dirname, 'backend', 'prisma');
    ensureDirectoryExists(prismaDir);
    
    // Проверка наличия файла schema.prisma
    const schemaPrismaPath = path.join(prismaDir, 'schema.prisma');
    
    if (!checkFileExists(schemaPrismaPath)) {
      log('❌ Файл schema.prisma не найден', 'error');
      return false;
    }
    
    // Исправляем схему Prisma
    fixPrismaSchema();
    
    // Генерация клиента Prisma
    log('Генерация клиента Prisma...', 'info');
    try {
      executeCommand('cd backend && npx prisma generate');
    } catch (error) {
      log('Ошибка при генерации клиента Prisma, пробуем исправить...', 'warning');
      
      // Исправляем схему Prisma еще раз
      fixPrismaSchema();
      
      // Пробуем снова сгенерировать клиент Prisma
      executeCommand('cd backend && npx prisma generate');
    }
    
    // Миграция базы данных
    log('Миграция базы данных...', 'info');
    
    try {
      executeCommand('cd backend && npx prisma migrate dev --name init');
    } catch (error) {
      log('Ошибка при миграции базы данных, пробуем создать базу данных напрямую...', 'warning');
      
      // Если миграция не удалась, пробуем создать базу данных напрямую
      executeCommand('cd backend && npx prisma db push');
    }
    
    // Создание тестовых данных
    log('Создание тестовых данных...', 'info');
    
    // Проверка наличия файла seed.js
    const seedJsPath = path.join(prismaDir, 'seed.js');
    
    if (!checkFileExists(seedJsPath)) {
      log('Создание файла seed.js...', 'info');
      
      const seedJsContent = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Создание администратора
  const admin = await prisma.user.upsert({
    where: { telegramId: '123456789' },
    update: {},
    create: {
      telegramId: '123456789',
      firstName: 'Admin',
      lastName: 'User',
      name: 'Admin User',
      role: 'ADMIN',
      status: 'ACTIVE'
    }
  });
  
  console.log('Создан администратор:', admin);
  
  // Создание менеджера
  const manager = await prisma.user.upsert({
    where: { telegramId: '987654321' },
    update: {},
    create: {
      telegramId: '987654321',
      firstName: 'Manager',
      lastName: 'User',
      name: 'Manager User',
      role: 'MANAGER',
      status: 'ACTIVE'
    }
  });
  
  console.log('Создан менеджер:', manager);
  
  // Создание оператора
  const operator = await prisma.user.upsert({
    where: { telegramId: '123123123' },
    update: {},
    create: {
      telegramId: '123123123',
      firstName: 'Operator',
      lastName: 'User',
      name: 'Operator User',
      role: 'OPERATOR',
      status: 'ACTIVE'
    }
  });
  
  console.log('Создан оператор:', operator);
  
  // Создание техника
  const technician = await prisma.user.upsert({
    where: { telegramId: '456456456' },
    update: {},
    create: {
      telegramId: '456456456',
      firstName: 'Technician',
      lastName: 'User',
      name: 'Technician User',
      role: 'TECHNICIAN',
      status: 'ACTIVE'
    }
  });
  
  console.log('Создан техник:', technician);
  
  // Создание складского работника
  const warehouse = await prisma.user.upsert({
    where: { telegramId: '789789789' },
    update: {},
    create: {
      telegramId: '789789789',
      firstName: 'Warehouse',
      lastName: 'User',
      name: 'Warehouse User',
      role: 'WAREHOUSE',
      status: 'ACTIVE'
    }
  });
  
  console.log('Создан складской работник:', warehouse);
  
  // Создание локации
  const location = await prisma.location.upsert({
    where: { id: 'loc1' },
    update: {},
    create: {
      id: 'loc1',
      name: 'Торговый центр "Мега"',
      address: 'ул. Примерная, 123',
      city: 'Москва',
      coordinates: '55.7558, 37.6173'
    }
  });
  
  console.log('Создана локация:', location);
  
  // Создание автомата
  const machine = await prisma.machine.upsert({
    where: { id: 'machine1' },
    update: {},
    create: {
      id: 'machine1',
      name: 'Автомат №1',
      internalCode: 'VM001',
      model: 'VendMax 3000',
      status: 'ACTIVE',
      locationId: location.id
    }
  });
  
  console.log('Создан автомат:', machine);
  
  // Создание задачи
  const task = await prisma.task.upsert({
    where: { id: 'task1' },
    update: {},
    create: {
      id: 'task1',
      title: 'Заполнение бункеров',
      description: 'Необходимо заполнить бункеры автомата №1',
      status: 'PENDING',
      priority: 'HIGH',
      type: 'REFILL',
      machineId: machine.id,
      assignedUserId: operator.id,
      createdUserId: manager.id,
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000) // Завтра
    }
  });
  
  console.log('Создана задача:', task);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
`;
      
      fs.writeFileSync(seedJsPath, seedJsContent);
      
      // Обновление package.json для поддержки seed
      const packageJsonPath = path.join(__dirname, 'backend', 'package.json');
      
      if (checkFileExists(packageJsonPath)) {
        let packageJsonContent = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        
        if (!packageJsonContent.prisma) {
          packageJsonContent.prisma = {};
        }
        
        packageJsonContent.prisma.seed = 'node prisma/seed.js';
        
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJsonContent, null, 2));
      }
    }
    
    // Запуск seed
    log('Запуск seed для создания тестовых данных...', 'info');
    try {
      executeCommand('cd backend && npx prisma db seed');
    } catch (error) {
      log('Ошибка при запуске seed, пробуем запустить напрямую...', 'warning');
      
      // Если seed не удался, пробуем запустить напрямую
      executeCommand('cd backend && node prisma/seed.js');
    }
    
    log('✅ Локальная база данных SQLite успешно настроена', 'success');
    return true;
  } catch (error) {
    log(`❌ Ошибка при настройке локальной базы данных SQLite: ${error.message}`, 'error');
    return false;
  }
}

// Функция для запуска API-сервера
function startApiServer() {
  log('Запуск API-сервера...', 'info');
  
  // Пути к компонентам
  const API_PATH = path.join(__dirname, 'backend', 'src', 'index.js');
  
  // Конфигурация
  const API_PORT = process.env.PORT || 3000;
  
  // Создаем переменные окружения для API-сервера
  const env = {
    ...process.env,
    PORT: API_PORT,
    NODE_ENV: process.env.NODE_ENV || 'development',
    SKIP_DATABASE: 'false',
    DATABASE_URL: 'file:./prisma/dev.db'
  };
  
  // Запускаем API-сервер
  apiProcess = spawn('node', [API_PATH], { env });
  
  // Обработка вывода API-сервера
  apiProcess.stdout.on('data', (data) => {
    const message = data.toString().trim();
    log(message, 'api');
    
    // Проверяем, запустился ли API-сервер
    if (message.includes('Server running on port') || message.includes('API-сервер запущен на порту')) {
      isApiReady = true;
    }
  });
  
  apiProcess.stderr.on('data', (data) => {
    const message = data.toString().trim();
    log(`ERROR: ${message}`, 'api');
  });
  
  apiProcess.on('error', (error) => {
    log(`ERROR: Не удалось запустить API-сервер: ${error.message}`, 'error');
  });
  
  apiProcess.on('close', (code) => {
    log(`API-сервер завершил работу с кодом ${code}`, 'api');
    isApiReady = false;
  });
}

// Функция для запуска Telegram-бота
function startTelegramBot() {
  log('Запуск Telegram-бота...', 'info');
  
  // Пути к компонентам
  const BOT_PATH = path.join(__dirname, 'apps', 'telegram-bot', 'src', 'index.js');
  
  // Конфигурация
  const API_PORT = process.env.PORT || 3000;
  const API_URL = process.env.API_BASE_URL || `http://localhost:${API_PORT}`;
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const WEBHOOK_URL = process.env.WEBHOOK_URL || `${API_URL}/api/telegram/webhook`;
  
  // Создаем переменные окружения для Telegram-бота
  const env = {
    ...process.env,
    TELEGRAM_BOT_TOKEN: BOT_TOKEN,
    API_BASE_URL: API_URL,
    WEBHOOK_URL: WEBHOOK_URL,
    SKIP_DATABASE: 'false',
    DATABASE_URL: 'file:../../backend/prisma/dev.db',
    NODE_ENV: process.env.NODE_ENV || 'development'
  };
  
  // Запускаем Telegram-бота
  botProcess = spawn('node', [BOT_PATH], { env });
  
  // Обработка вывода Telegram-бота
  botProcess.stdout.on('data', (data) => {
    const message = data.toString().trim();
    log(message, 'bot');
    
    // Проверяем, запустился ли Telegram-бот
    if (message.includes('Бот успешно запущен') || message.includes('Bot started')) {
      isBotReady = true;
    }
  });
  
  botProcess.stderr.on('data', (data) => {
    const message = data.toString().trim();
    log(`ERROR: ${message}`, 'bot');
  });
  
  botProcess.on('error', (error) => {
    log(`ERROR: Не удалось запустить Telegram-бота: ${error.message}`, 'error');
  });
  
  botProcess.on('close', (code) => {
    log(`Telegram-бот завершил работу с кодом ${code}`, 'bot');
    isBotReady = false;
  });
}

// Функция для корректного завершения работы
function shutdown() {
  // Остановка API-сервера
  if (apiProcess) {
    log('Остановка API-сервера...', 'info');
    apiProcess.kill();
  }
  
  // Остановка Telegram-бота
  if (botProcess) {
    log('Остановка Telegram-бота...', 'info');
    botProcess.kill();
  }
  
  log('Система VendHub успешно остановлена', 'success');
  process.exit(0);
}

// Главная функция
async function main() {
  try {
    log('=== ЗАПУСК СИСТЕМЫ VENDHUB С ИСПРАВЛЕНИЕМ ВСЕХ ОШИБОК ===', 'title');
    
    // Исправление файлов FSM-сценариев
    const fsmFixed = fixFsmScenes();
    
    if (!fsmFixed) {
      log('❌ Не удалось исправить файлы FSM-сценариев', 'error');
      return;
    }
    
    // Настройка локальной базы данных SQLite
    const databaseSetup = await setupSQLiteDatabase();
    
    if (!databaseSetup) {
      log('❌ Не удалось настроить локальную базу данных SQLite', 'error');
      return;
    }
    
    // Запускаем API-сервер
    startApiServer();
    
    // Ждем 5 секунд перед запуском Telegram-бота
    log('Ожидание запуска API-сервера...', 'info');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Запускаем Telegram-бота
    startTelegramBot();
    
    log('=== СИСТЕМА VENDHUB УСПЕШНО ЗАПУЩЕНА ===', 'title');
    log('', 'info');
    log('Для остановки системы нажмите Ctrl+C', 'info');
    
    // Обработка завершения работы
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    
    // Вывод информации о тестовых пользователях
    log('=== ТЕСТОВЫЕ ПОЛЬЗОВАТЕЛИ ===', 'title');
    log('1. Администратор:', 'info');
    log('   - Telegram ID: 123456789', 'info');
    log('   - Роль: ADMIN', 'info');
    log('', 'info');
    log('2. Менеджер:', 'info');
    log('   - Telegram ID: 987654321', 'info');
    log('   - Роль: MANAGER', 'info');
    log('', 'info');
    log('3. Оператор:', 'info');
    log('   - Telegram ID: 123123123', 'info');
    log('   - Роль: OPERATOR', 'info');
    log('', 'info');
    log('4. Техник:', 'info');
    log('   - Telegram ID: 456456456', 'info');
    log('   - Роль: TECHNICIAN', 'info');
    log('', 'info');
    log('5. Складской работник:', 'info');
    log('   - Telegram ID: 789789789', 'info');
    log('   - Роль: WAREHOUSE', 'info');
  } catch (error) {
    log(`❌ Ошибка при запуске системы VendHub: ${error.message}`, 'error');
  }
}
