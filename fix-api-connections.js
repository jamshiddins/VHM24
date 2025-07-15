/**
 * Скрипт для исправления ошибок подключения к API и улучшения взаимодействия между ботом и веб-интерфейсом
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

// Функция для исправления файла backend/src/routes/api.js
function fixApiRoutesFile() {
  log('Проверка и исправление файла backend/src/routes/api.js...', 'info');
  
  const apiRoutesPath = path.join(__dirname, 'backend', 'src', 'routes', 'api.js');
  
  if (!checkFileExists(apiRoutesPath)) {
    log('Файл backend/src/routes/api.js не найден, создаем...', 'warning');
    
    const apiRoutesContent = `/**
 * Основной маршрутизатор API
 */
const express = require('express');
const router = express.Router();

// Импорт маршрутов
const authRoutes = require('./auth');
const healthRoutes = require('./health');
const machinesRoutes = require('./machines');
const tasksRoutes = require('./tasks');
const usersRoutes = require('./users');
const telegramRoutes = require('./telegram');
const inventoryRoutes = require('./inventory');
const warehouseRoutes = require('./warehouse');
const dataImportRoutes = require('./data-import');

// Middleware для проверки API-ключа
const apiKeyCheck = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  
  // В режиме разработки пропускаем проверку API-ключа
  if (process.env.NODE_ENV === 'development' || process.env.SKIP_API_KEY_CHECK === 'true') {
    return next();
  }
  
  // Проверяем API-ключ
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Неверный API-ключ' });
  }
  
  next();
};

// Маршрут для проверки работоспособности API
router.use('/health', healthRoutes);

// Маршруты, требующие API-ключ
router.use('/auth', apiKeyCheck, authRoutes);
router.use('/machines', apiKeyCheck, machinesRoutes);
router.use('/tasks', apiKeyCheck, tasksRoutes);
router.use('/users', apiKeyCheck, usersRoutes);
router.use('/inventory', apiKeyCheck, inventoryRoutes);
router.use('/warehouse', apiKeyCheck, warehouseRoutes);
router.use('/data-import', apiKeyCheck, dataImportRoutes);

// Маршруты для Telegram-бота
router.use('/telegram', telegramRoutes);

module.exports = router;
`;
    
    fs.writeFileSync(apiRoutesPath, apiRoutesContent);
    log('Файл backend/src/routes/api.js успешно создан', 'success');
  } else {
    log('Файл backend/src/routes/api.js уже существует, проверяем содержимое...', 'info');
    
    const apiRoutesContent = fs.readFileSync(apiRoutesPath, 'utf8');
    
    // Проверяем наличие всех необходимых маршрутов
    const requiredRoutes = [
      'authRoutes',
      'healthRoutes',
      'machinesRoutes',
      'tasksRoutes',
      'usersRoutes',
      'telegramRoutes',
      'inventoryRoutes',
      'warehouseRoutes',
      'dataImportRoutes'
    ];
    
    const missingRoutes = [];
    
    for (const route of requiredRoutes) {
      if (!apiRoutesContent.includes(route)) {
        missingRoutes.push(route);
      }
    }
    
    if (missingRoutes.length > 0) {
      log(`В файле backend/src/routes/api.js отсутствуют следующие маршруты: ${missingRoutes.join(', ')}`, 'warning');
      
      // Исправляем файл
      const updatedApiRoutesContent = `/**
 * Основной маршрутизатор API
 */
const express = require('express');
const router = express.Router();

// Импорт маршрутов
const authRoutes = require('./auth');
const healthRoutes = require('./health');
const machinesRoutes = require('./machines');
const tasksRoutes = require('./tasks');
const usersRoutes = require('./users');
const telegramRoutes = require('./telegram');
const inventoryRoutes = require('./inventory');
const warehouseRoutes = require('./warehouse');
const dataImportRoutes = require('./data-import');

// Middleware для проверки API-ключа
const apiKeyCheck = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  
  // В режиме разработки пропускаем проверку API-ключа
  if (process.env.NODE_ENV === 'development' || process.env.SKIP_API_KEY_CHECK === 'true') {
    return next();
  }
  
  // Проверяем API-ключ
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Неверный API-ключ' });
  }
  
  next();
};

