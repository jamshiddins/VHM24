/**
 * Маршруты для Telegram бота
 */
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const https = require('https');
const url = require('url');

/**
 * Функция для автоматической настройки вебхука при запуске в production
 * @param {string} webhookUrl - URL для вебхука
 * @param {string} botToken - Токен Telegram бота
 * @returns {Promise<object>} - Результат установки вебхука
 */
const setupWebhook = async (webhookUrl, botToken) => {
  return new Promise((resolve, reject) => {
    try {
      if (!botToken) {
        return reject(new Error('TELEGRAM_BOT_TOKEN не настроен в переменных окружения'));
      }
      
      if (!webhookUrl) {
        return reject(new Error('URL вебхука не указан'));
      }
      
      // Формируем URL для установки вебхука
      const telegramApiUrl = `https://api.telegram.org/bot${botToken}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;
      
      console.log(`Настройка вебхука для Telegram бота: ${webhookUrl}`);
      
      // Отправляем запрос к Telegram API
      const request = https.request(
        url.parse(telegramApiUrl),
        (response) => {
          let data = '';
          
          response.on('data', (chunk) => {
            data += chunk;
          });
          
          response.on('end', () => {
            try {
              const result = JSON.parse(data);
              console.log('Ответ от Telegram API при автоматической настройке вебхука:', result);
              
              if (result.ok) {
                resolve({
                  success: true,
                  message: 'Вебхук успешно установлен автоматически',
                  webhookUrl,
                  telegramResponse: result
                });
              } else {
                reject(new Error(`Ошибка установки вебхука: ${JSON.stringify(result)}`));
              }
            } catch (error) {
              reject(new Error(`Ошибка при обработке ответа от Telegram API: ${error.message}`));
            }
          });
        }
      );
      
      request.on('error', (error) => {
        reject(new Error(`Ошибка при отправке запроса к Telegram API: ${error.message}`));
      });
      
      request.end();
    } catch (error) {
      reject(error);
    }
  });
};

// Автоматическая настройка вебхука при запуске в production
if (process.env.NODE_ENV === 'production') {
  const webhookUrl = process.env.WEBHOOK_URL || `${process.env.RAILWAY_PUBLIC_URL}/api/telegram/webhook`;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  
  if (botToken && webhookUrl) {
    console.log('Запуск в production режиме. Автоматическая настройка вебхука...');
    setupWebhook(webhookUrl, botToken)
      .then(result => {
        console.log('Вебхук успешно настроен:', result);
      })
      .catch(error => {
        console.error('Ошибка при автоматической настройке вебхука:', error);
      });
  } else {
    console.warn('Автоматическая настройка вебхука не выполнена: отсутствует TELEGRAM_BOT_TOKEN или WEBHOOK_URL/RAILWAY_PUBLIC_URL');
  }
}

// Middleware для проверки секрета Telegram
const verifyTelegramSecret = (req, res, next) => {
  const token = req.query.token || '';
  if (token !== process.env.TELEGRAM_BOT_TOKEN) {
    console.error('Неверный токен Telegram');
    return res.status(403).json({ error: 'Доступ запрещен' });
  }
  next();
};

/**
 * @route GET /api/telegram
 * @desc Проверка работоспособности Telegram API
 */
router.get('/', (req, res) => {
  try {
    res.json({
      message: 'Telegram API работает',
      timestamp: new Date().toISOString(),
      webhookUrl: process.env.WEBHOOK_URL || 'Не настроен'
    });
  } catch (error) {
    console.error('Ошибка в Telegram API:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

/**
 * @route POST /api/telegram/webhook
 * @desc Обработчик вебхука от Telegram API
 */
router.post('/webhook', (req, res) => {
  try {
    const update = req.body;
    
    // Логирование входящего обновления
    console.log(`Получено обновление от Telegram: ${JSON.stringify(update)}`);
    
    // Отправляем 200 OK сразу, чтобы Telegram не повторял запрос
    res.status(200).send('OK');
    
    // Дальнейшая обработка происходит в Telegram боте (apps/telegram-bot/src/index.js)
    
  } catch (error) {
    console.error('Ошибка обработки вебхука Telegram:', error);
    // Даже при ошибке отправляем 200 OK, чтобы Telegram не повторял запрос
    res.status(200).send('OK');
  }
});

/**
 * @route POST /api/telegram/setWebhook
 * @desc Установка вебхука для Telegram бота
 */
router.post('/setWebhook', verifyTelegramSecret, async (req, res) => {
  try {
    const webhookUrl = process.env.WEBHOOK_URL || `${process.env.RAILWAY_PUBLIC_URL}/api/telegram/webhook`;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!botToken) {
      return res.status(400).json({ 
        success: false, 
        error: 'TELEGRAM_BOT_TOKEN не настроен в переменных окружения' 
      });
    }
    
    // Используем встроенный модуль https для отправки запроса к Telegram API
    const https = require('https');
    const url = require('url');
    
    // Формируем URL для установки вебхука
    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;
    
    // Отправляем запрос к Telegram API
    const request = https.request(
      url.parse(telegramApiUrl),
      (response) => {
        let data = '';
        
        response.on('data', (chunk) => {
          data += chunk;
        });
        
        response.on('end', () => {
          try {
            const result = JSON.parse(data);
            console.log('Ответ от Telegram API:', result);
            
            if (result.ok) {
              res.json({
                success: true,
                message: 'Вебхук успешно установлен',
                webhookUrl,
                telegramResponse: result
              });
            } else {
              res.status(400).json({
                success: false,
                message: 'Ошибка установки вебхука',
                webhookUrl,
                telegramResponse: result
              });
            }
          } catch (error) {
            console.error('Ошибка при обработке ответа от Telegram API:', error);
            res.status(500).json({ 
              success: false, 
              error: 'Ошибка при обработке ответа от Telegram API' 
            });
          }
        });
      }
    );
    
    request.on('error', (error) => {
      console.error('Ошибка при отправке запроса к Telegram API:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Ошибка при отправке запроса к Telegram API' 
      });
    });
    
    request.end();
  } catch (error) {
    console.error('Ошибка установки вебхука:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка установки вебхука',
      details: error.message 
    });
  }
});

/**
 * @route GET /api/telegram/status
 * @desc Проверка статуса вебхука
 */
router.get('/status', verifyTelegramSecret, async (req, res) => {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const webhookUrl = process.env.WEBHOOK_URL || `${process.env.RAILWAY_PUBLIC_URL}/api/telegram/webhook`;
    
    if (!botToken) {
      return res.status(400).json({ 
        success: false, 
        error: 'TELEGRAM_BOT_TOKEN не настроен в переменных окружения' 
      });
    }
    
    // Используем встроенный модуль https для отправки запроса к Telegram API
    const https = require('https');
    const url = require('url');
    
    // Формируем URL для проверки статуса вебхука
    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/getWebhookInfo`;
    
    // Отправляем запрос к Telegram API
    const request = https.request(
      url.parse(telegramApiUrl),
      (response) => {
        let data = '';
        
        response.on('data', (chunk) => {
          data += chunk;
        });
        
        response.on('end', () => {
          try {
            const result = JSON.parse(data);
            console.log('Ответ от Telegram API (getWebhookInfo):', result);
            
            if (result.ok) {
              res.json({
                success: true,
                message: 'Статус вебхука',
                webhookUrl,
                botToken: '✅ Настроен',
                timestamp: new Date().toISOString(),
                telegramResponse: result
              });
            } else {
              res.status(400).json({
                success: false,
                message: 'Ошибка получения информации о вебхуке',
                webhookUrl,
                botToken: '✅ Настроен',
                timestamp: new Date().toISOString(),
                telegramResponse: result
              });
            }
          } catch (error) {
            console.error('Ошибка при обработке ответа от Telegram API:', error);
            res.status(500).json({ 
              success: false, 
              error: 'Ошибка при обработке ответа от Telegram API' 
            });
          }
        });
      }
    );
    
    request.on('error', (error) => {
      console.error('Ошибка при отправке запроса к Telegram API:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Ошибка при отправке запроса к Telegram API' 
      });
    });
    
    request.end();
  } catch (error) {
    console.error('Ошибка проверки статуса вебхука:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка проверки статуса вебхука',
      details: error.message 
    });
  }
});

module.exports = router;
