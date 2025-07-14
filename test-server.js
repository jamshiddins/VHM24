const express = require('express');
const app = express();
const PORT = process.env.PORT || 8000;

console.log('🚀 Starting minimal test server...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', PORT);
console.log('DATABASE_URL present:', !!process.env.DATABASE_URL);
console.log('REDIS_URL present:', !!process.env.REDIS_URL);

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'VHM24 Test Server',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    port: PORT
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'VHM24 Test Server is running!',
    endpoints: ['/health', '/test'],
    timestamp: new Date().toISOString()
  });
});

app.get('/test', (req, res) => {
  res.json({
    database: !!process.env.DATABASE_URL,
    redis: !!process.env.REDIS_URL,
    environment: process.env.NODE_ENV,
    railways: {
      project_id: process.env.RAILWAY_PROJECT_ID,
      service_id: process.env.RAILWAY_SERVICE_ID,
      environment: process.env.RAILWAY_ENVIRONMENT
    }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Test server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});