// Маршрут для проверки работоспособности API
router.use('/health', healthRoutes);

// Маршруты, требующие API-ключ
router.use('/auth', apiKeyCheck, authRoutes);
router.use('/machines', apiKeyCheck, machinesRoutes);
router.use('/tasks', apiKeyCheck, tasksRoutes);
router.use('/users', apiKeyCheck, usersRoutes);
router.use('/inventory', apiKeyCheck, inventoryRoutes);
router.use('/warehouse', apiKeyCheck, warehouseRoutes);
router.use('/data-import', apiKeyCheck, dataImportRoutes);

// Маршруты для Telegram-бота
router.use('/telegram', telegramRoutes);

module.exports = router;
`;
      
      fs.writeFileSync(apiRoutesPath, updatedApiRoutesContent);
      log('Файл backend/src/routes/api.js успешно исправлен', 'success');
    } else {
      log('Файл backend/src/routes/api.js содержит все необходимые маршруты', 'success');
    }
  }
}

// Функция для исправления файла backend/src/routes/health.js
function fixHealthRouteFile() {
  log('Проверка и исправление файла backend/src/routes/health.js...', 'info');
  
  const healthRoutePath = path.join(__dirname, 'backend', 'src', 'routes', 'health.js');
  
  if (!checkFileExists(healthRoutePath)) {
    log('Файл backend/src/routes/health.js не найден, создаем...', 'warning');
    
    const healthRouteContent = `/**
 * Маршрут для проверки работоспособности API
 */
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Время запуска сервера
const startTime = new Date();

/**
 * @route GET /api/health
 * @desc Проверка работоспособности API
 */
