const express = require('express');
const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});

// API info endpoint
router.get('/info', (req, res) => {
    res.json({
        name: 'VHM24 API',
        version: '1.0.0',
        description: 'VendHub Management System API',
        endpoints: [
            'GET /api/health',
            'GET /api/info',
            'POST /api/auth/login',
            'GET /api/users',
            'GET /api/machines',
            'GET /api/tasks'
        ]
    });
});

module.exports = router;
