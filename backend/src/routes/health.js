/**
 * Маршруты для проверки работоспособности системы
 */
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const redis = require('redis');

const prisma = new PrismaClient();
let redisClient = null;

// Инициализация Redis клиента
if (process.env.REDIS_URL) {
    redisClient = redis.createClient({
        url: process.env.REDIS_URL
    });
    
    redisClient.on('error', (err) => {
        console.error('Redis error:', err);
    });
    
    // Подключение к Redis
    (async () => {
        try {
            await redisClient.connect();
            console.log('✅ Успешное подключение к Redis');
        } catch (error) {
            console.error('❌ Ошибка подключения к Redis:', error);
        }
    })();
}

/**
 * @route GET /api/health
 * @desc Проверка работоспособности API
 */
router.get('/', async (req, res) => {
    try {
        // Проверка подключения к базе данных
        let dbStatus = 'Connected';
        try {
            await prisma.$queryRaw`SELECT 1`;
        } catch (error) {
            dbStatus = 'Disconnected';
        }
        
        // Проверка подключения к Redis
        let redisStatus = 'Not configured';
        if (redisClient) {
            try {
                if (redisClient.isReady) {
                    redisStatus = 'Connected';
                } else {
                    redisStatus = 'Disconnected';
                }
            } catch (error) {
                redisStatus = 'Error';
            }
        }
        
        res.status(200).json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            services: {
                database: dbStatus,
                redis: redisStatus,
                telegram: process.env.TELEGRAM_BOT_TOKEN ? 'Configured' : 'Not configured'
            }
        });
    } catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({
            status: 'Error',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

/**
 * @route GET /api/health/detailed
 * @desc Подробная информация о состоянии системы
 */
router.get('/detailed', async (req, res) => {
    try {
        // Проверка подключения к базе данных
        let dbStatus = 'Connected';
        let dbVersion = '';
        try {
            const result = await prisma.$queryRaw`SELECT version()`;
            dbVersion = result[0].version;
        } catch (error) {
            dbStatus = 'Disconnected';
        }
        
        // Проверка подключения к Redis
        let redisStatus = 'Not configured';
        let redisInfo = {};
        if (redisClient) {
            try {
                if (redisClient.isReady) {
                    redisStatus = 'Connected';
                    const info = await redisClient.info();
                    redisInfo = {
                        version: info.split('\n').find(line => line.startsWith('redis_version'))?.split(':')[1] || 'Unknown',
                        memory: info.split('\n').find(line => line.startsWith('used_memory_human'))?.split(':')[1] || 'Unknown',
                        clients: info.split('\n').find(line => line.startsWith('connected_clients'))?.split(':')[1] || 'Unknown'
                    };
                } else {
                    redisStatus = 'Disconnected';
                }
            } catch (error) {
                redisStatus = 'Error';
                redisInfo = { error: error.message };
            }
        }
        
        res.json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            services: {
                database: {
                    status: dbStatus,
                    version: dbVersion,
                    url: process.env.DATABASE_URL ? `${process.env.DATABASE_URL.split('@')[1]}` : 'Not configured'
                },
                redis: {
                    status: redisStatus,
                    info: redisInfo,
                    url: process.env.REDIS_URL ? `${process.env.REDIS_URL.split('@')[1]}` : 'Not configured'
                },
                telegram: {
                    status: process.env.TELEGRAM_BOT_TOKEN ? 'Configured' : 'Not configured',
                    webhook: process.env.WEBHOOK_URL || 'Not configured'
                }
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
    } catch (error) {
        console.error('Detailed health check error:', error);
        res.status(500).json({
            status: 'Error',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
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