router.get('/', async (req, res) => {
  try {
    // Проверка подключения к базе данных
    let dbStatus = 'OK';
    let dbError = null;
    
    try {
      if (process.env.SKIP_DATABASE !== 'true') {
        await prisma.$queryRaw\`SELECT 1\`;
      }
    } catch (error) {
      dbStatus = 'ERROR';
      dbError = error.message;
    }
    
    // Формируем ответ
    const response = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((new Date() - startTime) / 1000),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: dbStatus,
        error: dbError,
        url: process.env.DATABASE_URL ? 'Настроен' : 'Не настроен'
      },
      telegram: {
        botToken: process.env.TELEGRAM_BOT_TOKEN ? 'Настроен' : 'Не настроен',
        webhookUrl: process.env.WEBHOOK_URL || 'Не настроен'
      },
      api: {
        url: process.env.API_BASE_URL || req.protocol + '://' + req.get('host')
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('Ошибка в маршруте /api/health:', error);
    res.status(500).json({ 
      status: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/health/detailed
 * @desc Подробная проверка работоспособности API
 */
router.get('/detailed', async (req, res) => {
  try {
    // Проверка подключения к базе данных
    let dbStatus = 'OK';
    let dbError = null;
    let dbTables = [];
    
    try {
      if (process.env.SKIP_DATABASE !== 'true') {
        await prisma.$queryRaw\`SELECT 1\`;
        
        // Получаем список таблиц
        const tables = await prisma.$queryRaw\`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public'
        \`;
        
        dbTables = tables.map(table => table.table_name);
      }
    } catch (error) {
      dbStatus = 'ERROR';
      dbError = error.message;
    }
    
    // Проверка подключения к S3
    let s3Status = 'NOT_CONFIGURED';
    let s3Error = null;
    
    if (process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY) {
      try {
        s3Status = 'OK';
      } catch (error) {
        s3Status = 'ERROR';
        s3Error = error.message;
      }
    }
    
    // Формируем ответ
    const response = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((new Date() - startTime) / 1000),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: dbStatus,
        error: dbError,
        url: process.env.DATABASE_URL ? 'Настроен' : 'Не настроен',
        tables: dbTables
      },
      telegram: {
        botToken: process.env.TELEGRAM_BOT_TOKEN ? 'Настроен' : 'Не настроен',
        webhookUrl: process.env.WEBHOOK_URL || 'Не настроен',
        adminIds: process.env.ADMIN_IDS || 'Не настроены'
      },
      api: {
        url: process.env.API_BASE_URL || req.protocol + '://' + req.get('host'),
        port: process.env.PORT || '3000'
      },
      storage: {
        s3: {
          status: s3Status,
          error: s3Error,
          bucket: process.env.S3_BUCKET || 'Не настроен',
          region: process.env.S3_REGION || 'Не настроен'
        }
      },
      memory: {
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB'
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('Ошибка в маршруте /api/health/detailed:', error);
    res.status(500).json({ 
      status: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
`;
    
    fs.writeFileSync(healthRoutePath, healthRouteContent);
    log('Файл backend/src/routes/health.js успешно создан', 'success');
  } else {
    log('Файл backend/src/routes/health.js уже существует, проверяем содержимое...', 'info');
    
    const healthRouteContent = fs.readFileSync(healthRoutePath, 'utf8');
    
    // Проверяем наличие всех необходимых маршрутов
    if (!healthRouteContent.includes('/api/health/detailed')) {
      log('В файле backend/src/routes/health.js отсутствует маршрут /api/health/detailed', 'warning');
      
      // Исправляем файл
      const updatedHealthRouteContent = `/**
 * Маршрут для проверки работоспособности API
 */
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Время запуска сервера
const startTime = new Date();

/**
 * @route GET /api/health
 * @desc Проверка работоспособности API
 */
router.get('/', async (req, res) => {
  try {
    // Проверка подключения к базе данных
    let dbStatus = 'OK';
    let dbError = null;
    
    try {
      if (process.env.SKIP_DATABASE !== 'true') {
        await prisma.$queryRaw\`SELECT 1\`;
      }
    } catch (error) {
      dbStatus = 'ERROR';
      dbError = error.message;
    }
    
    // Формируем ответ
    const response = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((new Date() - startTime) / 1000),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: dbStatus,
        error: dbError,
        url: process.env.DATABASE_URL ? 'Настроен' : 'Не настроен'
      },
      telegram: {
        botToken: process.env.TELEGRAM_BOT_TOKEN ? 'Настроен' : 'Не настроен',
        webhookUrl: process.env.WEBHOOK_URL || 'Не настроен'
      },
      api: {
        url: process.env.API_BASE_URL || req.protocol + '://' + req.get('host')
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('Ошибка в маршруте /api/health:', error);
    res.status(500).json({ 
      status: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/health/detailed
 * @desc Подробная проверка работоспособности API
 */
router.get('/detailed', async (req, res) => {
  try {
    // Проверка подключения к базе данных
    let dbStatus = 'OK';
    let dbError = null;
    let dbTables = [];
    
    try {
      if (process.env.SKIP_DATABASE !== 'true') {
        await prisma.$queryRaw\`SELECT 1\`;
        
        // Получаем список таблиц
        const tables = await prisma.$queryRaw\`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public'
        \`;
        
        dbTables = tables.map(table => table.table_name);
      }
    } catch (error) {
      dbStatus = 'ERROR';
      dbError = error.message;
    }
    
    // Проверка подключения к S3
    let s3Status = 'NOT_CONFIGURED';
    let s3Error = null;
    
    if (process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY) {
      try {
        s3Status = 'OK';
      } catch (error) {
        s3Status = 'ERROR';
        s3Error = error.message;
      }
    }
    
    // Формируем ответ
    const response = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((new Date() - startTime) / 1000),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: dbStatus,
        error: dbError,
        url: process.env.DATABASE_URL ? 'Настроен' : 'Не настроен',
        tables: dbTables
      },
      telegram: {
        botToken: process.env.TELEGRAM_BOT_TOKEN ? 'Настроен' : 'Не настроен',
        webhookUrl: process.env.WEBHOOK_URL || 'Не настроен',
        adminIds: process.env.ADMIN_IDS || 'Не настроены'
      },
      api: {
        url: process.env.API_BASE_URL || req.protocol + '://' + req.get('host'),
        port: process.env.PORT || '3000'
      },
      storage: {
        s3: {
          status: s3Status,
          error: s3Error,
          bucket: process.env.S3_BUCKET || 'Не настроен',
          region: process.env.S3_REGION || 'Не настроен'
        }
      },
      memory: {
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB'
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('Ошибка в маршруте /api/health/detailed:', error);
    res.status(500).json({ 
      status: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
`;
      
      fs.writeFileSync(healthRoutePath, updatedHealthRouteContent);
      log('Файл backend/src/routes/health.js успешно исправлен', 'success');
    } else {
      log('Файл backend/src/routes/health.js содержит все необходимые маршруты', 'success');
    }
  }
}

// Функция для исправления файла apps/telegram-bot/src/index.js
function fixTelegramBotIndexFile() {
  log('Проверка и исправление файла apps/telegram-bot/src/index.js...', 'info');
  
  const telegramBotIndexPath = path.join(__dirname, 'apps', 'telegram-bot', 'src', 'index.js');
  
  if (checkFileExists(telegramBotIndexPath)) {
    const telegramBotIndexContent = fs.readFileSync(telegramBotIndexPath, 'utf8');
    
    // Проверяем наличие обработки ошибок при подключении к API
    if (!telegramBotIndexContent.includes('retryCount') || !telegramBotIndexContent.includes('retryDelay')) {
      log('В файле apps/telegram-bot/src/index.js отсутствует механизм повторных попыток подключения к API', 'warning');
      
      // Исправляем файл
      const updatedTelegramBotIndexContent = telegramBotIndexContent.replace(
        /async function checkApiHealth\(\) {[\s\S]*?}/,
        `async function checkApiHealth() {
  try {
    log('Проверка работоспособности API...', 'system');
    
    const maxRetries = 5;
    const retryDelay = 3000; // 3 секунды
    let retryCount = 0;
    let connected = false;
    
    while (retryCount < maxRetries && !connected) {
      try {
        const response = await axios.get(\`\${API_BASE_URL}/api/health\`, { timeout: 5000 });
        
        if (response.status === 200) {
          log(\`API работает: \${JSON.stringify(response.data)}\`, 'success');
          connected = true;
          return true;
        } else {
          log(\`WARN: API вернул статус \${response.status}\`, 'warning');
        }
      } catch (error) {
        retryCount++;
        if (retryCount < maxRetries) {
          log(\`Ошибка подключения к API (\${retryCount}/\${maxRetries}): \${error.message}. Повторная попытка через \${retryDelay/1000} сек...\`, 'warning');
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        } else {
          log(\`Не удалось подключиться к API после \${maxRetries} попыток: \${error.message}\`, 'error');
        }
      }
    }
    
    return connected;
  } catch (error) {
    log(\`Ошибка проверки API: \${error.message}\`, 'error');
    return false;
  }
}`
      );
      
      fs.writeFileSync(telegramBotIndexPath, updatedTelegramBotIndexContent);
      log('Файл apps/telegram-bot/src/index.js успешно исправлен', 'success');
    } else {
      log('Файл apps/telegram-bot/src/index.js уже содержит механизм повторных попыток подключения к API', 'success');
    }
  } else {
    log('Файл apps/telegram-bot/src/index.js не найден', 'error');
  }
}

// Функция для исправления файла start-vendhub-complete.js
function fixStartVendHubCompleteFile() {
  log('Проверка и исправление файла start-vendhub-complete.js...', 'info');
  
  const startVendHubCompletePath = path.join(__dirname, 'start-vendhub-complete.js');
  
  if (checkFileExists(startVendHubCompletePath)) {
    const startVendHubCompleteContent = fs.readFileSync(startVendHubCompletePath, 'utf8');
    
    // Проверяем наличие механизма повторных попыток подключения
    if (!startVendHubCompleteContent.includes('retryCount') || !startVendHubCompleteContent.includes('retryDelay')) {
      log('В файле start-vendhub-complete.js отсутствует механизм повторных попыток подключения', 'warning');
      
      // Исправляем файл
      const updatedStartVendHubCompleteContent = startVendHubCompleteContent.replace(
        /async function checkApiHealth\(\) {[\s\S]*?}/,
        `async function checkApiHealth() {
  try {
    log('Проверка работоспособности API...', 'system');
    
    const maxRetries = 5;
    const retryDelay = 3000; // 3 секунды
    let retryCount = 0;
    let connected = false;
    
    while (retryCount < maxRetries && !connected) {
      try {
        const response = await axios.get(\`\${API_URL}/api/health\`, { timeout: 5000 });
        
        if (response.status === 200) {
          log(\`API работает: \${JSON.stringify(response.data)}\`, 'system');
          connected = true;
          return true;
        } else {
          log(\`WARN: API вернул статус \${response.status}\`, 'system');
        }
      } catch (error) {
        retryCount++;
        if (retryCount < maxRetries) {
          log(\`Ошибка подключения к API (\${retryCount}/\${maxRetries}): \${error.message}. Повторная попытка через \${retryDelay/1000} сек...\`, 'system');
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        } else {
          log(\`Не удалось подключиться к API после \${maxRetries} попыток: \${error.message}\`, 'system');
        }
      }
    }
    
    return connected;
  } catch (error) {
    log(\`ERROR: Не удалось подключиться к API: \${error.message}\`, 'system');
    return false;
  }
}`
      );
      
      fs.writeFileSync(startVendHubCompletePath, updatedStartVendHubCompleteContent);
      log('Файл start-vendhub-complete.js успешно исправлен', 'success');
    } else {
      log('Файл start-vendhub-complete.js уже содержит механизм повторных попыток подключения', 'success');
    }
  } else {
    log('Файл start-vendhub-complete.js не найден', 'error');
  }
}

// Функция для исправления файла start-vendhub-railway.js
function fixStartVendHubRailwayFile() {
  log('Проверка и исправление файла start-vendhub-railway.js...', 'info');
  
  const startVendHubRailwayPath = path.join(__dirname, 'start-vendhub-railway.js');
  
  if (checkFileExists(startVendHubRailwayPath)) {
    const startVendHubRailwayContent = fs.readFileSync(startVendHubRailwayPath, 'utf8');
    
    // Проверяем наличие механизма повторных попыток подключения
    if (!startVendHubRailwayContent.includes('retryCount') || !startVendHubRailwayContent.includes('retryDelay')) {
      log('В файле start-vendhub-railway.js отсутствует механизм повторных попыток подключения', 'warning');
      
      // Исправляем файл
      const updatedStartVendHubRailwayContent = startVendHubRailwayContent.replace(
        /async function checkApiHealth\(\) {[\s\S]*?}/,
        `async function checkApiHealth() {
  try {
    log('Проверка работоспособности API...', 'system');
    
    const maxRetries = 5;
    const retryDelay = 3000; // 3 секунды
    let retryCount = 0;
    let connected = false;
    
    while (retryCount < maxRetries && !connected) {
      try {
        const response = await axios.get(\`\${API_URL}/api/health\`, { timeout: 5000 });
        
        if (response.status === 200) {
          log(\`API работает: \${JSON.stringify(response.data)}\`, 'system');
          connected = true;
          return true;
        } else {
          log(\`WARN: API вернул статус \${response.status}\`, 'system');
        }
      } catch (error) {
        retryCount++;
        if (retryCount < maxRetries) {
          log(\`Ошибка подключения к API (\${retryCount}/\${maxRetries}): \${error.message}. Повторная попытка через \${retryDelay/1000} сек...\`, 'system');
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        } else {
          log(\`Не удалось подключиться к API после \${maxRetries} попыток: \${error.message}\`, 'system');
        }
      }
    }
    
    return connected;
  } catch (error) {
    log(\`ERROR: Не удалось подключиться к API: \${error.message}\`, 'system');
    return false;
  }
}`
      );
      
      fs.writeFileSync(startVendHubRailwayPath, updatedStartVendHubRailwayContent);
      log('Файл start-vendhub-railway.js успешно исправлен', 'success');
    } else {
      log('Файл start-vendhub-railway.js уже содержит механизм повторных попыток подключения', 'success');
    }
  } else {
    log('Файл start-vendhub-railway.js не найден', 'error');
  }
}
