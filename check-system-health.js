/**
 * Скрипт для проверки работоспособности всех компонентов системы VHM24
 */
require('dotenv').config();
const axios = require('axios');
const { createClient } = require('redis');
const { PrismaClient } = require('@prisma/client');

// Конфигурация
const RAILWAY_PUBLIC_URL = process.env.RAILWAY_PUBLIC_URL || 'https://web-production-d9582.up.railway.app';
const API_BASE_URL = `${RAILWAY_PUBLIC_URL}/api`;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8015112367:AAHi25gHhI3p1X1uyuCAt8vUnlMZRrcoKEQ';
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:TnKaHJbWffrqtZOIklgKNSlNZHDcxsQh@postgres.railway.internal:5432/railway';
const REDIS_URL = process.env.REDIS_URL || 'redis://default:AlBzXGfakMRiVrFolnlZITTgniXFVBPX@yamanote.proxy.rlwy.net:21211';
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || 'DO00XEB6BC6XZ8Q2M4KQ';
const S3_SECRET_KEY = process.env.S3_SECRET_KEY || 'SeYpfXGQ4eKR8WEDdGKjtLo0c6BK82r2hfnrzB63swk';
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'vhm24-uploads';
const S3_REGION = process.env.S3_REGION || 'fra1';
const S3_ENDPOINT = process.env.S3_ENDPOINT || 'https://fra1.digitaloceanspaces.com';

// Результаты проверок
const results = {
  api: { status: 'pending', message: '' },
  database: { status: 'pending', message: '' },
  redis: { status: 'pending', message: '' },
  telegram: { status: 'pending', message: '' },
  s3: { status: 'pending', message: '' },
  worker: { status: 'pending', message: '' },
  scheduler: { status: 'pending', message: '' }
};

/**
 * Проверка API
 */
async function checkAPI() {
  try {
    console.log('🔍 Проверка API...');
    const response = await axios.get(`${API_BASE_URL}/health`, { timeout: 10000 });
    
    if (response.status === 200 && response.data.status === 'OK') {
      results.api.status = 'success';
      results.api.message = `API работает. Версия: ${response.data.version}, Время работы: ${response.data.uptime} сек.`;
      console.log('✅ API работает нормально');
    } else {
      results.api.status = 'warning';
      results.api.message = `API отвечает, но статус не OK: ${JSON.stringify(response.data)}`;
      console.log('⚠️ API отвечает, но статус не OK');
    }
  } catch (error) {
    results.api.status = 'error';
    results.api.message = `Ошибка при проверке API: ${error.message}`;
    console.error('❌ Ошибка при проверке API:', error.message);
  }
}

/**
 * Проверка базы данных
 */
async function checkDatabase() {
  try {
    console.log('🔍 Проверка базы данных...');
    
    // Проверка через API
    const response = await axios.get(`${API_BASE_URL}/database/health`, { timeout: 10000 });
    
    if (response.status === 200 && response.data.status === 'OK') {
      results.database.status = 'success';
      results.database.message = 'База данных работает нормально (проверено через API)';
      console.log('✅ База данных работает нормально (проверено через API)');
    } else {
      results.database.status = 'warning';
      results.database.message = `База данных API отвечает, но статус не OK: ${JSON.stringify(response.data)}`;
      console.log('⚠️ База данных API отвечает, но статус не OK');
    }
  } catch (error) {
    // Если API для проверки базы данных недоступен, выводим сообщение
    results.database.status = 'warning';
    results.database.message = 'Невозможно проверить базу данных локально. Требуется доступ к Railway.';
    console.log('⚠️ Невозможно проверить базу данных локально. Требуется доступ к Railway.');
  }
}

/**
 * Проверка Redis
 */
async function checkRedis() {
  let redisClient;
  try {
    console.log('🔍 Проверка Redis...');
    redisClient = createClient({
      url: REDIS_URL
    });
    
    // Обработка ошибок
    redisClient.on('error', (err) => {
      results.redis.status = 'error';
      results.redis.message = `Ошибка Redis: ${err.message}`;
      console.error('❌ Ошибка Redis:', err.message);
    });
    
    // Подключение к Redis
    await redisClient.connect();
    
    // Проверка работоспособности
    const testKey = `test:${Date.now()}`;
    await redisClient.set(testKey, 'test-value');
    const value = await redisClient.get(testKey);
    await redisClient.del(testKey);
    
    if (value === 'test-value') {
      results.redis.status = 'success';
      results.redis.message = 'Redis работает нормально';
      console.log('✅ Redis работает нормально');
    } else {
      results.redis.status = 'warning';
      results.redis.message = 'Redis отвечает, но значение не соответствует ожидаемому';
      console.log('⚠️ Redis отвечает, но значение не соответствует ожидаемому');
    }
  } catch (error) {
    results.redis.status = 'error';
    results.redis.message = `Ошибка при проверке Redis: ${error.message}`;
    console.error('❌ Ошибка при проверке Redis:', error.message);
  } finally {
    if (redisClient && redisClient.isOpen) {
      await redisClient.quit();
    }
  }
}

