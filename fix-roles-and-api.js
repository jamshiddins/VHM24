/**
 * Скрипт для исправления реализации ролей и подключений API между ботом и веб-интерфейсом
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const axios = require('axios');

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
  }
  
  console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
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

// Функция для исправления файла apps/telegram-bot/src/utils/role-sync.js
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
};
`;
  
  fs.writeFileSync(roleSyncPath, roleSyncContent);
  log('Файл apps/telegram-bot/src/utils/role-sync.js успешно создан', 'success');
}

// Функция для исправления файла backend/src/routes/users.js
function fixUsersRouteFile() {
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
    log('Файл backend/src/routes/users.js не найден, создаем...', 'warning');
    
    // Создаем директорию, если она не существует
    ensureDirectoryExists(path.dirname(usersRoutePath));
    
    const usersRouteContent = `/**
 * Маршруты для управления пользователями
 */
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticateToken, requireRole, ROLES } = require('../middleware/roleCheck');

/**
 * @route GET /api/users
 * @desc Получение списка пользователей
 */
router.get('/', authenticateToken, requireRole([ROLES.ADMIN, ROLES.MANAGER]), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.json(users);
  } catch (error) {
    console.error('Ошибка получения списка пользователей:', error);
    res.status(500).json({ error: 'Ошибка получения списка пользователей' });
  }
});

/**
 * @route GET /api/users/:id
 * @desc Получение информации о пользователе
 */
router.get('/:id', authenticateToken, requireRole([ROLES.ADMIN, ROLES.MANAGER], true), async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Ошибка получения информации о пользователе:', error);
    res.status(500).json({ error: 'Ошибка получения информации о пользователе' });
  }
});

/**
 * @route POST /api/users
 * @desc Создание нового пользователя
 */
router.post('/', authenticateToken, requireRole([ROLES.ADMIN]), async (req, res) => {
  try {
    const { telegramId, firstName, lastName, role } = req.body;
    
    if (!telegramId) {
      return res.status(400).json({ error: 'Telegram ID обязателен' });
    }
    
    // Проверяем, существует ли пользователь с таким Telegram ID
    const existingUser = await prisma.user.findUnique({
      where: { telegramId }
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'Пользователь с таким Telegram ID уже существует' });
    }
    
    // Создаем нового пользователя
    const user = await prisma.user.create({
      data: {
        telegramId,
        firstName: firstName || '',
        lastName: lastName || '',
        role: role || 'USER',
        status: 'ACTIVE'
      }
    });
    
    res.status(201).json(user);
  } catch (error) {
    console.error('Ошибка создания пользователя:', error);
    res.status(500).json({ error: 'Ошибка создания пользователя' });
  }
});

/**
 * @route PUT /api/users/:id
 * @desc Обновление информации о пользователе
 */
router.put('/:id', authenticateToken, requireRole([ROLES.ADMIN]), async (req, res) => {
  try {
    const { id } = req.params;
    const { telegramId, firstName, lastName, role, status } = req.body;
    
    // Проверяем, существует ли пользователь
    const user = await prisma.user.findUnique({
      where: { id }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    // Обновляем информацию о пользователе
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        telegramId: telegramId || user.telegramId,
        firstName: firstName || user.firstName,
        lastName: lastName || user.lastName,
        role: role || user.role,
        status: status || user.status
      }
    });
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Ошибка обновления информации о пользователе:', error);
    res.status(500).json({ error: 'Ошибка обновления информации о пользователе' });
  }
});

/**
 * @route DELETE /api/users/:id
 * @desc Удаление пользователя
 */
router.delete('/:id', authenticateToken, requireRole([ROLES.ADMIN]), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Проверяем, существует ли пользователь
    const user = await prisma.user.findUnique({
      where: { id }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    // Удаляем пользователя
    await prisma.user.delete({
      where: { id }
    });
    
    res.json({ message: 'Пользователь успешно удален' });
  } catch (error) {
    console.error('Ошибка удаления пользователя:', error);
    res.status(500).json({ error: 'Ошибка удаления пользователя' });
  }
});

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
});

