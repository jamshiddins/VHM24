require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { PrismaClient } = require('@prisma/client');
const logger = require('./utils/logger');

// Инициализация
const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Импорт роутов
const authRoutes = require('./routes/auth');
const machinesRoutes = require('./routes/machines');
const inventoryRoutes = require('./routes/inventory');
const tasksRoutes = require('./routes/tasks');
const recipesRoutes = require('./routes/recipes');
const usersRoutes = require('./routes/users');
const dashboardRoutes = require('./routes/dashboard');
const ingredientsRoutes = require('./routes/ingredients');
const routesRoutes = require('./routes/routes');
const warehouseRoutes = require('./routes/warehouse');
const auditRoutes = require('./routes/audit');
const dataImportRoutes = require('./routes/data-import');
const incompleteDataRoutes = require('./routes/incomplete-data');

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'VHM24 Backend',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/machines', machinesRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/tasks', tasksRoutes);
app.use('/api/v1/recipes', recipesRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/ingredients', ingredientsRoutes);
app.use('/api/v1/routes', routesRoutes);
app.use('/api/v1/warehouse', warehouseRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/v1/data-import', dataImportRoutes);
app.use('/api/incomplete-data', incompleteDataRoutes);

// Error handling
app.use((err, req, res, _next) => {
  logger.error('Ошибка обработки запроса', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
      status: 404
    }
  });
});

// Запуск сервера
async function startServer() {
  try {
    await prisma.$connect();
    logger.info('Подключение к базе данных установлено');
    
    app.listen(PORT, () => {
      logger.info(`VHM24 Backend запущен на порту ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Ошибка запуска сервера', { error: error.message, stack: error.stack });
    throw error;
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Остановка сервера...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
