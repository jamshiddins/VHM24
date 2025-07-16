/**
 * Скрипт для проверки подключения worker и scheduler к Redis
 */
require('dotenv').config();
const { createClient } = require('redis');

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

// Функция для проверки подключения к Redis
async function testRedisConnection() {
  log('Проверка подключения к Redis...');
  
  // Проверка наличия переменной окружения REDIS_URL
  if (!process.env.REDIS_URL) {
    log('REDIS_URL не настроен в переменных окружения', 'ERROR');
    return false;
  }
  
  log(`Используется REDIS_URL: ${process.env.REDIS_URL}`);
  
  try {
    // Создание клиента Redis с расширенными настройками
    const redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          // Максимальное количество попыток переподключения - 20
          if (retries > 20) {
            log('Превышено максимальное количество попыток подключения к Redis', 'ERROR');
            return new Error('Превышено максимальное количество попыток подключения к Redis');
          }
          // Экспоненциальная задержка с максимумом в 5 секунд
          const delay = Math.min(Math.pow(2, retries) * 100, 5000);
          log(`Попытка переподключения к Redis через ${delay}мс...`, 'INFO');
          return delay;
        },
        connectTimeout: 10000, // Таймаут подключения - 10 секунд
        keepAlive: 5000 // Проверка соединения каждые 5 секунд
      }
    });
    
    // Обработка ошибок Redis
    redisClient.on('error', (err) => {
      log(`Ошибка Redis: ${err.message}`, 'ERROR');
    });
    
    // Подключение к Redis
    await redisClient.connect();
    log('Подключение к Redis успешно', 'SUCCESS');
    
    // Тестирование публикации и подписки
    await testPubSub(redisClient);
    
    // Закрытие соединения
    await redisClient.quit();
    log('Соединение с Redis закрыто', 'INFO');
    
    return true;
  } catch (error) {
    log(`Ошибка подключения к Redis: ${error.message}`, 'ERROR');
    return false;
  }
}

// Функция для тестирования публикации и подписки
async function testPubSub(redisClient) {
  log('Тестирование публикации и подписки...');
  
  // Создание второго клиента для подписки
  const subscriberClient = redisClient.duplicate();
  await subscriberClient.connect();
  
  // Подписка на канал
  await subscriberClient.subscribe('test-channel', (message) => {
    log(`Получено сообщение: ${message}`, 'SUCCESS');
    subscriberClient.unsubscribe('test-channel');
  });
  
  log('Подписка на канал test-channel успешна', 'SUCCESS');
  
  // Публикация сообщения
  const messageCount = await redisClient.publish('test-channel', 'Тестовое сообщение');
  log(`Сообщение отправлено ${messageCount} подписчикам`, 'SUCCESS');
  
  // Закрытие соединения подписчика
  await subscriberClient.quit();
}

// Функция для имитации работы scheduler
async function simulateScheduler() {
  log('Имитация работы scheduler...', 'INFO');
  
  // Проверка наличия переменной окружения REDIS_URL
  if (!process.env.REDIS_URL) {
    log('REDIS_URL не настроен в переменных окружения', 'ERROR');
    return false;
  }
  
  try {
    // Создание клиента Redis с расширенными настройками
    const redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          // Максимальное количество попыток переподключения - 20
          if (retries > 20) {
            log('Превышено максимальное количество попыток подключения к Redis в scheduler', 'ERROR');
            return new Error('Превышено максимальное количество попыток подключения к Redis');
          }
          // Экспоненциальная задержка с максимумом в 5 секунд
          const delay = Math.min(Math.pow(2, retries) * 100, 5000);
          log(`Попытка переподключения scheduler к Redis через ${delay}мс...`, 'INFO');
          return delay;
        },
        connectTimeout: 10000, // Таймаут подключения - 10 секунд
        keepAlive: 5000 // Проверка соединения каждые 5 секунд
      }
    });
    
    // Обработка ошибок Redis
    redisClient.on('error', (err) => {
      log(`Ошибка Redis в scheduler: ${err.message}`, 'ERROR');
    });
    
    // Подключение к Redis
    await redisClient.connect();
    log('Scheduler подключен к Redis', 'SUCCESS');
    
    // Создание тестовой задачи
    const task = {
      id: `test-task-${Date.now()}`,
      type: 'TEST_TASK',
      data: {
        message: 'Это тестовая задача от scheduler',
        timestamp: new Date().toISOString()
      },
      createdAt: new Date().toISOString()
    };
    
    // Отправка задачи в канал tasks
    const messageCount = await redisClient.publish('tasks', JSON.stringify(task));
    log(`Задача отправлена ${messageCount} подписчикам`, 'SUCCESS');
    
    // Закрытие соединения
    await redisClient.quit();
    log('Scheduler отключен от Redis', 'INFO');
    
    return true;
  } catch (error) {
    log(`Ошибка в работе scheduler: ${error.message}`, 'ERROR');
    return false;
  }
}

