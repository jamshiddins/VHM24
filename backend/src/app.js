const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { PrismaClient } = require('@prisma/client');
const routes = require('./routes');
const logger = require('./utils/logger');

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Логирование запросов
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Проверка подключения к базе данных
app.use(async (req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    next();
  } catch (error) {
    logger.error('Ошибка подключения к базе данных:', error);
    res.status(500).json({ error: 'Ошибка подключения к базе данных' });
  }
});

// Маршруты API
app.use('/api/v1', routes);

// Маршрут для проверки здоровья
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    services: {
      api: 'OK',
      database: 'OK'
    }
  });
});

// Обработка ошибок
app.use((err, req, res, next) => {
  logger.error('Ошибка сервера:', err);
  res.status(500).json({ 
    error: 'Внутренняя ошибка сервера',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 обработчик
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Маршрут не найден' });
});

module.exports = app;