/**
 * Проверка Telegram бота
 */
async function checkTelegram() {
  try {
    console.log('🔍 Проверка Telegram бота...');
    const response = await axios.get(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`, { timeout: 10000 });
    
    if (response.status === 200 && response.data.ok) {
      results.telegram.status = 'success';
      results.telegram.message = `Telegram бот работает. Имя: ${response.data.result.first_name}, Username: @${response.data.result.username}`;
      console.log(`✅ Telegram бот работает. Username: @${response.data.result.username}`);
    } else {
      results.telegram.status = 'warning';
      results.telegram.message = `Telegram API отвечает, но статус не OK: ${JSON.stringify(response.data)}`;
      console.log('⚠️ Telegram API отвечает, но статус не OK');
    }
  } catch (error) {
    results.telegram.status = 'error';
    results.telegram.message = `Ошибка при проверке Telegram бота: ${error.message}`;
    console.error('❌ Ошибка при проверке Telegram бота:', error.message);
  }
}

/**
 * Проверка S3 хранилища
 */
async function checkS3() {
  try {
    console.log('🔍 Проверка S3 хранилища...');
    
    // Проверка через API
    const response = await axios.get(`${API_BASE_URL}/storage/health`, { timeout: 10000 });
    
    if (response.status === 200 && response.data.status === 'OK') {
      results.s3.status = 'success';
      results.s3.message = 'S3 хранилище работает нормально';
      console.log('✅ S3 хранилище работает нормально');
    } else {
      results.s3.status = 'warning';
      results.s3.message = `S3 API отвечает, но статус не OK: ${JSON.stringify(response.data)}`;
      console.log('⚠️ S3 API отвечает, но статус не OK');
    }
  } catch (error) {
    // Если API для проверки S3 недоступен, выводим сообщение
    results.s3.status = 'warning';
    results.s3.message = 'Невозможно проверить S3 хранилище локально. Требуется доступ к Railway.';
    console.log('⚠️ Невозможно проверить S3 хранилище локально. Требуется доступ к Railway.');
  }
}

/**
 * Проверка Worker
 */
async function checkWorker() {
  try {
    console.log('🔍 Проверка Worker...');
    
    // Проверка через Redis
    const redisClient = createClient({
      url: REDIS_URL
    });
    
    await redisClient.connect();
    
    // Публикация тестового сообщения
    const testTask = {
      id: `test-task-${Date.now()}`,
      type: 'TEST',
      data: {
        timestamp: new Date().toISOString()
      }
    };
    
    // Подписка на канал для получения ответа
    const responseChannel = `test-response-${Date.now()}`;
    let responseReceived = false;
    
    const subscription = redisClient.duplicate();
    await subscription.connect();
    
    await subscription.subscribe(responseChannel, (message) => {
      try {
        const response = JSON.parse(message);
        if (response.taskId === testTask.id) {
          responseReceived = true;
          results.worker.status = 'success';
          results.worker.message = 'Worker работает нормально';
          console.log('✅ Worker работает нормально');
        }
      } catch (error) {
        console.error('Ошибка при обработке ответа от Worker:', error.message);
      }
    });
    
    // Добавляем канал для ответа в задачу
    testTask.responseChannel = responseChannel;
    
    // Публикуем задачу
    await redisClient.publish('tasks', JSON.stringify(testTask));
    
    // Ждем ответа в течение 5 секунд
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    if (!responseReceived) {
      // Проверяем статус через API
      try {
        const response = await axios.get(`${API_BASE_URL}/worker/status`, { timeout: 5000 });
        
        if (response.status === 200 && response.data.status === 'OK') {
          results.worker.status = 'success';
          results.worker.message = 'Worker работает нормально (проверено через API)';
          console.log('✅ Worker работает нормально (проверено через API)');
        } else {
          results.worker.status = 'warning';
          results.worker.message = 'Worker не ответил на тестовую задачу, но API сообщает, что он работает';
          console.log('⚠️ Worker не ответил на тестовую задачу, но API сообщает, что он работает');
        }
      } catch (apiError) {
        results.worker.status = 'error';
        results.worker.message = 'Worker не ответил на тестовую задачу, и API недоступен';
        console.error('❌ Worker не ответил на тестовую задачу, и API недоступен');
      }
    }
    
    // Закрываем подключения
    await subscription.unsubscribe(responseChannel);
    await subscription.quit();
    await redisClient.quit();
    
  } catch (error) {
    results.worker.status = 'error';
    results.worker.message = `Ошибка при проверке Worker: ${error.message}`;
    console.error('❌ Ошибка при проверке Worker:', error.message);
  }
}

/**
 * Проверка Scheduler
 */
async function checkScheduler() {
  try {
    console.log('🔍 Проверка Scheduler...');
    
    // Проверяем через API
    const response = await axios.get(`${API_BASE_URL}/scheduler/status`, { timeout: 5000 });
    
    if (response.status === 200 && response.data.status === 'OK') {
      results.scheduler.status = 'success';
      results.scheduler.message = 'Scheduler работает нормально';
      console.log('✅ Scheduler работает нормально');
    } else {
      results.scheduler.status = 'warning';
      results.scheduler.message = `Scheduler API отвечает, но статус не OK: ${JSON.stringify(response.data)}`;
      console.log('⚠️ Scheduler API отвечает, но статус не OK');
    }
  } catch (error) {
    // Если API для проверки Scheduler недоступен, проверяем через Redis
    try {
      console.log('🔄 Проверка Scheduler через Redis...');
      
      const redisClient = createClient({
        url: REDIS_URL
      });
      
      await redisClient.connect();
      
      // Проверяем наличие ключей, созданных Scheduler
      const keys = await redisClient.keys('scheduler:*');
      
      if (keys.length > 0) {
        results.scheduler.status = 'success';
        results.scheduler.message = `Scheduler работает. Найдено ${keys.length} ключей в Redis`;
        console.log(`✅ Scheduler работает. Найдено ${keys.length} ключей в Redis`);
      } else {
        results.scheduler.status = 'warning';
        results.scheduler.message = 'Не найдено ключей Scheduler в Redis';
        console.log('⚠️ Не найдено ключей Scheduler в Redis');
      }
      
      await redisClient.quit();
    } catch (redisError) {
      results.scheduler.status = 'error';
      results.scheduler.message = `Ошибка при проверке Scheduler: ${error.message}. Redis ошибка: ${redisError.message}`;
      console.error('❌ Ошибка при проверке Scheduler:', error.message);
      console.error('❌ Redis ошибка:', redisError.message);
    }
  }
}

/**
 * Вывод результатов проверки
 */
function printResults() {
  console.log('\n📊 Результаты проверки системы VHM24:');
  console.log('=====================================');
  
  const components = Object.keys(results);
  const maxComponentLength = Math.max(...components.map(c => c.length));
  
  for (const component of components) {
    const result = results[component];
    const status = result.status === 'success' ? '✅' : 
                  result.status === 'warning' ? '⚠️' : 
                  result.status === 'error' ? '❌' : '❓';
    
    console.log(`${status} ${component.padEnd(maxComponentLength)}: ${result.message}`);
  }
  
  console.log('=====================================');
  
  // Подсчет статистики
  const stats = {
    success: components.filter(c => results[c].status === 'success').length,
    warning: components.filter(c => results[c].status === 'warning').length,
    error: components.filter(c => results[c].status === 'error').length,
    pending: components.filter(c => results[c].status === 'pending').length
  };
  
  console.log(`📈 Статистика: ✅ ${stats.success} успешно, ⚠️ ${stats.warning} с предупреждениями, ❌ ${stats.error} с ошибками, ❓ ${stats.pending} не проверено`);
  
  // Общий статус
  if (stats.error > 0) {
    console.log('❌ Общий статус: КРИТИЧЕСКИЕ ОШИБКИ');
  } else if (stats.warning > 0) {
    console.log('⚠️ Общий статус: ЕСТЬ ПРЕДУПРЕЖДЕНИЯ');
  } else if (stats.pending > 0) {
    console.log('❓ Общий статус: ПРОВЕРКА НЕ ЗАВЕРШЕНА');
  } else {
    console.log('✅ Общий статус: ВСЕ СИСТЕМЫ РАБОТАЮТ');
  }
}

/**
 * Запуск всех проверок
 */
async function runChecks() {
  console.log('🚀 Запуск проверки системы VHM24...');
  console.log(`📅 Дата и время: ${new Date().toLocaleString()}`);
  console.log(`🔗 API URL: ${API_BASE_URL}`);
  
  try {
    // Запускаем все проверки параллельно
    await Promise.all([
      checkAPI(),
      checkDatabase(),
      checkRedis(),
      checkTelegram(),
      checkS3(),
      checkWorker(),
      checkScheduler()
    ]);
    
    // Выводим результаты
    printResults();
    
    // Возвращаем результаты
    return results;
  } catch (error) {
    console.error('❌ Критическая ошибка при выполнении проверок:', error);
    return results;
  }
}

// Запуск проверок, если скрипт запущен напрямую
if (require.main === module) {
  runChecks().catch(error => {
    console.error('❌ Критическая ошибка:', error);
    process.exit(1);
  });
}

module.exports = { runChecks };
