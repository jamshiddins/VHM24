/**
 * Скрипт для автоматического исправления проблем с подключением worker и scheduler в Railway
 * Исправляет распространенные проблемы с конфигурацией, подключением и зависимостями
 */
const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');

// Загружаем .env.development файл для локальной разработки
const devEnv = dotenv.config({ path: '.env.development' });
dotenvExpand.expand(devEnv);

// Загружаем основной .env файл
const mainEnv = dotenv.config();
dotenvExpand.expand(mainEnv);
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Функция для логирования
function log(message, type = 'INFO') {
  const timestamp = new Date().toISOString();
  const colors = {
    INFO: '\x1b[36m',    // Голубой
    SUCCESS: '\x1b[32m', // Зеленый
    WARNING: '\x1b[33m', // Желтый
    ERROR: '\x1b[31m',   // Красный
    RESET: '\x1b[0m'     // Сброс цвета
  };
  
  console.log(`${colors[type]}[${timestamp}] [${type}] ${message}${colors.RESET}`);
}

// Функция для проверки наличия файла
function checkFileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    log(`Ошибка при проверке файла ${filePath}: ${error.message}`, 'ERROR');
    return false;
  }
}

// Функция для создания директории
function ensureDirectoryExists(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      log(`Создана директория: ${dirPath}`, 'SUCCESS');
    }
    return true;
  } catch (error) {
    log(`Ошибка при создании директории ${dirPath}: ${error.message}`, 'ERROR');
    return false;
  }
}

// Функция для исправления railway.json
function fixRailwayJson() {
  log('Исправление railway.json...');
  
  try {
    // Проверка наличия файла railway.json
    if (!checkFileExists('railway.json')) {
      log('Файл railway.json не найден', 'ERROR');
      return false;
    }
    
    // Чтение файла railway.json
    const railwayJsonContent = fs.readFileSync('railway.json', 'utf8');
    let railwayJson;
    
    try {
      railwayJson = JSON.parse(railwayJsonContent);
    } catch (error) {
      log(`Ошибка при парсинге railway.json: ${error.message}`, 'ERROR');
      return false;
    }
    
    // Проверка наличия секции services
    if (!railwayJson.services) {
      log('Добавление секции services в railway.json', 'INFO');
      railwayJson.services = [];
    }
    
    // Проверка наличия сервисов web, worker и scheduler
    const serviceNames = railwayJson.services.map(service => service.name);
    
    // Добавление сервиса web, если он отсутствует
    if (!serviceNames.includes('web')) {
      log('Добавление сервиса web в railway.json', 'INFO');
      railwayJson.services.push({
        name: 'web',
        startCommand: railwayJson.deploy?.startCommand || 'node index.js',
        healthcheckPath: railwayJson.deploy?.healthcheckPath || '/api/health',
        healthcheckTimeout: railwayJson.deploy?.healthcheckTimeout || 300,
        healthcheckInterval: railwayJson.deploy?.healthcheckInterval || 60,
        restartPolicyType: railwayJson.deploy?.restartPolicyType || 'ON_FAILURE',
        restartPolicyMaxRetries: railwayJson.deploy?.restartPolicyMaxRetries || 10,
        numReplicas: railwayJson.deploy?.numReplicas || 1
      });
    }
    
    // Добавление сервиса worker, если он отсутствует
    if (!serviceNames.includes('worker')) {
      log('Добавление сервиса worker в railway.json', 'INFO');
      railwayJson.services.push({
        name: 'worker',
        startCommand: 'npm run start:worker',
        restartPolicyType: 'ON_FAILURE',
        restartPolicyMaxRetries: 10,
        numReplicas: 1
      });
    }
    
    // Добавление сервиса scheduler, если он отсутствует
    if (!serviceNames.includes('scheduler')) {
      log('Добавление сервиса scheduler в railway.json', 'INFO');
      railwayJson.services.push({
        name: 'scheduler',
        startCommand: 'npm run start:scheduler',
        restartPolicyType: 'ON_FAILURE',
        restartPolicyMaxRetries: 10,
        numReplicas: 1
      });
    }
    
    // Запись обновленного файла railway.json
    fs.writeFileSync('railway.json', JSON.stringify(railwayJson, null, 2));
    log('Файл railway.json успешно обновлен', 'SUCCESS');
    
    return true;
  } catch (error) {
    log(`Ошибка при исправлении railway.json: ${error.message}`, 'ERROR');
    return false;
  }
}