// Функция для имитации работы worker
async function simulateWorker() {
  log('Имитация работы worker...', 'INFO');
  
  // Проверка наличия переменной окружения REDIS_URL
  if (!process.env.REDIS_URL) {
    log('REDIS_URL не настроен в переменных окружения', 'ERROR');
    return false;
  }
  
  try {
    // Создание клиента Redis с расширенными настройками
    const redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          // Максимальное количество попыток переподключения - 20
          if (retries > 20) {
            log('Превышено максимальное количество попыток подключения к Redis в worker', 'ERROR');
            return new Error('Превышено максимальное количество попыток подключения к Redis');
          }
          // Экспоненциальная задержка с максимумом в 5 секунд
          const delay = Math.min(Math.pow(2, retries) * 100, 5000);
          log(`Попытка переподключения worker к Redis через ${delay}мс...`, 'INFO');
          return delay;
        },
        connectTimeout: 10000, // Таймаут подключения - 10 секунд
        keepAlive: 5000 // Проверка соединения каждые 5 секунд
      }
    });
    
    // Обработка ошибок Redis
    redisClient.on('error', (err) => {
      log(`Ошибка Redis в worker: ${err.message}`, 'ERROR');
    });
    
    // Подключение к Redis
    await redisClient.connect();
    log('Worker подключен к Redis', 'SUCCESS');
    
    // Подписка на канал tasks
    await redisClient.subscribe('tasks', (message) => {
      try {
        const task = JSON.parse(message);
        log(`Worker получил задачу: ${task.type} (${task.id})`, 'SUCCESS');
        log(`Данные задачи: ${JSON.stringify(task.data)}`, 'INFO');
      } catch (error) {
        log(`Ошибка обработки задачи: ${error.message}`, 'ERROR');
      }
    });
    
    log('Worker подписан на канал tasks', 'SUCCESS');
    
    // Ожидание получения задачи
    log('Ожидание задачи от scheduler...', 'INFO');
    
    // Ожидание 5 секунд для получения задачи
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Отписка от канала
    await redisClient.unsubscribe('tasks');
    log('Worker отписан от канала tasks', 'INFO');
    
    // Закрытие соединения
    await redisClient.quit();
    log('Worker отключен от Redis', 'INFO');
    
    return true;
  } catch (error) {
    log(`Ошибка в работе worker: ${error.message}`, 'ERROR');
    return false;
  }
}

// Главная функция
async function main() {
  log('Запуск проверки подключения worker и scheduler к Redis...', 'INFO');
  
  // Проверка подключения к Redis
  const isRedisConnected = await testRedisConnection();
  
  if (!isRedisConnected) {
    log('Проверка подключения к Redis не пройдена', 'ERROR');
    process.exit(1);
  }
  
  // Запуск worker в отдельном потоке
  const workerPromise = simulateWorker();
  
  // Небольшая задержка перед запуском scheduler
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Запуск scheduler
  const isSchedulerOk = await simulateScheduler();
  
  if (!isSchedulerOk) {
    log('Имитация работы scheduler не удалась', 'ERROR');
  }
  
  // Ожидание завершения worker
  await workerPromise;
  
  log('Проверка подключения worker и scheduler к Redis завершена', 'INFO');
  
  // Вывод результатов
  if (isRedisConnected && isSchedulerOk) {
    log('✅ Проверка успешно пройдена! Worker и scheduler могут обмениваться сообщениями через Redis.', 'SUCCESS');
  } else {
    log('❌ Проверка не пройдена! Есть проблемы с подключением worker и scheduler к Redis.', 'ERROR');
  }
}

// Запуск скрипта
main().catch(error => {
  log(`Критическая ошибка: ${error.message}`, 'ERROR');
  process.exit(1);
});
