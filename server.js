const express = require('express');
const app = express();

// Получаем порт из окружения - КРИТИЧЕСКИ ВАЖНО для Railway
const PORT = process.env.PORT || 3000;

// Базовые middleware
app.use(express.json());

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'VHM24 VendHub Management System',
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint - КРИТИЧЕСКИ ВАЖНО для Railway
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// Альтернативный health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'VHM24',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Telegram webhook
app.post('/api/bot', (req, res) => {
  
  res.json({ ok: true });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Start server - КРИТИЧЕСКИ ВАЖНО прослушивание process.env.PORT
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[${new Date().toISOString()}] Server running on port ${PORT}`);
  console.log(`[${new Date().toISOString()}] Health check: http://localhost:${PORT}/health`);
  console.log(`[${new Date().toISOString()}] API health check: http://localhost:${PORT}/api/health`);
});
