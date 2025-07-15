#!/usr/bin/env node
/**
 * Скрипт для настройки вебхука Telegram-бота
 * Запускается командой: npm run setup:webhook
 */

require('dotenv').config();
const axios = require('axios');
const readline = require('readline');

// Создание интерфейса для чтения ввода пользователя
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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
    default:
      color = colors.white;
  }
  
  console.log(`${color}[${timestamp}] [${type.toUpperCase()}] ${message}${colors.reset}`);
}

// Функция для настройки вебхука
async function setupWebhook() {
  log('=== НАСТРОЙКА ВЕБХУКА TELEGRAM-БОТА ===', 'title');
  
  try {
    // Проверка наличия необходимых переменных окружения
    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
    let webhookUrl = process.env.WEBHOOK_URL;
    const railwayPublicUrl = process.env.RAILWAY_PUBLIC_URL;
    
    if (!telegramBotToken) {
      log('❌ Отсутствует переменная окружения TELEGRAM_BOT_TOKEN', 'error');
      
      // Запрос токена у пользователя
      await new Promise((resolve) => {
        rl.question('Введите токен Telegram-бота: ', (answer) => {
          if (answer.trim()) {
            process.env.TELEGRAM_BOT_TOKEN = answer.trim();
            log(`✅ Токен Telegram-бота установлен: ${answer.trim()}`, 'success');
          } else {
            log('❌ Токен Telegram-бота не введен', 'error');
            process.exit(1);
          }
          
          resolve();
        });
      });
    }
    
    if (!webhookUrl) {
      log('❌ Отсутствует переменная окружения WEBHOOK_URL', 'error');
      
      if (railwayPublicUrl) {
        // Формирование URL вебхука на основе RAILWAY_PUBLIC_URL
        webhookUrl = `${railwayPublicUrl}/api/telegram/webhook`;
        log(`ℹ️ URL вебхука сформирован на основе RAILWAY_PUBLIC_URL: ${webhookUrl}`, 'info');
      } else {
        // Запрос URL вебхука у пользователя
        await new Promise((resolve) => {
          rl.question('Введите URL вебхука (например, https://your-app.up.railway.app/api/telegram/webhook): ', (answer) => {
            if (answer.trim()) {
              webhookUrl = answer.trim();
              log(`✅ URL вебхука установлен: ${webhookUrl}`, 'success');
            } else {
              log('❌ URL вебхука не введен', 'error');
              process.exit(1);
            }
            
            resolve();
          });
        });
      }
    }
    
    // Получение информации о боте
    log('🔍 Получение информации о боте...', 'info');
    
    try {
      const botInfoResponse = await axios.get(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getMe`);
      
      if (botInfoResponse.data.ok) {
        const botInfo = botInfoResponse.data.result;
        log(`✅ Бот найден: ${botInfo.first_name} (@${botInfo.username})`, 'success');
      } else {
        log(`❌ Ошибка при получении информации о боте: ${botInfoResponse.data.description}`, 'error');
        process.exit(1);
      }
    } catch (error) {
      log(`❌ Ошибка при получении информации о боте: ${error.message}`, 'error');
      
      if (error.response) {
        log(`📝 Статус: ${error.response.status}`, 'error');
        log(`📝 Данные: ${JSON.stringify(error.response.data)}`, 'error');
      }
      
      process.exit(1);
    }
    
    // Настройка вебхука
    log(`🔄 Настройка вебхука на URL: ${webhookUrl}`, 'info');
    
    try {
      const setWebhookResponse = await axios.get(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/setWebhook?url=${encodeURIComponent(webhookUrl)}`);
      
      if (setWebhookResponse.data.ok) {
        log(`✅ Вебхук успешно настроен: ${setWebhookResponse.data.description}`, 'success');
      } else {
        log(`❌ Ошибка при настройке вебхука: ${setWebhookResponse.data.description}`, 'error');
        process.exit(1);
      }
    } catch (error) {
      log(`❌ Ошибка при настройке вебхука: ${error.message}`, 'error');
      
      if (error.response) {
        log(`📝 Статус: ${error.response.status}`, 'error');
        log(`📝 Данные: ${JSON.stringify(error.response.data)}`, 'error');
      }
      
      process.exit(1);
    }
    
    // Получение информации о текущем вебхуке
    log('🔍 Получение информации о текущем вебхуке...', 'info');
    
    try {
      const webhookInfoResponse = await axios.get(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getWebhookInfo`);
      
      if (webhookInfoResponse.data.ok) {
        const webhookInfo = webhookInfoResponse.data.result;
        
        log('📋 Информация о вебхуке:', 'info');
        log(`📌 URL: ${webhookInfo.url}`, 'info');
        log(`📌 Ожидающие обновления: ${webhookInfo.pending_update_count}`, 'info');
        log(`📌 Последняя ошибка: ${webhookInfo.last_error_message || 'Нет'}`, 'info');
        log(`📌 Максимальное количество соединений: ${webhookInfo.max_connections}`, 'info');
        log(`📌 IP-адрес: ${webhookInfo.ip_address || 'Не указан'}`, 'info');
        
        if (webhookInfo.url !== webhookUrl) {
          log(`⚠️ Установленный URL вебхука (${webhookInfo.url}) отличается от запрошенного (${webhookUrl})`, 'warning');
        }
        
        if (webhookInfo.pending_update_count > 0) {
          log(`⚠️ Есть необработанные обновления: ${webhookInfo.pending_update_count}`, 'warning');
        }
        
        if (webhookInfo.last_error_message) {
          log(`⚠️ Последняя ошибка вебхука: ${webhookInfo.last_error_message}`, 'warning');
        }
      } else {
        log(`❌ Ошибка при получении информации о вебхуке: ${webhookInfoResponse.data.description}`, 'error');
      }
    } catch (error) {
      log(`❌ Ошибка при получении информации о вебхуке: ${error.message}`, 'error');
      
      if (error.response) {
        log(`📝 Статус: ${error.response.status}`, 'error');
        log(`📝 Данные: ${JSON.stringify(error.response.data)}`, 'error');
      }
    }
    
    // Вывод итогового результата
    log('=== ИТОГОВЫЙ РЕЗУЛЬТАТ ===', 'title');
    log('✅ Вебхук Telegram-бота успешно настроен', 'success');
    log(`📌 URL вебхука: ${webhookUrl}`, 'success');
    log('📌 Бот готов к использованию', 'success');
    
    rl.close();
  } catch (error) {
    log(`❌ Критическая ошибка: ${error.message}`, 'error');
    rl.close();
    process.exit(1);
  }
}

// Запуск скрипта
setupWebhook().catch(error => {
  log(`❌ Критическая ошибка: ${error.message}`, 'error');
  rl.close();
  process.exit(1);
});
