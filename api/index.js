/**
 * Основной файл запуска VHM24 API сервера
 */
require('dotenv').config({ path: '.env.api' });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { PrismaClient } = require('@prisma/client');
const routes = require('../backend/src/routes/index');
const logger = require('../backend/src/utils/logger');

// Инициализация приложения
const app = express();
const prisma = new PrismaClient();

// Получаем порт из окружения - КРИТИЧЕСКИ ВАЖНО для Railway
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  methods: process.env.CORS_METHODS || 'GET,POST,PUT,DELETE,OPTIONS',
  credentials: process.env.CORS_CREDENTIALS === 'true'
}));
app.use(helmet());
app.use(express.json({ limit: process.env.MAX_FILE_SIZE || '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Логирование запросов
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'VHM24 VendHub Management System',
    status: 'online',
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint - КРИТИЧЕСКИ ВАЖНО для Railway
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    services: {
      api: 'OK',
      database: 'OK',
      redis: process.env.REDIS_URL ? 'OK' : 'N/A'
    }
  });
});

// API маршруты
app.use('/api', routes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Запуск сервера
async function startServer() {
  try {
    // Проверка подключения к базе данных
    await prisma.$connect();
    logger.info('✅ Успешное подключение к базе данных');
    
    // Запуск сервера
    app.listen(PORT, HOST, () => {
      logger.info(`✅ Сервер запущен на http://${HOST}:${PORT}`);
      logger.info(`📅 Время запуска: ${new Date().toISOString()}`);
      logger.info(`🔧 Окружение: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔍 Health check: http://${HOST}:${PORT}/health`);
    });
  } catch (error) {
    logger.error('❌ Ошибка запуска сервера:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Получен сигнал SIGINT, завершение работы...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Получен сигнал SIGTERM, завершение работы...');
  await prisma.$disconnect();
  process.exit(0);
});

// Запуск сервера
startServer().catch(error => {
  logger.error('❌ Критическая ошибка:', error);
  process.exit(1);
});
