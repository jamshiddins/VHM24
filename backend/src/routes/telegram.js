/**
 * Маршруты для Telegram бота
 */
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
    }`);
    
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
    
    // Здесь должен быть код для установки вебхука через Telegram API
    // Обычно это делается через fetch или axios
    
    
    
    res.json({
      success: true,
      message: 'Вебхук установлен',
      webhookUrl
    });
  } catch (error) {
    console.error('Ошибка установки вебхука:', error);
    res.status(500).json({ error: 'Ошибка установки вебхука' });
  }
});

/**
 * @route GET /api/telegram/status
 * @desc Проверка статуса вебхука
 */
router.get('/status', verifyTelegramSecret, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Статус вебхука',
      webhookUrl: process.env.WEBHOOK_URL || `${process.env.RAILWAY_PUBLIC_URL}/api/telegram/webhook`,
      botToken: process.env.TELEGRAM_BOT_TOKEN ? '✅ Настроен' : '❌ Не настроен',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Ошибка проверки статуса вебхука:', error);
    res.status(500).json({ error: 'Ошибка проверки статуса вебхука' });
  }
});

module.exports = router;
