const express = require('express');
const authRoutes = require('./auth');
const usersRoutes = require('./users');
const machinesRoutes = require('./machines');
const tasksRoutes = require('./tasks');
const inventoryRoutes = require('./inventory');
const warehouseRoutes = require('./warehouse');
const dataImportRoutes = require('./data-import');
const telegramRoutes = require('./telegram');
const healthRoutes = require('./health');
const routesRoutes = require('./routes');

const router = express.Router();

// Подключение всех маршрутов
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/machines', machinesRoutes);
router.use('/tasks', tasksRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/warehouse', warehouseRoutes);
router.use('/data-import', dataImportRoutes);
router.use('/telegram', telegramRoutes);
router.use('/health', healthRoutes);
router.use('/routes', routesRoutes);

// Базовый маршрут API
router.get('/', (req, res) => {
  res.json({
    message: 'VHM24 API работает',
    version: '1.0.0',
    endpoints: [
      '/api/auth',
      '/api/users',
      '/api/machines',
      '/api/tasks',
      '/api/inventory',
      '/api/warehouse',
      '/api/data-import',
      '/api/telegram',
      '/api/health',
      '/api/routes'
    ]
  });
});

module.exports = router;
