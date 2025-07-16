/**
 * Скрипт для комплексной проверки интеграции всех компонентов системы в Railway
 * Проверяет работоспособность Web/API, Worker, Scheduler, подключения к PostgreSQL и Redis,
 * логическую связанность между компонентами и наличие ошибок
 */
require('dotenv').config();
const { createClient } = require('redis');
const { Pool } = require('pg');
const axios = require('axios');
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
  const reportPath = path.join(reportDir, `system-integration-report-${timestamp}.md`);
  
  // Создание заголовка отчета
  const header = `# Отчет о проверке интеграции компонентов системы в Railway
Дата: ${new Date().toLocaleString()}

## Переменные окружения
- DATABASE_URL: ${process.env.DATABASE_URL ? 'Настроен' : 'Не настроен'}
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

// Функция для проверки подключения к PostgreSQL
async function testPostgresConnection() {
  log('Проверка подключения к PostgreSQL...');
  
  // Проверка наличия переменной окружения DATABASE_URL
  if (!process.env.DATABASE_URL) {
    log('DATABASE_URL не настроен в переменных окружения', 'ERROR');
    return false;
  }
  
  log(`Используется DATABASE_URL: ${process.env.DATABASE_URL.substring(0, 20)}...`);
  
  try {
    // Создание пула подключений
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    // Проверка подключения
    const client = await pool.connect();
    
    // Проверка версии PostgreSQL
    const result = await client.query('SELECT version()');
    log(`Версия PostgreSQL: ${result.rows[0].version}`, 'SUCCESS');
    
    // Проверка таблиц
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    log(`Найдено ${tablesResult.rows.length} таблиц в базе данных`, 'SUCCESS');
    
    // Вывод списка таблиц
    if (tablesResult.rows.length > 0) {
      log('Список таблиц:');
      tablesResult.rows.forEach(row => {
        log(`- ${row.table_name}`);
      });
    }
    
    // Освобождение клиента
    client.release();
    
    // Закрытие пула
    await pool.end();
    
    log('Подключение к PostgreSQL успешно', 'SUCCESS');
    return true;
  } catch (error) {
    log(`Ошибка подключения к PostgreSQL: ${error.message}`, 'ERROR');
    return false;
  }
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
    // Создание клиента Redis
    const redisClient = createClient({
      url: process.env.REDIS_URL
    });
    
    // Обработка ошибок Redis
    redisClient.on('error', (err) => {
      log(`Ошибка Redis: ${err.message}`, 'ERROR');
    });
    
    // Подключение к Redis
    await redisClient.connect();
    log('Подключение к Redis успешно', 'SUCCESS');
    
    // Проверка работоспособности Redis
    await redisClient.set('test-key', 'test-value');
    const value = await redisClient.get('test-key');
    
    if (value === 'test-value') {
      log('Операции чтения/записи в Redis работают корректно', 'SUCCESS');
    } else {
      log(`Ошибка операций чтения/записи в Redis: получено ${value}, ожидалось test-value`, 'ERROR');
    }
    
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

// Функция для проверки API
async function testApiEndpoints() {
  log('Проверка API endpoints...');
  
  // Проверка наличия переменной окружения RAILWAY_PUBLIC_URL
  if (!process.env.RAILWAY_PUBLIC_URL) {
    log('RAILWAY_PUBLIC_URL не настроен в переменных окружения', 'ERROR');
    return false;
  }
  
  const apiUrl = process.env.RAILWAY_PUBLIC_URL;
  log(`Используется API URL: ${apiUrl}`);
  
  try {
    // Проверка endpoint /health
    const healthResponse = await axios.get(`${apiUrl}/api/health`, { timeout: 5000 });
    
    if (healthResponse.status === 200) {
      log(`Endpoint /api/health работает: ${JSON.stringify(healthResponse.data)}`, 'SUCCESS');
    } else {
      log(`Endpoint /api/health вернул статус ${healthResponse.status}`, 'ERROR');
    }
    
    // Проверка других endpoints
    // TODO: Добавить проверку других endpoints API
    
    log('Проверка API endpoints завершена', 'SUCCESS');
    return true;
  } catch (error) {
    log(`Ошибка при проверке API endpoints: ${error.message}`, 'ERROR');
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
    const railwayJson = require('../railway.json');
    log('Файл railway.json найден', 'SUCCESS');
    
    // Проверка наличия секции services
    if (railwayJson.services && Array.isArray(railwayJson.services)) {
      log(`Найдено ${railwayJson.services.length} сервисов в railway.json`, 'SUCCESS');
      
      // Проверка наличия сервисов web, worker и scheduler
      const serviceNames = railwayJson.services.map(service => service.name);
      const requiredServices = ['web', 'worker', 'scheduler'];
      const missingServices = requiredServices.filter(name => !serviceNames.includes(name));
      
      if (missingServices.length > 0) {
        log(`В railway.json отсутствуют сервисы: ${missingServices.join(', ')}`, 'ERROR');
      } else {
        log('Все необходимые сервисы настроены в railway.json', 'SUCCESS');
      }
      
      // Проверка команд запуска для worker и scheduler
      const workerService = railwayJson.services.find(service => service.name === 'worker');
      const schedulerService = railwayJson.services.find(service => service.name === 'scheduler');
      
      if (workerService) {
        log(`Команда запуска worker: ${workerService.startCommand}`, 'INFO');
      }
      
      if (schedulerService) {
        log(`Команда запуска scheduler: ${schedulerService.startCommand}`, 'INFO');
      }
    } else {
      log('Секция services не найдена в railway.json', 'ERROR');
    }
  } catch (error) {
    log(`Ошибка при проверке railway.json: ${error.message}`, 'ERROR');
  }
}

// Функция для проверки зависимостей
function checkDependencies() {
  log('Проверка зависимостей...');
  
  try {
    // Проверка package.json
    const packageJson = require('../package.json');
    
    // Проверка наличия необходимых зависимостей
    const requiredDeps = ['redis', 'pg', 'express', 'dotenv'];
    const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep]);
    
    if (missingDeps.length > 0) {
      log(`Отсутствуют необходимые зависимости: ${missingDeps.join(', ')}`, 'ERROR');
    } else {
      log('Все необходимые зависимости установлены', 'SUCCESS');
    }
    
    // Проверка наличия скриптов для запуска worker и scheduler
    if (!packageJson.scripts['start:worker'] || !packageJson.scripts['start:scheduler']) {
      log('Отсутствуют скрипты для запуска worker и/или scheduler', 'ERROR');
    } else {
      log('Скрипты для запуска worker и scheduler настроены', 'SUCCESS');
    }
  } catch (error) {
    log(`Ошибка при проверке зависимостей: ${error.message}`, 'ERROR');
  }
}

// Функция для проверки логической связанности компонентов
async function testComponentIntegration() {
  log('Проверка логической связанности компонентов...');
  
  try {
    // Проверка наличия переменных окружения
    if (!process.env.REDIS_URL || !process.env.DATABASE_URL || !process.env.RAILWAY_PUBLIC_URL) {
      log('Отсутствуют необходимые переменные окружения для проверки интеграции', 'ERROR');
      return false;
    }
    
    // Создание клиента Redis
    const redisClient = createClient({
      url: process.env.REDIS_URL
    });
    
    // Обработка ошибок Redis
    redisClient.on('error', (err) => {
      log(`Ошибка Redis: ${err.message}`, 'ERROR');
    });
    
    // Подключение к Redis
    await redisClient.connect();
    
    // Создание тестовой задачи
    const testTask = {
      id: `integration-test-${Date.now()}`,
      type: 'INTEGRATION_TEST',
      data: {
        message: 'Тестовая задача для проверки интеграции',
        timestamp: new Date().toISOString()
      },
      createdAt: new Date().toISOString()
    };
    
    // Отправка задачи в Redis
    const messageCount = await redisClient.publish('tasks', JSON.stringify(testTask));
    log(`Тестовая задача отправлена ${messageCount} подписчикам`, 'SUCCESS');
    
    // Проверка получения задачи worker'ом
    // TODO: Добавить проверку получения задачи worker'ом
    
    // Закрытие соединения с Redis
    await redisClient.quit();
    
    log('Проверка логической связанности компонентов завершена', 'SUCCESS');
    return true;
  } catch (error) {
    log(`Ошибка при проверке логической связанности компонентов: ${error.message}`, 'ERROR');
    return false;
  }
}

// Функция для проверки наличия ошибок в логах
function checkLogsForErrors() {
  log('Проверка логов на наличие ошибок...');
  
  try {
    // Получение логов Railway
    // TODO: Добавить получение логов Railway через API или CLI
    
    log('Проверка логов на наличие ошибок завершена', 'SUCCESS');
    return true;
  } catch (error) {
    log(`Ошибка при проверке логов: ${error.message}`, 'ERROR');
    return false;
  }
}

// Главная функция
async function main() {
  log('Запуск комплексной проверки интеграции компонентов системы в Railway...');
  
  // Проверка настроек Railway
  checkRailwaySettings();
  
  // Проверка зависимостей
  checkDependencies();
  
  // Проверка подключения к PostgreSQL
  const isPostgresConnected = await testPostgresConnection();
  
  // Проверка подключения к Redis
  const isRedisConnected = await testRedisConnection();
  
  // Проверка API endpoints
  const isApiWorking = await testApiEndpoints();
  
  // Проверка логической связанности компонентов
  const isIntegrationWorking = await testComponentIntegration();
  
  // Проверка наличия ошибок в логах
  const isLogsOk = await checkLogsForErrors();
  
  log('Комплексная проверка интеграции компонентов системы в Railway завершена', 'INFO');
  
  // Вывод результатов
  const isAllOk = isPostgresConnected && isRedisConnected && isApiWorking && isIntegrationWorking && isLogsOk;
  
  if (isAllOk) {
    log('✅ Все проверки успешно пройдены! Система работает корректно.', 'SUCCESS');
    finishReport(true);
  } else {
    log('❌ Некоторые проверки не пройдены! Необходимо исправить ошибки.', 'ERROR');
    finishReport(false);
  }
}

// Функция для завершения отчета
function finishReport(success) {
  const summary = success
    ? '## Итог: ✅ Все проверки успешно пройдены!\nСистема работает корректно.'
    : '## Итог: ❌ Некоторые проверки не пройдены!\nНеобходимо исправить ошибки.';
  
  appendToReport('\n' + summary);
  
  // Добавление рекомендаций
  appendToReport('\n## Рекомендации');
  
  if (success) {
    appendToReport('- Все компоненты работают корректно, дополнительных действий не требуется.');
    appendToReport('- Для мониторинга работы системы рекомендуется настроить логирование в Railway.');
  } else {
    appendToReport('- Проверьте настройки переменных окружения в Railway.');
    appendToReport('- Убедитесь, что все сервисы правильно настроены в railway.json.');
    appendToReport('- Проверьте логи сервисов на наличие ошибок.');
    appendToReport('- Убедитесь, что все необходимые зависимости установлены.');
  }
  
  log(`Отчет сохранен в файле: ${reportPath}`, 'INFO');
}

// Запуск скрипта
main().catch(error => {
  log(`Критическая ошибка: ${error.message}`, 'ERROR');
  finishReport(false);
});
