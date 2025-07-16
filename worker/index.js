/**
 * Worker для обработки фоновых задач
 */
require('dotenv').config({ path: '.env.worker' });
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
