# 🚨 Настройка системы уведомлений о критических ошибках для проекта VHM24

## 📋 Обзор

Этот документ содержит инструкции по настройке системы уведомлений о критических ошибках для проекта VHM24. Система уведомлений позволяет оперативно реагировать на критические ошибки в приложении и минимизировать время простоя.

## 🔧 Настройка логирования

### 1. Установка Winston

Winston - это универсальная библиотека для логирования в Node.js, которая позволяет настраивать различные транспорты для логов.

```bash
npm install winston
```

### 2. Создание логгера

Создайте файл `src/logger.js`:

```javascript
const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Создаем директорию для логов, если она не существует
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Настройка форматирования логов
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Создание логгера
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'vhm24' },
  transports: [
    // Логирование в файл
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  exceptionHandlers: [
    // Логирование необработанных исключений
    new winston.transports.File({ 
      filename: path.join(logDir, 'exceptions.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  rejectionHandlers: [
    // Логирование необработанных отклоненных промисов
    new winston.transports.File({ 
      filename: path.join(logDir, 'rejections.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Добавляем консольный транспорт в режиме разработки
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
}

module.exports = logger;
```

### 3. Интеграция логгера в Express

Обновите файл `server.js`:

```javascript
const express = require('express');
const logger = require('./src/logger');

const app = express();

// Middleware для логирования запросов
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`;
    
    if (res.statusCode >= 500) {
      logger.error(message);
    } else if (res.statusCode >= 400) {
      logger.warn(message);
    } else {
      logger.info(message);
    }
  });
  
  next();
});

// Middleware для обработки ошибок
app.use((err, req, res, next) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    body: req.body,
    query: req.query,
    params: req.params,
    headers: req.headers,
  });
  
  res.status(500).json({ error: 'Internal Server Error' });
});

// Остальные маршруты
// ...

app.listen(3000, () => {
  logger.info('Server is running on port 3000');
});

// Обработка необработанных исключений и отклоненных промисов
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
```

### 4. Интеграция логгера в Telegram бота

Обновите файл `apps/telegram-bot/src/index.js`:

```javascript
const { Telegraf } = require('telegraf');
const logger = require('../../../src/logger');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Middleware для логирования
bot.use((ctx, next) => {
  const start = Date.now();
  
  return next().then(() => {
    const ms = Date.now() - start;
    const message = ctx.message?.text || ctx.callbackQuery?.data || 'unknown';
    const userId = ctx.from?.id || 'unknown';
    const username = ctx.from?.username || 'unknown';
    
    logger.info(`Telegram bot: ${userId} (${username}) - ${message} - ${ms}ms`);
  }).catch((err) => {
    logger.error({
      message: err.message,
      stack: err.stack,
      update: ctx.update,
      userId: ctx.from?.id,
      username: ctx.from?.username,
    });
    
    ctx.reply('Произошла ошибка. Пожалуйста, попробуйте позже.');
  });
});

// Обработка ошибок
bot.catch((err, ctx) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    update: ctx.update,
    userId: ctx.from?.id,
    username: ctx.from?.username,
  });
  
  ctx.reply('Произошла ошибка. Пожалуйста, попробуйте позже.');
});

// Остальной код бота
// ...

bot.launch();
```

## 🔧 Настройка Sentry

Sentry - это платформа для мониторинга ошибок и производительности приложений.

### 1. Создание аккаунта в Sentry

1. Зарегистрируйтесь на сайте Sentry: https://sentry.io/signup/
2. Создайте новый проект для Node.js
3. Получите DSN (Data Source Name) для вашего проекта

### 2. Установка Sentry

```bash
npm install @sentry/node @sentry/tracing
```

### 3. Интеграция Sentry в Express

Обновите файл `server.js`:

```javascript
const express = require('express');
const Sentry = require('@sentry/node');
const Tracing = require('@sentry/tracing');
const logger = require('./src/logger');

const app = express();

// Инициализация Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    // Включение трассировки HTTP-запросов
    new Sentry.Integrations.Http({ tracing: true }),
    // Включение трассировки Express
    new Tracing.Integrations.Express({ app }),
  ],
  // Установка частоты сэмплирования для трассировки
  tracesSampleRate: 1.0,
  // Установка окружения
  environment: process.env.NODE_ENV || 'development',
});

