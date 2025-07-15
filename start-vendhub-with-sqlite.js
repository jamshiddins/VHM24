/**
 * Скрипт для запуска системы VendHub с использованием локальной базы данных SQLite
 */

require('dotenv').config();
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
    
    // Чтение файла schema.prisma
    let schemaPrismaContent = fs.readFileSync(schemaPrismaPath, 'utf8');
    
    // Проверка и изменение провайдера на SQLite
    if (schemaPrismaContent.includes('provider = "postgresql"')) {
      log('Изменение провайдера базы данных на SQLite...', 'info');
      
      // Создаем резервную копию файла schema.prisma
      fs.writeFileSync(schemaPrismaPath + '.backup', schemaPrismaContent);
      
      // Заменяем провайдер на SQLite
      schemaPrismaContent = schemaPrismaContent.replace(
        /provider = "postgresql"/g,
        'provider = "sqlite"'
      );
      
      // Заменяем URL базы данных
      schemaPrismaContent = schemaPrismaContent.replace(
        /url = env\("DATABASE_URL"\)/g,
        'url = "file:./dev.db"'
      );
      
      // Записываем обновленный файл schema.prisma
      fs.writeFileSync(schemaPrismaPath, schemaPrismaContent);
      
      log('✅ Провайдер базы данных успешно изменен на SQLite', 'success');
    } else if (schemaPrismaContent.includes('provider = "sqlite"')) {
      log('✅ Провайдер базы данных уже настроен на SQLite', 'success');
    } else {
      log('❌ Не удалось определить провайдер базы данных', 'error');
      return false;
    }
    
    // Генерация клиента Prisma
    log('Генерация клиента Prisma...', 'info');
    executeCommand('cd backend && npx prisma generate');
    
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
      assignedToId: operator.id,
      createdById: manager.id,
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
    executeCommand('cd backend && npx prisma db seed');
    
    log('✅ Локальная база данных SQLite успешно настроена', 'success');
    return true;
  } catch (error) {
    log(`❌ Ошибка при настройке локальной базы данных SQLite: ${error.message}`, 'error');
    return false;
  }
}

// Функция для создания файла role-sync.js
function createRoleSyncFile() {
  log('Создание файла apps/telegram-bot/src/utils/role-sync.js...', 'info');
  
  const roleSyncPath = path.join(__dirname, 'apps', 'telegram-bot', 'src', 'utils', 'role-sync.js');
  
  // Создаем директорию, если она не существует
  ensureDirectoryExists(path.dirname(roleSyncPath));
  
  const roleSyncContent = `/**
 * Утилита для синхронизации ролей между Telegram-ботом и веб-интерфейсом
 */
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Константы ролей
const ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  WAREHOUSE: 'WAREHOUSE',
  OPERATOR: 'OPERATOR',
  TECHNICIAN: 'TECHNICIAN',
  DRIVER: 'DRIVER'
};

// Текстовые представления ролей
const ROLE_TEXTS = {
  ADMIN: 'Администратор',
  MANAGER: 'Менеджер',
  WAREHOUSE: 'Складской работник',
  OPERATOR: 'Оператор',
  TECHNICIAN: 'Техник',
  DRIVER: 'Водитель'
};

// Права доступа для ролей
const ROLE_PERMISSIONS = {
  ADMIN: ['*'], // Администратор имеет все права
  MANAGER: ['create_task', 'view_reports', 'manage_machines', 'manage_finance', 'manage_directories'],
  WAREHOUSE: ['receive_items', 'dispatch_items', 'manage_bags', 'inventory_check'],
  OPERATOR: ['execute_task', 'replace_hoppers', 'replace_water', 'clean', 'cash_collection'],
  TECHNICIAN: ['repair', 'diagnostics', 'execute_task', 'view_reports'],
  DRIVER: ['execute_task', 'view_routes']
};

/**
 * Проверка роли пользователя
 * @param {string} telegramId - Telegram ID пользователя
 * @returns {Promise<object|null>} - Информация о пользователе или null, если пользователь не найден
 */
async function checkUserRole(telegramId) {
  try {
    // Проверяем, существует ли пользователь в базе
    const user = await prisma.user.findUnique({
      where: { telegramId: telegramId.toString() }
    });
    
    if (!user) {
      console.log(\`Пользователь с Telegram ID \${telegramId} не найден\`);
      return null;
    }
    
    if (user.status !== 'ACTIVE') {
      console.log(\`Пользователь с Telegram ID \${telegramId} заблокирован\`);
      return null;
    }
    
    return {
      id: user.id,
      telegramId: user.telegramId,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      permissions: ROLE_PERMISSIONS[user.role] || []
    };
  } catch (error) {
    console.error('Ошибка при проверке роли пользователя:', error);
    return null;
  }
}

/**
 * Проверка наличия разрешения у пользователя
 * @param {string} role - Роль пользователя
 * @param {string} permission - Проверяемое разрешение
 * @returns {boolean} - true, если у пользователя есть разрешение, иначе false
 */
function hasPermission(role, permission) {
  if (!role || !permission) {
    return false;
  }
  
  // Администратор имеет все права
  if (role === ROLES.ADMIN) {
    return true;
  }
  
  // Проверяем наличие разрешения для роли
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission) || permissions.includes('*');
}

/**
 * Синхронизация пользователя с API
 * @param {object} user - Информация о пользователе
 * @returns {Promise<boolean>} - true, если синхронизация успешна, иначе false
 */
async function syncUserWithAPI(user) {
  try {
    if (!user || !user.id) {
      console.error('Ошибка синхронизации пользователя: отсутствуют данные пользователя');
      return false;
    }
    
    const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
    
    // Отправляем запрос к API для синхронизации пользователя
    const response = await axios.post(\`\${API_BASE_URL}/users/sync\`, {
      userId: user.id,
      telegramId: user.telegramId,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    }, {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200 && response.data.success) {
      console.log(\`Пользователь \${user.id} успешно синхронизирован с API\`);
      return true;
    } else {
      console.warn(\`Ошибка синхронизации пользователя \${user.id} с API: \${JSON.stringify(response.data)}\`);
      return false;
    }
  } catch (error) {
    console.error('Ошибка синхронизации пользователя с API:', error.message);
    return false;
  }
}

/**
 * Получение текстового представления роли
 * @param {string} role - Роль пользователя
 * @returns {string} - Текстовое представление роли
 */
function getRoleText(role) {
  return ROLE_TEXTS[role] || 'Пользователь';
}

module.exports = {
  ROLES,
  ROLE_TEXTS,
  ROLE_PERMISSIONS,
  checkUserRole,
  hasPermission,
  syncUserWithAPI,
  getRoleText
};`;
  
  fs.writeFileSync(roleSyncPath, roleSyncContent);
  log('Файл apps/telegram-bot/src/utils/role-sync.js успешно создан', 'success');
}