// Функция для исправления package.json
function fixPackageJson() {
  log('Исправление package.json...');
  
  try {
    // Проверка наличия файла package.json
    if (!checkFileExists('package.json')) {
      log('Файл package.json не найден', 'ERROR');
      return false;
    }
    
    // Чтение файла package.json
    const packageJsonContent = fs.readFileSync('package.json', 'utf8');
    let packageJson;
    
    try {
      packageJson = JSON.parse(packageJsonContent);
    } catch (error) {
      log(`Ошибка при парсинге package.json: ${error.message}`, 'ERROR');
      return false;
    }
    
    // Проверка наличия секции scripts
    if (!packageJson.scripts) {
      log('Добавление секции scripts в package.json', 'INFO');
      packageJson.scripts = {};
    }
    
    // Проверка наличия скриптов start:worker и start:scheduler
    let isModified = false;
    
    if (!packageJson.scripts['start:worker']) {
      log('Добавление скрипта start:worker в package.json', 'INFO');
      packageJson.scripts['start:worker'] = 'node src/worker.js';
      isModified = true;
    }
    
    if (!packageJson.scripts['start:scheduler']) {
      log('Добавление скрипта start:scheduler в package.json', 'INFO');
      packageJson.scripts['start:scheduler'] = 'node src/scheduler.js';
      isModified = true;
    }
    
    // Проверка наличия скриптов для проверки и деплоя
    if (!packageJson.scripts['check:worker-scheduler']) {
      log('Добавление скрипта check:worker-scheduler в package.json', 'INFO');
      packageJson.scripts['check:worker-scheduler'] = 'node check-railway-worker-scheduler.js';
      isModified = true;
    }
    
    if (!packageJson.scripts['check:system-integration']) {
      log('Добавление скрипта check:system-integration в package.json', 'INFO');
      packageJson.scripts['check:system-integration'] = 'node check-railway-system-integration.js';
      isModified = true;
    }
    
    if (!packageJson.scripts['deploy:worker-scheduler']) {
      log('Добавление скрипта deploy:worker-scheduler в package.json', 'INFO');
      packageJson.scripts['deploy:worker-scheduler'] = 'node deploy-worker-scheduler-to-railway.js';
      isModified = true;
    }
    
    // Проверка наличия необходимых зависимостей
    if (!packageJson.dependencies) {
      log('Добавление секции dependencies в package.json', 'INFO');
      packageJson.dependencies = {};
    }
    
    const requiredDeps = {
      'redis': '^5.6.0',
      'pg': '^8.16.3',
      'express': '^4.18.2',
      'dotenv': '^16.6.1',
      'axios': '^1.10.0'
    };
    
    for (const [dep, version] of Object.entries(requiredDeps)) {
      if (!packageJson.dependencies[dep]) {
        log(`Добавление зависимости ${dep} в package.json`, 'INFO');
        packageJson.dependencies[dep] = version;
        isModified = true;
      }
    }
    
    // Запись обновленного файла package.json, если были внесены изменения
    if (isModified) {
      fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
      log('Файл package.json успешно обновлен', 'SUCCESS');
    } else {
      log('Файл package.json не требует обновления', 'INFO');
    }
    
    return true;
  } catch (error) {
    log(`Ошибка при исправлении package.json: ${error.message}`, 'ERROR');
    return false;
  }
}

