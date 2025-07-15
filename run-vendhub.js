/**
 * Скрипт для запуска VendHub с исправленными ролями и API-подключениями
 */

require('dotenv').config();
const path = require('path');
const { spawn } = require('child_process');
const axios = require('axios');
const fs = require('fs');

// Конфигурация
const API_PORT = process.env.PORT || 3000;
const API_URL = process.env.API_BASE_URL || `http://localhost:${API_PORT}`;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const WEBHOOK_URL = process.env.WEBHOOK_URL || `${API_URL}/api/telegram/webhook`;

// Пути к компонентам
const API_PATH = path.join(__dirname, 'backend', 'src', 'index.js');
const BOT_PATH = path.join(__dirname, 'apps', 'telegram-bot', 'src', 'index.js');

// Переменные для хранения процессов
let apiProcess = null;
let botProcess = null;
let isApiReady = false;
let isBotReady = false;

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

// Функция для исправления файла main-menu.scene.js
function fixMainMenuScene() {
  log('Проверка и исправление файла apps/telegram-bot/src/scenes/main-menu.scene.js...', 'info');
  
  const mainMenuScenePath = path.join(__dirname, 'apps', 'telegram-bot', 'src', 'scenes', 'main-menu.scene.js');
  
  if (checkFileExists(mainMenuScenePath)) {
    const mainMenuSceneContent = fs.readFileSync(mainMenuScenePath, 'utf8');
    
    // Проверяем наличие импорта role-sync
    if (!mainMenuSceneContent.includes('role-sync')) {
      log('В файле apps/telegram-bot/src/scenes/main-menu.scene.js отсутствует импорт role-sync, исправляем...', 'warning');
      
      // Добавляем импорт role-sync
      const updatedContent = mainMenuSceneContent.replace(
        /const states = require\('\.\.\/states'\);/,
        `const states = require('../states');
const { checkUserRole, getRoleText, syncUserWithAPI } = require('../utils/role-sync');`
      );
      
      // Заменяем функцию handleAuthCheck
      const updatedContent2 = updatedContent.replace(
        /async function handleAuthCheck\(ctx\) {[\s\S]*?}/,
        `async function handleAuthCheck(ctx) {
  try {
    const telegramId = ctx.from.id.toString();
    
    // Проверяем роль пользователя с помощью role-sync
    const user = await checkUserRole(telegramId);
    
    if (!user) {
      // Пользователь не найден или заблокирован
      await ctx.reply('⚠️ Вы не зарегистрированы в системе или ваш аккаунт заблокирован. Обратитесь к администратору.');
      ctx.session.state = 'unauthorized';
      return;
    }
    
    // Синхронизируем пользователя с API
    await syncUserWithAPI(user);
    
    // Сохраняем данные пользователя в сессии
    ctx.session.user = user;
    
    // Переходим к отображению главного меню
    ctx.session.state = 'main_menu';
    await handleMainMenu(ctx);
  } catch (error) {
    console.error('Ошибка при проверке авторизации:', error);
    await ctx.reply('❌ Ошибка авторизации. Попробуйте позже.');
    await ctx.scene.leave();
  }
}`
      );
      
      // Заменяем функцию getRoleText
      const updatedContent3 = updatedContent2.replace(
        /function getRoleText\(role\) {[\s\S]*?}/,
        `// Используем функцию getRoleText из role-sync
// function getRoleText(role) {
//   const roles = {
//     ADMIN: 'Администратор',
//     MANAGER: 'Менеджер',
//     WAREHOUSE: 'Складской работник',
//     OPERATOR: 'Оператор',
//     TECHNICIAN: 'Техник',
//     DRIVER: 'Водитель'
//   };
//   
//   return roles[role] || 'Пользователь';
// }`
      );
      
      fs.writeFileSync(mainMenuScenePath, updatedContent3);
      log('Файл apps/telegram-bot/src/scenes/main-menu.scene.js успешно исправлен', 'success');
    } else {
      log('Файл apps/telegram-bot/src/scenes/main-menu.scene.js уже содержит импорт role-sync', 'success');
    }
  } else {
    log('Файл apps/telegram-bot/src/scenes/main-menu.scene.js не найден', 'error');
  }
}

// Функция для запуска API-сервера
function startApiServer() {
  log('Запуск API-сервера...', 'info');
  
  // Создаем переменные окружения для API-сервера
  const env = {
    ...process.env,
    PORT: API_PORT,
    NODE_ENV: process.env.NODE_ENV || 'development',
    SKIP_DATABASE: process.env.SKIP_DATABASE || 'false',
    DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db'
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
  
  // Создаем переменные окружения для Telegram-бота
  const env = {
    ...process.env,
    TELEGRAM_BOT_TOKEN: BOT_TOKEN,
    API_BASE_URL: API_URL,
    WEBHOOK_URL: WEBHOOK_URL,
    SKIP_DATABASE: process.env.SKIP_DATABASE || 'false',
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
    log('=== ЗАПУСК СИСТЕМЫ VENDHUB ===', 'title');
    
    // Создаем файл role-sync.js
    createRoleSyncFile();
    
    // Добавляем маршрут синхронизации пользователей
    addUserSyncRoute();
    
    // Исправляем файл main-menu.scene.js
    fixMainMenuScene();
    
    // Запускаем API-сервер
    startApiServer();
    
    // Ждем 5 секунд перед запуском Telegram-бота
    log('Ожидание запуска API-сервера...', 'info');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Запускаем Telegram-бота
    startTelegramBot();
    
    log('=== СИСТЕМА VENDHUB УСПЕШНО ЗАПУЩЕНА ===', 'title');
    log(`📊 API URL: ${API_URL}`, 'success');
    log(`🤖 Telegram Bot Token: ${BOT_TOKEN.substring(0, 10)}...`, 'success');
    log(`🔗 Webhook URL: ${WEBHOOK_URL}`, 'success');
    log('', 'info');
    log('Для остановки системы нажмите Ctrl+C', 'info');
    
    // Обработка завершения работы
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    log(`❌ Ошибка запуска системы: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Запуск системы
main();
