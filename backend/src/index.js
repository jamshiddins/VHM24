const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

// Импорт маршрутов
const apiRoutes = require('./routes/api');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Логирование запросов
app.use((req, res, next) => {
  .toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API маршруты
app.use('/api', apiRoutes);

// Главная страница
app.get('/', (req, res) => {
  res.json({
    message: 'VendHub API Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      users: '/api/users',
      tasks: '/api/tasks'
    }
  });
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error('Ошибка сервера:', err);
  res.status(500).json({ 
    error: 'Внутренняя ошибка сервера',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 обработчик
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Маршрут не найден' });
});

// Запуск сервера
async function startServer() {
  try {
    // Проверка подключения к БД
    await prisma.$connect();
    
    
    app.listen(PORT, () => {
      
      
    });
  } catch (error) {
    console.error('❌ Ошибка запуска сервера:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  
  await prisma.$disconnect();
  process.exit(0);
});

// Запуск если файл выполняется напрямую
if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };