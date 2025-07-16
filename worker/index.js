/**
 * Worker для обработки фоновых задач
 */
const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');

// Загружаем основной .env файл
const mainEnv = dotenv.config();
dotenvExpand.expand(mainEnv);

// Загружаем .env.worker файл с переопределениями для Worker
const workerEnv = dotenv.config({ path: '.env.worker' });
dotenvExpand.expand(workerEnv);
const { createClient } = require('redis');

// Инициализация Redis-клиента
let redisClient;

/**
 * Инициализация очереди задач
 */
async function initWorkerQueue() {
  try {
    // Выбор URL для подключения к Redis
    // Если мы запускаемся в Railway, используем внутренний URL
    // Если мы запускаемся локально, используем публичный URL или локальный URL
    let redisUrl = process.env.REDIS_URL || process.env.REDIS_URL_PUBLIC;
    
    // Проверка наличия переменной окружения REDIS_URL
    if (!redisUrl) {
      console.error('❌ REDIS_URL и REDIS_URL_PUBLIC не настроены в переменных окружения');
      return;
    }
    
    // Проверяем, запущены ли мы в Railway
    const isRailway = process.env.RAILWAY_ENVIRONMENT === 'production';
    
    // Если мы запущены в Railway, используем специальный URL для подключения к Redis
    if (isRailway) {
      // В Railway сервисы могут обращаться друг к другу по имени сервиса
      // Для Redis используем полный URL с именем сервиса Redis
      redisUrl = 'redis://default:AlBzXGfakMRiVrFolnlZITTgniXFVBPX@Redis:6379';
      console.log('Запущено в Railway, используем специальный URL для подключения к Redis');
    }
    
    console.log(`Используется URL Redis: ${redisUrl.split('@')[1]}`);
    
    // Подключение к Redis с расширенными настройками
    redisClient = createClient({
      url: redisUrl,
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
    console.log(`📥 Получена задача: ${message}`);
    
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
      default:
        console.warn(`⚠️ Неизвестный тип задачи: ${task.type}`);
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
  console.log(`📤 Отправка уведомления: ${task.data.message} для ${task.data.userId}`);
  // Здесь логика отправки уведомления
}

/**
 * Обработка задачи генерации отчета
 * @param {object} task - Задача
 */
async function processGenerateReport(task) {
  console.log(`📊 Генерация отчета: ${task.data.reportType} за ${task.data.period}`);
  // Здесь логика генерации отчета
}

/**
 * Обработка задачи синхронизации данных
 * @param {object} task - Задача
 */
async function processSyncData(task) {
  console.log(`🔄 Синхронизация данных: ${task.data.source} -> ${task.data.destination}`);
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