// Middleware для Sentry
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

// Middleware для логирования запросов
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`;
    
    if (res.statusCode >= 500) {
      logger.error(message);
    } else if (res.statusCode >= 400) {
      logger.warn(message);
    } else {
      logger.info(message);
    }
  });
  
  next();
});

// Остальные маршруты
// ...

// Middleware для обработки ошибок Sentry
app.use(Sentry.Handlers.errorHandler());

// Middleware для обработки ошибок
app.use((err, req, res, next) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    body: req.body,
    query: req.query,
    params: req.params,
    headers: req.headers,
  });
  
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(3000, () => {
  logger.info('Server is running on port 3000');
});

// Обработка необработанных исключений и отклоненных промисов
process.on('uncaughtException', (err) => {
  Sentry.captureException(err);
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  Sentry.captureException(reason);
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
```

### 4. Интеграция Sentry в Telegram бота

Обновите файл `apps/telegram-bot/src/index.js`:

```javascript
const { Telegraf } = require('telegraf');
const Sentry = require('@sentry/node');
const logger = require('../../../src/logger');

// Инициализация Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
});

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Middleware для логирования и Sentry
bot.use((ctx, next) => {
  const start = Date.now();
  
  return next().then(() => {
    const ms = Date.now() - start;
    const message = ctx.message?.text || ctx.callbackQuery?.data || 'unknown';
    const userId = ctx.from?.id || 'unknown';
    const username = ctx.from?.username || 'unknown';
    
    logger.info(`Telegram bot: ${userId} (${username}) - ${message} - ${ms}ms`);
  }).catch((err) => {
    Sentry.withScope((scope) => {
      scope.setUser({
        id: ctx.from?.id,
        username: ctx.from?.username,
      });
      scope.setExtra('update', ctx.update);
      Sentry.captureException(err);
    });
    
    logger.error({
      message: err.message,
      stack: err.stack,
      update: ctx.update,
      userId: ctx.from?.id,
      username: ctx.from?.username,
    });
    
    ctx.reply('Произошла ошибка. Пожалуйста, попробуйте позже.');
  });
});

// Обработка ошибок
bot.catch((err, ctx) => {
  Sentry.withScope((scope) => {
    scope.setUser({
      id: ctx.from?.id,
      username: ctx.from?.username,
    });
    scope.setExtra('update', ctx.update);
    Sentry.captureException(err);
  });
  
  logger.error({
    message: err.message,
    stack: err.stack,
    update: ctx.update,
    userId: ctx.from?.id,
    username: ctx.from?.username,
  });
  
  ctx.reply('Произошла ошибка. Пожалуйста, попробуйте позже.');
});

// Остальной код бота
// ...

bot.launch();
```

## 🔧 Настройка уведомлений в Telegram

### 1. Создание бота для уведомлений

1. Откройте BotFather в Telegram: https://t.me/BotFather
2. Отправьте команду `/newbot` и следуйте инструкциям
3. После создания бота вы получите токен
4. Создайте группу в Telegram для уведомлений
5. Добавьте бота в группу
6. Получите ID группы с помощью бота @userinfobot

### 2. Создание модуля для отправки уведомлений

Создайте файл `src/notifications.js`:

```javascript
const axios = require('axios');
const logger = require('./logger');

/**
 * Отправка уведомления в Telegram
 * @param {string} message - Сообщение для отправки
 * @param {string} level - Уровень уведомления (info, warning, error)
 * @returns {Promise<void>}
 */
async function sendTelegramNotification(message, level = 'info') {
  try {
    // Проверяем наличие переменных окружения
    if (!process.env.TELEGRAM_NOTIFICATION_BOT_TOKEN || !process.env.TELEGRAM_NOTIFICATION_CHAT_ID) {
      logger.warn('Отсутствуют переменные окружения для отправки уведомлений в Telegram');
      return;
    }
    
    // Формируем эмодзи в зависимости от уровня уведомления
    let emoji = '📝';
    if (level === 'warning') {
      emoji = '⚠️';
    } else if (level === 'error') {
      emoji = '🚨';
    }
    
    // Формируем текст сообщения
    const text = `${emoji} <b>${level.toUpperCase()}</b>\n\n${message}\n\n<i>Окружение: ${process.env.NODE_ENV || 'development'}</i>\n<i>Время: ${new Date().toISOString()}</i>`;
    
    // Отправляем сообщение
    await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_NOTIFICATION_BOT_TOKEN}/sendMessage`, {
      chat_id: process.env.TELEGRAM_NOTIFICATION_CHAT_ID,
      text,
      parse_mode: 'HTML',
    });
    
    logger.info(`Уведомление отправлено в Telegram: ${level} - ${message.substring(0, 50)}...`);
  } catch (error) {
    logger.error('Ошибка отправки уведомления в Telegram:', error);
  }
}

/**
 * Отправка информационного уведомления
 * @param {string} message - Сообщение для отправки
 * @returns {Promise<void>}
 */
function sendInfo(message) {
  return sendTelegramNotification(message, 'info');
}

/**
 * Отправка предупреждающего уведомления
 * @param {string} message - Сообщение для отправки
 * @returns {Promise<void>}
 */
function sendWarning(message) {
  return sendTelegramNotification(message, 'warning');
}

/**
 * Отправка уведомления об ошибке
 * @param {string} message - Сообщение для отправки
 * @returns {Promise<void>}
 */
function sendError(message) {
  return sendTelegramNotification(message, 'error');
}

module.exports = {
  sendInfo,
  sendWarning,
  sendError,
};
```

### 3. Интеграция уведомлений в Express

Обновите файл `server.js`:

```javascript
const express = require('express');
const Sentry = require('@sentry/node');
const Tracing = require('@sentry/tracing');
const logger = require('./src/logger');
const { sendError } = require('./src/notifications');

const app = express();

// Инициализация Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    // Включение трассировки HTTP-запросов
    new Sentry.Integrations.Http({ tracing: true }),
    // Включение трассировки Express
    new Tracing.Integrations.Express({ app }),
  ],
  // Установка частоты сэмплирования для трассировки
  tracesSampleRate: 1.0,
  // Установка окружения
  environment: process.env.NODE_ENV || 'development',
});

// Middleware для Sentry
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

// Middleware для логирования запросов
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`;
    
    if (res.statusCode >= 500) {
      logger.error(message);
      
      // Отправляем уведомление об ошибке
      if (process.env.NODE_ENV === 'production') {
        sendError(`Ошибка сервера: ${message}`);
      }
    } else if (res.statusCode >= 400) {
      logger.warn(message);
    } else {
      logger.info(message);
    }
  });
  
  next();
});

// Остальные маршруты
// ...

// Middleware для обработки ошибок Sentry
app.use(Sentry.Handlers.errorHandler());

// Middleware для обработки ошибок
app.use((err, req, res, next) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    body: req.body,
    query: req.query,
    params: req.params,
    headers: req.headers,
  });
  
  // Отправляем уведомление об ошибке
  if (process.env.NODE_ENV === 'production') {
    sendError(`Ошибка сервера: ${err.message}\n\nURL: ${req.method} ${req.originalUrl}\n\nStack: ${err.stack}`);
  }
  
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(3000, () => {
  logger.info('Server is running on port 3000');
});

// Обработка необработанных исключений и отклоненных промисов
process.on('uncaughtException', (err) => {
  Sentry.captureException(err);
  logger.error('Uncaught Exception:', err);
  
  // Отправляем уведомление об ошибке
  if (process.env.NODE_ENV === 'production') {
    sendError(`Необработанное исключение: ${err.message}\n\nStack: ${err.stack}`);
  }
  
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  Sentry.captureException(reason);
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  
  // Отправляем уведомление об ошибке
  if (process.env.NODE_ENV === 'production') {
    sendError(`Необработанное отклонение промиса: ${reason.message || reason}\n\nStack: ${reason.stack || 'No stack'}`);
  }
  
  process.exit(1);
});
```