// Функция для исправления файлов worker и scheduler
function fixWorkerAndSchedulerFiles() {
  log('Исправление файлов worker и scheduler...');
  
  try {
    // Проверка наличия директории src
    if (!ensureDirectoryExists('src')) {
      log('Не удалось создать директорию src', 'ERROR');
      return false;
    }
    
    // Проверка наличия файла worker.js
    if (!checkFileExists('src/worker.js')) {
      log('Создание файла src/worker.js', 'INFO');
      
      const workerContent = `/**
 * Worker для обработки фоновых задач
 */
require('dotenv').config();
const { createClient } = require('redis');

// Инициализация Redis-клиента
let redisClient;

/**
 * Инициализация очереди задач
 */
async function initWorkerQueue() {
  try {
    // Проверка наличия переменной окружения REDIS_URL
    if (!process.env.REDIS_URL) {
      console.error('❌ REDIS_URL не настроен в переменных окружения');
      return;
    }
    
    // Подключение к Redis
    redisClient = createClient({
      url: process.env.REDIS_URL
    });
    
    // Обработка ошибок Redis
    redisClient.on('error', (err) => {
      console.error('❌ Ошибка Redis:', err.message);
    });
    
    // Подключение к Redis
    await redisClient.connect();
    
    console.log('✅ Подключение к Redis успешно');
    
    // Подписка на канал задач
    await redisClient.subscribe('tasks', handleTask);
    
    console.log('✅ Подписка на канал задач успешна');
    
    // Запуск обработчика задач
    startTaskProcessor();
    
    console.log('✅ Обработчик задач запущен');
  } catch (error) {
    console.error('❌ Ошибка инициализации очереди задач:', error.message);
  }
}

/**
 * Обработка задачи
 * @param {string} message - Сообщение с задачей
 */
async function handleTask(message) {
  try {
    console.log(\`📥 Получена задача: \${message}\`);
    
    // Парсинг задачи
    const task = JSON.parse(message);
    
    // Обработка задачи в зависимости от типа
    switch (task.type) {
      case 'SEND_NOTIFICATION':
        await processSendNotification(task);
        break;
      case 'GENERATE_REPORT':
        await processGenerateReport(task);
        break;
      case 'SYNC_DATA':
        await processSyncData(task);
        break;
      case 'INTEGRATION_TEST':
        console.log(\`🧪 Получена тестовая задача: \${task.data.message}\`);
        break;
      default:
        console.warn(\`⚠️ Неизвестный тип задачи: \${task.type}\`);
    }
  } catch (error) {
    console.error('❌ Ошибка обработки задачи:', error.message);
  }
}

/**
 * Обработка задачи отправки уведомления
 * @param {object} task - Задача
 */
async function processSendNotification(task) {
  console.log(\`📤 Отправка уведомления: \${task.data.message} для \${task.data.userId}\`);
  // Здесь логика отправки уведомления
}

/**
 * Обработка задачи генерации отчета
 * @param {object} task - Задача
 */
async function processGenerateReport(task) {
  console.log(\`📊 Генерация отчета: \${task.data.reportType} за \${task.data.period}\`);
  // Здесь логика генерации отчета
}

/**
 * Обработка задачи синхронизации данных
 * @param {object} task - Задача
 */
async function processSyncData(task) {
  console.log(\`🔄 Синхронизация данных: \${task.data.source} -> \${task.data.destination}\`);
  // Здесь логика синхронизации данных
}

/**
 * Запуск обработчика задач
 */
function startTaskProcessor() {
  console.log('🚀 Запуск обработчика задач...');
  
  // Обработка завершения процесса
  process.on('SIGINT', async () => {
    console.log('👋 Завершение работы обработчика задач...');
    
    if (redisClient) {
      await redisClient.quit();
    }
    
    process.exit(0);
  });
}

// Запуск worker'а
async function main() {
  console.log('🎯 Worker запущен...');
  await initWorkerQueue();
}

// Запуск
main().catch(error => {
  console.error('❌ Критическая ошибка:', error.message);
  process.exit(1);
});
`;
      
      fs.writeFileSync('src/worker.js', workerContent);
      log('Файл src/worker.js успешно создан', 'SUCCESS');
    } else {
      log('Файл src/worker.js уже существует', 'INFO');
    }
    
    // Проверка наличия файла scheduler.js
    if (!checkFileExists('src/scheduler.js')) {
      log('Создание файла src/scheduler.js', 'INFO');
      
      const schedulerContent = `/**
 * Scheduler для планирования задач
 */
require('dotenv').config();
const { createClient } = require('redis');

// Инициализация Redis-клиента
let redisClient;

/**
 * Инициализация планировщика задач
 */
async function initScheduler() {
  try {
    // Проверка наличия переменной окружения REDIS_URL
    if (!process.env.REDIS_URL) {
      console.error('❌ REDIS_URL не настроен в переменных окружения');
      return;
    }
    
    // Подключение к Redis
    redisClient = createClient({
      url: process.env.REDIS_URL
    });
    
    // Обработка ошибок Redis
    redisClient.on('error', (err) => {
      console.error('❌ Ошибка Redis:', err.message);
    });
    
    // Подключение к Redis
    await redisClient.connect();
    
    console.log('✅ Подключение к Redis успешно');
    
    // Запуск планировщика задач
    startScheduler();
    
    console.log('✅ Планировщик задач запущен');
  } catch (error) {
    console.error('❌ Ошибка инициализации планировщика задач:', error.message);
  }
}

/**
 * Запуск планировщика задач
 */
function startScheduler() {
  console.log('🚀 Запуск планировщика задач...');
  
  // Планирование задач
  scheduleTask('daily-report', '0 8 * * *', createDailyReportTask);
  scheduleTask('hourly-sync', '0 * * * *', createHourlySyncTask);
  scheduleTask('check-bot-health', '*/10 * * * *', createCheckBotHealthTask);
  scheduleTask('backup-database', '0 0 * * *', createBackupDatabaseTask);
  
  // Обработка завершения процесса
  process.on('SIGINT', async () => {
    console.log('👋 Завершение работы планировщика задач...');
    
    if (redisClient) {
      await redisClient.quit();
    }
    
    process.exit(0);
  });
}

/**
 * Планирование задачи
 * @param {string} taskId - Идентификатор задачи
 * @param {string} cronExpression - Cron-выражение для планирования задачи
 * @param {Function} taskCreator - Функция для создания задачи
 */
function scheduleTask(taskId, cronExpression, taskCreator) {
  console.log(\`📅 Планирование задачи \${taskId} с расписанием \${cronExpression}\`);
  
  // Парсинг cron-выражения
  const [minute, hour, dayOfMonth, month, dayOfWeek] = cronExpression.split(' ');
  
  // Запуск таймера для планирования задачи
  setInterval(() => {
    const now = new Date();
    
    // Проверка соответствия текущего времени cron-выражению
    if (
      (minute === '*' || minute === \`*/\${now.getMinutes()}\` || minute === now.getMinutes().toString()) &&
      (hour === '*' || hour === \`*/\${now.getHours()}\` || hour === now.getHours().toString()) &&
      (dayOfMonth === '*' || dayOfMonth === now.getDate().toString()) &&
      (month === '*' || month === (now.getMonth() + 1).toString()) &&
      (dayOfWeek === '*' || dayOfWeek === now.getDay().toString())
    ) {
      // Создание и отправка задачи
      const task = taskCreator();
      sendTask(task);
    }
  }, 60000); // Проверка каждую минуту
}

/**
 * Отправка задачи в очередь
 * @param {object} task - Задача
 */
async function sendTask(task) {
  try {
    console.log(\`📤 Отправка задачи: \${JSON.stringify(task)}\`);
    
    // Отправка задачи в канал Redis
    await redisClient.publish('tasks', JSON.stringify(task));
    
    console.log('✅ Задача отправлена');
  } catch (error) {
    console.error('❌ Ошибка отправки задачи:', error.message);
  }
}

/**
 * Создание задачи ежедневного отчета
 * @returns {object} Задача
 */
function createDailyReportTask() {
  return {
    id: \`daily-report-\${Date.now()}\`,
    type: 'GENERATE_REPORT',
    data: {
      reportType: 'DAILY',
      period: new Date().toISOString().split('T')[0]
    },
    createdAt: new Date().toISOString()
  };
}

/**
 * Создание задачи ежечасной синхронизации
 * @returns {object} Задача
 */
function createHourlySyncTask() {
  return {
    id: \`hourly-sync-\${Date.now()}\`,
    type: 'SYNC_DATA',
    data: {
      source: 'API',
      destination: 'DATABASE',
      timestamp: new Date().toISOString()
    },
    createdAt: new Date().toISOString()
  };
}

/**
 * Создание задачи проверки здоровья бота
 * @returns {object} Задача
 */
function createCheckBotHealthTask() {
  return {
    id: \`check-bot-health-\${Date.now()}\`,
    type: 'CHECK_BOT_HEALTH',
    data: {
      botId: 'telegram-bot',
      timestamp: new Date().toISOString()
    },
    createdAt: new Date().toISOString()
  };
}

/**
 * Создание задачи резервного копирования базы данных
 * @returns {object} Задача
 */
function createBackupDatabaseTask() {
  return {
    id: \`backup-database-\${Date.now()}\`,
    type: 'BACKUP_DATABASE',
    data: {
      timestamp: new Date().toISOString()
    },
    createdAt: new Date().toISOString()
  };
}

// Запуск scheduler'а
async function main() {
  console.log('⏰ Scheduler стартовал...');
  await initScheduler();
}

// Запуск
main().catch(error => {
  console.error('❌ Критическая ошибка:', error.message);
  process.exit(1);
});
`;
      
      fs.writeFileSync('src/scheduler.js', schedulerContent);
      log('Файл src/scheduler.js успешно создан', 'SUCCESS');
    } else {
      log('Файл src/scheduler.js уже существует', 'INFO');
    }
    
    return true;
  } catch (error) {
    log(`Ошибка при исправлении файлов worker и scheduler: ${error.message}`, 'ERROR');
    return false;
  }
}

// Функция для исправления переменных окружения
function fixEnvironmentVariables() {
  log('Исправление переменных окружения...');
  
  try {
    // Проверка наличия файла .env
    if (!checkFileExists('.env')) {
      log('Файл .env не найден, создание нового файла', 'INFO');
      
      // Создание файла .env с базовыми переменными окружения
      const envContent = `# Основные переменные окружения
NODE_ENV=development
PORT=3000

# База данных
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vendhub

# Redis
REDIS_URL=redis://localhost:6379

# Railway
RAILWAY_PROJECT_ID=
RAILWAY_PUBLIC_URL=
RAILWAY_PUBLIC_DOMAIN=
`;
      
      fs.writeFileSync('.env', envContent);
      log('Файл .env успешно создан', 'SUCCESS');
    } else {
      // Чтение файла .env
      const envContent = fs.readFileSync('.env', 'utf8');
      const envLines = envContent.split('\n');
      
      // Проверка наличия необходимых переменных окружения
      const requiredVars = [
        'NODE_ENV',
        'PORT',
        'DATABASE_URL',
        'REDIS_URL'
      ];
      
      const missingVars = [];
      
      for (const varName of requiredVars) {
        if (!envLines.some(line => line.startsWith(`${varName}=`))) {
          missingVars.push(varName);
        }
      }
      
      // Добавление отсутствующих переменных окружения
      if (missingVars.length > 0) {
        log(`Добавление отсутствующих переменных окружения: ${missingVars.join(', ')}`, 'INFO');
        
        let newEnvContent = envContent;
        
        if (!newEnvContent.endsWith('\n')) {
          newEnvContent += '\n';
        }
        
        if (missingVars.includes('NODE_ENV')) {
          newEnvContent += 'NODE_ENV=development\n';
        }
        
        if (missingVars.includes('PORT')) {
          newEnvContent += 'PORT=3000\n';
        }
        
        if (missingVars.includes('DATABASE_URL')) {
          newEnvContent += 'DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vendhub\n';
        }
        
        if (missingVars.includes('REDIS_URL')) {
          newEnvContent += 'REDIS_URL=redis://localhost:6379\n';
        }
        
        fs.writeFileSync('.env', newEnvContent);
        log('Файл .env успешно обновлен', 'SUCCESS');
      } else {
        log('Все необходимые переменные окружения уже настроены', 'INFO');
      }
    }
    
    return true;
  } catch (error) {
    log(`Ошибка при исправлении переменных окружения: ${error.message}`, 'ERROR');
    return false;
  }
}

