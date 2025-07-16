/**
 * Scheduler для планирования задач
 */
const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');

// Загружаем основной .env файл
const mainEnv = dotenv.config();
dotenvExpand.expand(mainEnv);

// Загружаем .env.scheduler файл с переопределениями для Scheduler
const schedulerEnv = dotenv.config({ path: '.env.scheduler' });
dotenvExpand.expand(schedulerEnv);
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
    
    // Подключение к Redis с расширенными настройками
    redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          // Максимальное количество попыток переподключения - 20
          if (retries > 20) {
            console.error('❌ Превышено максимальное количество попыток подключения к Redis');
            return new Error('Превышено максимальное количество попыток подключения к Redis');
          }
          // Экспоненциальная задержка с максимумом в 5 секунд
          const delay = Math.min(Math.pow(2, retries) * 100, 5000);
          console.log(`⏳ Попытка переподключения к Redis через ${delay}мс...`);
          return delay;
        },
        connectTimeout: 10000, // Таймаут подключения - 10 секунд
        keepAlive: 5000 // Проверка соединения каждые 5 секунд
      }
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
  console.log(`📅 Планирование задачи ${taskId} с расписанием ${cronExpression}`);
  
  // Парсинг cron-выражения
  const [minute, hour, dayOfMonth, month, dayOfWeek] = cronExpression.split(' ');
  
  // Запуск таймера для планирования задачи
  setInterval(() => {
    const now = new Date();
    
    // Проверка соответствия текущего времени cron-выражению
    if (
      (minute === '*' || minute === `*/${now.getMinutes()}` || minute === now.getMinutes().toString()) &&
      (hour === '*' || hour === `*/${now.getHours()}` || hour === now.getHours().toString()) &&
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
    console.log(`📤 Отправка задачи: ${JSON.stringify(task)}`);
    
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
    id: `daily-report-${Date.now()}`,
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
    id: `hourly-sync-${Date.now()}`,
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
    id: `check-bot-health-${Date.now()}`,
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
    id: `backup-database-${Date.now()}`,
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
