const express = require('express');
const router = express.Router();

// Health check роуты для VHM24

/**
 * Проверка состояния системы
 */
router.get('/', async (req, res) => {
  try {
    const health = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    };
    
    res.json({
      success: true,
      data: health,
      message: 'Система работает нормально'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка проверки состояния системы',
      error: error.message
    });
  }
});

/**
 * Детальная проверка всех компонентов
 */
router.get('/detailed', async (req, res) => {
  try {
    const checks = {
      database: 'OK', // TODO: Проверка БД
      redis: 'OK',    // TODO: Проверка Redis
      telegram: 'OK', // TODO: Проверка Telegram Bot
      services: 'OK'  // TODO: Проверка сервисов
    };
    
    const allHealthy = Object.values(checks).every(status => status === 'OK');
    
    res.status(allHealthy ? 200 : 503).json({
      success: allHealthy,
      data: {
        status: allHealthy ? 'HEALTHY' : 'UNHEALTHY',
        checks,
        timestamp: new Date().toISOString()
      },
      message: allHealthy ? 'Все компоненты работают' : 'Обнаружены проблемы'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка детальной проверки',
      error: error.message
    });
  }
});

module.exports = router;
