/**
 * Скрипт для проверки здоровья системы
 * Запускается командой: npm run check:health
 */

require('dotenv').config();
const axios = require('axios');
const { createClient } = require('redis');
const { PrismaClient } = require('@prisma/client');

// Проверка наличия необходимых переменных окружения
const requiredEnvVars = ['DATABASE_URL', 'REDIS_URL', 'RAILWAY_PUBLIC_URL'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(`❌ Отсутствуют необходимые переменные окружения: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

// Инициализация клиентов
const prisma = new PrismaClient();
const redisClient = createClient({
  url: process.env.REDIS_URL
});

// Обработка ошибок Redis
redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

/**
 * Проверка здоровья базы данных
 */
async function checkDatabaseHealth() {
  try {
    console.log('🔍 Проверка подключения к базе данных...');
    
    // Подключение к базе данных
    await prisma.$connect();
    
    // Выполнение тестового запроса
    const result = await prisma.$queryRaw`SELECT version()`;
    
    console.log(`✅ База данных доступна. Версия: ${result[0].version}`);
    return true;
  } catch (error) {
    console.error('❌ Ошибка подключения к базе данных:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Проверка здоровья Redis
 */
async function checkRedisHealth() {
  try {
    console.log('🔍 Проверка подключения к Redis...');
    
    // Подключение к Redis
    await redisClient.connect();
    
    // Выполнение тестового запроса
    const pingResult = await redisClient.ping();
    const infoResult = await redisClient.info();
    
    console.log(`✅ Redis доступен. Ping: ${pingResult}`);
    console.log(`✅ Redis версия: ${infoResult.split('\n').find(line => line.startsWith('redis_version'))}`);
    
    return true;
  } catch (error) {
    console.error('❌ Ошибка подключения к Redis:', error.message);
    return false;
  } finally {
    await redisClient.quit();
  }
}

/**
 * Проверка здоровья API
 */
async function checkApiHealth() {
  try {
    console.log('🔍 Проверка доступности API...');
    
    // Формируем URL для проверки здоровья
    const healthUrl = `${process.env.RAILWAY_PUBLIC_URL}/api/health`;
    
    // Отправляем запрос
    const response = await axios.get(healthUrl);
    
    if (response.status === 200) {
      console.log(`✅ API доступен. Статус: ${response.data.status}`);
      console.log(`📊 Сервисы: ${JSON.stringify(response.data.services)}`);
      return true;
    } else {
      console.error(`❌ API недоступен. Статус: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Ошибка при проверке API:');
    if (error.response) {
      console.error(`📝 Статус: ${error.response.status}`);
      console.error(`📝 Данные: ${JSON.stringify(error.response.data)}`);
    } else {
      console.error(error.message);
    }
    return false;
  }
}

/**
 * Проверка здоровья Telegram бота
 */
async function checkTelegramBotHealth() {
  try {
    console.log('🔍 Проверка Telegram бота...');
    
    // Проверка наличия токена
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      console.error('❌ Отсутствует токен Telegram бота');
      return false;
    }
    
    // Получаем информацию о боте
    const getBotInfoUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getMe`;
    const botInfoResponse = await axios.get(getBotInfoUrl);
    
    if (botInfoResponse.data.ok) {
      console.log(`✅ Telegram бот доступен. Имя: ${botInfoResponse.data.result.first_name}`);
      console.log(`✅ Username: @${botInfoResponse.data.result.username}`);
      
      // Получаем информацию о вебхуке
      const getWebhookInfoUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getWebhookInfo`;
      const webhookInfoResponse = await axios.get(getWebhookInfoUrl);
      
      if (webhookInfoResponse.data.ok) {
        const webhookInfo = webhookInfoResponse.data.result;
        
        if (webhookInfo.url) {
          console.log(`✅ Вебхук настроен. URL: ${webhookInfo.url}`);
          
          if (webhookInfo.pending_update_count > 0) {
            console.warn(`⚠️ Есть необработанные обновления: ${webhookInfo.pending_update_count}`);
          }
          
          return true;
        } else {
          console.error('❌ Вебхук не настроен');
          return false;
        }
      } else {
        console.error(`❌ Ошибка при получении информации о вебхуке: ${webhookInfoResponse.data.description}`);
        return false;
      }
    } else {
      console.error(`❌ Ошибка при получении информации о боте: ${botInfoResponse.data.description}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Ошибка при проверке Telegram бота:');
    if (error.response) {
      console.error(`📝 Статус: ${error.response.status}`);
      console.error(`📝 Данные: ${JSON.stringify(error.response.data)}`);
    } else {
      console.error(error.message);
    }
    return false;
  }
}

/**
 * Проверка здоровья всей системы
 */
async function checkSystemHealth() {
  console.log('🚀 Начинаем проверку здоровья системы...');
  console.log('📅 Время:', new Date().toISOString());
  console.log('🌐 Окружение:', process.env.NODE_ENV || 'development');
  console.log('🔗 URL:', process.env.RAILWAY_PUBLIC_URL);
  console.log('-----------------------------------');
  
  // Проверяем все компоненты
  const dbHealth = await checkDatabaseHealth();
  console.log('-----------------------------------');
  
  const redisHealth = await checkRedisHealth();
  console.log('-----------------------------------');
  
  const apiHealth = await checkApiHealth();
  console.log('-----------------------------------');
  
  const telegramHealth = await checkTelegramBotHealth();
  console.log('-----------------------------------');
  
  // Выводим итоговый результат
  console.log('📊 Итоговый результат проверки:');
  console.log(`📁 База данных: ${dbHealth ? '✅ OK' : '❌ ERROR'}`);
  console.log(`📁 Redis: ${redisHealth ? '✅ OK' : '❌ ERROR'}`);
  console.log(`📁 API: ${apiHealth ? '✅ OK' : '❌ ERROR'}`);
  console.log(`📁 Telegram бот: ${telegramHealth ? '✅ OK' : '❌ ERROR'}`);
  
  // Определяем общий статус
  const overallStatus = dbHealth && redisHealth && apiHealth && telegramHealth;
  console.log('-----------------------------------');
  console.log(`🚦 Общий статус: ${overallStatus ? '✅ СИСТЕМА РАБОТАЕТ' : '❌ СИСТЕМА НЕ РАБОТАЕТ'}`);
  
  // Выходим с соответствующим кодом
  process.exit(overallStatus ? 0 : 1);
}

// Запускаем проверку здоровья
checkSystemHealth();
