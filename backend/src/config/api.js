
module.exports = {
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
    corsOptions: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    },
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 минут
        max: 100 // лимит запросов с одного IP
    },
    timeout: 30000, // 30 секунд
    bodyLimit: '1mb'
};