// Функция для установки зависимостей
function installDependencies() {
  log('Установка зависимостей...');
  
  try {
    // Проверка наличия файла package.json
    if (!checkFileExists('package.json')) {
      log('Файл package.json не найден', 'ERROR');
      return false;
    }
    
    // Чтение файла package.json
    const packageJsonContent = fs.readFileSync('package.json', 'utf8');
    let packageJson;
    
    try {
      packageJson = JSON.parse(packageJsonContent);
    } catch (error) {
      log(`Ошибка при парсинге package.json: ${error.message}`, 'ERROR');
      return false;
    }
    
    // Проверка наличия необходимых зависимостей
    const requiredDeps = ['redis', 'pg', 'express', 'dotenv', 'axios'];
    const missingDeps = [];
    
    for (const dep of requiredDeps) {
      if (!packageJson.dependencies || !packageJson.dependencies[dep]) {
        missingDeps.push(dep);
      }
    }
    
    // Установка отсутствующих зависимостей
    if (missingDeps.length > 0) {
      log(`Установка отсутствующих зависимостей: ${missingDeps.join(', ')}`, 'INFO');
      
      try {
        execSync(`npm install ${missingDeps.join(' ')} --save`, { stdio: 'inherit' });
        log('Зависимости успешно установлены', 'SUCCESS');
      } catch (error) {
        log(`Ошибка при установке зависимостей: ${error.message}`, 'ERROR');
        return false;
      }
    } else {
      log('Все необходимые зависимости уже установлены', 'INFO');
    }
    
    return true;
  } catch (error) {
    log(`Ошибка при установке зависимостей: ${error.message}`, 'ERROR');
    return false;
  }
}

