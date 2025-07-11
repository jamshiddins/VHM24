
const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 8004;

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'VHM24 Monitoring Service',
    timestamp: new Date().toISOString()
  });
});

// Проверка всех сервисов
app.get('/status', async (req, res) => {
  const services = [
    { name: 'Gateway', url: 'http://localhost:8000/health' },
    { name: 'Uploads', url: 'http://localhost:8002/health' },
    { name: 'Backups', url: 'http://localhost:8003/health' }
  ];

  const results = await Promise.allSettled(
    services.map(async service => {
      try {
        const response = await axios.get(service.url, { timeout: 5000 });
        return {
          name: service.name,
          status: 'healthy',
          response: response.data
        };
      } catch (error) {
        return {
          name: service.name,
          status: 'unhealthy',
          error: error.message
        };
      }
    })
  );

  res.json({
    timestamp: new Date().toISOString(),
    services: results.map(result => result.value)
  });
});

app.listen(PORT, () => {
  console.log(`VHM24 Monitoring Service running on port ${PORT}`);
});