### 4. Интеграция уведомлений в Telegram бота

Обновите файл `apps/telegram-bot/src/index.js`:

```javascript
const { Telegraf } = require('telegraf');
const Sentry = require('@sentry/node');
const logger = require('../../../src/logger');
const { sendError } = require('../../../src/notifications');

// Инициализация Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
});

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Middleware для логирования и Sentry
bot.use((ctx, next) => {
  const start = Date.now();
  
  return next().then(() => {
    const ms = Date.now() - start;
    const message = ctx.message?.text || ctx.callbackQuery?.data || 'unknown';
    const userId = ctx.from?.id || 'unknown';
    const username = ctx.from?.username || 'unknown';
    
    logger.info(`Telegram bot: ${userId} (${username}) - ${message} - ${ms}ms`);
  }).catch((err) => {
    Sentry.withScope((scope) => {
      scope.setUser({
        id: ctx.from?.id,
        username: ctx.from?.username,
      });
      scope.setExtra('update', ctx.update);
      Sentry.captureException(err);
    });
    
    logger.error({
      message: err.message,
      stack: err.stack,
      update: ctx.update,
      userId: ctx.from?.id,
      username: ctx.from?.username,
    });
    
    // Отправляем уведомление об ошибке
    if (process.env.NODE_ENV === 'production') {
      sendError(`Ошибка Telegram бота: ${err.message}\n\nUser: ${ctx.from?.id} (${ctx.from?.username})\n\nUpdate: ${JSON.stringify(ctx.update)}\n\nStack: ${err.stack}`);
    }
    
    ctx.reply('Произошла ошибка. Пожалуйста, попробуйте позже.');
  });
});

// Обработка ошибок
bot.catch((err, ctx) => {
  Sentry.withScope((scope) => {
    scope.setUser({
      id: ctx.from?.id,
      username: ctx.from?.username,
    });
    scope.setExtra('update', ctx.update);
    Sentry.captureException(err);
  });
  
  logger.error({
    message: err.message,
    stack: err.stack,
    update: ctx.update,
    userId: ctx.from?.id,
    username: ctx.from?.username,
  });
  
  // Отправляем уведомление об ошибке
  if (process.env.NODE_ENV === 'production') {
    sendError(`Ошибка Telegram бота: ${err.message}\n\nUser: ${ctx.from?.id} (${ctx.from?.username})\n\nUpdate: ${JSON.stringify(ctx.update)}\n\nStack: ${err.stack}`);
  }
  
  ctx.reply('Произошла ошибка. Пожалуйста, попробуйте позже.');
});

// Остальной код бота
// ...

bot.launch();
```

## 🔧 Настройка переменных окружения

Добавьте следующие переменные окружения в файл `.env`:

```
# Логирование
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Sentry
SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0

# Уведомления в Telegram
TELEGRAM_NOTIFICATION_BOT_TOKEN=1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890
TELEGRAM_NOTIFICATION_CHAT_ID=-1001234567890
```

## 📝 Рекомендации по настройке системы уведомлений

1. **Настройте уровни логирования**:
   - `error` - для критических ошибок, которые требуют немедленного вмешательства
   - `warn` - для предупреждений, которые могут привести к ошибкам
   - `info` - для информационных сообщений
   - `debug` - для отладочной информации

2. **Настройте фильтрацию уведомлений**:
   - Отправляйте уведомления только о критических ошибках
   - Группируйте похожие ошибки
   - Устанавливайте ограничение на количество уведомлений в единицу времени

3. **Настройте ротацию логов**:
   - Устанавливайте максимальный размер файла лога
   - Устанавливайте максимальное количество файлов логов
   - Настройте архивацию старых логов

4. **Настройте мониторинг логов**:
   - Используйте инструменты для анализа логов
   - Настройте алерты на основе логов
   - Регулярно проверяйте логи на наличие ошибок

## 📝 Заключение

Настройка системы уведомлений о критических ошибках позволяет оперативно реагировать на проблемы в приложении и минимизировать время простоя. Следуйте рекомендациям по настройке системы уведомлений для обеспечения стабильной работы приложения.