// Главная функция
async function main() {
  log('Запуск автоматического исправления проблем с подключением worker и scheduler в Railway...');
  
  // Исправление railway.json
  const isRailwayJsonFixed = fixRailwayJson();
  
  // Исправление package.json
  const isPackageJsonFixed = fixPackageJson();
  
  // Исправление файлов worker и scheduler
  const isWorkerAndSchedulerFilesFixed = fixWorkerAndSchedulerFiles();
  
  // Исправление переменных окружения
  const isEnvironmentVariablesFixed = fixEnvironmentVariables();
  
  // Установка зависимостей
  const isDependenciesInstalled = installDependencies();
  
  // Вывод результатов
  log('\n=== Результаты исправления ===');
  log(`railway.json: ${isRailwayJsonFixed ? '✅ Исправлен' : '❌ Не исправлен'}`);
  log(`package.json: ${isPackageJsonFixed ? '✅ Исправлен' : '❌ Не исправлен'}`);
  log(`worker и scheduler: ${isWorkerAndSchedulerFilesFixed ? '✅ Исправлены' : '❌ Не исправлены'}`);
  log(`Переменные окружения: ${isEnvironmentVariablesFixed ? '✅ Исправлены' : '❌ Не исправлены'}`);
  log(`Зависимости: ${isDependenciesInstalled ? '✅ Установлены' : '❌ Не установлены'}`);
  
  // Общий результат
  const isAllFixed = isRailwayJsonFixed && isPackageJsonFixed && isWorkerAndSchedulerFilesFixed && isEnvironmentVariablesFixed && isDependenciesInstalled;
  
  if (isAllFixed) {
    log('\n✅ Все проблемы успешно исправлены!', 'SUCCESS');
    log('Для проверки работы worker и scheduler запустите: npm run check:worker-scheduler', 'INFO');
    log('Для деплоя в Railway запустите: npm run deploy:worker-scheduler', 'INFO');
  } else {
    log('\n⚠️ Некоторые проблемы не удалось исправить автоматически.', 'WARNING');
    log('Пожалуйста, исправьте оставшиеся проблемы вручную.', 'WARNING');
  }
}

// Запуск скрипта
main().catch(error => {
  log(`Критическая ошибка: ${error.message}`, 'ERROR');
  process.exit(1);
});
