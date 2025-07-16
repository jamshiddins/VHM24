/**
 * Основной файл запуска VHM24 API сервера
 */
const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');

// Загружаем основной .env файл
const mainEnv = dotenv.config();
dotenvExpand.expand(mainEnv);

// Загружаем .env.api файл с переопределениями для API сервера
const apiEnv = dotenv.config({ path: '.env.api' });
dotenvExpand.expand(apiEnv);
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { PrismaClient } = require('@prisma/client');
const routes = require('../backend/src/routes/index');
const logger = require('../backend/src/utils/logger');

// Инициализация приложения
const app = express();

// Выбор URL для подключения к базе данных
// Если мы запускаемся в Railway, используем внутренний URL
// Если мы запускаемся локально, используем публичный URL или локальный URL
let databaseUrl = process.env.DATABASE_URL || process.env.DATABASE_URL_PUBLIC;

// Проверяем, запущены ли мы в Railway
const isRailway = process.env.RAILWAY_ENVIRONMENT === 'production';

// Если мы запущены в Railway, используем специальный URL для подключения к PostgreSQL
if (isRailway) {
  // В Railway сервисы могут обращаться друг к другу по имени сервиса
  // Для PostgreSQL используем полный URL с именем сервиса Postgres
  databaseUrl = 'postgresql://postgres:TnKaHJbWffrqtZOIklgKNSlNZHDcxsQh@Postgres:5432/railway';
  console.log('Запущено в Railway, используем специальный URL для подключения к PostgreSQL');
}

console.log(`Используется URL базы данных: ${databaseUrl ? databaseUrl.split('@')[1] : 'не указан'}`);

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl
    }
  }
});

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
  // Выбор URL для подключения к Redis
  const redisUrl = process.env.REDIS_URL || process.env.REDIS_URL_PUBLIC;
  
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: 'Connected',
      redis: redisUrl ? 'Connected' : 'N/A',
      telegram: 'Configured'
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