module.exports = router;
`;
    
    fs.writeFileSync(usersRoutePath, usersRouteContent);
    log('Файл backend/src/routes/users.js успешно создан', 'success');
  }
}

// Функция для исправления файла apps/telegram-bot/src/scenes/main-menu.scene.js
function fixMainMenuSceneFile() {
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

// Функция для исправления файла apps/telegram-bot/src/index.js
function fixTelegramBotIndexFile() {
  log('Проверка и исправление файла apps/telegram-bot/src/index.js...', 'info');
  
  const telegramBotIndexPath = path.join(__dirname, 'apps', 'telegram-bot', 'src', 'index.js');
  
  if (checkFileExists(telegramBotIndexPath)) {
    const telegramBotIndexContent = fs.readFileSync(telegramBotIndexPath, 'utf8');
    
    // Проверяем наличие механизма повторных попыток подключения к API
    if (!telegramBotIndexContent.includes('retryCount') || !telegramBotIndexContent.includes('retryDelay')) {
      log('В файле apps/telegram-bot/src/index.js отсутствует механизм повторных попыток подключения к API, исправляем...', 'warning');
      
      // Заменяем функцию checkApiHealth
      const updatedContent = telegramBotIndexContent.replace(
        /async function startBot\(\) {[\s\S]*?}/,
        `async function startBot() {
  try {
    console.log('🚀 Запуск Telegram бота...');
    
    // Настройка вебхука
    await setupWebhook();
    
    // Проверка подключения к API с повторными попытками
    const maxRetries = 5;
    const retryDelay = 3000; // 3 секунды
    let retryCount = 0;
    let apiConnected = false;
    
    while (retryCount < maxRetries && !apiConnected) {
      try {
        const response = await axios.get(\`\${API_BASE_URL}/health\`, { timeout: 5000 });
        console.log(\`✅ API доступен: \${JSON.stringify(response.data)}\`);
        apiConnected = true;
      } catch (error) {
        retryCount++;
        if (retryCount < maxRetries) {
          console.warn(\`❌ Ошибка подключения к API (\${retryCount}/\${maxRetries}): \${error.message}. Повторная попытка через \${retryDelay/1000} сек...\`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        } else {
          console.error(\`❌ Не удалось подключиться к API после \${maxRetries} попыток: \${error.message}\`);
        }
      }
    }
    
    // Запуск бота
    await bot.launch();
    
    console.log('✅ Бот успешно запущен');
    
    // Вывод информации о конфигурации
    console.log(\`🔧 Конфигурация бота: API_BASE_URL=\${API_BASE_URL}, WEBHOOK_URL=\${WEBHOOK_URL}, ADMIN_IDS=\${ADMIN_IDS.join(', ') || 'Не настроены'}\`);
    
    // Graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
    
  } catch (error) {
    console.error('❌ Ошибка запуска бота:', error);
    process.exit(1);
  }
}`
      );
      
      fs.writeFileSync(telegramBotIndexPath, updatedContent);
      log('Файл apps/telegram-bot/src/index.js успешно исправлен', 'success');
    } else {
      log('Файл apps/telegram-bot/src/index.js уже содержит механизм повторных попыток подключения к API', 'success');
    }
  } else {
    log('Файл apps/telegram-bot/src/index.js не найден', 'error');
  }
}

// Функция для исправления файла backend/src/routes/telegram.js
function fixTelegramRouteFile() {
  log('Проверка и исправление файла backend/src/routes/telegram.js...', 'info');
  
  const telegramRoutePath = path.join(__dirname, 'backend', 'src', 'routes', 'telegram.js');
  
  if (checkFileExists(telegramRoutePath)) {
    const telegramRouteContent = fs.readFileSync(telegramRoutePath, 'utf8');
    
    // Проверяем наличие обработки ошибок при настройке вебхука
    if (!telegramRouteContent.includes('maxRetries') || !telegramRouteContent.includes('retryDelay')) {
      log('В файле backend/src/routes/telegram.js отсутствует обработка ошибок при настройке вебхука, исправляем...', 'warning');
      
      // Добавляем код для обработки ошибок при настройке вебхука
      const updatedContent = telegramRouteContent.replace(
        /router\.post\('\/webhook', async \(req, res\) => {[\s\S]*?try {/,
        `router.post('/webhook', async (req, res) => {
  try {
    // Настройка вебхука с повторными попытками
    const maxRetries = 3;
    const retryDelay = 2000; // 2 секунды
    let retryCount = 0;
    let webhookSet = false;
    
    while (retryCount < maxRetries && !webhookSet) {
      try {
        // Попытка установить вебхук
        await bot.telegram.setWebhook(\`\${WEBHOOK_URL}/api/telegram/webhook\`);
        console.log('✅ Вебхук успешно установлен');
        webhookSet = true;
      } catch (error) {
        retryCount++;
        if (retryCount < maxRetries) {
          console.warn(\`❌ Ошибка установки вебхука (\${retryCount}/\${maxRetries}): \${error.message}. Повторная попытка через \${retryDelay/1000} сек...\`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        } else {
          console.error(\`❌ Не удалось установить вебхук после \${maxRetries} попыток: \${error.message}\`);
        }
      }
    }`
      );
      
      fs.writeFileSync(telegramRoutePath, updatedContent);
      log('Файл backend/src/routes/telegram.js успешно исправлен', 'success');
    } else {
      log('Файл backend/src/routes/telegram.js уже содержит обработку ошибок при настройке вебхука', 'success');
    }
  } else {
    log('Файл backend/src/routes/telegram.js не найден', 'error');
  }
}
