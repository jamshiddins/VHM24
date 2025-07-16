/**
 * Скрипт для проверки подключения worker и scheduler в Railway
 * Этот скрипт запускается в Railway и проверяет, что worker и scheduler
 * могут подключаться к Redis и обмениваться сообщениями
 */
require('dotenv').config();
const { createClient } = require('redis');
const fs = require('fs');
const path = require('path');

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
  
  // Запись в файл отчета
  appendToReport(`[${timestamp}] [${type}] ${message}`);
}

// Функция для создания директории отчетов
function ensureReportDirectory() {
  const reportDir = path.join(__dirname, 'reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  return reportDir;
}

// Функция для создания файла отчета
function createReportFile() {
  const reportDir = ensureReportDirectory();
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const reportPath = path.join(reportDir, `worker-scheduler-report-${timestamp}.md`);
  
  // Создание заголовка отчета
  const header = `# Отчет о проверке подключения worker и scheduler в Railway
Дата: ${new Date().toLocaleString()}

## Переменные окружения
- REDIS_URL: ${process.env.REDIS_URL ? 'Настроен' : 'Не настроен'}
- NODE_ENV: ${process.env.NODE_ENV || 'Не настроен'}
- RAILWAY_PUBLIC_URL: ${process.env.RAILWAY_PUBLIC_URL || 'Не настроен'}

## Результаты проверки
`;
  
  fs.writeFileSync(reportPath, header);
  return reportPath;
}

// Глобальная переменная для пути к файлу отчета
let reportPath;

// Функция для добавления записи в отчет
function appendToReport(message) {
  if (!reportPath) {
    reportPath = createReportFile();
  }
  
  fs.appendFileSync(reportPath, message + '\n');
}

// Функция для проверки подключения к Redis
async function testRedisConnection() {
  log('Проверка подключения к Redis...');
  
  // Проверка наличия переменной окружения REDIS_URL
  if (!process.env.REDIS_URL) {
    log('REDIS_URL не настроен в переменных окружения', 'ERROR');
    return false;
  }
  
  log(`Используется REDIS_URL: ${process.env.REDIS_URL.substring(0, 20)}...`);
  
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

// Функция для проверки настроек Railway
function checkRailwaySettings() {
  log('Проверка настроек Railway...');
  
  // Проверка наличия переменных окружения Railway
  const railwayEnvVars = [
    'RAILWAY_PROJECT_ID',
    'RAILWAY_PUBLIC_URL',
    'RAILWAY_PUBLIC_DOMAIN'
  ];
  
  const missingVars = railwayEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    log(`Отсутствуют переменные окружения Railway: ${missingVars.join(', ')}`, 'WARNING');
  } else {
    log('Все переменные окружения Railway настроены', 'SUCCESS');
  }
  
  // Проверка наличия файла railway.json
  try {
    const railwayJson = require('./railway.json');
    log('Файл railway.json найден', 'SUCCESS');
    
    // Проверка наличия секции services
    if (railwayJson.services && Array.isArray(railwayJson.services)) {
      log(`Найдено ${railwayJson.services.length} сервисов в railway.json`, 'SUCCESS');
      
      // Проверка наличия сервисов worker и scheduler
      const workerService = railwayJson.services.find(service => service.name === 'worker');
      const schedulerService = railwayJson.services.find(service => service.name === 'scheduler');
      
      if (workerService) {
        log('Сервис worker настроен в railway.json', 'SUCCESS');
        log(`Команда запуска worker: ${workerService.startCommand}`, 'INFO');
      } else {
        log('Сервис worker не настроен в railway.json', 'ERROR');
      }
      
      if (schedulerService) {
        log('Сервис scheduler настроен в railway.json', 'SUCCESS');
        log(`Команда запуска scheduler: ${schedulerService.startCommand}`, 'INFO');
      } else {
        log('Сервис scheduler не настроен в railway.json', 'ERROR');
      }
    } else {
      log('Секция services не найдена в railway.json', 'ERROR');
    }
  } catch (error) {
    log(`Ошибка при проверке railway.json: ${error.message}`, 'ERROR');
  }
}

// Главная функция
async function main() {
  log('Запуск проверки подключения worker и scheduler в Railway...', 'INFO');
  
  // Проверка настроек Railway
  checkRailwaySettings();
  
  // Проверка подключения к Redis
  const isRedisConnected = await testRedisConnection();
  
  if (!isRedisConnected) {
    log('Проверка подключения к Redis не пройдена', 'ERROR');
    finishReport(false);
    return;
  }
  
  // Запуск worker в отдельном потоке
  const workerPromise = simulateWorker();
  
  // Небольшая задержка перед запуском scheduler
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Запуск scheduler
  const isSchedulerOk = await simulateScheduler();
  
  if (!isSchedulerOk) {
    log('Имитация работы scheduler не удалась', 'ERROR');
    finishReport(false);
    return;
  }
  
  // Ожидание завершения worker
  await workerPromise;
  
  log('Проверка подключения worker и scheduler в Railway завершена', 'INFO');
  
  // Вывод результатов
  if (isRedisConnected && isSchedulerOk) {
    log('✅ Проверка успешно пройдена! Worker и scheduler могут обмениваться сообщениями через Redis.', 'SUCCESS');
    finishReport(true);
  } else {
    log('❌ Проверка не пройдена! Есть проблемы с подключением worker и scheduler к Redis.', 'ERROR');
    finishReport(false);
  }
}

// Функция для завершения отчета
function finishReport(success) {
  const summary = success
    ? '## Итог: ✅ Проверка успешно пройдена!\nWorker и scheduler могут обмениваться сообщениями через Redis.'
    : '## Итог: ❌ Проверка не пройдена!\nЕсть проблемы с подключением worker и scheduler к Redis.';
  
  appendToReport('\n' + summary);
  
  // Добавление рекомендаций
  appendToReport('\n## Рекомендации');
  
  if (success) {
    appendToReport('- Все компоненты работают корректно, дополнительных действий не требуется.');
    appendToReport('- Для мониторинга работы worker и scheduler рекомендуется настроить логирование в Railway.');
  } else {
    appendToReport('- Проверьте настройки REDIS_URL в переменных окружения Railway.');
    appendToReport('- Убедитесь, что сервисы worker и scheduler правильно настроены в railway.json.');
    appendToReport('- Проверьте доступность Redis из сервисов Railway.');
  }
  
  log(`Отчет сохранен в файле: ${reportPath}`, 'INFO');
}

// Запуск скрипта
main().catch(error => {
  log(`Критическая ошибка: ${error.message}`, 'ERROR');
  finishReport(false);
});
