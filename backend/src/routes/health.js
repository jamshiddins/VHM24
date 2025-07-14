/**
 * Маршруты для проверки работоспособности системы
 */
const express = require('express');
const router = express.Router();

/**
 * @route GET /api/health
 * @desc Проверка работоспособности API
 */
router.get('/', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        services: {
            database: 'Connected',
            redis: 'Connected',
            telegram: process.env.TELEGRAM_BOT_TOKEN ? 'Configured' : 'Not configured'
        }
    });
});

/**
 * @route GET /api/health/detailed
 * @desc Подробная информация о состоянии системы
 */
router.get('/detailed', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        services: {
            database: 'Connected',
            redis: 'Connected',
            telegram: process.env.TELEGRAM_BOT_TOKEN ? 'Configured' : 'Not configured'
        },
        memory: {
            rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
            heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`,
            heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`
        },
        system: {
            platform: process.platform,
            arch: process.arch,
            nodeVersion: process.version
        }
    });
});

/**
 * @route GET /api/health/info
 * @desc Информация об API
 */
router.get('/info', (req, res) => {
    res.json({
        name: 'VHM24 API',
        version: '1.0.0',
        description: 'VendHub Management System API',
        endpoints: [
            'GET /api/health',
            'GET /api/health/detailed',
            'GET /api/health/info',
            'POST /api/auth/login',
            'GET /api/users',
            'GET /api/machines',
            'GET /api/tasks',
            'GET /api/inventory',
            'GET /api/warehouse',
            'GET /api/telegram'
        ],
        publicUrl: process.env.RAILWAY_PUBLIC_URL || 'Not configured'
    });
});

module.exports = router;