// Функция для добавления маршрута синхронизации пользователей
function addUserSyncRoute() {
  log('Проверка и исправление файла backend/src/routes/users.js...', 'info');
  
  const usersRoutePath = path.join(__dirname, 'backend', 'src', 'routes', 'users.js');
  
  if (checkFileExists(usersRoutePath)) {
    const usersRouteContent = fs.readFileSync(usersRoutePath, 'utf8');
    
    // Проверяем наличие маршрута для синхронизации пользователей
    if (!usersRouteContent.includes('/sync')) {
      log('В файле backend/src/routes/users.js отсутствует маршрут для синхронизации пользователей, добавляем...', 'warning');
      
      // Находим место для добавления нового маршрута
      const newRoute = `
/**
 * @route POST /api/users/sync
 * @desc Синхронизация пользователя между Telegram-ботом и веб-интерфейсом
 */
router.post('/sync', async (req, res) => {
  try {
    const { userId, telegramId, firstName, lastName, role } = req.body;
    
    if (!userId || !telegramId) {
      return res.status(400).json({
        success: false,
        error: 'Отсутствуют обязательные параметры'
      });
    }
    
    // Проверяем, существует ли пользователь
    let user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      // Проверяем, существует ли пользователь с таким Telegram ID
      user = await prisma.user.findUnique({
        where: { telegramId }
      });
      
      if (user) {
        // Обновляем существующего пользователя
        user = await prisma.user.update({
          where: { telegramId },
          data: {
            firstName: firstName || user.firstName,
            lastName: lastName || user.lastName,
            role: role || user.role
          }
        });
        
        return res.json({
          success: true,
          message: 'Пользователь успешно обновлен',
          user
        });
      }
      
      // Создаем нового пользователя
      user = await prisma.user.create({
        data: {
          id: userId,
          telegramId,
          firstName: firstName || '',
          lastName: lastName || '',
          role: role || 'USER',
          status: 'ACTIVE'
        }
      });
      
      return res.json({
        success: true,
        message: 'Пользователь успешно создан',
        user
      });
    }
    
    // Обновляем существующего пользователя
    user = await prisma.user.update({
      where: { id: userId },
      data: {
        telegramId,
        firstName: firstName || user.firstName,
        lastName: lastName || user.lastName,
        role: role || user.role
      }
    });
    
    res.json({
      success: true,
      message: 'Пользователь успешно синхронизирован',
      user
    });
  } catch (error) {
    console.error('Ошибка синхронизации пользователя:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка синхронизации пользователя',
      details: error.message
    });
  }
});`;
      
      // Добавляем новый маршрут перед module.exports
      const updatedContent = usersRouteContent.replace(
        /module\.exports = router;/,
        `${newRoute}\n\nmodule.exports = router;`
      );
      
      fs.writeFileSync(usersRoutePath, updatedContent);
      log('Файл backend/src/routes/users.js успешно исправлен', 'success');
    } else {
      log('Файл backend/src/routes/users.js уже содержит маршрут для синхронизации пользователей', 'success');
    }
  } else {
    log('Файл backend/src/routes/users.js не найден, создание маршрута невозможно', 'error');
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
    log('=== ЗАПУСК СИСТЕМЫ VENDHUB С ЛОКАЛЬНОЙ БАЗОЙ ДАННЫХ SQLITE ===', 'title');
    
    // Настройка локальной базы данных SQLite
    const databaseSetup = await setupSQLiteDatabase();
    
    if (!databaseSetup) {
      log('❌ Не удалось настроить локальную базу данных SQLite', 'error');
      return;
    }
    
    // Создаем файл role-sync.js
    createRoleSyncFile();
    
    // Добавляем маршрут синхронизации пользователей
    addUserSyncRoute();
    
    // Запускаем API-сервер
    startApiServer();
    
    // Ждем 5 секунд перед запуском Telegram-бота
    log('Ожидание запуска API-сервера...', 'info');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Запускаем Telegram-бота
    startTelegramBot();
    
    log('=== СИСТЕМА VENDHUB УСПЕШНО ЗАПУЩЕНА С ЛОКАЛЬНОЙ БАЗОЙ ДАННЫХ SQLITE ===', 'title');
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
    
    // Вывод инструкций по развертыванию в Railway
    log('=== ИНСТРУКЦИИ ПО РАЗВЕРТЫВАНИЮ В RAILWAY ===', 'title');
    log('1. Зарегистрируйтесь на сайте Railway (https://railway.app/)', 'info');
    log('2. Создайте новый проект из GitHub репозитория', 'info');
    log('3. Добавьте базу данных PostgreSQL в проект', 'info');
    log('4. Настройте переменные окружения:', 'info');
    log('   - DATABASE_URL: URL базы данных PostgreSQL', 'info');
    log('   - PORT: 3000', 'info');
    log('   - NODE_ENV: production', 'info');
    log('   - TELEGRAM_BOT_TOKEN: токен вашего Telegram-бота', 'info');
    log('   - API_BASE_URL: URL вашего API (например, https://your-app.railway.app)', 'info');
    log('   - WEBHOOK_URL: URL вебхука Telegram (например, https://your-app.railway.app/api/telegram/webhook)', 'info');
    log('5. Дождитесь завершения развертывания', 'info');
    log('6. Настройте вебхук Telegram, отправив запрос:', 'info');
    log('   https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=<WEBHOOK_URL>', 'info');
    log('7. Проверьте работоспособность системы, отправив сообщение боту', 'info');
  } catch (error) {
    log(`❌ Ошибка запуска системы: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Запуск системы
main().catch(error => {
  log(`❌ Критическая ошибка: ${error.message}`, 'error');
  process.exit(1);
});
